import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/chitty";

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
  const body = await req.json().catch(() => ({}));
  const { memberId, amount, method, note, paymentDate, refunded = false } = body;

  if (!amount || !method) {
    return NextResponse.json({ error: "Amount and method required" }, { status: 400 });
  }

  const month = await prisma.month.findFirst({ 
    where: { id: monthId, chittyId: session.chittyId } 
  });
  if (!month) {
    return NextResponse.json({ error: "Month not found" }, { status: 404 });
  }

  // For admins, check their own target instead of global isClosed
  if (session.role === "ADMIN") {
    // Get admin's members and calculate their target
    const adminMembers = await prisma.user.findMany({
      where: { 
        parentAdminId: session.id, 
        chittyId: session.chittyId, 
        role: "MEMBER",
        deletedAt: null
      },
      select: { id: true }
    });
    
    if (adminMembers.length > 0) {
      const { getSettings } = await import("@/lib/chitty");
      const settings = await getSettings(session.id, session.chittyId);
      const adminTarget = settings.monthlyAmount * adminMembers.length;
      
      // Get admin's total collected for this month
      const adminPayments = await prisma.payment.aggregate({
        where: {
          monthId,
          chittyId: session.chittyId,
          memberId: { in: adminMembers.map(m => m.id) },
          refunded: false,
          isDeleted: false
        },
        _sum: { amount: true }
      });
      
      const adminCollected = adminPayments._sum.amount || 0;
      
      // Only block if admin has reached their own target
      if (adminCollected >= adminTarget) {
        return NextResponse.json({ error: "This month is closed. No new payments can be recorded." }, { status: 400 });
      }
    }
  } else {
    // For members, check global isClosed
    if (month.isClosed) {
      return NextResponse.json({ error: "This month is closed. No new payments can be recorded." }, { status: 400 });
    }
  }

  const targetMemberId = session.role === "ADMIN" && memberId ? Number(memberId) : session.id;

  // For admins, verify the member belongs to them
  const memberWhere: any = { 
    id: targetMemberId, 
    chittyId: session.chittyId 
  };
  
  if (session.role === "ADMIN") {
    memberWhere.parentAdminId = session.id;
  }

  const member = await prisma.user.findFirst({ 
    where: memberWhere
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found or you don't have permission to record payment for this member" }, { status: 404 });
  }

  // Get admin ID for settings - use session.id if admin, otherwise find first admin
  const settingsAdminId = session.role === "ADMIN" ? session.id : undefined;
  
  const [settings, existingTotal] = await Promise.all([
    getSettings(settingsAdminId || 0, session.chittyId),
    prisma.payment.aggregate({
      where: { monthId, chittyId: session.chittyId, refunded: false, isDeleted: false },
      _sum: { amount: true }
    })
  ]);

  const currentTotal = existingTotal._sum.amount || 0;
  const projected = currentTotal + Number(amount);
  if (!settings.allowOverCollection && projected > month.target) {
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Payment exceeds target for the month" },
        { status: 400 }
      );
    }
  }

  const payment = await prisma.payment.create({
    data: {
      memberId: targetMemberId,
      monthId,
      chittyId: session.chittyId,
      monthIndex: month.index,
      amount: Number(amount),
      method,
      note,
      refunded,
      corrected: projected > month.target,
      date: paymentDate ? new Date(paymentDate) : new Date()
    }
  });

  await prisma.auditLog.create({
      data: {
        entityType: "PAYMENT",
        entityId: payment.id,
        action: "CREATE",
        data: JSON.stringify(payment),
        actorId: session.id,
        chittyId: session.chittyId
      }
  });

  // Mark month completed if target reached or exceeded.
  if (projected >= month.target && !month.isClosed) {
    await prisma.month.update({
      where: { id: monthId },
      data: { isClosed: true }
    });
  }

  return NextResponse.json({ payment });
}

