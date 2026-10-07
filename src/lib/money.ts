/**
 * Money helpers — every price in the system is an INTEGER number of cents.
 * `toFixed`/`Intl` appear only at the display boundary.
 */

/** 29999 -> "$299.99" (en-US, no trailing spaces). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Discount percentage between a price and its compare-at price, rounded. */
export function discountPercent(price: number, compareAtPrice: number | null | undefined): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Free-shipping threshold in cents ("Free shipping on orders over $100"). */
export const FREE_SHIPPING_THRESHOLD_CENTS = 10000;

/** Flat shipping fee (cents) below the free-shipping threshold.
 *  $9.99 — measured live on the reference (2026-10-07, session-4): $34.99
 *  and $79.99 carts both show Shipping $9.99; $299.99 shows Free. */
export const FLAT_SHIPPING_CENTS = 999;

export function shippingForSubtotal(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}
