"use server";

/**
 * Admin server actions — order status transitions + product visibility.
 * Every action re-checks the admin role server-side (defense in depth).
 */
import { revalidatePath } from "next/cache";
import { db } from "../db";
import { getCurrentUser, isAdmin } from "../auth";
import { refundEligibility } from "../admin-payments";
import { getStripe, isStripeServerConfigured } from "../stripe";
import { stripeRefundIdempotencyKey } from "../stripe-payment";
import type { ActionResult } from "./auth";

const ORDER_STATUSES = ["processing", "in_transit", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export async function updateOrderStatusAction(orderId: string, status: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, error: { message: "Invalid status" } };
  }
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: { message: "Order not found" } };
  if (order.status === status) return { ok: true, data: null };
  await db.order.update({ where: { id: orderId }, data: { status } });
  await db.orderEvent.create({
    data: { orderId, type: "status_changed", note: `${order.status} → ${status} by ${user?.email}` },
  });
  revalidatePath("/admin");
  revalidatePath("/account");
  return { ok: true, data: null };
}

export async function toggleProductActiveAction(productId: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: { message: "Product not found" } };
  await db.product.update({ where: { id: productId }, data: { isActive: !product.isActive } });
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true, data: null };
}

export async function updateProductStockAction(productId: string, stock: number): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return { ok: false, error: { message: "Invalid stock value" } };
  }
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: { message: "Product not found" } };
  await db.product.update({ where: { id: productId }, data: { stock } });
  revalidatePath("/admin");
  return { ok: true, data: null };
}

/**
 * The refund action seam (session-32, REFUND-ACTION-1, ADR-040) — the
 * payments family's first ACTION: the operator refunds a Stripe-paid
 * order from the console (the Shopify pattern) instead of leaving for
 * the Stripe dashboard.
 *
 * Design contracts:
 * - **The shared eligibility seam**: the SAME `refundEligibility` the
 *   order detail renders composes here as the guard (the DASH-ALERT-1
 *   rule — the button and the action can never disagree).
 * - **Demo mode refuses honestly** (the current configuration state):
 *   the operator copy names the dashboard path — the same vocabulary
 *   the webhook's ops trails use. The R10-2 customer-safe rule is a
 *   storefront contract; the console speaks operator.
 * - **Configured mode**: ONE full refund per intent, idempotent by the
 *   intent-scoped key (a double-click or a second operator replays the
 *   FIRST refund's response — never a second refund).
 * - **This action NEVER writes refund state on the order** — the
 *   webhook's charge.refunded reflection is the single writer (the
 *   action → Stripe → webhook → reflection loop; no optimistic local
 *   truth).
 */
export async function refundOrderAction(orderId: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, stripePaymentIntentId: true, paymentStatus: true },
  });
  if (!order) return { ok: false, error: { message: "Order not found" } };

  const eligibility = refundEligibility(order);
  if (!eligibility.eligible) {
    return { ok: false, error: { message: "This order cannot be refunded." } };
  }

  const stripe = getStripe();
  if (!stripe || !isStripeServerConfigured()) {
    return {
      ok: false,
      error: { message: "Stripe is not configured — refund via the Stripe dashboard." },
    };
  }

  const intentId = order.stripePaymentIntentId!;
  try {
    await stripe.refunds.create(
      { payment_intent: intentId } as Parameters<typeof stripe.refunds.create>[0],
      { idempotencyKey: stripeRefundIdempotencyKey(intentId) },
    );
  } catch (e) {
    console.error("[refundOrderAction] refund failed", order.number, intentId, e);
    return { ok: false, error: { message: "Refund failed — check the Stripe dashboard." } };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  // The webhook's charge.refunded delivery writes the order's refund
  // state (paymentStatus + the timeline event) — nothing here.
  return { ok: true, data: null };
}
