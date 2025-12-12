import { dashboardData } from "@/lib/chitty";
import { formatCurrency } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await dashboardData(
    session.id, 
    session.role, 
    session.chittyId,
    session.role === "ADMIN" ? session.id : undefined
  );
  const { currentMonth } = data;

  const collectionProgress = currentMonth
    ? Math.min(100, (data.currentMonthTotal / currentMonth.target) * 100)
    : 0;
  const overallProgress = data.months.length > 0
    ? (data.completedMonths / data.months.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="mt-1 text-slate-400">Welcome back, {session.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/payments"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-emerald-500 hover:text-emerald-400"
          >
            Payment history
          </Link>
          {session.role === "ADMIN" && (
            <>
              <Link
                href="/admin/members"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30"
              >
                Manage members
              </Link>
              <Link
                href="/settings"
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-blue-500 hover:text-blue-400"
              >
                Settings
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {currentMonth && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/months"
            className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Current Month</p>
              <p className="mt-2 text-2xl font-bold text-slate-100">{currentMonth.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Due {new Date(currentMonth.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </Link>

          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Collected</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{formatCurrency(data.currentMonthTotal)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                  style={{ width: `${collectionProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {collectionProgress.toFixed(0)}% of {formatCurrency(currentMonth.target)}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-amber-500/50 hover:shadow-amber-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Pending</p>
              <p className="mt-2 text-2xl font-bold text-amber-400">{formatCurrency(data.currentMonthPending)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {data.pendingMembers.length} member{data.pendingMembers.length !== 1 ? "s" : ""} pending
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-blue-500/50 hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <p className="text-sm font-medium text-slate-400">Progress</p>
              <p className="mt-2 text-2xl font-bold text-blue-400">
                {data.completedMonths} / {data.months.length}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Months completed</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Payers */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Pending Payers</h2>
              <Link
                href="/months"
                className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                View all →
              </Link>
            </div>
            {data.pendingMembers.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
                <p className="text-sm text-slate-400">🎉 All members have paid this month!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.pendingMembers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 transition-all hover:border-amber-500/50 hover:bg-slate-900"
                  >
                    <span className="font-medium text-slate-200">{p.name}</span>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-400">
                      {formatCurrency(p.pending)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Recent Payments</h2>
              <Link
                href="/payments"
                className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                View all →
              </Link>
            </div>
            {data.payments.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
                <p className="text-sm text-slate-400">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-100">
                        {payment.memberId === session.id ? "You" : payment.month.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(payment.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}{" "}
                        · {payment.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Recent Payouts */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Recent Payouts</h2>
              <Link
                href="/payouts"
                className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                View all →
              </Link>
            </div>
            {data.payouts.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
                <p className="text-xs text-slate-400">No payouts recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-emerald-500/50"
                  >
                    <p className="font-semibold text-slate-100">{payout.receiver.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{payout.month.name}</p>
                    <p className="mt-2 text-lg font-bold text-emerald-400">
                      {formatCurrency(payout.amount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(payout.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Summary */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Member Summary</h2>
          <p className="mt-1 text-sm text-slate-400">Total contributions and remaining balances</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.memberSummary.map((item) => {
            const totalExpected = data.settings.monthlyAmount * data.settings.monthsCount;
            const paidPercentage = totalExpected > 0 ? (item.paid / totalExpected) * 100 : 0;
            return (
              <div
                key={item.member.id}
                className="group rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700 hover:bg-slate-900"
              >
                <p className="font-semibold text-slate-100">{item.member.name}</p>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Paid</span>
                      <span className="font-medium text-emerald-400">{formatCurrency(item.paid)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.min(100, paidPercentage)}%` }}
                      />
                    </div>
                  </div>
                  {item.remaining > 0 && (
                    <p className="text-xs font-medium text-amber-400">
                      Remaining: {formatCurrency(item.remaining)}
                    </p>
                  )}
                  {item.remaining === 0 && (
                    <p className="text-xs font-medium text-emerald-400">✓ Fully paid</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

