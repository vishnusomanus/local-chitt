import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthId = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const { receiverId, amount, payoutDate, note } = body;

  if (!receiverId || !amount) {
    return NextResponse.json({ error: "receiverId and amount are required" }, { status: 400 });
  }

  const month = await prisma.month.findFirst({ 
    where: { id: monthId, chittyId: session.chittyId } 
  });
  if (!month) {
    return NextResponse.json({ error: "Month not found" }, { status: 404 });
  }

  // Handle organiser (Nanma) - find or create user in this chitty
  let finalReceiverId: number;
  if (receiverId === "organiser") {
    let organiser = await prisma.user.findFirst({
      where: { name: "Nanma", chittyId: session.chittyId, email: { contains: "organiser" } }
    });
    if (!organiser) {
      organiser = await prisma.user.create({
        data: {
          name: "Nanma",
          email: `organiser-${Date.now()}@chitty.local`,
          password: "organiser", // Placeholder password
          role: "MEMBER",
          chittyId: session.chittyId
        }
      });
    }
    finalReceiverId = organiser.id;
  } else {
    finalReceiverId = Number(receiverId);
    // Verify receiver belongs to same chitty
    const receiver = await prisma.user.findFirst({
      where: { id: finalReceiverId, chittyId: session.chittyId }
    });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }
  }

  const payout = await prisma.payout.upsert({
    where: { monthId },
    update: { receiverId: finalReceiverId, amount, date: payoutDate ? new Date(payoutDate) : new Date(), note },
    create: {
      monthId,
      receiverId: finalReceiverId,
      chittyId: session.chittyId,
      amount,
      date: payoutDate ? new Date(payoutDate) : new Date(),
      note
    },
    include: { receiver: true }
  });

  const updatedMonth = await prisma.month.update({
    where: { id: monthId },
    data: { lotReceiverId: finalReceiverId, isClosed: true }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "PAYOUT",
      entityId: payout.id,
      action: "UPSERT",
      data: JSON.stringify(payout),
      actorId: session.id,
      chittyId: session.chittyId
    }
  });

  return NextResponse.json({ payout, month: updatedMonth });
}

