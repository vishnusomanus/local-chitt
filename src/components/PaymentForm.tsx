"use client";

import { FormEvent, useState } from "react";

type Member = { id: number; name: string };

export function PaymentForm({
  monthId,
  members,
  defaultMemberId,
  isAdmin
}: {
  monthId: number;
  members: Member[];
  defaultMemberId: number;
  isAdmin: boolean;
}) {
  const [memberId, setMemberId] = useState<number | "">(isAdmin ? "" : defaultMemberId);
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isAdmin && !memberId) {
      setMessage("Please select a member");
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/months/${monthId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: memberId || defaultMemberId, amount, method, note })
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Payment recorded");
      setNote("");
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to record payment");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-slate-800 bg-slate-950 p-4">
      {isAdmin && (
        <div>
          <label className="text-sm text-slate-300">Member</label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            required
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-sm text-slate-300">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          required
          min={0}
        />
      </div>
      <div>
        <label className="text-sm text-slate-300">Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="manual">Manual</option>
          <option value="razorpay">Razorpay</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-slate-300">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          rows={2}
        />
      </div>
      {message && <p className="text-sm text-amber-400">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Record payment"}
      </button>
    </form>
  );
}

