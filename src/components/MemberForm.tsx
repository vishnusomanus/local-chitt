"use client";

import { FormEvent, useState } from "react";

export function MemberForm({ disabled = false }: { disabled?: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, role: "MEMBER" })
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Member added successfully");
      setName("");
      setPhone("");
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to add member");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Add Member</h3>
        <p className="mt-1 text-sm text-slate-400">
          {disabled 
            ? "Member limit reached. Update settings to add more members." 
            : "Members only need name and phone number"}
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-300">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            required
            placeholder="Enter member name"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            required
            placeholder="Enter phone number"
            disabled={disabled}
          />
        </div>
      </div>
      {message && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          message.includes("successfully") 
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" 
            : "border-amber-500/50 bg-amber-500/10 text-amber-400"
        }`}>
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-emerald-600"
      >
        {loading ? "Adding..." : disabled ? "Member Limit Reached" : "Add Member"}
      </button>
    </form>
  );
}
