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
 */

/** The canonical statuses the status combobox writes (ORDER_STATUSES). */
export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const CANONICAL_STATUSES = new Set<string>(ADMIN_ORDER_STATUS_OPTIONS.map((o) => o.value));

export type AdminOrderFilters = { status?: string; q?: string };

export type AdminOrderWhere = {
  status?: string;
  OR?: Array<{ number: { contains: string } } | { email: { contains: string } }>;
};

/**
 * Parse the raw searchParams record (the `Record<string, string | string[]
 * | undefined>` Next delivers) into the validated filter state. Array
 * params take their first value (the ?q=a&q=b shape), unknown keys are
 * ignored, invalid statuses are dropped.
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

  return { status, q: qRaw || undefined };
}

/**
 * Build the Prisma `where` for the filtered order query. No filters → `{}`
 * (the unfiltered list). Status-only → the exact match. With `q` → the
 * two-branch OR (number + email contains) — ANDed with the status when
 * both are present.
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
  return where;
}
