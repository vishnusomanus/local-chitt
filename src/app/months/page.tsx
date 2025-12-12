import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { monthCollection } from "@/lib/chitty";
import { formatCurrency } from "@/lib/utils";
import { startOfDay } from "date-fns";
import Link from "next/link";

export default async function MonthsPage() {
  const session = await requireUser();
  const today = startOfDay(new Date());
  const months = await prisma.month.findMany({
    where: { chittyId: session.chittyId, startDate: { lte: today } },
    orderBy: { index: "asc" }
  });

  const enriched = await Promise.all(
    months.map(async (month) => {
      const totals = await monthCollection(
        month.id, 
        session.chittyId,
        session.role === "ADMIN" ? session.id : undefined
      );
      return { month, totals };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Months</h1>
          <p className="mt-1 text-slate-400">Collection status per month</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {enriched.map(({ month, totals }) => {
          // Use admin's target (from totals) instead of global month.target
          const target = totals.target || month.target;
          const collectionProgress = Math.min(100, (totals.totalCollected / target) * 100);
          const isComplete = totals.totalCollected >= target;
          
          return (
            <Link
              href={`/months/${month.id}`}
              key={month.id}
              className={`group relative overflow-hidden rounded-xl p-6 shadow-lg transition-all ${
                isComplete
                  ? "border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 to-slate-950 hover:border-emerald-400 hover:shadow-emerald-500/20"
                  : "border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
              }`}
            >
              <div className={`absolute inset-0 transition-opacity group-hover:opacity-100 ${
                isComplete
                  ? "bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50"
                  : "bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0"
              }`} />
              
              <div className="relative">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-bold ${isComplete ? "text-emerald-100" : "text-slate-100"}`}>
                      {month.name}
                    </h3>
                    <p className={`mt-1 text-xs ${isComplete ? "text-emerald-300/70" : "text-slate-400"}`}>
                      Due {new Date(month.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {isComplete ? (
                    <span className="rounded-full bg-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-2 ring-emerald-500/50">
                      ✓ Complete
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        month.isClosed
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {month.isClosed ? "Closed" : "Open"}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="group/collected">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={`transition-colors ${isComplete ? "text-emerald-300/70 group-hover/collected:text-emerald-300" : "text-slate-400 group-hover/collected:text-slate-300"}`}>
                        Collected
                      </span>
                      <span className={`font-semibold transition-colors ${isComplete ? "text-emerald-300 group-hover/collected:text-emerald-200" : "text-emerald-400 group-hover/collected:text-emerald-300"}`}>
                        {formatCurrency(totals.totalCollected)}
                      </span>
                    </div>
                    <div className={`h-2 overflow-hidden rounded-full transition-all ${isComplete ? "bg-emerald-900/50 group-hover/collected:bg-emerald-900/70" : "bg-slate-800 group-hover/collected:bg-slate-700"}`}>
                      <div
                        className={`h-full transition-all ${
                          isComplete
                            ? "bg-gradient-to-r from-emerald-400 to-emerald-300"
                            : "bg-gradient-to-r from-blue-500 to-blue-400"
                        }`}
                        style={{ width: `${collectionProgress}%` }}
                      />
                    </div>
                    <p className={`mt-1 text-xs transition-colors ${isComplete ? "text-emerald-300/60 group-hover/collected:text-emerald-300/80" : "text-slate-500 group-hover/collected:text-slate-400"}`}>
                      {collectionProgress.toFixed(0)}% of {formatCurrency(target)}
                    </p>
                  </div>

                  {totals.pendingTotal > 0 && (
                    <div className="group/pending flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 transition-all hover:border-amber-500/50 hover:bg-slate-900/70">
                      <span className="text-xs text-slate-400 transition-colors group-hover/pending:text-amber-300">Pending</span>
                      <span className="text-sm font-semibold text-amber-400 transition-colors group-hover/pending:text-amber-300">
                        {formatCurrency(totals.pendingTotal)}
                      </span>
                    </div>
                  )}

                  {totals.pendingMembers.length > 0 && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
                      <p className="text-xs text-slate-400">
                        {totals.pendingMembers.length} member{totals.pendingMembers.length !== 1 ? "s" : ""} pending
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

