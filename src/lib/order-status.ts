/**
 * The order-status vocabulary (session-34, CUSTOMER-ORDER-DETAIL-1,
 * ADR-042) — the reference-measured badge classes + labels the account
 * family renders: the order-history rows (since session-9) and the
 * customer order-detail page (this round).
 *
 * WHY A SEAM MODULE: the vocabulary lived as module-level consts in
 * `account-tabs.tsx` — a `"use client"` module whose plain-object exports
 * are CLIENT REFERENCES, not importable values, from server components
 * (the client-boundary rule). The detail page (a server component) needs
 * the SAME vocabulary; the single source moves here — pure, Prisma-free,
 * importable from both sides (the admin-payments / order-money-state
 * precedent: the module boundary follows the data).
 */

// Reference badge anatomy (session-9, ACCOUNT-ORDER-ROW-1 — measured live
// on both sites 2026-10-08): the status chip is a button-classed element —
// delivered = the primary variant (bg-primary rgb(230,107,26) + white text
// + shadow), in_transit = the secondary variant (bg-secondary
// rgb(242,240,237)). Only these two statuses are observable on the
// reference's seeded orders; unmeasured statuses fall back to secondary
// (the consumer's `?? fallthrough` — the parse family's philosophy).
export const STATUS_STYLES: Record<string, string> = {
  delivered:
    "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
  in_transit:
    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  processing: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  cancelled: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

export const STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered",
  in_transit: "In Transit",
  processing: "Processing",
  cancelled: "Cancelled",
};

/**
 * The account family's short date ("Mar 28, 2026") — en-US,
 * short month / numeric day / numeric year. Shared by the history rows
 * and the detail page's Placed row so the two surfaces can never drift.
 * (E2E-pinned via both consumers' date pins; NOT unit-pinned to a
 * specific calendar day — a fixed UTC instant renders different local
 * days under different runner TZs, and the worker TZ is not a contract.)
 */
export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
