"use client";

/**
 * The reference's platform-level "not found" screen (captured live
 * 2026-10-07): a chrome-less full page on bg-slate-50 (NOT the app's warm
 * theme), a light 7xl "404", a hairline divider, "Page Not Found", the
 * offending path quoted in the copy, and a white/slate outline "Go Home"
 * button.
 *
 * Shared by TWO seams (session-8, TITLE-404-1):
 *  - `src/app/not-found.tsx` (the router's not-found boundary — derives
 *    the quoted path from usePathname)
 *  - `src/app/[...notFound]/page.tsx` (the catch-all that gives unknown
 *    routes the reference's humanized-path document.title)
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

export function Platform404({ path }: { path?: string }) {
  // The reference quotes the path WITHOUT the leading slash (verified live:
  // /nonexistent-xyz renders as "nonexistent-xyz"). The catch-all passes
  // its segments explicitly; the not-found boundary falls back to the
  // client pathname. The hook must run unconditionally (lint contract).
  const pathname = usePathname().replace(/^\//, "");
  const quoted = (path ?? pathname).replace(/\/+$/, "");

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">404</h1>
            <div className="h-0.5 w-16 bg-slate-200 mx-auto" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">Page Not Found</h2>
            <p className="text-slate-600 leading-relaxed">
              The page <span className="font-medium text-slate-700">&quot;{quoted}&quot;</span> could not be found in
              this application.
            </p>
          </div>
          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
