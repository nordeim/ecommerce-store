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
// The window is the standard-shipping quote: placedAt + 3 to + 7 calendar
// days (the seeded fulfillment stories sit inside it — ORD-2026-001 placed
// 2026-03-28, delivered 2026-04-02 = 5 days). The bounds are exported and
// unit-pinned (the FLAT_SHIPPING_CENTS precedent: the quoted bounds ARE the
// contract).
//
// THE CALM-STATE DISCIPLINE (the order-money-state / order-tracking
// precedent): the discriminated union's calm branch carries NO fields, so
// nothing can leak into a row that does not render. Only the promise states
// quote the window — `delivered` IS the answer (a past window is noise),
// `cancelled` carries no promise (the alert-fatigue rule), and an unknown
// status falls through to the calm state (the parse-family philosophy).
//
// TZ DETERMINISM: every format call pins `timeZone: "UTC"` — a fixed
// instant renders the same window on any runner TZ (the formatOrderDate
// lesson: the worker TZ is not a contract). The unit layer pins exact
// strings on fixed instants; the E2E pins the seeded fixture's window
// exactly and the fresh order's window by shape (the moving-date honesty).
//
// The module boundary follows the data (the order-* seam family:
// order-status, order-money-state, order-timeline, order-tracking) — pure,
// Prisma-free, importable from server components and tests alike.
// ---------------------------------------------------------------------------

/** The standard-shipping quote — the promise every processing/in-transit
 *  order carries. Calendar days (UTC) from the placed instant; the seeded
 *  fulfillment stories (5 days, delivered) sit inside the window. */
export const DELIVERY_WINDOW_MIN_DAYS = 3;
export const DELIVERY_WINDOW_MAX_DAYS = 7;

const DAY_MS = 86_400_000;

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
  const from = new Date(placedAt.getTime() + DELIVERY_WINDOW_MIN_DAYS * DAY_MS);
  const to = new Date(placedAt.getTime() + DELIVERY_WINDOW_MAX_DAYS * DAY_MS);
  return { visible: true, text: formatDeliveryWindow(from, to) };
}

/** The professional compressed window: same-month "Mar 18 – 22, 2026",
 *  cross-month "Mar 31 – Apr 4, 2026", cross-year "Dec 31, 2026 – Jan 4,
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
