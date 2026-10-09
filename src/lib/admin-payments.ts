/**
 * Admin payment-ops filters + outcome derivation (session-24, PAY-OPS-1;
 * refined session-25, PAY-OPS-2) — the pure seam behind /admin/payments'
 * URL-deep-linkable filter state (?family= + ?q=), mirroring the
 * /admin/orders pattern (session-13, ADMIN-SEARCH-1). The payments surface
 * is an admin-only superset, so it gets the lib-seam treatment (unit-pinned
 * here, E2E in tests/e2e/admin.spec.ts).
 *
 * Contract: `family` is validated against the four canonical event
 * families — succeeded / failed / refund-needed / other (raw Stripe event
 * types are free-form strings; the family is the operator's mental model)
 * — anything else falls through to undefined so a bad deep-link renders
 * the unfiltered list, never an error. `q` is trimmed and matched with
 * SQLite `contains` (ASCII-case-insensitive LIKE) against the
 * paymentIntentId OR the eventId — the two identifiers an operator
 * relays from the Stripe dashboard.
 *
 * The refund-needed family (session-25, PAY-OPS-2a) expresses "succeeded
 * AND not linked to any placed order": `buildAdminPaymentWhere` takes the
 * placed-intent set as its second (default-empty) parameter — pure input,
 * no Prisma import; the PAGE always passes the fetched set for this
 * family (the deep-link E2E test fails if it ever forgets — the
 * integration guard lives there, the shape contract lives here).
 *
 * The outcome resolver is the page's honest derivation, purely from DB
 * state: a succeeded event with no linked order is exactly the
 * deterministic-failure family the webhook records + 200s (amount
 * mismatch, stock-short, unusable metadata, vanished cart — see ADR-031)
 * — the refund-needed signal an operator must act on.
 */

/** The canonical event families the family Select writes. */
export const ADMIN_PAYMENT_FAMILY_OPTIONS = [
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "refund-needed", label: "Refund needed" },
  { value: "other", label: "Other" },
] as const;

const CANONICAL_FAMILIES = new Set<string>(ADMIN_PAYMENT_FAMILY_OPTIONS.map((o) => o.value));

/** The two Stripe event types the payment-ops surface treats specially. */
export const PAYMENT_INTENT_SUCCEEDED_TYPE = "payment_intent.succeeded";
export const PAYMENT_INTENT_FAILED_TYPE = "payment_intent.payment_failed";

export type AdminPaymentFilters = { family?: string; q?: string };

export type AdminPaymentWhere = {
  type?: string;
  NOT?: { OR: Array<{ type: string }> };
  OR?: Array<
    { paymentIntentId: { contains: string } }
    | { eventId: { contains: string } }
    | { paymentIntentId: { notIn: string[] } }
    | { paymentIntentId: null }
  >;
  AND?: Array<
    | { type: string }
    | { NOT: { OR: Array<{ type: string }> } }
    | { type: string; OR: NonNullable<AdminPaymentWhere["OR"]> }
    | { OR: NonNullable<AdminPaymentWhere["OR"]> }
  >;
};

/**
 * Parse the raw searchParams record (the `Record<string, string | string[]
 * | undefined>` Next delivers) into the validated filter state. Array
 * params take their first value (the ?q=a&q=b shape), unknown keys are
 * ignored, invalid families are dropped.
 */
export function parseAdminPaymentFilters(
  params: Record<string, string | string[] | undefined>,
): AdminPaymentFilters {
  const one = (k: string): string | undefined => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const familyRaw = one("family");
  const family = familyRaw && CANONICAL_FAMILIES.has(familyRaw) ? familyRaw : undefined;

  const qRaw = one("q")?.trim();

  return { family, q: qRaw || undefined };
}

