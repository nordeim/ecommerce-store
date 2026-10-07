/**
 * Pure stepper math (session-4, CART-RACE-1).
 *
 * The drawer and /cart steppers previously sent ABSOLUTE quantities computed
 * from the current render (`item.quantity + 1`). Two rapid clicks before the
 * first server response re-rendered both sent the same value — a lost-update
 * race that collapsed double-clicks into a single +1 (observed as an E2E
 * flake under parallel load). The fix: clients send DELTAS; the server
 * applies them transactionally (`changeQuantityBy` in cart.ts). This module
 * holds the pure arithmetic so it stays unit-testable without a database.
 */

/** Max items per line — mirrors addToCartSchema's quantity ceiling. */
export const MAX_LINE_QUANTITY = 99;

/**
 * Apply a stepper delta to a line's current quantity.
 * Returns the next quantity; 0 is the DELETE signal (matches the legacy
 * absolute-quantity contract where quantity <= 0 removed the item).
 */
export function nextQuantity(current: number, delta: number): number {
  const next = current + delta;
  if (next <= 0) return 0;
  return Math.min(next, MAX_LINE_QUANTITY);
}
