"use client";

/**
 * Standalone 404 — a byte-parity port of the reference's platform-level
 * "not found" screen (captured live 2026-10-07): a chrome-less full page on
 * bg-slate-50 (NOT the app's warm theme), a light 7xl "404", a hairline
 * divider, "Page Not Found", the offending path quoted in the copy, and a
 * white/slate outline "Go Home" button.
 *
 * This renders WITHOUT the storefront chrome because the root layout is
 * deliberately minimal (see src/app/layout.tsx) — matching the reference,
 * whose unknown-route screen replaces the entire app shell.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

export default function NotFound() {
  // The reference quotes the path WITHOUT the leading slash (verified live:
  // /nonexistent-xyz renders as "nonexistent-xyz").
  const pathname = usePathname().replace(/^\//, "");

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
              The page <span className="font-medium text-slate-700">&quot;{pathname}&quot;</span> could not be found in
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
