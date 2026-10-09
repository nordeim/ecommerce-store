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
 * PAY-OPS-3 (session-26): the date-range bounds (`?from=` / `?to=`) —
 * an operator triaging refund-needed payments asks "which events
 * arrived in THIS window?". Bounds validate as strict `YYYY-MM-DD`
 * (shape + Date round-trip — 2026-02-30 normalizes to March 2, month
 * 13 parses NaN); a bad bound falls through to undefined (the family
 * pattern — a bad deep-link renders the unfiltered list, never an
 * error) and an inverted pair (from > to) drops together. The where
 * composes a single `receivedAt` clause — `gte` the UTC day boundary of
 * `from`, `lt` the day AFTER `to` (exclusive — `to`'s whole day is in
 * range) — ANDed with the family + q elements (the composable-AND
 * refactor keeps every pre-session-26 single-element shape identical).
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

export type AdminPaymentFilters = { family?: string; q?: string; from?: string; to?: string };

/** A strict `YYYY-MM-DD` day bound on `StripeEvent.receivedAt` (UTC). */
export type AdminPaymentDateRange = { gte?: Date; lt?: Date };

export type AdminPaymentWhere = {
  type?: string;
  receivedAt?: AdminPaymentDateRange;
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
    | { receivedAt: AdminPaymentDateRange }
  >;
};

/** The strict shape a date bound must carry (no time, no slashes, 4-2-2). */
const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate one raw bound: the shape regex + the Date round-trip
 * (2026-02-30 parses but normalizes to 2026-03-02 — not the same day;
 * 2026-13-01 parses NaN). Returns the canonical string or undefined.
 */
function parseDateBound(raw: string | undefined): string | undefined {
  if (!raw || !ISO_DAY_RE.test(raw)) return undefined;
  const t = Date.parse(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(t)) return undefined;
  if (new Date(t).toISOString().slice(0, 10) !== raw) return undefined;
  return raw;
}

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

  // PAY-OPS-3 (session-26): validate each bound independently, then
  // drop an inverted pair together (lexicographic order IS chronological
  // order for validated YYYY-MM-DD strings — no Date math needed here).
  let from = parseDateBound(one("from"));
  let to = parseDateBound(one("to"));
  if (from && to && from > to) {
    from = undefined;
    to = undefined;
  }

  return { family, q: qRaw || undefined, from, to };
}

/**
 * Build the Prisma `where` for the filtered StripeEvent query. No filters
 * → `{}` (the unfiltered list). Each active dimension contributes ONE
 * AND element — the family element (the exact type match for
 * succeeded/failed, the NOT-OR negation for other, or the refund-needed
 * shape: succeeded + not-in-the-placed-intent-set + the null-intent
 * branch — a succeeded event with no intent id is refund-needed per the
 * resolver, kept intact as one nested element), the `q` element (the
 * two-branch OR: paymentIntentId + eventId contains), and the date
 * element (PAY-OPS-3: `receivedAt` at UTC day boundaries — `gte` from's
 * midnight, `lt` the midnight AFTER to, so `to`'s whole day is in
 * range). One element renders bare (the historical single-filter
 * shapes); two or more AND together — every pre-session-26 shape is
 * byte-identical under this composition (the session-25 unit pins hold
 * unchanged).
 *
 * The placed-intent set (default `[]`) is only consulted for the
 * refund-needed family; other families ignore it.
 */
export function buildAdminPaymentWhere(
  filters: AdminPaymentFilters,
  placedIntentIds: string[] = [],
): AdminPaymentWhere {
  const and: NonNullable<AdminPaymentWhere["AND"]> = [];

  if (filters.family === "succeeded") {
    and.push({ type: PAYMENT_INTENT_SUCCEEDED_TYPE });
  } else if (filters.family === "failed") {
    and.push({ type: PAYMENT_INTENT_FAILED_TYPE });
  } else if (filters.family === "refund-needed") {
    and.push({
      type: PAYMENT_INTENT_SUCCEEDED_TYPE,
      OR: [
        { paymentIntentId: { notIn: placedIntentIds } },
        { paymentIntentId: null },
      ],
    });
  } else if (filters.family === "other") {
    and.push({
      NOT: {
        OR: [{ type: PAYMENT_INTENT_SUCCEEDED_TYPE }, { type: PAYMENT_INTENT_FAILED_TYPE }],
      },
    });
  }

  if (filters.q) {
    and.push({
      OR: [
        { paymentIntentId: { contains: filters.q } },
        { eventId: { contains: filters.q } },
      ],
    });
  }

  if (filters.from || filters.to) {
    const receivedAt: AdminPaymentDateRange = {};
    if (filters.from) {
      receivedAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    }
    if (filters.to) {
      // The day AFTER `to`, exclusive — 86,400,000ms of one UTC day.
      receivedAt.lt = new Date(Date.parse(`${filters.to}T00:00:00.000Z`) + 86_400_000);
    }
    and.push({ receivedAt });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { AND: and };
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

/**
 * The dashboard's refund-needed alert (session-28, DASH-ALERT-1) — the
 * presentation contract for /admin's alert row. The COUNT the caller
 * passes derives from this module's OWN where composition
 * (buildAdminPaymentWhere family=refund-needed + the placed-intent set),
 * so the dashboard stat and the payments family list can never disagree —
 * the same seam answers both. The href is exactly the family Select's
 * own value (the canonical param shape).
 *
 * count 0 → { visible: false }: the honest calm state. A permanent
 * zero-row invites alert fatigue — the operator's no-work day should
 * read as silence, not as a green zero (the console's stat cards own
 * the KPI-at-a-glance job; the alert row owns the act-now job).
 */
export type RefundNeededAlert =
  | { visible: false }
  | { visible: true; label: string; href: string };

export function refundNeededAlert(count: number): RefundNeededAlert {
  if (count <= 0) return { visible: false };
  const noun = count === 1 ? "payment" : "payments";
  const verb = count === 1 ? "needs" : "need";
  return {
    visible: true,
    label: `${count} ${noun} ${verb} refund attention`,
    href: "/admin/payments?family=refund-needed",
  };
}
