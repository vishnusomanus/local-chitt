import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthId = Number(params.id);
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { paymentIds } = body;

  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    return NextResponse.json({ error: "At least one payment must be selected" }, { status: 400 });
  }

  // Verify month exists and belongs to user's chitty
  const month = await prisma.month.findFirst({
    where: { id: monthId, chittyId: session.chittyId }
  });

  if (!month) {
    return NextResponse.json({ error: "Month not found" }, { status: 404 });
  }

  // Get all payments to verify permissions
  const payments = await prisma.payment.findMany({
    where: {
      id: { in: paymentIds.map((id: any) => Number(id)) },
      monthId,
      chittyId: session.chittyId,
      isDeleted: false
    },
    include: { month: true }
  });

  if (payments.length !== paymentIds.length) {
    return NextResponse.json({ 
      error: "Some payments were not found or have already been deleted" 
    }, { status: 404 });
  }

  // Verify permissions - admin can delete all, members can only delete their own
  const unauthorizedPayments = payments.filter(
    (p) => session.role !== "ADMIN" && p.memberId !== session.id
  );

  if (unauthorizedPayments.length > 0) {
    return NextResponse.json({ 
      error: "You don't have permission to delete some of the selected payments" 
    }, { status: 403 });
  }

  try {
    // Soft delete all payments in a transaction
    await prisma.$transaction(async (tx) => {
      for (const payment of payments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { isDeleted: true }
        });

        // Create audit log for each deletion
        await tx.auditLog.create({
          data: {
            entityType: "PAYMENT",
            entityId: payment.id,
            action: "DELETE",
            data: JSON.stringify({ paymentId: payment.id, monthId: payment.monthId }),
            actorId: session.id,
            chittyId: session.chittyId
          }
        });
      }
    });

    // Recalculate month totals
    const totals = await prisma.payment.aggregate({
      where: { 
        monthId, 
        chittyId: session.chittyId, 
        refunded: false, 
        isDeleted: false 
      },
      _sum: { amount: true }
    });

    const currentTotal = totals._sum.amount || 0;

    // If month was closed and total is now below target, reopen it
    if (month.isClosed && currentTotal < month.target) {
      await prisma.month.update({
        where: { id: monthId },
        data: { isClosed: false }
      });
    }

    return NextResponse.json({ 
      success: true,
      count: payments.length,
      deleted: payments.length
    });
  } catch (error: any) {
    console.error("Bulk delete payments error:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to delete payments" 
    }, { status: 500 });
  }
}


