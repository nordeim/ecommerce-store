import { describe, expect, it } from "vitest";

import {
  confirmationMoneyLineView,
  orderRefundLineView,
} from "./order-money-state";

// ---------------------------------------------------------------------------
// The customer-side money-state views (session-33, CUSTOMER-MONEY-1, ADR-041).
//
// The payments family (ADR-030..040) built every OPERATOR surface for the
// refund state; these seams mirror it onto the two CUSTOMER surfaces:
// the account order-history row (the persistent surface) and the checkout
// confirmation (the post-placement surface). Pure + Prisma-free; money
// formats through formatCents at the boundary (ADR-011) — the pure-to-pure
// import discipline of the admin-payments family.
// ---------------------------------------------------------------------------

describe("orderRefundLineView — the order-history row's money line", () => {
  it("renders the refund line with the returned amount on a refunded order", () => {
    expect(orderRefundLineView("refunded", 7999)).toEqual({
      visible: true,
      text: "Refunded · $79.99 returned",
    });
  });

  it("formats through formatCents at the boundary (integer cents everywhere)", () => {
    expect(orderRefundLineView("refunded", 0)).toEqual({
      visible: true,
      text: "Refunded · $0.00 returned",
    });
    expect(orderRefundLineView("refunded", 123456)).toEqual({
      visible: true,
      text: "Refunded · $1,234.56 returned",
    });
  });

  it("is invisible on the demo path (paymentStatus null) — the reference's resting row", () => {
    expect(orderRefundLineView(null, 52497)).toEqual({ visible: false });
  });

  it("is invisible on paid orders — history never shows a paid line (the calm state)", () => {
    // Every order in history was paid; a permanent paid line is noise
    // (the DASH-ALERT-1 alert-fatigue lesson). Only the EXCEPTIONAL money
    // state earns a line.
    expect(orderRefundLineView("paid", 52497)).toEqual({ visible: false });
  });

  it("falls through on unknown values — never an error, never a guess", () => {
    expect(orderRefundLineView("chargeback", 100)).toEqual({ visible: false });
    expect(orderRefundLineView("", 100)).toEqual({ visible: false });
  });
});

describe("confirmationMoneyLineView — the checkout confirmation's money line", () => {
  it("keeps session-22's paid wording byte-exact", () => {
    expect(confirmationMoneyLineView("paid")).toEqual({
      visible: true,
      text: "Payment received — charged by Stripe.",
    });
  });

  it("renders the refunded line — the customer-safe copy, no operator vocabulary", () => {
    expect(confirmationMoneyLineView("refunded")).toEqual({
      visible: true,
      text: "Payment refunded — the amount has been returned to your original payment method.",
    });
  });

  it("is invisible on the demo path (paymentStatus null)", () => {
    expect(confirmationMoneyLineView(null)).toEqual({ visible: false });
  });

  it("falls through on unknown values", () => {
    expect(confirmationMoneyLineView("chargeback")).toEqual({ visible: false });
    expect(confirmationMoneyLineView("")).toEqual({ visible: false });
  });
});
