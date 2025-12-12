import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentId = Number(params.id);
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, chittyId: session.chittyId },
    include: { month: true }
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Only allow admin or payment owner to delete
  if (session.role !== "ADMIN" && payment.memberId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (payment.isDeleted) {
    return NextResponse.json({ error: "Payment already deleted" }, { status: 400 });
  }

  // Soft delete the payment
  await prisma.payment.update({
    where: { id: paymentId },
    data: { isDeleted: true }
  });

  // Recalculate month totals
  const totals = await prisma.payment.aggregate({
    where: { monthId: payment.monthId, chittyId: session.chittyId, refunded: false, isDeleted: false },
    _sum: { amount: true }
  });

  const currentTotal = totals._sum.amount || 0;

  // If month was closed and total is now below target, reopen it
  if (payment.month.isClosed && currentTotal < payment.month.target) {
    await prisma.month.update({
      where: { id: payment.monthId },
      data: { isClosed: false }
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      entityType: "PAYMENT",
      entityId: payment.id,
      action: "DELETE",
      data: JSON.stringify({ paymentId, monthId: payment.monthId }),
      actorId: session.id,
      chittyId: session.chittyId
    }
  });

  return NextResponse.json({ success: true });
}

