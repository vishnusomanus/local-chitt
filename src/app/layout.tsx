import type { Metadata } from "next";
import "./globals.css";
import { HeaderClient } from "@/components/HeaderClient";
import { getSession } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chitty",
  description: "Rotating monthly pool tracking"
};

// Force dynamic rendering to ensure session is always fetched
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100">
        <div className="min-h-screen">
          <header className="relative z-40 border-b border-slate-800 bg-slate-950/60 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/dashboard" className="text-lg font-semibold hover:text-emerald-400 transition-colors">
                Chitty
              </Link>
              <div className="flex items-center gap-4">
                {session && (
                  <HeaderClient
                    userName={session.name}
                    userRole={session.role}
                    showSettings={session.role === "ADMIN"}
                  />
                )}
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

