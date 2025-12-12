import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");
  const monthId = searchParams.get("monthId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const payments = await prisma.payment.findMany({
    where: {
      chittyId: session.chittyId,
      isDeleted: false,
      ...(memberId ? { memberId: Number(memberId) } : {}),
      ...(monthId ? { monthId: Number(monthId) } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {})
            }
          }
        : {})
    },
    include: { member: true, month: true },
    orderBy: { date: "desc" }
  });

  return NextResponse.json({ payments });
}

