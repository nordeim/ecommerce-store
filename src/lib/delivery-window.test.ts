import { describe, expect, it } from "vitest";
// Session-37 (DELIVERY-WINDOW-1, ADR-045): the delivery-estimate view seam
// — the "when will it arrive" affordance's read vocabulary. The window
// composes from the order's status + placedAt ONLY (no schema change — the
// session-71 framing): the promise states (processing, in_transit) quote
// the standard-shipping window (placedAt + 3 to + 7 calendar days); the
// terminal states stay calm (delivered IS the answer — a past window is
// noise; cancelled carries no promise — the alert-fatigue rule; unknown
// falls through — the parse family). The date math is UTC-deterministic
// (timeZone: "UTC" in every format call) — a fixed instant renders the
// same window on any runner TZ (the formatOrderDate lesson: the worker TZ
// is not a contract). Pure module — no Prisma, no React (the order-* seam
// family: order-status, order-money-state, order-timeline, order-tracking).
import {
  DELIVERY_WINDOW_MAX_DAYS,
  DELIVERY_WINDOW_MIN_DAYS,
  deliveryWindowView,
} from "./delivery-window";

describe("deliveryWindowView — the calm state", () => {
  it("a delivered order carries no window (delivered IS the answer)", () => {
    expect(deliveryWindowView("delivered", new Date("2026-03-15T10:22:00Z"))).toEqual({
      visible: false,
    });
  });

  it("a cancelled order carries no window (no promise — the alert-fatigue rule)", () => {
    expect(deliveryWindowView("cancelled", new Date("2026-02-22T13:45:00Z"))).toEqual({
      visible: false,
    });
  });

  it("an unknown status falls through to the calm state (the parse-family fallthrough)", () => {
    expect(deliveryWindowView("returned", new Date("2026-03-15T10:22:00Z"))).toEqual({
      visible: false,
    });
  });
});

describe("deliveryWindowView — the promise states", () => {
  it("a processing order quotes the 3–7 day window (same-month compression)", () => {
    // ORD-2026-002's placed instant: 2026-03-15T10:22:00Z → Mar 18 – 22.
    expect(deliveryWindowView("processing", new Date("2026-03-15T10:22:00Z"))).toEqual({
      visible: true,
      text: "Mar 18 – 22, 2026",
    });
  });

  it("an in-transit order keeps the same promise (one quote, two promise states)", () => {
    expect(deliveryWindowView("in_transit", new Date("2026-03-15T10:22:00Z"))).toEqual({
      visible: true,
      text: "Mar 18 – 22, 2026",
    });
  });

  it("a window crossing a month repeats the end month", () => {
    // 2026-03-28 + 3/+7 → Mar 31 – Apr 4 (the same year).
    expect(deliveryWindowView("in_transit", new Date("2026-03-28T15:04:05Z"))).toEqual({
      visible: true,
      text: "Mar 31 – Apr 4, 2026",
    });
  });

  it("a window crossing a year shows both years (the honest form)", () => {
    // 2026-12-28 + 3/+7 → Dec 31, 2026 – Jan 4, 2027.
    expect(deliveryWindowView("processing", new Date("2026-12-28T09:00:00Z"))).toEqual({
      visible: true,
      text: "Dec 31, 2026 – Jan 4, 2027",
    });
  });
});

describe("deliveryWindowView — the quoted bounds", () => {
  it("the standard-shipping quote is 3–7 days (the FLAT_SHIPPING_CENTS precedent)", () => {
    expect(DELIVERY_WINDOW_MIN_DAYS).toBe(3);
    expect(DELIVERY_WINDOW_MAX_DAYS).toBe(7);
  });
});
