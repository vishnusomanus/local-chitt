import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Chitty</h1>
      <p className="text-slate-300">
        Manage the rotating monthly pool, track payments, assign payouts, and
        keep everyone in sync.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="rounded border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-slate-500"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

