"use client";

import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  baseUrl
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set("page", page.toString());
    return url.pathname + url.search;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {currentPage > 1 && (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-600 hover:bg-slate-800"
        >
          Previous
        </Link>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <Link
                key={page}
                href={getPageUrl(page)}
                className={`rounded px-3 py-1.5 text-sm ${
                  page === currentPage
                    ? "bg-emerald-500 text-slate-900 font-semibold"
                    : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                {page}
              </Link>
            );
          } else if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <span key={page} className="px-2 text-slate-500">
                ...
              </span>
            );
          }
          return null;
        })}
      </div>

      {currentPage < totalPages && (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-600 hover:bg-slate-800"
        >
          Next
        </Link>
      )}

      <span className="ml-4 text-sm text-slate-400">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}


