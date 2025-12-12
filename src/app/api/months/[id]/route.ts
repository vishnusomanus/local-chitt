import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthCollection } from "@/lib/chitty";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const month = await prisma.month.findFirst({
    where: { id, chittyId: session.chittyId },
    include: {
      payments: {
        where: { isDeleted: false, chittyId: session.chittyId },
        include: { member: true }
      },
      payout: { include: { receiver: true } },
      lotReceiver: true
    }
  });

  if (!month) {
    return NextResponse.json({ error: "Month not found" }, { status: 404 });
  }

  const totals = await monthCollection(
    id, 
    session.chittyId,
    session.role === "ADMIN" ? session.id : undefined
  );

  return NextResponse.json({ month, totals });
}

