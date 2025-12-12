"use client";

import { FormEvent, useState } from "react";

type Member = { id: number; name: string };

export function PayoutForm({
  monthId,
  members,
  defaultReceiverId
}: {
  monthId: number;
  members: Member[];
  defaultReceiverId?: number | null;
}) {
  const [receiverId, setReceiverId] = useState<string | number>(defaultReceiverId || "organiser");
  const [amount, setAmount] = useState(50000);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/months/${monthId}/assign-payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        receiverId: receiverId === "organiser" ? "organiser" : receiverId, 
        amount, 
        note 
      })
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Payout recorded and month closed");
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to record payout");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-slate-800 bg-slate-950 p-4">
      <div>
        <label className="text-sm text-slate-300">Receiver</label>
        <select
          value={receiverId}
          onChange={(e) => setReceiverId(Number(e.target.value))}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="organiser">organiser (Nanma)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
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
        {loading ? "Saving..." : "Record payout"}
      </button>
    </form>
  );
}

