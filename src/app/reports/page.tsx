import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function ReportsPage() {
  await requireUser();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-slate-400">Download monthly collection details.</p>
      </div>
      <div className="rounded border border-slate-800 bg-slate-950 p-4">
        <h2 className="text-lg font-semibold">Monthly report</h2>
        <p className="text-sm text-slate-400">Export payments and pending per month.</p>
        <div className="mt-3 flex gap-3">
          <Link
            href="/api/reports/monthly?format=json"
            className="rounded border border-slate-700 px-3 py-2 text-sm hover:border-emerald-400"
          >
            Download JSON
          </Link>
          <Link
            href="/api/reports/monthly?format=csv"
            className="rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
          >
            Download CSV
          </Link>
        </div>
      </div>
    </div>
  );
}

