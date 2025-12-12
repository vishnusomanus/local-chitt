"use client";

import { useState } from "react";
import { BulkPaymentForm } from "./BulkPaymentForm";
import { PaymentForm } from "./PaymentForm";

type Member = { id: number; name: string };

export function BulkPaymentToggle({
  monthId,
  members,
  defaultMemberId,
  isAdmin,
  isMonthClosed
}: {
  monthId: number;
  members: Member[];
  defaultMemberId: number;
  isAdmin: boolean;
  isMonthClosed: boolean;
}) {
  const [showBulk, setShowBulk] = useState(false);

  if (isMonthClosed) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950 p-4 text-sm">
        <p className="text-slate-400">This month is closed. No new payments can be recorded.</p>
      </div>
    );
  }

  // Only show bulk option for admins
  if (!isAdmin) {
    return (
      <PaymentForm
        monthId={monthId}
        members={members}
        defaultMemberId={defaultMemberId}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowBulk(false)}
          className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
            !showBulk
              ? "bg-emerald-500 text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Single Payment
        </button>
        <button
          type="button"
          onClick={() => setShowBulk(true)}
          className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
            showBulk
              ? "bg-emerald-500 text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Bulk Payment
        </button>
      </div>

      {showBulk ? (
        <BulkPaymentForm
          monthId={monthId}
          members={members}
          isAdmin={isAdmin}
        />
      ) : (
        <PaymentForm
          monthId={monthId}
          members={members}
          defaultMemberId={defaultMemberId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

