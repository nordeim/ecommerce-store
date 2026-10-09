import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

/**
 * PAY-STRIPE-1 (session-22) — the pure-seam unit layer for the Stripe
 * payment integration. Every contract here is SDK-free (fixture intents,
 * plain env objects) so the suite runs in the node environment like every
 * other seam: config resolution, idempotency keys, PaymentIntent params,
 * placement verification, webhook classification, last4 extraction, and
 * the webhook envelope's Zod parse.
 *
 * The sentinel rule (L16/R8-1 from the reference skill): the SERVER
 * (STRIPE_SECRET_KEY) and CLIENT (publishable key) "configured" checks
 * share one truth table so they can never disagree — a client that thinks
 * Stripe is on while the server doesn't (or vice-versa) renders a broken
 * checkout. The "set-me" placeholder convention from the reference skill
 * is honored: placeholder values are NOT configuration.
 */
import {
  buildPaymentIntentParams,
  classifyStripeEvent,
  classifyWebhookPlacementError,
  isIntentAnchorP2002,
  isPublishableKeyConfigured,
  parseStripeWebhookEvent,
  paymentIntentLast4,
  resolveStripeConfig,
  shippingSnapshotHash,
  stripeIdempotencyKey,
  verifyPaymentIntentForPlacement,
} from "./stripe-payment";
import type { CartDto } from "./cart";

const cart = (total: number): CartDto => ({
  items: [
    {
      id: "item1",
      productId: "p1",
      slug: "wireless-headphones",
      name: "Wireless Headphones",
      image: "https://media.base44.com/x.png",
      price: 19900,
      quantity: 1,
      lineTotal: total - 999,
    },
  ],
  itemCount: 1,
  subtotal: total - 999,
  shipping: 999,
  total,
});

const shippingInput = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zip: "10001",
};

const intent = (over: Record<string, unknown> = {}) => ({
  id: "pi_test_1",
  status: "succeeded",
  amount: 20899,
  currency: "usd",
  payment_method: "pm_test_1",
  latest_charge: "ch_test_1",
  metadata: {},
  ...over,
});

// ---------------------------------------------------------------------------
// resolveStripeConfig — the server/client sentinel truth table
// ---------------------------------------------------------------------------

