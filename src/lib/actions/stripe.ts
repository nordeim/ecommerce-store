"use server";

/**
 * Stripe server actions (session-22, PAY-STRIPE-1).
 *
 * `createPaymentIntentAction` is the client island's entry point: it
 * re-derives the cart server-side (ADR-011 — money is server truth),
 * builds the PaymentIntent params via the pure seam, and creates (or
 * idempotently reuses — the deterministic key) the intent. Returns the
 * client secret the Payment Element mounts with.
 *
 * Placement itself stays in `placeOrderAction` (checkout.ts) — the same
 * transactional seam as the demo path; this module never writes orders.
 */
import { getCart, getCartId } from "../cart";
import { getCurrentUser } from "../auth";
import { clientIp, rateLimit } from "../rate-limit";
import { getStripe, isStripeServerConfigured } from "../stripe";
import {
  buildPaymentIntentParams,
  shippingSnapshotHash,
  stripeIdempotencyKey,
} from "../stripe-payment";
import { checkoutSchema } from "../validation";
import type { ActionResult } from "./auth";

export type PaymentIntentSession = {
  clientSecret: string;
  paymentIntentId: string;
  /** Echoed for the island's own amount display — server truth, not client input. */
  amount: number;
};

export async function createPaymentIntentAction(
  input: Record<string, unknown>,
): Promise<ActionResult<PaymentIntentSession>> {
  if (!isStripeServerConfigured()) {
    // Customer-safe: no operator vocabulary (the R10-2 rule).
    return { ok: false, error: { message: "Card payments are unavailable right now. Please try again later." } };
  }
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: { message: "Card payments are unavailable right now. Please try again later." } };
  }

  const user = await getCurrentUser();
  const ip = clientIp(new Headers());
  const rl = rateLimit(`stripe-intent:${user?.id ?? ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, error: { message: `Too many payment attempts. Try again in ${rl.retryAfterSec}s.` } };
  }

  // The shipping snapshot rides the intent (webhook backstop metadata) —
  // parsed with the SAME schema the placement uses.
  const parsed = checkoutSchema.safeParse({ ...input, paymentMethod: "card", cardNumber: "", cardExpiry: "", cardCvc: "" });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        message: parsed.error.issues[0]?.message ?? "Invalid shipping details",
      },
    };
  }

  const cart = await getCart(user?.id ?? null);
  if (cart.items.length === 0) {
    return { ok: false, error: { message: "Your cart is empty" } };
  }
  const cartId = await getCartId(user?.id ?? null);
  if (!cartId) {
    return { ok: false, error: { message: "Your cart is empty" } };
  }

  const params = buildPaymentIntentParams({ cart, input: parsed.data, cartId, userId: user?.id ?? null });
  const idempotencyKey = stripeIdempotencyKey(cartId, cart.total, shippingSnapshotHash(parsed.data));

  try {
    const intent = await stripe.paymentIntents.create(
      {
        ...params,
        automatic_payment_methods: { enabled: true },
      } as Parameters<typeof stripe.paymentIntents.create>[0],
      { idempotencyKey },
    );
    if (!intent.client_secret) {
      console.error("[createPaymentIntentAction]", "intent without client_secret");
      return { ok: false, error: { message: "We could not start your payment. Please try again." } };
    }
    return {
      ok: true,
      data: {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount: intent.amount,
      },
    };
  } catch (e) {
    console.error("[createPaymentIntentAction]", e);
    return { ok: false, error: { message: "We could not start your payment. Please try again." } };
  }
}
