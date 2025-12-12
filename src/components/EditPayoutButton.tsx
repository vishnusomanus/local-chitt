"use client";

import { useState } from "react";

type Member = { id: number; name: string };

export function EditPayoutButton({
  monthId,
  members,
  currentPayout
}: {
  monthId: number;
  members: Member[];
  currentPayout: { receiverId: number; amount: number; note: string | null };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [receiverId, setReceiverId] = useState<string | number>(currentPayout.receiverId);
  const [amount, setAmount] = useState(currentPayout.amount);
  const [note, setNote] = useState(currentPayout.note || "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setMessage("Payout updated");
      setIsEditing(false);
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to update payout");
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full rounded border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-emerald-400 hover:text-emerald-400"
      >
        Edit payout
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-slate-800 bg-slate-950 p-4">
      <div>
        <label className="text-sm text-slate-300">Receiver</label>
        <select
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value === "organiser" ? "organiser" : Number(e.target.value))}
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          required
        >
          <option value="">Select receiver</option>
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
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update payout"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setReceiverId(currentPayout.receiverId);
            setAmount(currentPayout.amount);
            setNote(currentPayout.note || "");
            setMessage(null);
          }}
          disabled={loading}
          className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

