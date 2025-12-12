"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { DeletePaymentButton } from "./DeletePaymentButton";

type Payment = {
  id: number;
  memberId: number;
  member: { name: string };
  amount: number;
  method: string;
  date: Date;
  note: string | null;
};

export function BulkDeletePayments({
  payments,
  monthId,
  isAdmin,
  currentUserId
}: {
  payments: Payment[];
  monthId: number;
  isAdmin: boolean;
  currentUserId: number;
}) {
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Filter payments that can be deleted (admin can delete all, members can only delete their own)
  const deletablePayments = payments.filter(
    (p) => isAdmin || p.memberId === currentUserId
  );

  const togglePayment = (paymentId: number) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const enterBulkMode = () => {
    // Enter bulk mode with all checkboxes unchecked
    setBulkMode(true);
    setSelectedPayments(new Set());
  };

  const selectAll = () => {
    setSelectedPayments(new Set(deletablePayments.map((p) => p.id)));
  };

  const deselectAll = () => {
    // Deselect all but keep bulk mode active (keep checkboxes visible)
    setSelectedPayments(new Set());
  };

  const cancelBulkMode = () => {
    // Cancel bulk mode: uncheck all and exit bulk mode (return to default page)
    setSelectedPayments(new Set());
    setBulkMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.size === 0) {
      setMessage("Please select at least one payment to delete");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPayments.size} payment(s)?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/months/${monthId}/payments/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIds: Array.from(selectedPayments) })
      });

      if (res.ok) {
        setMessage(`Successfully deleted ${selectedPayments.size} payment(s)`);
        setSelectedPayments(new Set());
        setBulkMode(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to delete payments");
      }
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      setMessage("An error occurred while deleting payments");
    } finally {
      setLoading(false);
    }
  };

  if (deletablePayments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Payments</h2>
          {selectedPayments.size > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
              {selectedPayments.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {deletablePayments.length > 0 && !bulkMode && (
            <button
              type="button"
              onClick={enterBulkMode}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              Select Multiple
            </button>
          )}
          {bulkMode && (
            <>
              {selectedPayments.size === deletablePayments.length ? (
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Deselect All
                </button>
              ) : (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Check All
                </button>
              )}
              {selectedPayments.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="rounded bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {loading ? "Deleting..." : `Delete ${selectedPayments.size}`}
                </button>
              )}
              <button
                type="button"
                onClick={cancelBulkMode}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className={`mx-4 rounded px-3 py-2 text-sm ${
          message.includes("Successfully") 
            ? "bg-emerald-500/20 text-emerald-400" 
            : "bg-red-500/20 text-red-400"
        }`}>
          {message}
        </div>
      )}

      <div className="divide-y divide-slate-900">
        {payments.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-400">No payments yet.</p>
        )}
        {payments.map((payment) => {
          const canDelete = isAdmin || payment.memberId === currentUserId;
          const isSelected = selectedPayments.has(payment.id);

          return (
            <div
              key={payment.id}
              className={`grid grid-cols-7 gap-3 px-4 py-2 text-sm items-center ${
                isSelected ? "bg-slate-900/50" : ""
              }`}
            >
              {bulkMode && canDelete ? (
                <label className="flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePayment(payment.id)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500"
                  />
                </label>
              ) : bulkMode ? (
                <div className="w-4" />
              ) : null}
              <span className="font-medium text-slate-100">{payment.member.name}</span>
              <span>{formatCurrency(payment.amount)}</span>
              <span className="text-slate-300">{payment.method}</span>
              <span className="text-slate-400">
                {new Date(payment.date).toLocaleDateString()}
              </span>
              <span className="text-slate-400">{payment.note || "-"}</span>
              <div>
                {canDelete && (
                  bulkMode ? (
                    isSelected && (
                      <span className="text-xs text-emerald-400">Selected</span>
                    )
                  ) : (
                    <DeletePaymentButton paymentId={payment.id} />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