describe("resolveStripeConfig", () => {
  it("is unconfigured when STRIPE_SECRET_KEY is absent", () => {
    expect(resolveStripeConfig({})).toEqual({ serverConfigured: false, publishableKey: null });
  });

  it("is unconfigured when the secret is the empty string", () => {
    expect(resolveStripeConfig({ STRIPE_SECRET_KEY: "" })).toEqual({
      serverConfigured: false,
      publishableKey: null,
    });
  });

  it("treats a whitespace-only secret as unconfigured", () => {
    expect(resolveStripeConfig({ STRIPE_SECRET_KEY: "   " }).serverConfigured).toBe(false);
  });

  it("treats the set-me placeholder as NOT configuration (the R8-1 sentinel)", () => {
    expect(resolveStripeConfig({ STRIPE_SECRET_KEY: "sk_test_set-me" }).serverConfigured).toBe(false);
  });

  it("is server-configured with a real test secret, and surfaces the publishable key", () => {
    expect(
      resolveStripeConfig({ STRIPE_SECRET_KEY: "sk_test_REAL", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_REAL" }),
    ).toEqual({ serverConfigured: true, publishableKey: "pk_test_REAL" });
  });

  it("surfaces a null publishable key when only the secret is set", () => {
    expect(resolveStripeConfig({ STRIPE_SECRET_KEY: "sk_test_REAL" }).publishableKey).toBeNull();
  });
});

describe("isPublishableKeyConfigured (the client mirror)", () => {
  it("agrees with the server sentinel for every class of value", () => {
    // The mirror must implement the SAME truth table as the server check:
    // absent/empty/whitespace/set-me are NOT configuration.
    expect(isPublishableKeyConfigured(undefined)).toBe(false);
    expect(isPublishableKeyConfigured(null)).toBe(false);
    expect(isPublishableKeyConfigured("")).toBe(false);
    expect(isPublishableKeyConfigured("   ")).toBe(false);
    expect(isPublishableKeyConfigured("pk_test_set-me")).toBe(false);
    expect(isPublishableKeyConfigured("pk_test_REAL")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// stripeIdempotencyKey + shippingSnapshotHash
// ---------------------------------------------------------------------------

describe("stripeIdempotencyKey", () => {
  it("is deterministic for the same cart + address", () => {
    const h = shippingSnapshotHash(shippingInput);
    expect(stripeIdempotencyKey("cart1", 20899, h)).toBe(stripeIdempotencyKey("cart1", 20899, h));
  });

  it("changes when the cart changes (fresh cart -> fresh intent)", () => {
    const h = shippingSnapshotHash(shippingInput);
    expect(stripeIdempotencyKey("cart1", 20899, h)).not.toBe(stripeIdempotencyKey("cart2", 20899, h));
  });

  it("changes when the total changes (price/qty edit -> fresh amount)", () => {
    const h = shippingSnapshotHash(shippingInput);
    expect(stripeIdempotencyKey("cart1", 20899, h)).not.toBe(stripeIdempotencyKey("cart1", 30898, h));
  });

  it("changes when the shipping snapshot changes (address edit -> fresh metadata)", () => {
    const h1 = shippingSnapshotHash(shippingInput);
    const h2 = shippingSnapshotHash({ ...shippingInput, city: "Austin" });
    expect(stripeIdempotencyKey("cart1", 20899, h1)).not.toBe(stripeIdempotencyKey("cart1", 20899, h2));
  });

  it("is a hex digest (Stripe idempotency keys are opaque server-side)", () => {
    const key = stripeIdempotencyKey("cart1", 20899, shippingSnapshotHash(shippingInput));
    expect(key).toMatch(/^[0-9a-f]+$/);
    expect(key.length).toBeGreaterThan(0);
    expect(key.length).toBeLessThanOrEqual(255);
  });
});

describe("shippingSnapshotHash", () => {
  it("is key-order independent (canonical JSON)", () => {
    const a = shippingSnapshotHash({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
    });
    const b = shippingSnapshotHash({
      zip: "10001",
      state: "NY",
      city: "New York",
      address: "123 Main St",
      email: "john@example.com",
      lastName: "Doe",
      firstName: "John",
    });
    expect(a).toBe(b);
  });

  it("is a sha256 hex digest", () => {
    const h = shippingSnapshotHash(shippingInput);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(
      createHash("sha256").update(
        JSON.stringify(
          {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            address: "123 Main St",
            city: "New York",
            state: "NY",
            zip: "10001",
          },
          Object.keys(shippingInput).sort(),
        ),
      ).digest("hex"),
    );
  });
});

// ---------------------------------------------------------------------------
// buildPaymentIntentParams — server-re-derived money, never client input
// ---------------------------------------------------------------------------

describe("buildPaymentIntentParams", () => {
  it("derives amount/currency from the SERVER cart (the ADR-011 money contract)", () => {
    const params = buildPaymentIntentParams({
      cart: cart(20899),
      input: shippingInput,
      cartId: "cart1",
      userId: "user1",
    });
    expect(params.amount).toBe(20899);
    expect(params.currency).toBe("usd");
  });

  it("enables automatic payment methods (the Payment Element contract)", () => {
    const params = buildPaymentIntentParams({ cart: cart(20899), input: shippingInput, cartId: "cart1", userId: "user1" });
    expect(params.automatic_payment_methods).toEqual({ enabled: true });
  });

  it("carries the webhook backstop's metadata: cartId, userId, email, and the shipping snapshot JSON", () => {
    const params = buildPaymentIntentParams({
      cart: cart(20899),
      input: shippingInput,
      cartId: "cart1",
      userId: "user1",
    });
    expect(params.metadata).toEqual({
      cartId: "cart1",
      userId: "user1",
      email: "john@example.com",
      shipping: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
      }),
    });
  });

  it("accepts a null userId (guest checkout metadata)", () => {
    const params = buildPaymentIntentParams({ cart: cart(20899), input: shippingInput, cartId: "guestcart", userId: null });
    expect(params.metadata.userId).toBe("");
  });

  it("never reads an amount from the client input", () => {
    const params = buildPaymentIntentParams({
      cart: cart(20899),
      // A hostile client "total" must not leak into the intent.
      input: { ...shippingInput, ...({ total: 1, amount: 1 } as object) },
      cartId: "cart1",
      userId: "user1",
    } as Parameters<typeof buildPaymentIntentParams>[0]);
    expect(params.amount).toBe(20899);
  });
});

// ---------------------------------------------------------------------------
// verifyPaymentIntentForPlacement — the placement gate
// ---------------------------------------------------------------------------

describe("verifyPaymentIntentForPlacement", () => {
  it("accepts a succeeded usd intent whose amount equals the server cart total", () => {
    expect(verifyPaymentIntentForPlacement(intent(), cart(20899))).toEqual({ ok: true });
  });

  it("rejects an intent that has not succeeded (the customer has not paid)", () => {
    const r = verifyPaymentIntentForPlacement(intent({ status: "requires_confirmation" }), cart(20899));
    expect(r).toEqual({ ok: false, reason: "status", message: expect.stringMatching(/payment/i) });
  });

  it("rejects a processing intent", () => {
    const r = verifyPaymentIntentForPlacement(intent({ status: "processing" }), cart(20899));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("status");
  });

  it("rejects a canceled intent", () => {
    const r = verifyPaymentIntentForPlacement(intent({ status: "canceled" }), cart(20899));
    expect(r.ok).toBe(false);
  });

  it("rejects an amount mismatch with customer-safe copy (cart changed mid-checkout)", () => {
    const r = verifyPaymentIntentForPlacement(intent({ amount: 999 }), cart(20899));
    expect(r).toEqual({ ok: false, reason: "amount", message: expect.stringMatching(/changed/i) });
  });

  it("rejects a foreign currency", () => {
    const r = verifyPaymentIntentForPlacement(intent({ currency: "eur" }), cart(20899));
    expect(r).toEqual({ ok: false, reason: "currency", message: expect.any(String) });
  });

  it("never leaks Stripe internals in the failure copy (R10-2 customer-safe rule)", () => {
    for (const over of [{ status: "requires_payment_method" }, { amount: 1 }, { currency: "eur" }]) {
      const r = verifyPaymentIntentForPlacement(intent(over), cart(20899));
      if (!r.ok) {
        expect(r.message).not.toMatch(/pi_|intent id|stripe\.com|api/i);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// classifyStripeEvent + parseStripeWebhookEvent
// ---------------------------------------------------------------------------

describe("classifyStripeEvent", () => {
  it("routes payment_intent.succeeded to the placement backstop", () => {
    expect(classifyStripeEvent("payment_intent.succeeded")).toBe("succeeded");
  });

  it("routes payment_intent.payment_failed to the failure log", () => {
    expect(classifyStripeEvent("payment_intent.payment_failed")).toBe("failed");
  });

  it("ignores every other event type (charges, refunds, …)", () => {
    expect(classifyStripeEvent("charge.succeeded")).toBe("ignored");
    expect(classifyStripeEvent("payment_intent.created")).toBe("ignored");
    expect(classifyStripeEvent("customer.subscription.deleted")).toBe("ignored");
    expect(classifyStripeEvent("")).toBe("ignored");
  });
});

describe("parseStripeWebhookEvent", () => {
  const envelope = {
    id: "evt_1",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_1",
        status: "succeeded",
        amount: 20899,
        currency: "usd",
        metadata: { cartId: "cart1", userId: "user1", email: "john@example.com", shipping: "{}" },
      },
    },
  };

  it("parses a well-formed envelope", () => {
    const parsed = parseStripeWebhookEvent(envelope);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe("evt_1");
      expect(parsed.data.type).toBe("payment_intent.succeeded");
      expect(parsed.data.data.object.id).toBe("pi_1");
      expect(parsed.data.data.object.amount).toBe(20899);
    }
  });

  it("rejects a non-object payload", () => {
    expect(parseStripeWebhookEvent(null).success).toBe(false);
    expect(parseStripeWebhookEvent("evt").success).toBe(false);
    expect(parseStripeWebhookEvent(42).success).toBe(false);
  });

  it("rejects a missing event id (the dedup anchor)", () => {
    expect(parseStripeWebhookEvent({ ...envelope, id: "" }).success).toBe(false);
  });

  it("rejects a missing type", () => {
    expect(parseStripeWebhookEvent({ ...envelope, type: undefined }).success).toBe(false);
  });

  it("rejects a malformed data.object", () => {
    expect(parseStripeWebhookEvent({ ...envelope, data: {} }).success).toBe(false);
    expect(parseStripeWebhookEvent({ ...envelope, data: { object: null } }).success).toBe(false);
  });

  it("tolerates absent metadata (older intents / non-checkout intents)", () => {
    const parsed = parseStripeWebhookEvent({
      ...envelope,
      data: { object: { id: "pi_1", status: "succeeded", amount: 100, currency: "usd" } },
    });
    expect(parsed.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// paymentIntentLast4 — defensive extraction from SDK shapes
// ---------------------------------------------------------------------------

describe("paymentIntentLast4", () => {
  it("reads last4 from an expanded payment_method object", () => {
    expect(
      paymentIntentLast4(intent({ payment_method: { id: "pm_1", card: { last4: "4242", brand: "visa" } } })),
    ).toBe("4242");
  });

  it("reads last4 from an expanded latest_charge object", () => {
    expect(
      paymentIntentLast4(
        intent({ payment_method: "pm_1", latest_charge: { id: "ch_1", payment_method_details: { card: { last4: "1881" } } } }),
      ),
    ).toBe("1881");
  });

  it("returns null for bare string references (nothing expanded)", () => {
    expect(paymentIntentLast4(intent())).toBeNull();
  });

  it("returns null when the expanded payment_method has no card", () => {
    expect(paymentIntentLast4(intent({ payment_method: { id: "pm_1" } }))).toBeNull();
  });

  it("returns null when the latest_charge has no card details", () => {
    expect(paymentIntentLast4(intent({ latest_charge: { id: "ch_1", payment_method_details: {} } }))).toBeNull();
  });

  it("returns null for null/undefined shapes", () => {
    expect(paymentIntentLast4(intent({ payment_method: null, latest_charge: null }))).toBeNull();
  });
});

describe("classifyWebhookPlacementError (PAY-STRIPE-2: the failure policy seam)", () => {
  // The structural error view — the route casts the caught Prisma/unknown
  // error to this shape; the seam never imports Prisma (unit-pinnable).
  const view = (e: unknown) => e as { code?: string; message?: string; meta?: { target?: unknown } };

  it("a P2002 on the event id (a concurrent delivery won the dedup race) classifies duplicate", () => {
    expect(classifyWebhookPlacementError(view({ code: "P2002", meta: { target: ["eventId"] } }))).toBe("duplicate");
  });

  it("a P2002 on the intent anchor (the client path placed between check and tx) classifies duplicate", () => {
    expect(
      classifyWebhookPlacementError(view({ code: "P2002", meta: { target: ["stripePaymentIntentId"] } })),
    ).toBe("duplicate");
  });

  it("a P2002 on the order number (a concurrent placement mint race) classifies transient — a retry gets a fresh number", () => {
    expect(classifyWebhookPlacementError(view({ code: "P2002", meta: { target: ["number"] } }))).toBe("transient");
  });

  it("the string-form Prisma target is honored", () => {
    expect(classifyWebhookPlacementError(view({ code: "P2002", meta: { target: "eventId" } }))).toBe("duplicate");
  });

  it("a STOCK_SHORT marker classifies permanent — deterministic, a retry cannot succeed", () => {
    expect(classifyWebhookPlacementError(view(new Error("STOCK_SHORT:Aurora Table Lamp")))).toBe("permanent");
  });

  it("a plain error classifies transient (the retry is the recovery)", () => {
    expect(classifyWebhookPlacementError(view(new Error("ECONNRESET")))).toBe("transient");
  });

  it("a non-P2002 Prisma code classifies transient", () => {
    expect(classifyWebhookPlacementError(view({ code: "P2024", message: "Timed out" }))).toBe("transient");
  });

  it("a P2002 on an unrelated target classifies transient (never silently duplicate)", () => {
    expect(classifyWebhookPlacementError(view({ code: "P2002", meta: { target: ["slug"] } }))).toBe("transient");
  });
});

describe("isIntentAnchorP2002 (the action path's already-placed resolution gate)", () => {
  const view = (e: unknown) => e as { code?: string; meta?: { target?: unknown } };

  it("true for the intent-anchor target (the retried submit resolves to the placed order)", () => {
    expect(isIntentAnchorP2002(view({ code: "P2002", meta: { target: ["stripePaymentIntentId"] } }))).toBe(true);
  });

  it("false for a number-race P2002 (the honest retry copy — not the already-placed path)", () => {
    expect(isIntentAnchorP2002(view({ code: "P2002", meta: { target: ["number"] } }))).toBe(false);
  });

  it("false for non-P2002 errors and string-form foreign targets", () => {
    expect(isIntentAnchorP2002(view(new Error("nope")))).toBe(false);
    expect(isIntentAnchorP2002(view({ code: "P2002", meta: { target: "number" } }))).toBe(false);
  });
});
