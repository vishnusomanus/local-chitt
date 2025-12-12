import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { monthCollection, getSettings } from "@/lib/chitty";
import { requireAdmin } from "@/lib/auth";
import { stringify } from "csv-stringify/sync";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const settings = await getSettings(session.id, session.chittyId);
  const months = await prisma.month.findMany({ 
    where: { chittyId: session.chittyId },
    orderBy: { index: "asc" } 
  });

  const rows: any[] = [];
  for (const month of months) {
    const totals = await monthCollection(month.id, session.chittyId, session.id);
    rows.push({
      month: month.name,
      target: month.target,
      collected: totals.totalCollected,
      pending: totals.pendingTotal,
      pendingMembers: totals.pendingMembers.map((p) => p.name).join(", "),
      lotReceiver: month.lotReceiverId || ""
    });
  }

  if (format === "csv") {
    const csv = stringify(rows, {
      header: true,
      columns: [
        "month",
        "target",
        "collected",
        "pending",
        "pendingMembers",
        "lotReceiver"
      ]
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=monthly-report.csv"
      }
    });
  }

  return NextResponse.json({ settings, months: rows });
}

