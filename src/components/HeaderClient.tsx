"use client";

import { UserProfileDropdown } from "./UserProfileDropdown";
import Link from "next/link";

export function HeaderClient({
  userName,
  userRole,
  showSettings
}: {
  userName: string;
  userRole: string;
  showSettings: boolean;
}) {
  return (
    <>
      <nav className="hidden sm:flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/months"
          className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          Months
        </Link>
      </nav>
      <UserProfileDropdown
        userName={userName}
        userRole={userRole}
        showSettings={showSettings}
      />
    </>
  );
}


