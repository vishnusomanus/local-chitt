import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get member IDs for this admin
  const adminMembers = await prisma.user.findMany({
    where: { 
      parentAdminId: session.id, 
      chittyId: session.chittyId, 
      role: "MEMBER",
      deletedAt: null
    },
    select: { id: true }
  });
  const adminMemberIds = adminMembers.map(m => m.id);
  
  const payoutWhere: any = {
    chittyId: session.chittyId
  };
  
  if (adminMemberIds.length > 0) {
    payoutWhere.receiverId = { in: adminMemberIds };
  } else {
    // No members, so no payouts to show
    payoutWhere.receiverId = -1; // This will return no results
  }

  const payouts = await prisma.payout.findMany({
    where: payoutWhere,
    include: { receiver: true, month: true },
    orderBy: { date: "desc" }
  });
  return NextResponse.json({ payouts });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { monthId, receiverId, amount, date, note } = body;
  if (!monthId || !receiverId || !amount) {
    return NextResponse.json({ error: "monthId, receiverId, amount required" }, { status: 400 });
  }

  // Verify month and receiver belong to same chitty
  const month = await prisma.month.findFirst({
    where: { id: Number(monthId), chittyId: session.chittyId }
  });
  if (!month) {
    return NextResponse.json({ error: "Month not found" }, { status: 404 });
  }

  const receiver = await prisma.user.findFirst({
    where: { id: Number(receiverId), chittyId: session.chittyId }
  });
  if (!receiver) {
    return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
  }

  const payout = await prisma.payout.create({
    data: {
      monthId: Number(monthId),
      receiverId: Number(receiverId),
      chittyId: session.chittyId,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      note
    }
  });

  await prisma.month.update({
    where: { id: Number(monthId) },
    data: { lotReceiverId: Number(receiverId), isClosed: true }
  });

  return NextResponse.json({ payout });
}

