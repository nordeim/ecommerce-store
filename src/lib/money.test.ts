import { describe, expect, it } from "vitest";
import {
  discountPercent,
  formatCents,
  shippingForSubtotal,
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
} from "./money";

describe("formatCents", () => {
  it("renders whole dollars without stray decimals", () => {
    expect(formatCents(18900)).toBe("$189.00");
  });
  it("renders fractional dollars", () => {
    expect(formatCents(29999)).toBe("$299.99");
    expect(formatCents(5)).toBe("$0.05");
  });
  it("renders zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });
});

describe("discountPercent", () => {
  it("computes the reference's -25% headphones discount", () => {
    expect(discountPercent(29999, 39999)).toBe(25);
  });
  it("computes the -33% charging pad discount (rounds)", () => {
    expect(discountPercent(3999, 5999)).toBe(33);
  });
  it("returns null without a compare-at price", () => {
    expect(discountPercent(18900, null)).toBeNull();
  });
  it("returns null when the compare-at is not higher", () => {
    expect(discountPercent(5000, 5000)).toBeNull();
    expect(discountPercent(5000, 4000)).toBeNull();
  });
});

describe("shippingForSubtotal", () => {
  it("is free at and above the $100 threshold", () => {
    expect(shippingForSubtotal(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
    expect(shippingForSubtotal(29999)).toBe(0);
  });
  it("is the flat fee below the threshold", () => {
    expect(shippingForSubtotal(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(FLAT_SHIPPING_CENTS);
    expect(shippingForSubtotal(3499)).toBe(599);
  });
  it("totals never invert: subtotal + shipping >= subtotal", () => {
    for (const subtotal of [0, 1, 9999, 10000, 99999]) {
      expect(subtotal + shippingForSubtotal(subtotal)).toBeGreaterThanOrEqual(subtotal);
    }
  });
});
