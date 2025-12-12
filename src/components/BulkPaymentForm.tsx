"use client";

import { FormEvent, useState } from "react";

type Member = { id: number; name: string };

export function BulkPaymentForm({
  monthId,
  members,
  isAdmin
}: {
  monthId: number;
  members: Member[];
  isAdmin: boolean;
}) {
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleMember = (memberId: number) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedMembers.size === 0) {
      setMessage("Please select at least one member");
      return;
    }
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await fetch(`/api/months/${monthId}/payments/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          memberIds: Array.from(selectedMembers), 
          amount, 
          method, 
          note 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage(`Successfully recorded ${data.count} payment(s)`);
        setSelectedMembers(new Set());
        setNote("");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        let errorMessage = data.error || `Failed to record payments (${res.status})`;
        if (data.details) {
          errorMessage += `: ${data.details}`;
        }
        setMessage(errorMessage);
        console.error("Payment error:", {
          status: res.status,
          statusText: res.statusText,
          data,
          url: `/api/months/${monthId}/payments/bulk`
        });
      }
    } catch (error: any) {
      console.error("Network error:", error);
      setMessage(error?.message || "An error occurred while recording payments. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bulk Add Payments</h3>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          {selectedMembers.size === members.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-slate-800 bg-slate-900 p-3">
        {members.length === 0 ? (
          <p className="text-sm text-slate-400">No members available</p>
        ) : (
          members.map((member) => (
            <label
              key={member.id}
              className="flex cursor-pointer items-center space-x-2 rounded px-2 py-1.5 hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={selectedMembers.has(member.id)}
                onChange={() => toggleMember(member.id)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-300">{member.name}</span>
            </label>
          ))
        )}
      </div>

      <div className="text-xs text-slate-400">
        {selectedMembers.size} member{selectedMembers.size !== 1 ? "s" : ""} selected
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

      {message && (
        <p className={`text-sm ${message.includes("Successfully") ? "text-emerald-400" : "text-amber-400"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || selectedMembers.size === 0}
        className="w-full rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : `Record ${selectedMembers.size} Payment${selectedMembers.size !== 1 ? "s" : ""}`}
      </button>
    </form>
  );
}

