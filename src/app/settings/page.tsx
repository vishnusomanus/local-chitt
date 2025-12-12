import { getSettings } from "@/lib/chitty";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");
  if (!session.chittyId) {
    // If chittyId is missing, redirect to login to get a fresh session
    redirect("/login");
  }

  const settings = await getSettings(session.id, session.chittyId);

  const maxMembers = settings.maxMembers || (settings.monthsCount > 0 ? settings.monthsCount - 1 : 0);
  const totalAmount = settings.monthlyAmount * settings.monthsCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Chitty Settings</h1>
          <p className="mt-1 text-slate-400">Configure your chitty parameters and rules</p>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-400">Installments</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{settings.monthsCount}</p>
            <p className="mt-1 text-xs text-slate-500">Total duration</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-400">Max Members</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{maxMembers}</p>
            <p className="mt-1 text-xs text-slate-500">Installments - 1</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-blue-500/50 hover:shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-400">Installment Amount</p>
            <p className="mt-2 text-2xl font-bold text-blue-400">₹{settings.monthlyAmount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">Per month per member</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg transition-all hover:border-purple-500/50 hover:shadow-purple-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <p className="text-sm font-medium text-slate-400">Total Amount</p>
            <p className="mt-2 text-2xl font-bold text-purple-400">₹{totalAmount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">Per member total</p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
        <SettingsForm
          settings={{
            monthlyAmount: settings.monthlyAmount,
            monthsCount: settings.monthsCount,
            startDate: settings.startDate.toISOString().slice(0, 10),
            dueDay: settings.dueDay,
            maxMembers: maxMembers
          }}
        />
      </div>
    </div>
  );
}

