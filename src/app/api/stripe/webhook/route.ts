import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { shippingForSubtotal } from "@/lib/money";
import { getStripe, STRIPE_WEBHOOK_TOLERANCE_SECONDS } from "@/lib/stripe";
import { classifyStripeEvent, parseStripeWebhookEvent, verifyPaymentIntentForPlacement } from "@/lib/stripe-payment";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — POST /api/stripe/webhook (session-22, PAY-STRIPE-1).
 *
 * The route-handler whitelist's documented +1: Stripe delivers asynchronous
 * payment events here — the backstop for the one failure the synchronous
 * client path cannot cover (the customer's browser dies between the
 * PaymentIntent confirmation and the placement submit: payment captured,
 * no order written).
 *
 * Design (the C8/R10-7 lesson family from the reference skill, adapted to
 * this repo's action-canonical architecture):
 * - **Raw-body signature verification** (300s tolerance) BEFORE anything —
 *   `constructEvent` on the exact bytes; a bad signature is a 400 with
 *   customer-safe copy (never a 500, never internals).
 * - **Dedup-first**: the StripeEvent row (eventId UNIQUE) is inserted
 *   before processing — a Stripe retry of an already-processed event
 *   short-circuits to 200 no-op instead of double-processing.
 * - **payment_intent.succeeded**: if an Order already holds the intent id
 *   (the client path placed it) → 200 no-op. Otherwise attempt the
 *   backstop placement from the intent's own metadata (the shipping
 *   snapshot + cart anchor embedded at intent creation): re-load the cart,
 *   re-price, and verify the intent against the CURRENT server cart. On
 *   amount mismatch or a vanished cart → an ops refund-trail log
 *   (console.error) + 200 (never a throw — a 5xx would make Stripe retry
 *   forever; the operator refunds from the Stripe dashboard).
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

  // ---- Dedup-first: a retry of a processed event is a 200 no-op.
  try {
    const existing = await db.stripeEvent.findUnique({ where: { eventId: evt.id } });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    await db.stripeEvent.create({
      data: { eventId: evt.id, type: evt.type, paymentIntentId: evt.data.object.id },
    });
  } catch (e) {
    console.error("[stripe-webhook] dedup insert", e);
    // A dedup failure is not retry-worthy for Stripe (the next event will
    // carry a fresh id); process on — placement itself is guarded by the
    // Order.stripePaymentIntentId unique anchor.
  }

  if (class_ === "failed") {
    console.error("[stripe-webhook] payment failed", evt.data.object.id);
    return NextResponse.json({ received: true });
  }
  if (class_ !== "succeeded") {
    return NextResponse.json({ received: true, ignored: true });
  }

  // ---- payment_intent.succeeded: the backstop.
  const intentView = evt.data.object;
  try {
    const placed = await db.order.findUnique({
      where: { stripePaymentIntentId: intentView.id },
      select: { number: true },
    });
    if (placed) {
      // The client path already placed it (the normal case).
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
      // Not our checkout intent (or metadata drifted) — ops refund trail.
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
    // paid exactly the server-re-derived total, in USD.
    const verification = verifyPaymentIntentForPlacement(intentView, cart);
    if (!verification.ok) {
      // Captured payment ≠ order value — the ops refund trail (never a
      // throw: Stripe would retry forever; the operator refunds from the
      // dashboard using this log line).
      console.error(
        "[stripe-webhook] amount mismatch — refund via dashboard",
        intentView.id,
        `intent=${intentView.amount} cart=${cart.total} reason=${verification.reason}`,
      );
      return NextResponse.json({ received: true });
    }

    // Placement: the same transactional contract as placeOrderAction
    // (stock re-check inside the tx, decrement, cart clear, events) with
    // the paid-payment columns. The UNIQUE intent id is the anchor: a race
    // against the client path resolves to the existing order.
    const s = shippingSnapshot.data;
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const count = await db.order.count({ where: { number: { startsWith: prefix } } });
    const number = `${prefix}${String(count + 1).padStart(3, "0")}`;

    await db.$transaction(async (tx) => {
      for (const item of items) {
        const row = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true },
        });
        if (row && row.stock < item.quantity) {
          // Paid but unfulfillable — ops trail; the refund path is manual
          // (the intent WAS captured; the customer is not silently left
          // with a charged card and no order record).
          throw new Error(`STOCK_SHORT:${row.name}`);
        }
      }
      await tx.order.create({
        data: {
          number,
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
    });

    return NextResponse.json({ received: true, order: number });
  } catch (e) {
    // A stock-short or tx failure on an ALREADY-CAPTURED payment: the ops
    // refund trail. 200 (never a 5xx — Stripe would retry forever; the
    // dedup row already exists so a retry would no-op anyway).
    console.error("[stripe-webhook] backstop placement failed — refund via dashboard", intentView.id, e);
    return NextResponse.json({ received: true });
  }
}
