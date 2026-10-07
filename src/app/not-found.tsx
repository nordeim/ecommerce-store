"use client";

/**
 * Standalone 404 — a byte-parity port of the reference's platform-level
 * "not found" screen (captured live 2026-10-07). The UI itself lives in
 * the shared `Platform404` component (session-8, TITLE-404-1) so the
 * `[...notFound]` catch-all — which gives unknown routes the reference's
 * humanized-path document.title — renders the identical screen.
 *
 * This renders WITHOUT the storefront chrome because the root layout is
 * deliberately minimal (see src/app/layout.tsx) — matching the reference,
 * whose unknown-route screen replaces the entire app shell. In practice
 * every unmatched path is handled by the catch-all; this boundary stays
 * as insurance for any future notFound() call.
 */
import { Platform404 } from "@/components/store/platform-404";

export default function NotFound() {
  return <Platform404 />;
}
