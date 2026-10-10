import { formatCents } from "./money";

// ---------------------------------------------------------------------------
// The customer-side money-state views (session-33, CUSTOMER-MONEY-1, ADR-041).
//
// The payments family (ADR-030..040) built every OPERATOR surface for the
// refund state — the payments log, the family filters, the dashboard alert,
// the order payment-events trail, the refund ACTION, and the webhook's
// charge.refunded order-state reflection (the single writer of
// paymentStatus "refunded"). This module mirrors that state onto the two
// CUSTOMER surfaces:
//
//   1. the account order-history row — the persistent surface (Half 1 of
//      the round's finding: OrderRow carried no paymentStatus; a refunded
//      order was indistinguishable from a fulfilled-and-kept one);
//   2. the checkout confirmation — the post-placement surface (Half 2: the
//      money line handled "paid" only; a refunded order revisiting its
//      confirmation rendered nothing).
//
// Design rules (the DASH-ALERT-1 calm-state lesson): only the EXCEPTIONAL
// money state earns pixels. History never shows a paid line (every order
// in history was paid — a permanent paid line is noise), and the
// confirmation's paid line keeps session-22's wording byte-exact.
//
// Pure + Prisma-free; money formats through formatCents at the boundary
// (ADR-011 — integer cents everywhere) — the pure-to-pure import
// discipline of the admin-payments family.
// ---------------------------------------------------------------------------

/**
 * The order-history row's money line. Visible ONLY on refunded orders —
 * a full refund (the reflection writes "refunded" for full refunds only;
 * partials keep "paid", so the state implies the amount returned equals
 * the order total).
 */
export function orderRefundLineView(
  paymentStatus: string | null,
  totalCents: number,
): { visible: false } | { visible: true; text: string } {
  if (paymentStatus !== "refunded") return { visible: false };
  return { visible: true, text: `Refunded · ${formatCents(totalCents)} returned` };
}

/**
 * The checkout confirmation's money line. The paid wording is session-22's,
 * byte-exact; the refunded line is customer-safe copy (the R10-2 rule — no
 * operator vocabulary, no intent ids, no "via Stripe dashboard").
 */
export function confirmationMoneyLineView(
  paymentStatus: string | null,
): { visible: false } | { visible: true; text: string } {
  switch (paymentStatus) {
    case "paid":
      return { visible: true, text: "Payment received — charged by Stripe." };
    case "refunded":
      return {
        visible: true,
        text: "Payment refunded — the amount has been returned to your original payment method.",
      };
    default:
      return { visible: false };
  }
}
