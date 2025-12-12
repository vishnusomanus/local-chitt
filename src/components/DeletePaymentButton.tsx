"use client";

import { useState } from "react";

export function DeletePaymentButton({ paymentId, onDeleted }: { paymentId: number; onDeleted?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      if (onDeleted) {
        onDeleted();
      } else {
        window.location.reload();
      }
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete payment");
      setConfirming(false);
    }
    setLoading(false);
  };

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
    >
      Delete
    </button>
  );
}

