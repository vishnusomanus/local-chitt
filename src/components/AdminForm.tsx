"use client";

import { FormEvent, useState } from "react";

export function AdminForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, role: "ADMIN" })
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Admin added successfully");
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to add admin");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Add Admin</h3>
        <p className="mt-1 text-sm text-slate-400">Admins need name, email, phone, and password</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-300">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            required
            placeholder="Enter admin name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            required
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            required
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Password *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            required
            placeholder="Enter password (min 6 characters)"
            minLength={6}
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
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add Admin"}
      </button>
    </form>
  );
}

