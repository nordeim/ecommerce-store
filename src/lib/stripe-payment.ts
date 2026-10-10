import { formatCents } from "./money";
import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * PAY-STRIPE-1 (session-22) — the server-side pure seams of the Stripe
 * payment integration. SDK-FREE by design (unit-pinnable in the node
 * environment): every function here works on plain objects, so the contract
 * layer is fully tested without network or keys. The SDK-touching code
 * lives in `src/lib/stripe.ts` (the lazy server client) and the actions.
 *
 * ⚠️ SERVER-ONLY: this module imports node:crypto (the hashing seams).
 * Client components and the Edge proxy must import the client-safe config
 * module `src/lib/stripe-config.ts` instead (re-exported below for
 * server-side convenience).
 *
 * Design contracts (docs/remediation-plan-session22.md):
 * - **Money is server truth (ADR-011)**: the intent amount is derived from
 *   the server cart DTO; nothing the client sends can move it.
 * - **Idempotency everywhere**: deterministic intent keys (cart + total +
 *   shipping hash), the Order.stripePaymentIntentId unique anchor, and the
 *   StripeEvent.eventId dedup table.
 * - **Customer-safe copy (R10-2)**: no operator vocabulary (env names, key
 *   formats, intent ids) in any message a customer can read.
 * - **The sentinel mirror (L16/R8-1)**: server and client "configured"
 *   checks share one truth table — see stripe-config.ts.
 */
import type { CartDto } from "./cart";
import type { CheckoutInput } from "./validation";
import { isPublishableKeyConfigured, isRealSecret, resolveStripeConfig } from "./stripe-config";
import type { StripeConfig } from "./stripe-config";

// Re-export the client-safe config seams for server-side callers (client
// components import @/lib/stripe-config directly — this module is
// server-only).
export { isPublishableKeyConfigured, isRealSecret, resolveStripeConfig };
export type { StripeConfig };

/** The shipping snapshot the seams consume (the checkout input's shipping
 *  subset — the PaymentIntent metadata's payload). */
export type ShippingSnapshotInput = Pick<
  CheckoutInput,
  "firstName" | "lastName" | "email" | "address" | "city" | "state" | "zip"
>;

// ---------------------------------------------------------------------------
// Idempotency — deterministic intent keys + shipping snapshots
// ---------------------------------------------------------------------------

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Canonical (key-order-independent) JSON — stable digests for the same data. */
function canonicalJson(value: Record<string, unknown>): string {
  return JSON.stringify(value, Object.keys(value).sort());
}

/** Stable digest of the shipping snapshot (drives the intent idempotency key). */
export function shippingSnapshotHash(input: ShippingSnapshotInput): string {
  return sha256(canonicalJson(input));
}

/**
 * The `paymentIntents.create` idempotency key: the same cart + total +
 * address reuses the SAME intent (re-mounts, step re-entries); any change
 * mints a fresh key → a fresh intent with the fresh amount. Stripe caches
 * the first response per key for 24h, so the key must encode every input
 * that shapes the request (amount + metadata).
 */
export function stripeIdempotencyKey(cartId: string, totalCents: number, shippingHash: string): string {
  return sha256(`${cartId}:${totalCents}:${shippingHash}`);
}

/**
 * The `refunds.create` idempotency key (session-32, REFUND-ACTION-1):
 * ONE full refund per payment intent. A double-click, a retry, or a
 * second operator hours later hits the same key → Stripe replays the
 * FIRST refund's response — never a second refund of the same charge.
 * Readable by design: intent ids are already bounded and url-safe, and
 * the key is the operator's artifact in Stripe's idempotency log (the
 * sha256 pattern above exists for user-shaped, unbounded inputs).
 */
export function stripeRefundIdempotencyKey(paymentIntentId: string): string {
  return `refund:${paymentIntentId}`;
}

// ---------------------------------------------------------------------------
// chargeRefundedReflection (session-32, REFUND-ACTION-1, ADR-040)
// ---------------------------------------------------------------------------

