/**
 * Admin order-list filters (session-13, ADMIN-SEARCH-1) — the pure seam
 * behind /admin/orders' URL-deep-linkable filter state (?status= + ?q=),
 * mirroring the shop's filter-bar pattern. The shop's parser stayed
 * page-local for reference-parity reasons; the admin surface is a
 * superset, so it gets the lib-seam treatment (unit-pinned here, E2E in
 * tests/e2e/admin.spec.ts).
 *
 * Contract: `status` is validated against the four canonical statuses the
 * AdminOrderRow combobox writes (src/lib/actions/admin.ts
 * ORDER_STATUSES) — anything else falls through to undefined so a bad
 * deep-link renders the unfiltered list, never an error. `q` is trimmed
 * and matched with SQLite `contains` (ASCII-case-insensitive LIKE) against
 * the order number OR the customer email — the two identifiers a customer
 * relays.
 *
 * ORDER-WINDOW-1 (session-41, ADR-048): the date-range window — the
 * PAY-OPS-3 treatment applied to this surface (the only LIST surface
 * without a time dimension; the take-100 ceiling's reach-past tool).
 * `from`/`to` validate as strict `YYYY-MM-DD` (the shared day-bounds
 * seam — the validation and boundary math compose src/lib/day-bounds.ts,
 * the session-35 formatTimelineDate precedent); a bad bound falls through
 * to undefined (the family contract) and an inverted pair (from > to)
 * drops together. The where composes the `placedAt` clause — `gte` the
 * UTC day boundary of `from`, `lt` the day AFTER `to` (exclusive — to's
 * whole day is in range) — ANDed with the status + q keys (the flat
 * shape's third key; every pre-session-41 shape is byte-identical).
 */

// Session-41, ORDER-WINDOW-1 (ADR-048): the day-bound validation + the
// boundary math compose the shared seam (the payments surface's own
// helpers, extracted — both seams' date handling is identical by
// construction).
import { parseDayBound, utcDayBounds } from "./day-bounds";

/** The canonical statuses the status combobox writes (ORDER_STATUSES). */
export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const CANONICAL_STATUSES = new Set<string>(ADMIN_ORDER_STATUS_OPTIONS.map((o) => o.value));

export type AdminOrderFilters = { status?: string; q?: string; from?: string; to?: string };

/** A strict `YYYY-MM-DD` day bound on `Order.placedAt` (UTC). */
export type AdminOrderDateRange = { gte?: Date; lt?: Date };

export type AdminOrderWhere = {
  status?: string;
  OR?: Array<{ number: { contains: string } } | { email: { contains: string } }>;
  placedAt?: AdminOrderDateRange;
};

/**
 * Parse the raw searchParams record (the `Record<string, string | string[]
 * | undefined>` Next delivers) into the validated filter state. Array
 * params take their first value (the ?q=a&q=b shape), unknown keys are
 * ignored, invalid statuses are dropped.
 *
 * ORDER-WINDOW-1: each date bound validates independently (the shared
 * parseDayBound), then an inverted pair drops together (lexicographic
 * order IS chronological order for validated YYYY-MM-DD strings).
 */
export function parseAdminOrderFilters(
  params: Record<string, string | string[] | undefined>,
): AdminOrderFilters {
  const one = (k: string): string | undefined => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const statusRaw = one("status");
  const status = statusRaw && CANONICAL_STATUSES.has(statusRaw) ? statusRaw : undefined;

  const qRaw = one("q")?.trim();

  // ORDER-WINDOW-1 (session-41): validate each bound independently, then
  // drop an inverted pair together (the PAY-OPS-3 contract).
  let from = parseDayBound(one("from"));
  let to = parseDayBound(one("to"));
  if (from && to && from > to) {
    from = undefined;
    to = undefined;
  }

  return { status, q: qRaw || undefined, from, to };
}

/**
 * Build the Prisma `where` for the filtered order query. No filters → `{}`
 * (the unfiltered list). Status-only → the exact match. With `q` → the
 * two-branch OR (number + email contains) — the flat shape ANDs its keys
 * (Prisma semantics: top-level keys AND).
 *
 * ORDER-WINDOW-1: the date window composes the `placedAt` clause as the
 * flat shape's third key — `gte` from's midnight, `lt` the midnight AFTER
 * to (the shared utcDayBounds). Every pre-session-41 shape is
 * byte-identical (the date keys were simply absent before).
 */
export function buildAdminOrderWhere(filters: AdminOrderFilters): AdminOrderWhere {
  const where: AdminOrderWhere = {};
  if (filters.status) where.status = filters.status;
  if (filters.q) {
    where.OR = [
      { number: { contains: filters.q } },
      { email: { contains: filters.q } },
    ];
  }
  if (filters.from || filters.to) {
    where.placedAt = utcDayBounds({ from: filters.from, to: filters.to });
  }
  return where;
}
