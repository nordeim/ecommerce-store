// ---------------------------------------------------------------------------
// The delivery-estimate view seam (session-37, DELIVERY-WINDOW-1, ADR-045)
// — the "when will it arrive" affordance's read vocabulary.
//
// WHY THIS SEAM EXISTS: the customer order-surfaces arc (sessions 33→36:
// the money mirror → the detail read surface → the timeline → the tracking
// link) renders the order's STORY — but the story is all backward-looking.
// The natural question at the moment of purchase and while the order is in
// flight — "when will it arrive?" — had no in-app answer. This seam composes
// the PROMISE: the standard-shipping window quoted from the placed date,
// rendered on the two moments the customer asks the question (the
// confirmation — the moment of purchase; the order detail — the moment of
// checking in). Both surfaces compose THIS seam (the DASH-ALERT-1 rule: one
// source, the surfaces can never disagree).
//
// THE INPUT CONTRACT (the session-71 framing): the estimate composes from
// `Order.status` + `Order.placedAt` ONLY — no schema change, no fixtures.
// The window is the standard-shipping quote: placedAt + 3 to + 7 BUSINESS
// days — Mon–Fri AND not one of the six standard US carrier non-delivery
// dates (session-39, DELIVERY-WINDOW-3, ADR-047; the session-37 calendar
// form could quote a Saturday/Sunday arrival, and the session-38
// business-day form could still quote Thanksgiving or Christmas —
// ORD-2026-002's own quote once landed its max bound on a Sunday, and a
// Fri 2026-12-18 placement's +7 bound IS Christmas Day). The seeded
// fulfillment story sits inside it in the honest unit: ORD-2026-001
// placed Sat 2026-03-28, delivered Thu 2026-04-02 = 4 business days.
// The bounds are exported and unit-pinned (the FLAT_SHIPPING_CENTS
// precedent: the quoted bounds ARE the contract).
//
// THE STORE-CONFIG DECISION (ADR-047, made): the store's implicit
// jurisdiction is the US — USD prices, the $9.99 flat US shipping tier,
// the State/ZIP address form — so the carrier calendar is the standard US
// carrier set: New Year's Day (Jan 1), Memorial Day (last Monday of May),
// Independence Day (Jul 4), Labor Day (first Monday of September),
// Thanksgiving (4th Thursday of November), Christmas Day (Dec 25) — the
// UPS/FedEx ground-tier no-delivery set, NOT the USPS retail-closure set
// (MLK/Presidents'/Columbus/Veterans/Juneteenth: post-office closures the
// standard carriers deliver). EXACT-DATE POLICY: a fixed-date holiday
// falling on a weekend is already skipped by the weekday rule — no
// observed-day shift (Jul 4, 2026 is a Saturday; the carriers run normal
// Friday service). The table is computed per step's year (a window
// crossing Dec 31 picks up the next year's table) and pinned by
// hand-computed 2026/2027 unit oracles — the expectations are never
// derived from this module's own calendar.
//
// THE CALM-STATE DISCIPLINE (the order-money-state / order-tracking
// precedent): the discriminated union's calm branch carries NO fields, so
// nothing can leak into a row that does not render. Only the promise states
// quote the window — `delivered` IS the answer (a past window is noise),
// `cancelled` carries no promise (the alert-fatigue rule), and an unknown
// status falls through to the calm state (the parse-family philosophy).
//
// TZ DETERMINISM: every format call pins `timeZone: "UTC"`, the business-day
// stepper advances in fixed 24h UTC increments, and the holiday tables are
// computed from UTC calendar arithmetic — UTC has no DST, so the weekday a
// step lands on is exact and a fixed instant renders the same window on any
// runner TZ (the formatOrderDate lesson: the worker TZ is not a contract).
// The unit layer pins exact strings on fixed instants; the E2E pins the
// seeded fixture's window exactly and the fresh order's window by shape
// (the moving-date honesty).
//
// The module boundary follows the data (the order-* seam family:
// order-status, order-money-state, order-timeline, order-tracking) — pure,
// Prisma-free, importable from server components and tests alike.
// ---------------------------------------------------------------------------

/** The standard-shipping quote — the promise every processing/in-transit
 *  order carries. BUSINESS days (Mon–Fri, UTC) from the placed instant —
 *  skipping the six standard US carrier non-delivery dates; the seeded
 *  fulfillment story (4 business days, delivered) sits inside the
 *  window. */
export const DELIVERY_WINDOW_MIN_BUSINESS_DAYS = 3;
export const DELIVERY_WINDOW_MAX_BUSINESS_DAYS = 7;

const DAY_MS = 86_400_000;

/** A carrier holiday row of the standard-carrier calendar (ADR-047). */
export type CarrierHoliday = { name: string; iso: string };

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/** The `n`th weekday of a month (UTC calendar arithmetic; `weekday` is
 *  0=Sun…6=Sat; `n` counts from 1 — e.g. n=4, weekday=4 is the 4th
 *  Thursday of November: Thanksgiving). */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7));
}

/** The last weekday of a month, walking back from its final day (e.g.
 *  weekday=1, month=May: Memorial Day — the last Monday of May). */
function lastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, month + 1, 0));
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return new Date(Date.UTC(year, month, last.getUTCDate() - offset));
}

