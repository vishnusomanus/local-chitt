"use client";

import { FormEvent, useState } from "react";

type Settings = {
  monthlyAmount: number;
  monthsCount: number;
  startDate: string;
  endDate?: string;
  dueDay: number;
  allowOverCollection: boolean;
  maxMembers?: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [form, setForm] = useState({
    ...settings,
    maxMembers: settings.maxMembers || (settings.monthsCount > 0 ? settings.monthsCount - 1 : 0)
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (key: keyof Settings, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    // Only send fields that are in the form (exclude endDate and allowOverCollection)
    const formData: any = {
      monthlyAmount: form.monthlyAmount,
      monthsCount: form.monthsCount,
      startDate: form.startDate,
      dueDay: form.dueDay
    };
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Settings updated");
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to save settings");
    }
  };

  // Auto-calculate maxMembers when monthsCount changes
  const handleMonthsCountChange = (value: number) => {
    updateField("monthsCount", value);
    if (value > 0) {
      updateField("maxMembers", value - 1);
    }
  };

  const totalAmount = form.monthlyAmount * form.monthsCount;
  const calculatedMaxMembers = form.maxMembers || (form.monthsCount > 0 ? form.monthsCount - 1 : 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Chitty Configuration</h3>
        <p className="mt-1 text-sm text-slate-400">Set up the core parameters for your chitty</p>
      </div>

      {/* Primary Settings - Installments/Members and Amounts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300">Number of Installments *</label>
            <input
              type="number"
              value={form.monthsCount}
              onChange={(e) => handleMonthsCountChange(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              required
              min={1}
              placeholder="e.g., 11"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Total number of monthly installments for the chitty
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
            <p className="text-xs font-medium text-slate-400">Max Members (Auto-calculated)</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">{calculatedMaxMembers}</p>
            <p className="mt-0.5 text-xs text-slate-500">Based on: Installments - 1</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300">Installment Amount (Monthly) *</label>
            <input
              type="number"
              value={form.monthlyAmount}
              onChange={(e) => updateField("monthlyAmount", Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              required
              min={1}
              placeholder="e.g., 5000"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Amount each member pays per month (in ₹)
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
            <p className="text-xs font-medium text-slate-400">Total Amount (Auto-calculated)</p>
            <p className="mt-1 text-lg font-bold text-purple-400">₹{totalAmount.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Based on: ₹{form.monthlyAmount.toLocaleString()} × {form.monthsCount} installments
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Settings */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300">Start Date *</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 transition-colors focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500/50"
            required
          />
          <p className="mt-1.5 text-xs text-slate-500">When the chitty begins</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Due Day (1-28) *</label>
          <input
            type="number"
            value={form.dueDay}
            onChange={(e) => updateField("dueDay", Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500/50"
            required
            min={1}
            max={28}
            placeholder="e.g., 10"
          />
          <p className="mt-1.5 text-xs text-slate-500">Day of month when payment is due</p>
        </div>
      </div>

      {/* Message and Submit */}
      {message && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          message.includes("updated") || message.includes("success")
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" 
            : "border-amber-500/50 bg-amber-500/10 text-amber-400"
        }`}>
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}


