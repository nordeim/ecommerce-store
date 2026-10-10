import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { shippingForSubtotal } from "@/lib/money";
import { getStripe, STRIPE_WEBHOOK_TOLERANCE_SECONDS } from "@/lib/stripe";
import {
  classifyStripeEvent,
  classifyWebhookPlacementError,
  parseStripeWebhookEvent,
  STRIPE_FAILURE_REASON,
  stripeEventIntentId,
  verifyPaymentIntentForPlacement,
} from "@/lib/stripe-payment";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — POST /api/stripe/webhook (session-22, PAY-STRIPE-1;
 * restructured session-23, PAY-STRIPE-2 / ADR-031).
 *
 * The route-handler whitelist's documented +1: Stripe delivers asynchronous
 * payment events here — the backstop for the one failure the synchronous
 * client path cannot cover (the customer's browser dies between the
 * PaymentIntent confirmation and the placement submit: payment captured,
 * no order written).
 *
 * Design (the C8/R10-7/H4d lesson family from the reference skill, adapted
 * to this repo's action-canonical architecture):
 * - **Raw-body signature verification** (300s tolerance) BEFORE anything —
 *   `constructEvent` on the exact bytes; a bad signature is a 400 with
 *   customer-safe copy (never a 500, never internals).
 * - **The dedup row commits WITH the side effects (H4d/L9, PAY-STRIPE-2):**
 *   for `payment_intent.succeeded`, the `StripeEvent` insert happens INSIDE
 *   the placement transaction. A TRANSIENT placement failure rolls the row
 *   back and answers 500 — Stripe retries (up to 3 days, exponential
 *   backoff), and the retry re-attempts the full placement. The
 *   session-22 shape (the row committed before the tx + a 200 on every
 *   failure) turned a transient blip into a permanently orphaned captured
 *   payment: the retry hit the dedup row and no-op'd.
 * - **The failure policy (the `classifyWebhookPlacementError` seam):**
 *   duplicate (P2002 on eventId / stripePaymentIntentId — a concurrent
 *   delivery or the client path won the race) → 200 with the winner's
 *   order number; permanent (STOCK_SHORT — deterministic, a retry cannot
 *   succeed) → record + 200 + the ops refund trail; transient (everything
 *   else, incl. a P2002 on `number` from a concurrent placement race) →
 *   500, the row rolled back, Stripe retries.
 * - **payment_intent.payment_failed**: recorded + logged only.
 * - Everything else: recorded, 200 ignored.
 *
 * The webhook answers 400 when Stripe is unconfigured: there is nothing to
 * verify a signature against (honest, safe, and the E2E contract).
 */

const shippingSnapshotSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  address: z.string().min(3).max(120),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

function safe400(message: string) {
  return NextResponse.json({ received: false, message }, { status: 400 });
}

/**
 * Record the delivery standalone (no side effects to couple): the
 * record-only classifications, the client-path-precedence no-op, and the
 * permanent-failure refund trails. Tolerates a concurrent recording of the
 * same event (P2002 → the delivery is already accounted for).
 *
 * Session-25 (PAY-OPS-2b/2c): the row persists the payload AMOUNT (minor
 * units — the payments surface renders the magnitude beside the outcome)
 * and the HONEST intent id (`payment_intent` for charge-family objects,
 * the object's own id otherwise — the surface's q-search over the intent
 * column stays truthful for the charge family).
 *
 * Session-30 (REASON-TRAIL-1, ADR-038): the optional `failureReason`
 * persists the canonical deterministic-failure code at the
 * permanent-classification write sites — the refund-needed family's WHY
 * joins the row (the payments surface maps it to operator copy). Every
 * non-failure recording passes no reason (null = the calm state).
 */
async function recordEvent(
  evt: {
    id: string;
    type: string;
    data: { object: { id: string; amount?: number; payment_intent?: string } };
  },
  failureReason?: string,
) {
  try {
    await db.stripeEvent.create({
      data: {
        eventId: evt.id,
        type: evt.type,
        paymentIntentId: stripeEventIntentId(evt.data.object),
        amount: evt.data.object.amount ?? null,
        failureReason: failureReason ?? null,
      },
    });
  } catch (e) {
    const cls = classifyWebhookPlacementError(e);
    if (cls !== "duplicate") throw e;
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    // Unconfigured: nothing to verify against — reject honestly, safely.
    return safe400("Webhook unavailable.");
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return safe400("Missing signature.");
  }

  // The EXACT raw bytes (constructEvent is byte-sensitive — request.json()
  // would re-serialize and break the HMAC).
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret, STRIPE_WEBHOOK_TOLERANCE_SECONDS);
  } catch {
    return safe400("Invalid signature.");
  }

  // Defense in depth: constructEvent verified authenticity; the structural
  // parse verifies processability (a usable id + data.object).
  const parsed = parseStripeWebhookEvent(JSON.parse(JSON.stringify(event)));
  if (!parsed.success) {
    return safe400("Invalid event.");
  }
  const evt = parsed.data;
  const class_ = classifyStripeEvent(evt.type);

  if (class_ === "failed") {
    await recordEvent(evt);
    console.error("[stripe-webhook] payment failed", evt.data.object.id);
    return NextResponse.json({ received: true });
  }
  if (class_ !== "succeeded") {
    await recordEvent(evt);
    return NextResponse.json({ received: true, ignored: true });
  }

  // ---- payment_intent.succeeded: the backstop.
  const intentView = evt.data.object;
  try {
    // Fast duplicate short-circuit (the common Stripe retry AFTER a
    // committed placement — the row exists, nothing to re-attempt).
    const alreadyRecorded = await db.stripeEvent.findUnique({ where: { eventId: evt.id } });
    if (alreadyRecorded) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // The client-path precedence (the normal case): an order already holds
    // the intent id — record the delivery, answer with the order.
    const placed = await db.order.findUnique({
      where: { stripePaymentIntentId: intentView.id },
      select: { number: true },
    });
    if (placed) {
      await recordEvent(evt);
      return NextResponse.json({ received: true, order: placed.number });
    }

    // The orphaned-payment case: rebuild the placement input from the
    // intent's OWN metadata (embedded at intent creation).
    const meta = intentView.metadata ?? {};
    const shippingSnapshot = shippingSnapshotSchema.safeParse(
      meta.shipping ? JSON.parse(meta.shipping) : null,
    );
    const cartId = typeof meta.cartId === "string" ? meta.cartId : null;
    const userId = typeof meta.userId === "string" && meta.userId.length > 0 ? meta.userId : null;
    if (!shippingSnapshot.success || !cartId) {
      // Not our checkout intent (or metadata drifted) — deterministic: record
      // + the ops refund trail (never a 5xx; a retry could not succeed).
      await recordEvent(evt, STRIPE_FAILURE_REASON.metadataUnusable);
      console.error(
        "[stripe-webhook] orphaned payment without usable metadata — refund via dashboard",
        intentView.id,
        intentView.amount,
      );
      return NextResponse.json({ received: true });
    }

    // Re-load the cart BY ID (no cookie/session in a webhook) + re-price.
    const cartRow = await db.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!cartRow || cartRow.items.length === 0) {
      // A vanished/empty cart is deterministic (the conversion cleared it or
      // the cart was never ours): record + the refund trail.
      await recordEvent(evt, STRIPE_FAILURE_REASON.cartUnavailable);
      console.error(
        "[stripe-webhook] orphaned payment with empty/absent cart — refund via dashboard",
        intentView.id,
        intentView.amount,
      );
      return NextResponse.json({ received: true });
    }
    const items = cartRow.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      slug: i.product.slug,
      name: i.product.name,
      image: i.product.image,
      price: i.product.price,
      quantity: i.quantity,
      lineTotal: i.product.price * i.quantity,
    }));
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const shipping = shippingForSubtotal(subtotal);
    const cart = {
      items,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
    };

    // The SAME verification gate as the action path — the intent must have
    // paid exactly the server-re-derived total, in USD. A mismatch is
    // deterministic: record + the refund trail (the operator refunds from
    // the Stripe dashboard using the log line).
    const verification = verifyPaymentIntentForPlacement(intentView, cart);
    if (!verification.ok) {
      await recordEvent(evt, STRIPE_FAILURE_REASON.amountMismatch);
      console.error(
        "[stripe-webhook] amount mismatch — refund via dashboard",
        intentView.id,
        `intent=${intentView.amount} cart=${cart.total} reason=${verification.reason}`,
      );
      return NextResponse.json({ received: true });
    }

    // Placement: the same transactional contract as placeOrderAction
    // (stock re-check inside the tx, decrement, cart clear, events) with
    // the paid-payment columns. THE H4d/L9 RULE (PAY-STRIPE-2): the
    // StripeEvent dedup row commits INSIDE this transaction — a transient
    // failure rolls it back WITH the placement, and the 500 below makes
    // Stripe retry the whole thing. A concurrent delivery that inserts the
    // row first surfaces as P2002 → the duplicate classification; a race
    // against the client path surfaces as P2002 on the intent anchor → the
    // same duplicate classification (never a double placement).
    const s = shippingSnapshot.data;
    const number = await db.$transaction(async (tx) => {
      await tx.stripeEvent.create({
        data: {
          eventId: evt.id,
          type: evt.type,
          paymentIntentId: intentView.id,
          amount: intentView.amount ?? null,
        },
      });

      const year = new Date().getFullYear();
      const prefix = `ORD-${year}-`;
      const count = await tx.order.count({ where: { number: { startsWith: prefix } } });
      const orderNumber = `${prefix}${String(count + 1).padStart(3, "0")}`;

      for (const item of items) {
        const row = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true },
        });
        if (row && row.stock < item.quantity) {
          // Paid but unfulfillable — deterministic at decision time; the
          // permanent classification records the event + refund trail.
          throw new Error(`STOCK_SHORT:${row.name}`);
        }
      }
      await tx.order.create({
        data: {
          number: orderNumber,
          userId,
          email: s.email,
          status: "processing",
          subtotal: cart.subtotal,
          shipping: cart.shipping,
          total: cart.total,
          shippingAddress: JSON.stringify({
            fullName: `${s.firstName} ${s.lastName}`.trim(),
            street: s.address,
            city: s.city,
            state: s.state,
            zip: s.zip,
            country: "United States",
          }),
          paymentMethod: "card",
          cardLast4: null,
          stripePaymentIntentId: intentView.id,
          paymentStatus: "paid",
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              nameSnapshot: i.name,
              imageSnapshot: i.image,
              unitPrice: i.price,
              quantity: i.quantity,
            })),
          },
          events: { create: { type: "placed", note: "Placed via card (Stripe webhook backstop)" } },
        },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId } });
      return orderNumber;
    });

    return NextResponse.json({ received: true, order: number });
  } catch (e) {
    // The failure policy (the classifyWebhookPlacementError seam):
    // duplicate / permanent / transient — see the module doc.
    const cls = classifyWebhookPlacementError(e);
    if (cls === "duplicate") {
      const winner = await db.order.findUnique({
        where: { stripePaymentIntentId: intentView.id },
        select: { number: true },
      });
      return NextResponse.json({ received: true, duplicate: true, order: winner?.number });
    }
    if (cls === "permanent") {
      // A captured payment that cannot be fulfilled (stock-short): the
      // operator refunds from the dashboard using this trail. The event is
      // recorded — a Stripe re-delivery of the same event no-ops. The
      // stock-short reason joins the row (session-30, REASON-TRAIL-1).
      await recordEvent(evt, STRIPE_FAILURE_REASON.stockShort);
      console.error("[stripe-webhook] captured payment unfulfillable (stock) — refund via dashboard", intentView.id, e);
      return NextResponse.json({ received: true });
    }
    // Transient: the transaction rolled back INCLUDING the dedup row.
    // Answer 500 — Stripe retries with backoff (up to 3 days), and the
    // retry re-attempts the full placement (the H4d recovery).
    console.error("[stripe-webhook] transient placement failure — answering 500 so Stripe retries", intentView.id, e);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
