import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthCollection } from "@/lib/chitty";
import { requireUserApi } from "@/lib/auth";

export async function GET() {
  let session;
  try {
    session = await requireUserApi();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const months = await prisma.month.findMany({
    where: { chittyId: session.chittyId },
    orderBy: { index: "asc" },
    include: {
      payments: {
        where: { isDeleted: false, refunded: false },
        select: { amount: true }
      },
      payout: { include: { receiver: true } },
      lotReceiver: true
    }
  });

  // For admins, pass their ID to filter by their members
  const parentAdminId = session.role === "ADMIN" ? session.id : undefined;

  const data = await Promise.all(
    months.map(async (month) => {
      const totals = await monthCollection(month.id, session.chittyId, parentAdminId);
      return {
        ...month,
        collected: totals.totalCollected,
        pending: totals.pendingTotal,
        pendingMembers: totals.pendingMembers,
        target: totals.target || month.target
      };
    })
  );

  return NextResponse.json({ months: data });
}

