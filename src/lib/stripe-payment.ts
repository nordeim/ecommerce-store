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
 * a usable id + data.object to be processable).
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
      metadata: metadataSchema.optional(),
    }),
  }),
});

export function parseStripeWebhookEvent(raw: unknown) {
  return stripeWebhookEventSchema.safeParse(raw);
}

export type StripeWebhookEvent = z.infer<typeof stripeWebhookEventSchema>;

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
