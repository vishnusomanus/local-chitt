import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/chitty";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Bulk payment route hit:", params?.id);
    
    if (!params || !params.id) {
      return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
    }
    
    let session;
    try {
      session = await requireUser();
      console.log("Session validated:", session.id, session.role);
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monthId = Number(params.id);
    console.log("Processing bulk payment for month:", monthId);
    
    let body;
    try {
      body = await req.json();
      console.log("Request body received:", { 
        memberIdsCount: body.memberIds?.length, 
        amount: body.amount, 
        method: body.method 
      });
    } catch (error) {
      console.error("JSON parse error:", error);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { memberIds, amount, method, note } = body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "At least one member must be selected" }, { status: 400 });
    }

    if (amount === undefined || amount === null || amount === "") {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    if (!method || method.trim() === "") {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    const month = await prisma.month.findFirst({ 
      where: { id: monthId, chittyId: session.chittyId } 
    });
    if (!month) {
      return NextResponse.json({ error: "Month not found" }, { status: 404 });
    }

    // For admins, check their own target instead of global isClosed
    // (This check will be done after we get the memberIds, so we'll check it later)
    if (session.role !== "ADMIN" && month.isClosed) {
      return NextResponse.json({ error: "This month is closed. No new payments can be recorded." }, { status: 400 });
    }

    // For admins, verify all members belong to them
    const memberWhere: any = { 
      id: { in: memberIds.map((id: any) => Number(id)) },
      chittyId: session.chittyId 
    };
    
    if (session.role === "ADMIN") {
      memberWhere.parentAdminId = session.id;
    }

    const validMembers = await prisma.user.findMany({ 
      where: memberWhere
    });

    if (validMembers.length !== memberIds.length) {
      return NextResponse.json({ 
        error: "Some members were not found or you don't have permission to record payments for them" 
      }, { status: 403 });
    }

    // Get admin ID for settings - use session.id if admin, otherwise find first admin
    const settingsAdminId = session.role === "ADMIN" ? session.id : undefined;
    
    const [settings, existingTotal] = await Promise.all([
      getSettings(settingsAdminId || 0, session.chittyId),
      prisma.payment.aggregate({
        where: { 
          monthId, 
          chittyId: session.chittyId, 
          memberId: { in: memberIds.map((id: any) => Number(id)) },
          refunded: false, 
          isDeleted: false 
        },
        _sum: { amount: true }
      })
    ]);

    const currentTotal = existingTotal._sum.amount || 0;
    const amountNum = Number(amount);
    const totalAmount = amountNum * memberIds.length;
    const projected = currentTotal + totalAmount;
    
    // For admins, check their own target instead of global month.target
    const adminTarget = session.role === "ADMIN" 
      ? settings.monthlyAmount * memberIds.length 
      : month.target;
    
    // Check if admin has reached their own target
    if (session.role === "ADMIN" && currentTotal >= adminTarget) {
      return NextResponse.json({ error: "This month is closed. No new payments can be recorded." }, { status: 400 });
    }

    // Validate amount is a positive number
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    // For admins, use their own target; for members, use global month.target
    const targetToCheck = session.role === "ADMIN" ? adminTarget : month.target;
    
    if (!settings.allowOverCollection && projected > targetToCheck) {
      if (session.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Total payments would exceed target for the month" },
          { status: 400 }
        );
      }
    }

    // Validate all member IDs are numbers
    const numericMemberIds = memberIds.map((id: any) => Number(id));
    if (numericMemberIds.some((id: number) => isNaN(id) || id <= 0)) {
      return NextResponse.json({ error: "Invalid member IDs provided" }, { status: 400 });
    }

    console.log("Creating bulk payments:", {
      monthId,
      memberIds: numericMemberIds,
      amount: amountNum,
      method,
      chittyId: session.chittyId
    });
    
    // Prepare payment data
    const paymentData = numericMemberIds.map((memberId: number) => ({
      memberId: memberId,
      monthId: monthId,
      chittyId: session.chittyId,
      monthIndex: month.index,
      amount: amountNum,
      method: String(method).trim(),
      note: note && String(note).trim() ? String(note).trim() : null,
      refunded: false,
      corrected: projected > month.target,
      date: new Date()
    }));

    console.log("Payment data prepared:", paymentData.length, "payments");

    // Create all payments in a transaction
    const payments = await prisma.$transaction(async (tx) => {
      const createdPayments = [];
      
      for (const data of paymentData) {
        const payment = await tx.payment.create({ data });
        createdPayments.push(payment);
      }
      
      return createdPayments;
    }, {
      timeout: 10000, // 10 second timeout
    });

    // Create audit logs for all payments
    if (payments.length > 0) {
      try {
        await prisma.auditLog.createMany({
          data: payments.map(payment => ({
            entityType: "PAYMENT",
            entityId: payment.id,
            action: "CREATE",
            data: JSON.stringify(payment),
            actorId: session.id,
            chittyId: session.chittyId
          }))
        });
      } catch (auditError) {
        // Log audit error but don't fail the request
        console.error("Failed to create audit logs:", auditError);
      }
    }

    // Mark month completed if target reached or exceeded
    if (projected >= month.target && !month.isClosed) {
      try {
        await prisma.month.update({
          where: { id: monthId },
          data: { isClosed: true }
        });
      } catch (updateError) {
        // Log update error but don't fail the request
        console.error("Failed to update month status:", updateError);
      }
    }

    return NextResponse.json({ 
      payments,
      count: payments.length,
      totalAmount: totalAmount
    });
  } catch (error: any) {
    console.error("Bulk payment error:", {
      error,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    
    // Provide more specific error messages
    let errorMessage = "Failed to create payments. Please try again.";
    let statusCode = 500;
    
    if (error?.code === "P2002") {
      errorMessage = "A payment already exists for one or more selected members.";
      statusCode = 400;
    } else if (error?.code === "P2003") {
      errorMessage = "Invalid member or month reference. Please verify the selected members.";
      statusCode = 400;
    } else if (error?.code === "P2025") {
      errorMessage = "One or more records were not found.";
      statusCode = 404;
    } else if (error?.message) {
      errorMessage = error.message;
      // If it's a validation error, use 400
      if (error.message.includes("required") || error.message.includes("Invalid")) {
        statusCode = 400;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error?.message : undefined
    }, { status: statusCode });
  }
}
