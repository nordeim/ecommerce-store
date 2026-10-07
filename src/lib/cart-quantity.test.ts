import { describe, expect, it } from "vitest";

import { nextQuantity } from "./cart-quantity";

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
