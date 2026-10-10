import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, History, Mail, MapPin, Package, PackageCheck, ReceiptText, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { orderPaymentTrail, refundEligibility } from "@/lib/admin-payments";
// Session-35 (CUSTOMER-TIMELINE-1): the timeline timestamp's single source —
// the SAME seam the customer timeline composes (the drift-proofing rule).
import { formatTimelineDate } from "@/lib/order-timeline";
// Session-36 (ORDER-TRACKING-1, ADR-044): the tracking read row's single
// source — the SAME seam the customer Shipping card composes (the
// DASH-ALERT-1 rule: the operator write surface and the customer read
// surface can never disagree about the vocabulary).
import { orderTrackingView } from "@/lib/order-tracking";
import { RefundOrderButton } from "@/components/account/refund-order-button";
import { AdminTrackingForm } from "@/components/account/admin-tracking-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Order",
};

/** The checkout/seed write the address as a JSON snapshot (Order.shippingAddress). */
type AddressSnapshot = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  // Session-6 (REDIRECT-1) + session-7 (REDIRECT-2): carry the visitor's
  // exact path — the dynamic route redirects with its own full URL.
  if (!user) redirect(`/login?redirect=/admin/orders/${id}`);
  if (!isAdmin(user)) redirect("/");

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });

  // Unknown order ids render an in-admin block (the console is an in-chrome
  // superset surface — the platform 404 is reserved for unknown routes).
  if (!order) {
    return (
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link href="/admin/orders">← Orders</Link>
            </Button>
            <h1 className="text-3xl font-bold">Order not found</h1>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
            <p className="text-muted-foreground">This order does not exist (it may have been removed).</p>
          </div>
        </div>
      </div>
    );
  }

  const address = JSON.parse(order.shippingAddress) as AddressSnapshot;
  const placedAt = order.placedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Session-29, REFUND-TRAIL-1: the payment-event trail for this order's
  // Stripe intent — the order side of the payments surface's deep link.
  // ONE bounded query composed on the exact linkage the payments outcome
  // resolver uses (paymentIntentId = the order's stripePaymentIntentId):
  // the capture + any dashboard refunds, chronological. An order with no
  // Stripe intent (or an intent with no recorded events) queries nothing
  // and the seam's calm state renders no card.
  const paymentEvents = order.stripePaymentIntentId
    ? await db.stripeEvent.findMany({
        where: { paymentIntentId: order.stripePaymentIntentId },
        orderBy: { receivedAt: "asc" },
        select: { type: true, amount: true, receivedAt: true },
      })
    : [];
  const paymentTrail = orderPaymentTrail(paymentEvents);
  // Session-36 (ORDER-TRACKING-1): the tracking read row — composed through
  // the seam the customer surface shares (the calm state renders nothing).
  const tracking = orderTrackingView(order.carrier, order.trackingNumber);

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/admin/orders">← Orders</Link>
          </Button>
          <h1 className="text-3xl font-bold">{order.number}</h1>
          <Badge variant="secondary" className="rounded-full capitalize">
            {order.status.replace("_", " ")}
          </Badge>
          <span className="text-2xl font-bold ml-auto">{formatCents(order.total)}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Customer</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{order.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Placed</dt>
                <dd className="font-medium">{placedAt}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="font-medium">
                  {order.paymentMethod === "paypal" ? "PayPal" : "Card"}
                  {order.cardLast4 ? ` ···· ${order.cardLast4}` : ""}
                </dd>
              </div>
              {order.paymentStatus && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Charge</dt>
                  <dd className="font-medium">
                    {/* Session-32, REFUND-ACTION-1: the refunded branch — the
                        calm terminal money state in the console's muted
                        vocabulary (contrast-safe; the census page
                        ORD-2026-001 carries paymentStatus null, so the row
                        never renders there — the a11y census pin stays 7). */}
                    {order.paymentStatus === "refunded" ? (
                      <span className="text-muted-foreground">Refunded (Stripe)</span>
                    ) : order.paymentStatus === "paid" ? (
                      <span className="text-emerald-600">Paid (Stripe)</span>
                    ) : order.paymentStatus === "failed" ? (
                      <span className="text-destructive">Payment failed</span>
                    ) : (
                      order.paymentStatus
                    )}
                    {/* The ops reference — Stripe dashboard lookup by id. */}
                    {order.stripePaymentIntentId ? (
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                        {order.stripePaymentIntentId}
                      </span>
                    ) : null}
                  </dd>
                </div>
              )}
            </dl>
            {/* Session-32, REFUND-ACTION-1 (ADR-040): the refund control —
                rendered ONLY on eligible orders (a Stripe intent + a paid,
                not-yet-refunded capture — the shared refundEligibility seam
                the action guard composes). The census page (ORD-2026-001)
                is a demo-path order: paymentStatus null → the Charge row
                AND this control never render there — the a11y census pin
                stays 7 by construction. */}
            {refundEligibility(order).eligible && (
              <RefundOrderButton orderId={order.id} orderNumber={order.number} />
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Shipping Address</h2>
            </div>
            <address className="not-italic text-sm space-y-1">
              <p className="font-medium">{address.fullName}</p>
              <p className="text-muted-foreground">{address.street}</p>
              <p className="text-muted-foreground">
                {address.city}, {address.state} {address.zip}
              </p>
              <p className="text-muted-foreground">{address.country}</p>
            </address>
            {/* Session-36, ORDER-TRACKING-1 (ADR-044): the tracking read row
                (the current columns) + the write surface (the compact
                form island) — both in the Shipping card, the operator's
                mental model of "how this order ships". The read row composes
                the SAME seam the customer surface reads (one vocabulary). */}
            {tracking.visible && (
              <p className="text-sm mt-4" data-testid="admin-tracking-row">
                <span className="text-muted-foreground">Current: </span>
                <span className="font-medium">
                  {tracking.carrierLabel} · {tracking.trackingCode}
                </span>
              </p>
            )}
            <AdminTrackingForm
              orderId={order.id}
              orderNumber={order.number}
              carrier={order.carrier}
              trackingNumber={order.trackingNumber}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm mb-4">
          <div className="flex items-center gap-2 p-6 pb-4">
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Items</h2>
          </div>
          <div className="px-6 pb-6 flex flex-col gap-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border/50"
              >
                <img
                  src={item.imageSnapshot}
                  alt={item.nameSnapshot}
                  className="h-12 w-12 rounded-lg object-cover bg-secondary/30"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium line-clamp-1">{item.nameSnapshot}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCents(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="font-semibold">{formatCents(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1 pt-2 text-sm border-t border-border/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCents(order.total - order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping === 0 ? "Free" : formatCents(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{formatCents(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session-29, REFUND-TRAIL-1: the payment-event trail — the
            StripeEvent rows for this order's intent (the capture + any
            dashboard refunds), chronological. Rendered only for Stripe-paid
            orders (the seam's calm state) and placed with the fulfillment
            Timeline (the two chronological trails read together). The row
            anatomy + contrast budget mirror the payments surface:
            foreground + muted text only — no destructive accent (the
            a11y order-detail census pin stays put). */}
        {paymentTrail.visible && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm mb-4">
            <div className="flex items-center gap-2 p-6 pb-4">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Payment events</h2>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-3">
              {paymentTrail.events.map((event) => (
                <div
                  key={`${event.label}-${event.receivedAt.toISOString()}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{event.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {/* Session-35 (CUSTOMER-TIMELINE-1): the single-source
                          extraction — the SAME formatTimelineDate the customer
                          timeline renders (zero behavior delta; the
                          drift-proofing rule). */}
                      {formatTimelineDate(event.receivedAt.toISOString())}
                    </p>
                  </div>
                  {event.amount != null && (
                    <span className="font-semibold shrink-0">
                      {formatCents(event.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 p-6 pb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Timeline</h2>
          </div>
          <div className="px-6 pb-6">
            {order.events.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No events recorded.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {order.events.map((event) => (
                  <li key={event.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      {event.type === "placed" ? (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      ) : event.type === "payment_refunded" ? (
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      ) : event.type === "tracking_added" ? (
                        <PackageCheck className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <History className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {/* Session-32, REFUND-ACTION-1: the webhook's
                            charge.refunded reflection writes a first-class
                            payment_refunded timeline event — the money
                            story joins the fulfillment story. */}
                        {event.type === "placed"
                          ? "Order placed"
                          : event.type === "payment_refunded"
                            ? "Payment refunded"
                            : event.type === "tracking_added"
                              ? "Tracking added"
                              : "Status changed"}
                      </p>
                      {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
                      <p className="text-xs text-muted-foreground">
                        {/* Session-35 (CUSTOMER-TIMELINE-1): the single-source
                            extraction — the SAME formatTimelineDate the
                            customer timeline renders. */}
                        {formatTimelineDate(event.createdAt.toISOString())}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
