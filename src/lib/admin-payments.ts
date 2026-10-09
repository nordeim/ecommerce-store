/**
 * Admin payment-ops filters + outcome derivation (session-24, PAY-OPS-1) —
 * the pure seam behind /admin/payments' URL-deep-linkable filter state
 * (?family= + ?q=), mirroring the /admin/orders pattern (session-13,
 * ADMIN-SEARCH-1). The payments surface is an admin-only superset, so it
 * gets the lib-seam treatment (unit-pinned here, E2E in
 * tests/e2e/admin.spec.ts).
 *
 * Contract: `family` is validated against the three canonical event
 * families — succeeded / failed / other (raw Stripe event types are
 * free-form strings; the family is the operator's mental model) —
 * anything else falls through to undefined so a bad deep-link renders
 * the unfiltered list, never an error. `q` is trimmed and matched with
 * SQLite `contains` (ASCII-case-insensitive LIKE) against the
 * paymentIntentId OR the eventId — the two identifiers an operator
 * relays from the Stripe dashboard.
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
  OR?: Array<{ paymentIntentId: { contains: string } } | { eventId: { contains: string } }>;
  AND?: Array<{ type: string } | { NOT: { OR: Array<{ type: string }> } } | { OR: NonNullable<AdminPaymentWhere["OR"]> }>;
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
 * (succeeded/failed) or the NOT-OR negation (other). With `q` → the
 * two-branch OR (paymentIntentId + eventId contains) — ANDed with the
 * family when both are present.
 */
export function buildAdminPaymentWhere(filters: AdminPaymentFilters): AdminPaymentWhere {
  const where: AdminPaymentWhere = {};
  if (filters.family === "succeeded") {
    where.type = PAYMENT_INTENT_SUCCEEDED_TYPE;
  } else if (filters.family === "failed") {
    where.type = PAYMENT_INTENT_FAILED_TYPE;
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
