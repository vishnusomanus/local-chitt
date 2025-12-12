"use client";

import { FormEvent, useState } from "react";

type MemberInput = {
  name: string;
  phone: string;
};

export function BulkMemberForm({ disabled = false }: { disabled?: boolean }) {
  // Initialize with 10 empty member rows
  const [members, setMembers] = useState<MemberInput[]>(
    Array.from({ length: 10 }, () => ({ name: "", phone: "" }))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addMemberRow = () => {
    setMembers([...members, { name: "", phone: "" }]);
  };

  const removeMemberRow = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof MemberInput, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Filter out empty rows and validate
    const validMembers = members.filter(m => m.name.trim() && m.phone.trim());
    
    if (validMembers.length === 0) {
      setMessage("Please add at least one member with name and phone");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/members/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: validMembers })
    });
    
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    
    if (res.ok) {
      setMessage(`Successfully added ${data.added || validMembers.length} member(s)`);
      setMembers(Array.from({ length: 10 }, () => ({ name: "", phone: "" })));
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setMessage(data.error || "Failed to add members");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Bulk Add Members</h3>
        <p className="mt-1 text-sm text-slate-400">
          {disabled 
            ? "Member limit reached. Update settings to add more members." 
            : "Add multiple members at once. Each member needs a name and phone number."}
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {members.map((member, index) => (
          <div key={index} className="flex gap-2 items-start p-3 rounded-lg border border-slate-800 bg-slate-900/50">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Name *</label>
                <input
                  value={member.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Member name"
                  disabled={disabled}
                  required={index === 0}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={member.phone}
                  onChange={(e) => updateMember(index, "phone", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  placeholder="Phone number"
                  disabled={disabled}
                  required={index === 0}
                />
              </div>
            </div>
            {members.length > 1 && (
              <button
                type="button"
                onClick={() => removeMemberRow(index)}
                className="mt-6 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                disabled={disabled}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMemberRow}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Add Another Member
      </button>

      {message && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          message.includes("Successfully") || message.includes("added")
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
        {loading ? "Adding..." : disabled ? "Member Limit Reached" : `Add ${members.filter(m => m.name.trim() && m.phone.trim()).length} Member(s)`}
      </button>
    </form>
  );
}