export type ChargeRefundedReflection = {
  /** "refunded" ONLY on a full refund of a paid order; null = no order-state change. */
  paymentStatus: "refunded" | null;
  /** The OrderEvent note; null = reflect nothing (a non-paid order / shape drift). */
  eventNote: string | null;
};

/**
 * The webhook's charge.refunded branch composes this seam to reflect a
 * refund on the linked ORDER — the missing half of the refund loop
 * (the trail showed the StripeEvent row; the order's money state went
 * silently stale). Pure + SDK-free, the verify/classify family's own
 * write-side derivation pattern.
 *
 * - A non-paid order (failed, demo columns, already refunded, a
 *   re-delivery shape) reflects NOTHING — the parse family's
 *   fall-through philosophy.
 * - `refunded === true` (Stripe's own fully-refunded boolean) →
 *   paymentStatus "refunded" + the full-refund note. A partial refund
 *   → the note only: the order keeps its paid capture state (a partial
 *   refund does not zero the capture — honest).
 * - Money formats through formatCents at the note boundary (ADR-011:
 *   integer cents everywhere, display formatting at the edge).
 */
export function chargeRefundedReflection(
  order: { paymentStatus: string | null },
  charge: { refunded?: boolean; amount?: number; amount_refunded?: number },
): ChargeRefundedReflection {
  if (order.paymentStatus !== "paid") return { paymentStatus: null, eventNote: null };
  const refundedAmount = charge.amount_refunded ?? charge.amount ?? 0;
  if (charge.refunded === true) {
    return {
      paymentStatus: "refunded",
      eventNote: `Refunded ${formatCents(refundedAmount)} via Stripe`,
    };
  }
  return {
    paymentStatus: null,
    eventNote: `Partially refunded ${formatCents(refundedAmount)} of ${formatCents(charge.amount ?? 0)} via Stripe`,
  };
}

// ---------------------------------------------------------------------------
// PaymentIntent params — server-re-derived money
// ---------------------------------------------------------------------------

export type PaymentIntentParams = {
  amount: number;
  currency: "usd";
  /** The Payment Element contract: Stripe renders the methods the account enables. */
  automatic_payment_methods: { enabled: boolean };
  /** The webhook backstop's placement input (cart anchor + shipping snapshot). */
  metadata: Record<string, string>;
};

export function buildPaymentIntentParams(args: {
  cart: CartDto;
  input: ShippingSnapshotInput;
  cartId: string;
  userId: string | null;
}): PaymentIntentParams {
  const { cart, input, cartId, userId } = args;
  // The snapshot serialization order is the webhook's parse contract.
  const shippingSnapshot = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    address: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
  };
  return {
    amount: cart.total,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      cartId,
      userId: userId ?? "",
      email: input.email,
      shipping: JSON.stringify(shippingSnapshot),
    },
  };
}

// ---------------------------------------------------------------------------
// Placement verification — the gate between a paid intent and an order
// ---------------------------------------------------------------------------

/** The structural view of a PaymentIntent the placement decision needs. */
export type PlacementIntentView = {
  status?: string;
  amount?: number;
  currency?: string;
};

export type PlacementVerification =
  | { ok: true }
  | { ok: false; reason: "status" | "amount" | "currency"; message: string };

/**
 * A PaymentIntent may only place an order when it SUCCEEDED, for the exact
 * server-re-derived total, in USD. Each failure maps to customer-safe copy
 * (never Stripe internals, never operator vocabulary).
 */
