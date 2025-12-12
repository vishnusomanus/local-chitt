"use client";

import { useState } from "react";
import { MemberForm } from "./MemberForm";
import { BulkMemberForm } from "./BulkMemberForm";

export function MemberFormToggle({ disabled = false }: { disabled?: boolean }) {
  const [showBulk, setShowBulk] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowBulk(false)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !showBulk
              ? "bg-emerald-500 text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Single Member
        </button>
        <button
          type="button"
          onClick={() => setShowBulk(true)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            showBulk
              ? "bg-emerald-500 text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Bulk Add
        </button>
      </div>

      {showBulk ? (
        <BulkMemberForm disabled={disabled} />
      ) : (
        <MemberForm disabled={disabled} />
      )}
    </div>
  );
}


