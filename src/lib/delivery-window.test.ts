import { describe, expect, it } from "vitest";
// Session-39 (DELIVERY-WINDOW-3, ADR-047): the carrier-holiday refinement
// of the delivery-estimate view seam (session-37/38, DELIVERY-WINDOW-1/2).
// The window composes from the order's status + placedAt ONLY (no schema
// change): the promise states (processing, in_transit) quote the
// standard-shipping window (placedAt + 3 to + 7 BUSINESS days — Mon–Fri,
// AND not one of the six standard US carrier non-delivery dates: New
// Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving,
// Christmas Day — the UPS/FedEx ground-tier set; a fixed-date holiday
// falling on a weekend is already skipped by the weekday rule, no
// observed-day shift); the terminal states stay calm (delivered IS the
// answer — a past window is noise; cancelled carries no promise — the
// alert-fatigue rule; unknown falls through — the parse family). The date
// math is UTC-deterministic (fixed 24h UTC steps, timeZone: "UTC" in
// every format call — UTC has no DST, so the weekday a step lands on is
// exact; the holiday tables are computed from UTC calendar arithmetic) —
// a fixed instant renders the same window on any runner TZ (the
// formatOrderDate lesson: the worker TZ is not a contract). The 2026 and
// 2027 holiday-table pins below are HAND-COMPUTED expected values (the
// independent-oracle rule — never derive the expectations from the seam's
// own calendar). Pure module — no Prisma, no React (the order-* seam
// family: order-status, order-money-state, order-timeline, order-tracking).
import {
  DELIVERY_WINDOW_MAX_BUSINESS_DAYS,
  DELIVERY_WINDOW_MIN_BUSINESS_DAYS,
  carrierHolidaysForYear,
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

describe("deliveryWindowView — the promise states (business days, carrier-holiday-aware)", () => {
  it("a Sunday-placed processing order quotes the 3–7 business-day window (ORD-2026-002's instant)", () => {
    // Placed Sun 2026-03-15: Mon 16, Tue 17, Wed 18 → from Mar 18; the
    // +7 bound steps past the Mar 21–22 weekend: … Mon 23, Tue 24 → to
    // Mar 24. March/April carry no carrier holidays, so this pin is
    // holiday-free — it is also the E2E fixture's exact pin.
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
    // Thu 2, Fri 3, ~~Apr 4–5 weekend~~, Mon 6, Tue 7 → to Apr 7.
    expect(deliveryWindowView("in_transit", new Date("2026-03-28T15:04:05Z"))).toEqual({
      visible: true,
      text: "Apr 1 – 7, 2026",
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

  it("a Thanksgiving-week window skips Thu Nov 26 (the holiday-blind quote promised Thanksgiving)", () => {
    // Placed Tue 2026-11-24: Wed 25 (1), ~~Thu 26 — Thanksgiving~~, Fri 27
    // (2), ~~Nov 28–29 weekend~~, Mon 30 (3) → from Nov 30; Tue Dec 1 (4),
    // Wed 2 (5), Thu 3 (6), Fri 4 (7) → to Dec 4. The holiday-blind form
    // quoted "Nov 27 – Dec 3" — a max bound ON Thanksgiving, a day the
    // standard carrier tier does not deliver (the round-39 finding).
    expect(deliveryWindowView("processing", new Date("2026-11-24T12:00:00Z"))).toEqual({
      visible: true,
      text: "Nov 30 – Dec 4, 2026",
    });
  });

  it("a Christmas-week window skips Fri Dec 25", () => {
    // Placed Mon 2026-12-21: Tue 22 (1), Wed 23 (2), Thu 24 (3) → from
    // Dec 24; ~~Fri 25 — Christmas~~, ~~Dec 26–27 weekend~~, Mon 28 (4),
    // Tue 29 (5), Wed 30 (6), Thu 31 (7) → to Dec 31. The from bound
    // lands Christmas Eve — a deliverable day; the blind to bound was
    // Dec 30, which counted the Christmas holiday as deliverable.
    expect(deliveryWindowView("in_transit", new Date("2026-12-21T12:00:00Z"))).toEqual({
      visible: true,
      text: "Dec 24 – 31, 2026",
    });
  });

  it("a late-December window can skip BOTH Christmas and New Year's Day (the double holiday)", () => {
    // Placed Tue 2026-12-22: Wed 23 (1), Thu 24 (2), ~~Fri 25 —
    // Christmas~~, Mon 28 (3) → from Dec 28; Tue 29 (4), Wed 30 (5), Thu
    // 31 (6), ~~Fri Jan 1 — New Year's Day 2027~~, Mon Jan 4 (7) → to
    // Jan 4, 2027. Both carrier holidays in one window — and the format
    // branch flips to the cross-year form (the per-step year switch picks
    // up the 2027 table mid-window). The blind form was "Dec 25 – 31,
    // 2026" — the from bound WAS Christmas Day.
    expect(deliveryWindowView("processing", new Date("2026-12-22T12:00:00Z"))).toEqual({
      visible: true,
      text: "Dec 28, 2026 – Jan 4, 2027",
    });
  });

  it("a Memorial-Day-week window skips Mon May 25 (the cross-month exact form)", () => {
    // Placed Thu 2026-05-21: Fri 22 (1), ~~Mon 25 — Memorial Day~~, Tue 26
    // (2), Wed 27 (3) → from May 27; Thu 28 (4), Fri 29 (5), ~~May 30–31
    // weekend~~, Mon Jun 1 (6), Tue 2 (7) → to Jun 2. Also pins the
    // cross-month same-year format branch with an exact string (the
    // session-39 audit's coverage gap: the branch had only ever been
    // exercised via the sweep's parse-back).
    expect(deliveryWindowView("in_transit", new Date("2026-05-21T12:00:00Z"))).toEqual({
      visible: true,
      text: "May 27 – Jun 2, 2026",
    });
  });

  it("a Labor-Day-week window skips Mon Sep 7", () => {
    // Placed Thu 2026-09-03: Fri 4 (1), ~~Mon 7 — Labor Day~~, Tue 8 (2),
    // Wed 9 (3) → from Sep 9; Thu 10 (4), Fri 11 (5), ~~Sep 12–13
    // weekend~~, Mon 14 (6), Tue 15 (7) → to Sep 15.
    expect(deliveryWindowView("processing", new Date("2026-09-03T12:00:00Z"))).toEqual({
      visible: true,
      text: "Sep 9 – 15, 2026",
    });
  });

  it("a weekend-falling fixed holiday gets NO observed-day shift (the exact-date policy)", () => {
    // Placed Thu 2026-07-02: Fri 3 (1), ~~Jul 4–5 weekend — Independence
    // Day falls ON Saturday 2026~~, Mon 6 (2), Tue 7 (3) → from Jul 7;
    // Wed 8 (4), Thu 9 (5), Fri 10 (6), Mon 13 (7) → to Jul 13. The
    // exact-date policy: the Saturday holiday is already skipped by the
    // weekday rule — the standard carriers run normal Friday service, so
    // there is NO observed-day shift to Fri Jul 3 (an observed-day model
    // would quote "Jul 8 – 13, 2026" and fail this pin). This pin is
    // green through RED and GREEN by design — it pins the POLICY.
    expect(deliveryWindowView("processing", new Date("2026-07-02T12:00:00Z"))).toEqual({
      visible: true,
      text: "Jul 7 – 13, 2026",
    });
  });

  it("a Monday-placed cross-year window skips the new year's weekend AND Fri Jan 1 (both years — the honest form)", () => {
    // Placed Mon 2026-12-28: Tue 29 (1), Wed 30 (2), Thu 31 (3) → from
    // Dec 31, 2026; ~~Fri Jan 1 — New Year's Day 2027~~, ~~Jan 2–3
    // weekend~~, Mon 4 (4), Tue 5 (5), Wed 6 (6), Thu 7 (7) → to Jan 7,
    // 2027. The round-38 form counted Jan 1 as a deliverable day ("…–
    // Jan 6, 2027") — the refinement's only UPDATED pin.
    expect(deliveryWindowView("processing", new Date("2026-12-28T09:00:00Z"))).toEqual({
      visible: true,
      text: "Dec 31, 2026 – Jan 7, 2027",
    });
  });
});

describe("carrierHolidaysForYear — the six-date standard-carrier calendar (the independent oracle)", () => {
  // The expected tables are HAND-COMPUTED (the independent-oracle rule):
  // fixed dates Jan 1 / Jul 4 / Dec 25 + the computed Mondays/Thursday —
  // Memorial Day (last Monday of May), Labor Day (first Monday of
  // September), Thanksgiving (4th Thursday of November). 2026 exercises
  // the weekend fall of Jul 4 (Sat); 2027 exercises the Sunday fall
  // (Jul 4) and the Saturday fall of Christmas (Dec 25) — under the
  // exact-date policy those dates stay in the table verbatim (the
  // weekday rule already skips them).
  it("2026: the six standard-carrier non-delivery dates", () => {
    expect(carrierHolidaysForYear(2026)).toEqual([
      { name: "New Year's Day", iso: "2026-01-01" },
      { name: "Memorial Day", iso: "2026-05-25" },
      { name: "Independence Day", iso: "2026-07-04" },
      { name: "Labor Day", iso: "2026-09-07" },
      { name: "Thanksgiving", iso: "2026-11-26" },
      { name: "Christmas Day", iso: "2026-12-25" },
    ]);
  });

  it("2027: the computed dates shift with the year (Memorial May 31, Labor Sep 6, Thanksgiving Nov 25)", () => {
    expect(carrierHolidaysForYear(2027)).toEqual([
      { name: "New Year's Day", iso: "2027-01-01" },
      { name: "Memorial Day", iso: "2027-05-31" },
      { name: "Independence Day", iso: "2027-07-04" },
      { name: "Labor Day", iso: "2027-09-06" },
      { name: "Thanksgiving", iso: "2027-11-25" },
      { name: "Christmas Day", iso: "2027-12-25" },
    ]);
  });
});

describe("deliveryWindowView — the never-a-nondeliverable-bound property", () => {
  // Parse the seam's three pinned text formats back into UTC dates and
  // assert BOTH bounds land on days the standard carrier tier actually
  // delivers: Mon–Fri AND not a carrier holiday.
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
  // The holiday membership oracle used by the ASSERTION side: the fixed
  // dates plus the computed Mondays/Thursday, evaluated by hand-checked
  // UTC calendar arithmetic (independent of the seam's implementation).
  const holidayISO = new Set<string>();
  for (const y of [2026, 2027]) {
    // Memorial Day — the last Monday of May: walk back from May 31.
    const lastMondayOfMay = new Date(Date.UTC(y, 5, 0));
    lastMondayOfMay.setUTCDate(lastMondayOfMay.getUTCDate() - ((lastMondayOfMay.getUTCDay() + 6) % 7));
    // Labor Day — the first Monday of September: walk forward from Sep 1.
    const firstOfSep = new Date(Date.UTC(y, 8, 1));
    const firstMondayOfSep = new Date(
      Date.UTC(y, 8, 1 + ((1 - firstOfSep.getUTCDay() + 7) % 7)),
    );
    // Thanksgiving — the 4th Thursday of November: first Thursday + 3 weeks.
    const firstOfNov = new Date(Date.UTC(y, 10, 1));
    const firstThursdayOfNov = new Date(
      Date.UTC(y, 10, 1 + ((4 - firstOfNov.getUTCDay() + 7) % 7)),
    );
    const thanksgiving = new Date(firstThursdayOfNov);
    thanksgiving.setUTCDate(thanksgiving.getUTCDate() + 21);
    const p = (n: number) => String(n).padStart(2, "0");
    const iso = (d: Date) => `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
    for (const d of [
      new Date(Date.UTC(y, 0, 1)),
      lastMondayOfMay,
      new Date(Date.UTC(y, 6, 4)),
      firstMondayOfSep,
      thanksgiving,
      new Date(Date.UTC(y, 11, 25)),
    ]) {
      holidayISO.add(iso(d));
    }
  }

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

  it("every bound of every window across a FULL placement year is a business day AND not a carrier holiday (2026: all six holidays, incl. the Jul-4 weekend fall)", () => {
    // The round-39 contract's core property: the quote never promises a
    // day the standard carrier tier does not deliver — neither a weekend
    // nor one of the six carrier holidays. Every placement day of 2026
    // (365 placements), parsed back from the seam's three text formats.
    // The holiday-blind math fails this on 10 placements (verified by the
    // independent oracle script before the plan was written).
    for (let d = 0; d < 365; d++) {
      const placed = new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + d * 86_400_000);
      const view = deliveryWindowView("processing", placed);
      expect(view.visible, `placed ${placed.toISOString()}`).toBe(true);
      if (!view.visible) continue;
      const parsed = parseWindow(view.text);
      expect(parsed, `unparseable window text: "${view.text}"`).not.toBeNull();
      if (!parsed) continue;
      const p = (n: number) => String(n).padStart(2, "0");
      const isoOf = (dt: Date) =>
        `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
      for (const [label, bound] of [
        ["FROM", parsed.from],
        ["TO", parsed.to],
      ] as const) {
        expect(
          BUSINESS_DOWS,
          `placed ${placed.toISOString()} — the ${label} bound "${view.text}" lands on a weekend`,
        ).toContain(bound.getUTCDay());
        expect(
          holidayISO,
          `placed ${placed.toISOString()} — the ${label} bound "${view.text}" lands on a carrier holiday (${isoOf(bound)})`,
        ).not.toContain(isoOf(bound));
      }
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