/**
 * Build the Prisma `where` for the filtered StripeEvent query. No filters
 * → `{}` (the unfiltered list). Family-only → the exact type match
 * (succeeded/failed), the NOT-OR negation (other), or the refund-needed
 * shape (succeeded + not-in-the-placed-intent-set + the null-intent
 * branch — a succeeded event with no intent id is refund-needed per the
 * resolver). With `q` → the two-branch OR (paymentIntentId + eventId
 * contains) — ANDed with the family when both are present (the
 * refund-needed family keeps its type + notIn group intact inside the
 * AND element).
 *
 * The placed-intent set (default `[]`) is only consulted for the
 * refund-needed family; other families ignore it.
 */
export function buildAdminPaymentWhere(
  filters: AdminPaymentFilters,
  placedIntentIds: string[] = [],
): AdminPaymentWhere {
  const where: AdminPaymentWhere = {};
  if (filters.family === "succeeded") {
    where.type = PAYMENT_INTENT_SUCCEEDED_TYPE;
  } else if (filters.family === "failed") {
    where.type = PAYMENT_INTENT_FAILED_TYPE;
  } else if (filters.family === "refund-needed") {
    where.type = PAYMENT_INTENT_SUCCEEDED_TYPE;
    where.OR = [
      { paymentIntentId: { notIn: placedIntentIds } },
      { paymentIntentId: null },
    ];
  } else if (filters.family === "other") {
    where.NOT = {
      OR: [{ type: PAYMENT_INTENT_SUCCEEDED_TYPE }, { type: PAYMENT_INTENT_FAILED_TYPE }],
    };
  }
  if (filters.q) {
    const qBranch: AdminPaymentWhere["OR"] = [
      { paymentIntentId: { contains: filters.q } },
      { eventId: { contains: filters.q } },
    ];
    if (where.type && where.OR) {
      // The refund-needed family: the type + notIn group stays intact
      // inside one AND element (Prisma composes the nested operators).
      return { AND: [{ type: where.type, OR: where.OR }, { OR: qBranch }] };
    }
    if (where.type) {
      // AND the family branch with the q branch (Prisma needs the
      // explicit combinator when both carry operator keys).
      return { AND: [{ type: where.type }, { OR: qBranch }] };
    }
    if (where.NOT) {
      return { AND: [{ NOT: where.NOT }, { OR: qBranch }] };
    }
    return { OR: qBranch };
  }
  return where;
}

/** The structural view of a StripeEvent row the resolver consumes. */
export type PaymentEventView = {
  type: string;
  paymentIntentId: string | null;
};

/** The structural view of an order linked by intent id. */
export type PaymentOrderView = {
  orderId: string;
  orderNumber: string;
};

export type PaymentEventOutcome =
  | { kind: "placed"; orderNumber: string; orderId: string }
  | { kind: "refund-needed" }
  | { kind: "failed" }
  | { kind: "ignored" };

/**
 * Derive the honest outcome for one event row from DB state:
 * - `payment_intent.succeeded` + a linked order → `placed` (the deep-link
 *   target);
 * - `payment_intent.succeeded` with NO order → `refund-needed` (the
 *   deterministic-failure family: a captured payment the operator must
 *   refund — the webhook recorded the event and answered 200);
 * - `payment_intent.payment_failed` → `failed`;
 * - anything else → `ignored`.
 *
 * The lookup receives a resolver function (the page passes one backed by
 * a single `findMany` over the page's intent ids — no N+1).
 */
export function resolvePaymentEventOutcome(
  event: PaymentEventView,
  orderByIntent: (intentId: string) => PaymentOrderView | undefined,
): PaymentEventOutcome {
  if (event.type === PAYMENT_INTENT_SUCCEEDED_TYPE) {
    if (event.paymentIntentId) {
      const order = orderByIntent(event.paymentIntentId);
      if (order) {
        return { kind: "placed", orderNumber: order.orderNumber, orderId: order.orderId };
      }
    }
    return { kind: "refund-needed" };
  }
  if (event.type === PAYMENT_INTENT_FAILED_TYPE) {
    return { kind: "failed" };
  }
  return { kind: "ignored" };
}
