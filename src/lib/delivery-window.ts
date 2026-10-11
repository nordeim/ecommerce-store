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
// days — Mon–Fri, the carrier-deliverable form (session-38, DELIVERY-
// WINDOW-2, ADR-046; the session-37 calendar form could quote a Saturday
// or Sunday arrival, days the standard carrier tier does not deliver —
// ORD-2026-002's own quote landed its max bound on a Sunday). The seeded
// fulfillment story sits inside it in the honest unit: ORD-2026-001
// placed Sat 2026-03-28, delivered Thu 2026-04-02 = 4 business days.
// The bounds are exported and unit-pinned (the FLAT_SHIPPING_CENTS
// precedent: the quoted bounds ARE the contract). Holidays are
// deliberately NOT modeled — jurisdiction-specific, and the standard
// store quote is Mon–Fri.
//
// THE CALM-STATE DISCIPLINE (the order-money-state / order-tracking
// precedent): the discriminated union's calm branch carries NO fields, so
// nothing can leak into a row that does not render. Only the promise states
// quote the window — `delivered` IS the answer (a past window is noise),
// `cancelled` carries no promise (the alert-fatigue rule), and an unknown
// status falls through to the calm state (the parse-family philosophy).
//
// TZ DETERMINISM: every format call pins `timeZone: "UTC"`, and the
// business-day stepper advances in fixed 24h UTC increments — UTC has no
// DST, so the weekday a step lands on is exact and a fixed instant renders
// the same window on any runner TZ (the formatOrderDate lesson: the worker
// TZ is not a contract). The unit layer pins exact strings on fixed
// instants; the E2E pins the seeded fixture's window exactly and the fresh
// order's window by shape (the moving-date honesty).
//
// The module boundary follows the data (the order-* seam family:
// order-status, order-money-state, order-timeline, order-tracking) — pure,
// Prisma-free, importable from server components and tests alike.
// ---------------------------------------------------------------------------

/** The standard-shipping quote — the promise every processing/in-transit
 *  order carries. BUSINESS days (Mon–Fri, UTC) from the placed instant;
 *  the seeded fulfillment story (4 business days, delivered) sits inside
 *  the window. */
export const DELIVERY_WINDOW_MIN_BUSINESS_DAYS = 3;
export const DELIVERY_WINDOW_MAX_BUSINESS_DAYS = 7;

const DAY_MS = 86_400_000;

/** True when the UTC calendar day of `d` is Mon–Fri — the e-commerce
 *  "business day" (the carrier-deliverable form; holidays deliberately
 *  not modeled — the standard store quote is Mon–Fri). */
function isBusinessDay(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow >= 1 && dow <= 5;
}

/** The `n`th business day strictly after `start` (UTC-deterministic: the
 *  stepper advances in fixed 24h UTC increments, so the weekday each step
 *  lands on is exact on any runner TZ). */
function addBusinessDays(start: Date, n: number): Date {
  let cursor = start.getTime();
  let counted = 0;
  while (counted < n) {
    cursor += DAY_MS;
    if (isBusinessDay(new Date(cursor))) counted += 1;
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
  const from = addBusinessDays(placedAt, DELIVERY_WINDOW_MIN_BUSINESS_DAYS);
  const to = addBusinessDays(placedAt, DELIVERY_WINDOW_MAX_BUSINESS_DAYS);
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