/** The six standard US carrier non-delivery dates for a year (ADR-047 —
 *  the store-config decision: the store is US-denominated — USD prices,
 *  the $9.99 flat US shipping tier, the State/ZIP address form — so the
 *  store's carrier calendar is the US one). The UPS/FedEx ground-tier
 *  set — NOT the USPS retail-closure set (MLK Day, Presidents' Day,
 *  Columbus Day, Veterans Day, Juneteenth are post-office closures; the
 *  standard carriers deliver them). EXACT-DATE POLICY: a fixed-date
 *  holiday falling on a weekend is already skipped by the weekday rule —
 *  no observed-day shift (the standard carriers run normal
 *  Friday/Monday service when the holiday falls on a weekend; Jul 4
 *  2026 is a Saturday and the 2026 window math is identical with or
 *  without the calendar). Sorted ascending — the table IS the pinned
 *  contract (the 2026/2027 unit oracles pin hand-computed values). */
export function carrierHolidaysForYear(year: number): CarrierHoliday[] {
  const fixed = (month: number, day: number) => new Date(Date.UTC(year, month, day));
  return [
    { name: "New Year's Day", iso: isoDate(fixed(0, 1)) },
    { name: "Memorial Day", iso: isoDate(lastWeekdayOfMonth(year, 4, 1)) },
    { name: "Independence Day", iso: isoDate(fixed(6, 4)) },
    { name: "Labor Day", iso: isoDate(nthWeekdayOfMonth(year, 8, 1, 1)) },
    { name: "Thanksgiving", iso: isoDate(nthWeekdayOfMonth(year, 10, 4, 4)) },
    { name: "Christmas Day", iso: isoDate(fixed(11, 25)) },
  ];
}

/** The per-year holiday tables already computed (a window crosses a year
 *  boundary at most once, so this cache holds at most two entries). */
const holidayCache = new Map<number, Set<string>>();

function holidayISOsForYear(year: number): Set<string> {
  let set = holidayCache.get(year);
  if (!set) {
    set = new Set(carrierHolidaysForYear(year).map((h) => h.iso));
    holidayCache.set(year, set);
  }
  return set;
}

/** True when the UTC calendar day of `d` is Mon–Fri AND not one of the
 *  six standard-carrier non-delivery dates — the e-commerce
 *  "business day" in its carrier-deliverable form (ADR-047). */
function isDeliverableDay(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow >= 1 && dow <= 5 && !holidayISOsForYear(d.getUTCFullYear()).has(isoDate(d));
}

/** The `n`th deliverable day strictly after `start` (UTC-deterministic:
 *  the stepper advances in fixed 24h UTC increments, so the weekday each
 *  step lands on is exact on any runner TZ; the holiday table is
 *  resolved per step's year, so a window crossing Dec 31 picks up the
 *  next year's table). */
function addDeliverableDays(start: Date, n: number): Date {
  let cursor = start.getTime();
  let counted = 0;
  while (counted < n) {
    cursor += DAY_MS;
    if (isDeliverableDay(new Date(cursor))) counted += 1;
  }
  return new Date(cursor);
}

/** The estimate read row — a discriminated union (the order-tracking
 *  precedent): the calm state carries NO fields, so nothing can leak into
 *  a row that does not render. */
export type DeliveryWindowView =
  | { visible: false }
  | { visible: true; text: string };

/**
 * Composes the customer-facing delivery estimate. Visible ONLY for the
 * promise states (`processing` — just placed / being prepared, and
 * `in_transit` — the promise still stands); the terminal states and any
 * unknown status stay calm.
 */
export function deliveryWindowView(status: string, placedAt: Date): DeliveryWindowView {
  if (status !== "processing" && status !== "in_transit") {
    return { visible: false };
  }
  const from = addDeliverableDays(placedAt, DELIVERY_WINDOW_MIN_BUSINESS_DAYS);
  const to = addDeliverableDays(placedAt, DELIVERY_WINDOW_MAX_BUSINESS_DAYS);
  return { visible: true, text: formatDeliveryWindow(from, to) };
}

/** The professional compressed window: same-month "Mar 18 – 24, 2026",
 *  cross-month "Mar 30 – Apr 3, 2026", cross-year "Dec 31, 2026 – Jan 6,
 *  2027" (both years when they differ — the honest form). UTC-pinned so
 *  the output is deterministic on any runner TZ. */
function formatDeliveryWindow(from: Date, to: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  const fromMonth = fmt(from, { month: "short" });
  const fromDay = fmt(from, { day: "numeric" });
  const fromYear = fmt(from, { year: "numeric" });
  const toMonth = fmt(to, { month: "short" });
  const toDay = fmt(to, { day: "numeric" });
  const toYear = fmt(to, { year: "numeric" });

  if (fromYear === toYear) {
    if (fromMonth === toMonth) {
      // Same month: the compressed form (the month stated once).
      return `${fromMonth} ${fromDay} – ${toDay}, ${toYear}`;
    }
    return `${fromMonth} ${fromDay} – ${toMonth} ${toDay}, ${toYear}`;
  }
  // Crossing a year: both years shown — the honest form.
  return `${fromMonth} ${fromDay}, ${fromYear} – ${toMonth} ${toDay}, ${toYear}`;
}
