import { describe, expect, it } from "vitest";

import { clampToStock, nextQuantity } from "./cart-quantity";

// Stepper math (session-4, CART-RACE-1): the drawer and /cart steppers send
// DELTAS to the server, which applies them transactionally — the client
// never computes an absolute target from stale render state again. The pure
// math is pinned here; the transactional application is E2E-covered.

describe("nextQuantity", () => {
  it("applies positive deltas", () => {
    expect(nextQuantity(1, 1)).toBe(2);
    expect(nextQuantity(2, 1)).toBe(3);
    expect(nextQuantity(5, 4)).toBe(9);
  });

  it("applies negative deltas", () => {
    expect(nextQuantity(3, -1)).toBe(2);
    expect(nextQuantity(99, -98)).toBe(1);
  });

  it("returns 0 (the delete signal) at or below zero", () => {
    expect(nextQuantity(1, -1)).toBe(0);
    expect(nextQuantity(1, -5)).toBe(0);
    expect(nextQuantity(0, -1)).toBe(0);
  });

  it("clamps at the 99-item ceiling (schema max)", () => {
    expect(nextQuantity(99, 1)).toBe(99);
    expect(nextQuantity(50, 100)).toBe(99);
  });

  it("is idempotent-safe for zero deltas", () => {
    expect(nextQuantity(4, 0)).toBe(4);
  });
});

// Stock clamping (session-6, STOCK-1): the server caps cart quantities at
// the product's available stock so API-level callers cannot assemble an
// over-stock cart. Decreases and deletes always pass through (a shopper
// must be able to reduce a line even after stock drops); only increases are
// capped. The placement-time rejection (overselling after an admin stock
// drop) is E2E-covered in tests/e2e/stock.spec.ts.
describe("clampToStock", () => {
  it("lets increases through when stock allows", () => {
    expect(clampToStock(3, 1, 5)).toBe(3);
    expect(clampToStock(25, 24, 25)).toBe(25);
  });

  it("caps increases at the available stock", () => {
    expect(clampToStock(5, 1, 3)).toBe(3);
    expect(clampToStock(30, 1, 25)).toBe(25);
  });

  it("never reduces an existing line below its current quantity", () => {
    // Stock dropped to 0 after the line was assembled — the line survives
    // (placement, not the stepper, is where overselling is rejected).
    expect(clampToStock(2, 1, 0)).toBe(1);
    expect(clampToStock(4, 3, 1)).toBe(3);
  });

  it("passes decreases and the delete signal through untouched", () => {
    expect(clampToStock(0, 2, 1)).toBe(0);
    expect(clampToStock(1, 2, 0)).toBe(1);
  });

  it("clamps a brand-new line (current 0) to the available stock", () => {
    expect(clampToStock(3, 0, 5)).toBe(3);
    expect(clampToStock(3, 0, 2)).toBe(2);
    // Out of stock: a new line clamps to 0 — the caller skips creating it.
    expect(clampToStock(3, 0, 0)).toBe(0);
  });
});