export function verifyPaymentIntentForPlacement(
  intent: PlacementIntentView,
  cart: CartDto,
): PlacementVerification {
  if (intent.status !== "succeeded") {
    return {
      ok: false,
      reason: "status",
      message: "Your payment could not be completed. Please try again.",
    };
  }
  if (intent.amount !== cart.total) {
    return {
      ok: false,
      reason: "amount",
      message: "Your cart changed since you started checkout. Please review your order and try again.",
    };
  }
  if ((intent.currency ?? "").toLowerCase() !== "usd") {
    return {
      ok: false,
      reason: "currency",
      message: "We could not verify your payment. Please contact support if you were charged.",
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Webhook classification + envelope parsing
// ---------------------------------------------------------------------------

export type StripeEventClass = "succeeded" | "failed" | "ignored";

export function classifyStripeEvent(type: string): StripeEventClass {
  if (type === "payment_intent.succeeded") return "succeeded";
  if (type === "payment_intent.payment_failed") return "failed";
  return "ignored";
}

// ---------------------------------------------------------------------------
// The placement failure policy (session-23, PAY-STRIPE-2 — the H4d/L9 rule)
// ---------------------------------------------------------------------------

/**
 * The structural view of a caught error the failure policy reads — the
 * route casts the real Prisma/unknown error to this shape; the seam stays
 * Prisma-import-free (unit-pinnable without the client).
 */
export type PlacementErrorView = {
  code?: unknown;
  message?: unknown;
  meta?: { target?: unknown } | null;
};

/** The P2002 unique-constraint target fields, as strings (any shape). */
function p2002Targets(view: PlacementErrorView): string[] | null {
  if (typeof view.code !== "string" || view.code !== "P2002") return null;
  const target = view.meta?.target;
  const fields = Array.isArray(target)
    ? target.map((f) => String(f))
    : typeof target === "string"
      ? [target]
      : [];
  return fields;
}

export type WebhookFailureClass = "duplicate" | "permanent" | "transient";

/**
 * The webhook's placement-failure policy (PAY-STRIPE-2, the reference
 * skill's H4d/L9 lesson transplanted):
 * - **duplicate** — a P2002 on `StripeEvent.eventId` (a concurrent delivery
 *   won the dedup race) or on `Order.stripePaymentIntentId` (the client
 *   path placed between our check and the tx): 200 with the winner's order
 *   number; never double-place.
 * - **permanent** — the `STOCK_SHORT:` marker (the route's typed signal —
 *   the reference's StockRejectedError convention, string form because a
 *   "use server" module cannot export a class): deterministic at decision
 *   time, a retry cannot succeed → record the event + 200 + the ops refund
 *   trail.
 * - **transient** — everything else (tx errors, a P2002 on `number` from a
 *   concurrent placement race): the tx rolled back INCLUDING the dedup row
 *   → answer 500 so Stripe retries and the retry re-attempts the placement
 *   (the recovery the backstop exists for).
 */
export function classifyWebhookPlacementError(error: unknown): WebhookFailureClass {
  const view = (error ?? {}) as PlacementErrorView;
  const targets = p2002Targets(view);
  if (targets && (targets.includes("eventId") || targets.includes("stripePaymentIntentId"))) {
    return "duplicate";
  }
  if (typeof view.message === "string" && view.message.startsWith("STOCK_SHORT:")) {
    return "permanent";
  }
  return "transient";
}

// ---------------------------------------------------------------------------
// The deterministic-failure reason vocabulary (session-30, REASON-TRAIL-1)
// ---------------------------------------------------------------------------

/**
 * The canonical reason CODES the webhook persists on the StripeEvent row
 * at its four deterministic-failure write sites (session-30, REASON-TRAIL-1,
 * ADR-038). The codes join the row as `StripeEvent.failureReason` (nullable
 * — null = no reason known: pre-session-30 rows, the failed/ignored
 * recordings, the client-path-precedence recording, and the SUCCESSFUL
 * in-tx insert, which writes none by construction). The write side and
 * the read side (src/lib/admin-payments.ts `paymentFailureReasonView`)
 * share this vocabulary as their single source — no stringly-typed drift.
 */
export const STRIPE_FAILURE_REASON = {
  /** The succeeded intent carried no usable metadata (shipping/cartId). */
  metadataUnusable: "metadata-unusable",
  /** The metadata's cartId resolved to no cart / an empty cart. */
  cartUnavailable: "cart-unavailable",
  /** The intent's amount did not match the server-re-derived cart total. */
  amountMismatch: "amount-mismatch",
  /** The paid cart was unfulfillable at decision time (STOCK_SHORT). */
  stockShort: "stock-short",
} as const;

export type StripeFailureReasonCode =
  (typeof STRIPE_FAILURE_REASON)[keyof typeof STRIPE_FAILURE_REASON];

/**
 * The action path's already-placed resolution gate: a P2002 on
 * `stripePaymentIntentId` means a retried submit whose intent already
 * placed an order (the customer should see their confirmation). A P2002 on
 * `number` is a concurrent-placement mint race — NOT the anchor — and must
 * fall through to the honest retry copy (the retry re-verifies the intent
 * and resolves via the anchor).
 */
export function isIntentAnchorP2002(error: unknown): boolean {
  const view = (error ?? {}) as PlacementErrorView;
  const targets = p2002Targets(view);
  return targets !== null && targets.includes("stripePaymentIntentId");
}

const metadataSchema = z.record(z.string());

/**
 * Structural parse of the webhook envelope — defense in depth AFTER
 * `constructEvent` verified authenticity (a well-formed event still needs
 * a usable id + data.object to be processable). `payment_intent` is the
 * charge-family's reference to its owning PaymentIntent (session-25,
 * PAY-OPS-2c) — `stripeEventIntentId` reads it to keep the StripeEvent
 * intent column honest for charge.* deliveries.
 */
export const stripeWebhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  data: z.object({
    object: z.object({
      id: z.string(),
      status: z.string().optional(),
      amount: z.number().optional(),
      currency: z.string().optional(),
      payment_intent: z.string().optional(),
      metadata: metadataSchema.optional(),
      // Session-32, REFUND-ACTION-1: the charge-object refund fields the
      // reflection seam reads. ADDITIVE optional fields — intent-family
      // events carry neither; every existing parse outcome is unchanged.
      refunded: z.boolean().optional(),
      amount_refunded: z.number().optional(),
    }),
  }),
});

export function parseStripeWebhookEvent(raw: unknown) {
  return stripeWebhookEventSchema.safeParse(raw);
}

export type StripeWebhookEvent = z.infer<typeof stripeWebhookEventSchema>;

// ---------------------------------------------------------------------------
// stripeEventIntentId (session-25, PAY-OPS-2c) — the honest intent column
// ---------------------------------------------------------------------------

/**
 * The intent id a StripeEvent row should record for this object:
 * `payment_intent` when the object carries one (charge-family events —
 * a charge is not an intent), else the object's own id (payment_intent.*
 * events ARE intents; other shapes keep their object id). The empty-string
 * guard exists only for honesty — Stripe never sends an empty
 * payment_intent.
 */
export function stripeEventIntentId(object: {
  id: string;
  payment_intent?: string;
}): string {
  return object.payment_intent && object.payment_intent.length > 0
    ? object.payment_intent
    : object.id;
}

// ---------------------------------------------------------------------------
// last4 extraction — defensive against every SDK shape
// ---------------------------------------------------------------------------

type CardHoldingMethod = { card?: { last4?: string | null } | null } | string | null | undefined;
type ChargeView = { payment_method_details?: { card?: { last4?: string | null } | null } | null } | string | null | undefined;

/**
 * Reads the card last4 from a PaymentIntent's expanded shapes. The caller
 * retrieves intents with `expand: ["payment_method"]` (or
 * `latest_charge`); un-expanded string references carry no last4 → null
 * (the admin surfaces render the existing "—" fallback).
 */
export function paymentIntentLast4(intent: {
  payment_method?: CardHoldingMethod;
  latest_charge?: ChargeView;
}): string | null {
  const pm = intent.payment_method;
  if (pm && typeof pm === "object" && pm.card?.last4) return pm.card.last4;
  const charge = intent.latest_charge;
  if (charge && typeof charge === "object" && charge.payment_method_details?.card?.last4) {
    return charge.payment_method_details.card.last4;
  }
  return null;
}
