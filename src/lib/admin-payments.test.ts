import { describe, expect, it } from "vitest";

import {
  ADMIN_PAYMENT_FAMILY_OPTIONS,
  buildAdminPaymentWhere,
  orderPaymentTrail,
  parseAdminPaymentFilters,
  paymentEventLabel,
  paymentFailureReasonView,
  refundNeededAlert,
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
    for (const f of ["succeeded", "failed", "other", "refund-needed"]) {
      expect(parseAdminPaymentFilters({ family: f })).toEqual({ family: f });
    }
  });

  it("drops non-canonical families (case-sensitive contract)", () => {
    expect(parseAdminPaymentFilters({ family: "Succeeded" })).toEqual({});
    expect(parseAdminPaymentFilters({ family: "Refund-Needed" })).toEqual({});
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

  // ---- session-26, PAY-OPS-3: the date-range bounds (?from= + ?to=) ----

  it("keeps a valid from/to date pair (session-26, PAY-OPS-3)", () => {
    expect(parseAdminPaymentFilters({ from: "2026-02-22", to: "2026-02-23" })).toEqual({
      from: "2026-02-22",
      to: "2026-02-23",
    });
  });

  it("keeps from-only and to-only bounds (open-ended ranges)", () => {
    expect(parseAdminPaymentFilters({ from: "2026-02-22" })).toEqual({ from: "2026-02-22" });
    expect(parseAdminPaymentFilters({ to: "2026-02-23" })).toEqual({ to: "2026-02-23" });
  });

  it("drops bounds that are not strict YYYY-MM-DD strings", () => {
    expect(parseAdminPaymentFilters({ from: "02/22/2026" })).toEqual({});
    expect(parseAdminPaymentFilters({ from: "2026-2-22" })).toEqual({});
    expect(parseAdminPaymentFilters({ from: "2026-02-22T10:00:00Z" })).toEqual({});
    expect(parseAdminPaymentFilters({ to: "not-a-date" })).toEqual({});
    expect(parseAdminPaymentFilters({ from: "2026-13-01" })).toEqual({}); // no month 13
    expect(parseAdminPaymentFilters({ to: "2026-02-30" })).toEqual({}); // no Feb 30
  });

  it("drops the pair when from is after to (an empty range is not a range)", () => {
    expect(parseAdminPaymentFilters({ from: "2026-02-23", to: "2026-02-22" })).toEqual({});
    // equal dates are a valid single-day range
    expect(parseAdminPaymentFilters({ from: "2026-02-22", to: "2026-02-22" })).toEqual({
      from: "2026-02-22",
      to: "2026-02-22",
    });
  });

  it("takes the first value of array date params (the ?from=a&from=b shape)", () => {
    expect(parseAdminPaymentFilters({ from: ["2026-02-22", "2026-01-01"] })).toEqual({
      from: "2026-02-22",
    });
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

  // session-25, PAY-OPS-2: the refund-needed family — the operator's most
  // actionable signal (the deterministic-failure rows the webhook records
  // + 200s per ADR-031). The where expresses "succeeded AND not linked to
  // any placed order": notIn over the placed-intent set + the null branch
  // (a succeeded event with no intent id is refund-needed per the resolver).
  it("family=refund-needed matches succeeded events not in the placed-intent set", () => {
    expect(buildAdminPaymentWhere({ family: "refund-needed" }, ["pi_a", "pi_b"])).toEqual({
      type: "payment_intent.succeeded",
      OR: [
        { paymentIntentId: { notIn: ["pi_a", "pi_b"] } },
        { paymentIntentId: null },
      ],
    });
  });

  it("family=refund-needed with an empty placed-intent set matches every succeeded event", () => {
    expect(buildAdminPaymentWhere({ family: "refund-needed" }, [])).toEqual({
      type: "payment_intent.succeeded",
      OR: [{ paymentIntentId: { notIn: [] } }, { paymentIntentId: null }],
    });
  });

  it("family=refund-needed defaults the placed-intent set to empty (fresh-DB honest)", () => {
    expect(buildAdminPaymentWhere({ family: "refund-needed" })).toEqual({
      type: "payment_intent.succeeded",
      OR: [{ paymentIntentId: { notIn: [] } }, { paymentIntentId: null }],
    });
  });

  it("family=refund-needed ANDs with q keeping the type+notIn group intact", () => {
    expect(buildAdminPaymentWhere({ family: "refund-needed", q: "pi_123" }, ["pi_a"])).toEqual({
      AND: [
        {
          type: "payment_intent.succeeded",
          OR: [{ paymentIntentId: { notIn: ["pi_a"] } }, { paymentIntentId: null }],
        },
        { OR: [{ paymentIntentId: { contains: "pi_123" } }, { eventId: { contains: "pi_123" } }] },
      ],
    });
  });

  it("the placed-intent set is ignored for the other families", () => {
    expect(buildAdminPaymentWhere({ family: "succeeded" }, ["pi_a"])).toEqual({
      type: "payment_intent.succeeded",
    });
    expect(buildAdminPaymentWhere({}, ["pi_a"])).toEqual({});
  });

  // ---- session-26, PAY-OPS-3: the receivedAt range clause ----

  it("from+to builds the UTC day-boundary range [fromStart, toEnd)", () => {
    expect(buildAdminPaymentWhere({ from: "2026-02-22", to: "2026-02-23" })).toEqual({
      receivedAt: { gte: new Date("2026-02-22T00:00:00.000Z"), lt: new Date("2026-02-24T00:00:00.000Z") },
    });
  });

  it("from-only and to-only build open-ended ranges", () => {
    expect(buildAdminPaymentWhere({ from: "2026-02-22" })).toEqual({
      receivedAt: { gte: new Date("2026-02-22T00:00:00.000Z") },
    });
    expect(buildAdminPaymentWhere({ to: "2026-02-23" })).toEqual({
      receivedAt: { lt: new Date("2026-02-24T00:00:00.000Z") },
    });
  });

  it("dates AND with the family branch", () => {
    expect(buildAdminPaymentWhere({ family: "failed", from: "2026-02-22", to: "2026-02-23" })).toEqual({
      AND: [
        { type: "payment_intent.payment_failed" },
        {
          receivedAt: { gte: new Date("2026-02-22T00:00:00.000Z"), lt: new Date("2026-02-24T00:00:00.000Z") },
        },
      ],
    });
  });

  it("dates AND with family + q (the triple composition)", () => {
    expect(
      buildAdminPaymentWhere({ family: "refund-needed", q: "pi_1", from: "2026-02-22", to: "2026-02-22" }, ["pi_a"]),
    ).toEqual({
      AND: [
        {
          type: "payment_intent.succeeded",
          OR: [{ paymentIntentId: { notIn: ["pi_a"] } }, { paymentIntentId: null }],
        },
        { OR: [{ paymentIntentId: { contains: "pi_1" } }, { eventId: { contains: "pi_1" } }] },
        {
          receivedAt: { gte: new Date("2026-02-22T00:00:00.000Z"), lt: new Date("2026-02-23T00:00:00.000Z") },
        },
      ],
    });
  });

  it("dates AND with q alone (no family)", () => {
    expect(buildAdminPaymentWhere({ q: "pi_1", from: "2026-02-22" })).toEqual({
      AND: [
        { OR: [{ paymentIntentId: { contains: "pi_1" } }, { eventId: { contains: "pi_1" } }] },
        { receivedAt: { gte: new Date("2026-02-22T00:00:00.000Z") } },
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
  it("carries the four canonical families with labels (refund-needed promoted, session-25)", () => {
    expect(ADMIN_PAYMENT_FAMILY_OPTIONS).toEqual([
      { value: "succeeded", label: "Succeeded" },
      { value: "failed", label: "Failed" },
      { value: "refund-needed", label: "Refund needed" },
      { value: "other", label: "Other" },
    ]);
  });
});

// ---- session-28, DASH-ALERT-1: the dashboard's refund-needed alert ----
// The presentation contract for /admin's alert row: the count derives
// from the SAME seam the payments family filter composes
// (buildAdminPaymentWhere family=refund-needed + the placed-intent set),
// so the stat and the list can never disagree. The visible=false calm
// state at count 0 is the seam's OWN contract (the e2e fixture set
// always counts 1, so only this unit layer can pin the calm state).

describe("refundNeededAlert (session-28, DASH-ALERT-1)", () => {
  it("is invisible at count 0 (the honest calm state — no alert noise)", () => {
    expect(refundNeededAlert(0)).toEqual({ visible: false });
  });

  it("carries the singular label at count 1 with the family deep-link", () => {
    expect(refundNeededAlert(1)).toEqual({
      visible: true,
      label: "1 payment needs refund attention",
      href: "/admin/payments?family=refund-needed",
    });
  });

  it("carries the plural label at count N with the same deep-link", () => {
    expect(refundNeededAlert(3)).toEqual({
      visible: true,
      label: "3 payments need refund attention",
      href: "/admin/payments?family=refund-needed",
    });
  });

  it("the href is exactly the family Select's own value (the canonical param shape)", () => {
    const alert = refundNeededAlert(2);
    if (!alert.visible) throw new Error("expected visible at count 2");
    expect(alert.href).toBe("/admin/payments?family=refund-needed");
  });
});

// ---- session-29, REFUND-TRAIL-1: the order-detail payment-event trail ----
// The order side of the payments surface's deep link: /admin/orders/[id]
// for a Stripe-paid order renders the StripeEvent rows for its intent
// (the capture + any dashboard refunds). The label seam maps the raw
// Stripe types to the operator's vocabulary; the trail seam owns the
// presentation contract (the calm state at an empty set — an order with
// no Stripe intent renders NO card, which is also what keeps the a11y
// order-detail census pin at 7: the census page is a non-Stripe order).

describe("paymentEventLabel (session-29, REFUND-TRAIL-1)", () => {
  it("maps the canonical types to the operator vocabulary", () => {
    expect(paymentEventLabel("payment_intent.succeeded")).toBe("Payment captured");
    expect(paymentEventLabel("charge.refunded")).toBe("Refunded");
    expect(paymentEventLabel("payment_intent.payment_failed")).toBe("Payment failed");
  });

  it("passes an unknown type through raw (the fall-through philosophy)", () => {
    expect(paymentEventLabel("charge.dispute.created")).toBe("charge.dispute.created");
    expect(paymentEventLabel("")).toBe("");
  });
});

describe("orderPaymentTrail (session-29, REFUND-TRAIL-1)", () => {
  it("is invisible for an empty event set (the honest calm state)", () => {
    expect(orderPaymentTrail([])).toEqual({ visible: false });
  });

  it("maps rows to labels preserving order and the amount magnitude", () => {
    const d1 = new Date("2026-02-20T18:45:40Z");
    const d2 = new Date("2026-03-01T09:00:00Z");
    const trail = orderPaymentTrail([
      { type: "payment_intent.succeeded", amount: 52497, receivedAt: d1 },
      { type: "charge.refunded", amount: 52497, receivedAt: d2 },
    ]);
    if (!trail.visible) throw new Error("expected visible for a non-empty set");
    expect(trail.events).toEqual([
      { label: "Payment captured", amount: 52497, receivedAt: d1 },
      { label: "Refunded", amount: 52497, receivedAt: d2 },
    ]);
  });

  it("keeps a null amount row (the PAY-OPS-2b contract — no magnitude rendered)", () => {
    const d = new Date("2026-02-21T09:12:00Z");
    const trail = orderPaymentTrail([
      { type: "payment_intent.payment_failed", amount: null, receivedAt: d },
    ]);
    if (!trail.visible) throw new Error("expected visible for a non-empty set");
    expect(trail.events).toEqual([
      { label: "Payment failed", amount: null, receivedAt: d },
    ]);
  });
});

// Session-30, REASON-TRAIL-1 (ADR-038): the deterministic-failure reason
// view — the presentation contract for the refund-needed family's WHY.
// The webhook persists a canonical code on the StripeEvent row at its
// four deterministic-failure write sites (metadata-unusable /
// cart-unavailable / amount-mismatch / stock-short — the vocabulary
// exported from src/lib/stripe-payment.ts); this seam maps codes to
// operator copy at read time. Null (pre-session-30 rows, non-failure
// recordings, the successful in-tx insert) is the CALM STATE — the
// refundNeededAlert precedent: the honest silence, not a "reason
// unknown" noise line. Unknown codes pass through RAW — the parse
// family's fall-through philosophy (paymentEventLabel's precedent).
describe("paymentFailureReasonView (session-30, REASON-TRAIL-1)", () => {
  it("is invisible for null — the honest calm state (pre-session-30 rows + every non-failure recording)", () => {
    expect(paymentFailureReasonView(null)).toEqual({ visible: false });
  });

  it("maps amount-mismatch to the operator copy", () => {
    expect(paymentFailureReasonView("amount-mismatch")).toEqual({
      visible: true,
      label: "Reason: amount mismatch vs cart total",
    });
  });

  it("maps stock-short to the operator copy", () => {
    expect(paymentFailureReasonView("stock-short")).toEqual({
      visible: true,
      label: "Reason: insufficient stock at placement",
    });
  });

  it("maps metadata-unusable to the operator copy", () => {
    expect(paymentFailureReasonView("metadata-unusable")).toEqual({
      visible: true,
      label: "Reason: payment metadata unusable",
    });
  });

  it("maps cart-unavailable to the operator copy", () => {
    expect(paymentFailureReasonView("cart-unavailable")).toEqual({
      visible: true,
      label: "Reason: cart unavailable at placement",
    });
  });

  it("passes an unknown code through raw (the fall-through philosophy — never an error)", () => {
    expect(paymentFailureReasonView("webhook-quake")).toEqual({
      visible: true,
      label: "Reason: webhook-quake",
    });
  });
});
