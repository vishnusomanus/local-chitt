import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { monthlyAmount, monthsCount, startDate, endDate, dueDay, allowOverCollection } = body;

  const monthsCountValue = monthsCount || 11;
  const maxMembersValue = monthsCountValue > 0 ? monthsCountValue - 1 : 10;
  
  const setting = await prisma.setting.upsert({
    where: { adminId: session.id },
    update: {
      ...(monthlyAmount ? { monthlyAmount: Number(monthlyAmount) } : {}),
      ...(monthsCount ? { monthsCount: Number(monthsCount), maxMembers: Number(monthsCount) - 1 } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(dueDay ? { dueDay: Number(dueDay) } : {}),
      ...(allowOverCollection !== undefined ? { allowOverCollection: Boolean(allowOverCollection) } : {})
    },
    create: {
      chittyId: session.chittyId,
      adminId: session.id,
      monthlyAmount: monthlyAmount || 5000,
      monthsCount: monthsCountValue,
      startDate: startDate ? new Date(startDate) : new Date("2025-09-01"),
      endDate: endDate ? new Date(endDate) : null,
      dueDay: dueDay || 10,
      allowOverCollection: allowOverCollection ?? false,
      maxMembers: maxMembersValue
    }
  });

  return NextResponse.json({ setting });
}

