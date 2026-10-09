import { describe, expect, it } from "vitest";

import {
  ADMIN_PAYMENT_FAMILY_OPTIONS,
  buildAdminPaymentWhere,
  parseAdminPaymentFilters,
  resolvePaymentEventOutcome,
} from "./admin-payments";

// Admin payment-ops filters (session-24, PAY-OPS-1): the /admin/payments
// surface takes a URL-deep-linkable filter state (?family= + ?q=) exactly
// like the /admin/orders filter bar (session-13, ADMIN-SEARCH-1 — the
// admin surface is a superset, so it gets the lib-seam treatment per repo
// convention). The Prisma application is E2E-covered in
// tests/e2e/admin.spec.ts.
//
// The outcome resolver is the page's honest derivation: a succeeded event
// with no order is exactly the deterministic-failure family the webhook
// records + 200s (amount mismatch, stock-short, unusable metadata,
// vanished cart) — the refund-needed signal an operator must act on.

describe("parseAdminPaymentFilters", () => {
  it("returns no filters for empty params", () => {
    expect(parseAdminPaymentFilters({})).toEqual({});
  });

  it("keeps canonical families", () => {
    for (const f of ["succeeded", "failed", "other"]) {
      expect(parseAdminPaymentFilters({ family: f })).toEqual({ family: f });
    }
  });

  it("drops non-canonical families (case-sensitive contract)", () => {
    expect(parseAdminPaymentFilters({ family: "Succeeded" })).toEqual({});
    expect(parseAdminPaymentFilters({ family: "refund-needed" })).toEqual({});
    expect(parseAdminPaymentFilters({ family: "bogus" })).toEqual({});
  });

  it("trims and keeps the query", () => {
    expect(parseAdminPaymentFilters({ q: "  pi_demo  " })).toEqual({ q: "pi_demo" });
  });

  it("drops an empty/whitespace query", () => {
    expect(parseAdminPaymentFilters({ q: "   " })).toEqual({});
  });

  it("takes the first value of array params (the ?q=a&q=b shape)", () => {
    expect(parseAdminPaymentFilters({ family: ["succeeded", "failed"] })).toEqual({
      family: "succeeded",
    });
    expect(parseAdminPaymentFilters({ q: ["pi_1", "pi_2"] })).toEqual({ q: "pi_1" });
  });

  it("ignores unknown keys", () => {
    expect(parseAdminPaymentFilters({ status: "delivered", page: "2" })).toEqual({});
  });
});

describe("buildAdminPaymentWhere", () => {
  it("returns an empty where for no filters", () => {
    expect(buildAdminPaymentWhere({})).toEqual({});
  });

  it("family=succeeded matches the exact event type", () => {
    expect(buildAdminPaymentWhere({ family: "succeeded" })).toEqual({
      type: "payment_intent.succeeded",
    });
  });

  it("family=failed matches the exact event type", () => {
    expect(buildAdminPaymentWhere({ family: "failed" })).toEqual({
      type: "payment_intent.payment_failed",
    });
  });

  it("family=other negates the two known payment_intent types", () => {
    expect(buildAdminPaymentWhere({ family: "other" })).toEqual({
      NOT: {
        OR: [{ type: "payment_intent.succeeded" }, { type: "payment_intent.payment_failed" }],
      },
    });
  });

  it("q searches the paymentIntentId OR the eventId", () => {
    expect(buildAdminPaymentWhere({ q: "pi_123" })).toEqual({
      OR: [{ paymentIntentId: { contains: "pi_123" } }, { eventId: { contains: "pi_123" } }],
    });
  });

  it("family and q AND together", () => {
    expect(buildAdminPaymentWhere({ family: "succeeded", q: "pi_123" })).toEqual({
      AND: [
        { type: "payment_intent.succeeded" },
        { OR: [{ paymentIntentId: { contains: "pi_123" } }, { eventId: { contains: "pi_123" } }] },
      ],
    });
  });
});

describe("resolvePaymentEventOutcome", () => {
  const orderByIntent = (intentId: string) =>
    intentId === "pi_known" ? { orderNumber: "ORD-2026-003", orderId: "order-3" } : undefined;

  it("a succeeded event with a linked order resolves to placed + the order", () => {
    expect(resolvePaymentEventOutcome(
      { type: "payment_intent.succeeded", paymentIntentId: "pi_known" },
      orderByIntent,
    )).toEqual({ kind: "placed", orderNumber: "ORD-2026-003", orderId: "order-3" });
  });

  it("a succeeded event with NO order resolves to refund-needed (the deterministic-failure family)", () => {
    expect(resolvePaymentEventOutcome(
      { type: "payment_intent.succeeded", paymentIntentId: "pi_orphan" },
      orderByIntent,
    )).toEqual({ kind: "refund-needed" });
  });

  it("a succeeded event with a null paymentIntentId resolves to refund-needed", () => {
    expect(resolvePaymentEventOutcome(
      { type: "payment_intent.succeeded", paymentIntentId: null },
      orderByIntent,
    )).toEqual({ kind: "refund-needed" });
  });

  it("a payment_failed event resolves to failed regardless of orders", () => {
    expect(resolvePaymentEventOutcome(
      { type: "payment_intent.payment_failed", paymentIntentId: "pi_known" },
      orderByIntent,
    )).toEqual({ kind: "failed" });
  });

  it("any other event type resolves to ignored", () => {
    expect(resolvePaymentEventOutcome(
      { type: "charge.refunded", paymentIntentId: "pi_known" },
      orderByIntent,
    )).toEqual({ kind: "ignored" });
    expect(resolvePaymentEventOutcome(
      { type: "customer.subscription.deleted", paymentIntentId: null },
      orderByIntent,
    )).toEqual({ kind: "ignored" });
  });
});

describe("ADMIN_PAYMENT_FAMILY_OPTIONS", () => {
  it("carries the three canonical families with labels", () => {
    expect(ADMIN_PAYMENT_FAMILY_OPTIONS).toEqual([
      { value: "succeeded", label: "Succeeded" },
      { value: "failed", label: "Failed" },
      { value: "other", label: "Other" },
    ]);
  });
});
