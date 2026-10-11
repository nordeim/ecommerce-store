import { describe, expect, it } from "vitest";
// Session-38 (DELIVERY-WINDOW-2, ADR-046): the business-day refinement of
// the delivery-estimate view seam (session-37, DELIVERY-WINDOW-1). The
// window composes from the order's status + placedAt ONLY (no schema
// change): the promise states (processing, in_transit) quote the
// standard-shipping window (placedAt + 3 to + 7 BUSINESS days — Mon–Fri,
// the carrier-deliverable form; the calendar-day form could quote a
// Saturday/Sunday arrival, days the standard tier does not deliver);
// the terminal states stay calm (delivered IS the answer — a past window
// is noise; cancelled carries no promise — the alert-fatigue rule;
// unknown falls through — the parse family). The date math is
// UTC-deterministic (fixed 24h UTC steps, timeZone: "UTC" in every format
// call — UTC has no DST, so the weekday a step lands on is exact) — a
// fixed instant renders the same window on any runner TZ (the
// formatOrderDate lesson: the worker TZ is not a contract). Holidays are
// deliberately NOT modeled (jurisdiction-specific; the standard store
// quote is Mon–Fri). Pure module — no Prisma, no React (the order-* seam
// family: order-status, order-money-state, order-timeline, order-tracking).
import {
  DELIVERY_WINDOW_MAX_BUSINESS_DAYS,
  DELIVERY_WINDOW_MIN_BUSINESS_DAYS,
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

describe("deliveryWindowView — the promise states (business days)", () => {
  it("a Sunday-placed processing order quotes the 3–7 business-day window (ORD-2026-002's instant)", () => {
    // Placed Sun 2026-03-15: Mon 16, Tue 17, Wed 18 → from Mar 18; the
    // +7 bound steps past the Mar 21–22 weekend: … Mon 23, Tue 24 → to
    // Mar 24. The calendar form quoted "Mar 18 – 22" — a SUNDAY max bound
    // the standard carrier tier does not deliver (the round-38 finding).
    expect(deliveryWindowView("processing", new Date("2026-03-15T10:22:00Z"))).toEqual({
      visible: true,
      text: "Mar 18 – 24, 2026",
    });
  });

  it("an in-transit order keeps the same promise (one quote, two promise states)", () => {
    expect(deliveryWindowView("in_transit", new Date("2026-03-15T10:22:00Z"))).toEqual({
      visible: true,
      text: "Mar 18 – 24, 2026",
    });
  });

  it("a Saturday-placed window skips BOTH bounding weekends (the same-month form)", () => {
    // Placed Sat 2026-03-28: Mon 30, Tue 31, Wed Apr 1 → from Apr 1;
    // Thu 2, Fri 3, ~~Apr 4–5 weekend~~, Mon 6, Tue 7 → to Apr 7. Note
    // the format branch: the calendar form's "Mar 31 – Apr 4" was
    // cross-month; the business form's bounds both land in April.
    expect(deliveryWindowView("in_transit", new Date("2026-03-28T15:04:05Z"))).toEqual({
      visible: true,
      text: "Apr 1 – 7, 2026",
    });
  });

  it("a Monday-placed cross-year window skips the new year's weekend (both years — the honest form)", () => {
    // Placed Mon 2026-12-28: Tue 29, Wed 30, Thu 31 → from Dec 31, 2026;
    // Fri Jan 1, ~~Jan 2–3 weekend~~, Mon 4, Tue 5, Wed 6 → to Jan 6, 2027.
    expect(deliveryWindowView("processing", new Date("2026-12-28T09:00:00Z"))).toEqual({
      visible: true,
      text: "Dec 31, 2026 – Jan 6, 2027",
    });
  });

  it("a Friday-placed window lands both bounds mid-next-week (the tightest weekend interaction)", () => {
    // Placed Fri 2026-03-20: ~~Mar 21–22 weekend~~, Mon 23, Tue 24, Wed 25
    // → from Mar 25; Thu 26, Fri 27, ~~Mar 28–29 weekend~~, Mon 30, Tue 31
    // → to Mar 31. A Friday placement straddles TWO weekends in one window.
    expect(deliveryWindowView("processing", new Date("2026-03-20T12:00:00Z"))).toEqual({
      visible: true,
      text: "Mar 25 – 31, 2026",
    });
  });
});

describe("deliveryWindowView — the never-a-weekend-bound property", () => {
  // Parse the seam's three pinned text formats back into UTC dates and
  // assert BOTH bounds land on Mon–Fri — for EVERY placement day of a
  // two-week span (Mar 15–28, 2026: both weekend days and every weekday).
  // This is the round-38 contract's core property: the quote never
  // promises a day the standard carrier tier does not deliver.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const utc = (mon: string, day: string, year: string) =>
    new Date(Date.UTC(Number(year), MONTHS.indexOf(mon), Number(day)));
  const parseWindow = (text: string): { from: Date; to: Date } | null => {
    let m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}) – (\d{1,2}), (\d{4})$/); // same-month
    if (m) return { from: utc(m[1], m[2], m[4]), to: utc(m[1], m[3], m[4]) };
    m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}) – ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/); // cross-month
    if (m) return { from: utc(m[1], m[2], m[5]), to: utc(m[3], m[4], m[5]) };
    m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4}) – ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/); // cross-year
    if (m) return { from: utc(m[1], m[2], m[3]), to: utc(m[4], m[5], m[6]) };
    return null;
  };
  const BUSINESS_DOWS = [1, 2, 3, 4, 5];

  it("every bound of every window in a 14-placement-day span is a business day", () => {
    for (let d = 0; d < 14; d++) {
      const placed = new Date(Date.UTC(2026, 2, 15, 10, 22, 0) + d * 86_400_000);
      const view = deliveryWindowView("processing", placed);
      expect(view.visible, `placed ${placed.toISOString()}`).toBe(true);
      if (!view.visible) continue;
      const parsed = parseWindow(view.text);
      expect(parsed, `unparseable window text: "${view.text}"`).not.toBeNull();
      if (!parsed) continue;
      expect(
        BUSINESS_DOWS,
        `placed ${placed.toISOString()} — the FROM bound "${view.text}" lands on a weekend`,
      ).toContain(parsed.from.getUTCDay());
      expect(
        BUSINESS_DOWS,
        `placed ${placed.toISOString()} — the TO bound "${view.text}" lands on a weekend`,
      ).toContain(parsed.to.getUTCDay());
      expect(parsed.from.getTime(), `from must not trail to: "${view.text}"`).toBeLessThanOrEqual(
        parsed.to.getTime(),
      );
    }
  });
});

describe("deliveryWindowView — the quoted bounds", () => {
  it("the standard-shipping quote is 3–7 business days (the FLAT_SHIPPING_CENTS precedent)", () => {
    expect(DELIVERY_WINDOW_MIN_BUSINESS_DAYS).toBe(3);
    expect(DELIVERY_WINDOW_MAX_BUSINESS_DAYS).toBe(7);
  });
});
