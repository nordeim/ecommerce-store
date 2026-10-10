import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, History, MapPin, Package, PackageCheck, ReceiptText, RotateCcw, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/metadata";
import { formatCents } from "@/lib/money";
// The account family's status vocabulary — the SAME seam the history rows
// compose (session-34: the extraction that lets a server component share
// the client tabs' reference-measured badge classes).
import { STATUS_LABELS, STATUS_STYLES, formatOrderDate } from "@/lib/order-status";
// The per-order read vocabulary (session-33's customer-safe money line —
// the paid wording byte-exact from session-22, the refunded copy the
// customer-side mirror). The detail page is the PERSISTENT confirmation:
// the same per-order money state, composed through the same seam.
import { confirmationMoneyLineView } from "@/lib/order-money-state";
// Session-35 (CUSTOMER-TIMELINE-1, ADR-043): the customer-safe order
// timeline — the operator→customer vocabulary mapping. The OrderEvent
// notes carry operator attribution ("→ … by admin@…") and operator
// vocabulary; this seam maps them to customer-safe labels and a row shape
// with NO note field (the leak is structurally impossible — R10-2).
import { customerOrderTimeline, formatTimelineDate } from "@/lib/order-timeline";
// Session-36 (ORDER-TRACKING-1, ADR-044): the "where's my order" read
// vocabulary — the calm state when the columns are unset, the canonical
// carrier map (the public track link), the raw passthrough for unknown
// carriers. The SAME seam the operator console composes (one vocabulary).
import { orderTrackingView } from "@/lib/order-tracking";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Clone-only route (superset — the reference's account orders are
// hardcoded rows that link nowhere): the static-page og pattern for
// consistency, with the og:url pointing at the account family root (the
// admin pages skip the builder entirely; a per-order canonical would leak
// the cuid into share previews — the private-page posture).
// CHECKOUT-SEO-1 belt-and-suspenders: noindex — a personal, owner-gated
// page (the robots.txt /account disallow already covers it; a disallow
// does not prevent indexing of linked URLs).
export const metadata: Metadata = {
  ...pageMetadata({ title: "Order Details", path: "/account" }),
  robots: { index: false, follow: false },
};

/** The checkout/seed write the address as a JSON snapshot (Order.shippingAddress) — the ADR-015 pattern. */
type AddressSnapshot = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

/** The timeline row icons — the presentation vocabulary (the labels and
 *  timestamps come from the seam; the icon map stays with its consumer). */
const TIMELINE_ICONS: Record<string, typeof Package> = {
  placed: Package,
  status_changed: Truck,
  payment_succeeded: CreditCard,
  payment_failed: CreditCard,
  payment_refunded: RotateCcw,
  tracking_added: PackageCheck,
};

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  // Session-6 (REDIRECT-1) + session-7 (REDIRECT-2): carry the visitor's
  // exact path — the dynamic route redirects with its own full URL (the
  // admin-detail precedent).
  if (!user) redirect(`/login?redirect=/account/orders/${id}`);

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      // Session-35 (CUSTOMER-TIMELINE-1): the events join the read —
      // oldest-first (the seam re-sorts defensively; the query's order
      // is the belt-and-suspenders).
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  // GUEST-TOKEN-1 discipline (session-31): a sequential public id is
  // never a capability token — and existence itself is information. The
  // unknown-id, not-owned-id, and guest-order (userId null — its
  // confirmation carries the HMAC view token; the bookmarked-confirmation
  // contract) cases all render the SAME generic in-chrome block: never
  // confirm which one failed. (The platform 404 is reserved for unknown
  // routes — the ADR-015 pattern.)
  if (!order || order.userId !== user.id) {
    return (
      // session-12 (A11Y-MAIN-1): a <div>, NOT a <main> — the (storefront)
      // layout owns the page's single landmark.
      <div className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link href="/account">← Orders</Link>
            </Button>
            <h1 className="text-3xl font-bold">Order not found</h1>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
            <p className="text-muted-foreground">
              This order does not exist or does not belong to your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const address = JSON.parse(order.shippingAddress) as AddressSnapshot;
  // The money state — the confirmation's per-order read vocabulary,
  // composed through the session-33 seam (the text NEVER string-built in
  // the consumer). Demo-path orders (paymentStatus null) render no line —
  // the calm state.
  const money = confirmationMoneyLineView(order.paymentStatus);
  // Session-35 (CUSTOMER-TIMELINE-1): the customer-safe timeline — the
  // events mapped through the seam (the note NEVER renders; R10-2).
  const timeline = customerOrderTimeline(order.events);
  // Session-36 (ORDER-TRACKING-1): the tracking line — the order's resting
  // carrier + number composed through the seam (the calm state renders
  // nothing; the number links to the carrier's public tracking page).
  const tracking = orderTrackingView(order.carrier, order.trackingNumber);

  return (
    <div className="flex-1">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* The header — the admin-detail pattern (the back affordance, the
            number h1, the status pill, the total) with the ACCOUNT family's
            vocabulary: the pill composes the history rows' STATUS_STYLES
            seam, not the console's Badge. */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/account">← Orders</Link>
          </Button>
          <h1 className="text-3xl font-bold">{order.number}</h1>
          <span
            className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full ${
              STATUS_STYLES[order.status] ??
              "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <span className="text-2xl font-bold ml-auto">{formatCents(order.total)}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* The payment card — the customer-safe subset of the operator
              detail's customer block: the method + card row, the placed
              date, and the money state (R10-2: no intent ids, no operator
              vocabulary). */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Payment</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd className="font-medium">
                  {order.paymentMethod === "paypal" ? "PayPal" : "Card"}
                  {order.cardLast4 ? ` ···· ${order.cardLast4}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Placed</dt>
                <dd className="font-medium">{formatOrderDate(order.placedAt.toISOString())}</dd>
              </div>
            </dl>
            {money.visible && (
              <p className="text-sm text-muted-foreground mt-3">{money.text}</p>
            )}
          </div>

          {/* The shipping card — the parsed address snapshot (ADR-015). */}
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
            {/* Session-36, ORDER-TRACKING-1 (ADR-044): the "where's my
                order" read surface — the carrier + tracking number with
                the carrier's public track link (external, safe opener).
                The calm state (no columns set) renders NOTHING — no empty
                row, no placeholder (the alert-fatigue rule). An unknown
                carrier renders the pair without a link (the raw
                passthrough — the number still shows). */}
            {tracking.visible && (
              <div className="mt-4 pt-4 border-t border-border/50 text-sm" data-testid="tracking-line">
                <p className="text-muted-foreground">Tracking</p>
                <p className="font-medium">
                  {tracking.carrierLabel} ·{" "}
                  {tracking.href ? (
                    <a
                      href={tracking.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {tracking.trackingCode}
                    </a>
                  ) : (
                    tracking.trackingCode
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* The items card — the operator detail's rows (image / name /
            unit × qty / line total) + the totals block. */}
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
                <span>{formatCents(order.subtotal)}</span>
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

        {/* Session-35 (CUSTOMER-TIMELINE-1): the customer-safe timeline —
            the order's STORY (placed → fulfillment transitions → money
            events) in the account family's card language. The admin detail
            renders the same events WITH their operator notes (ADR-015);
            here the note is structurally absent (the seam's row has no note
            field) and the labels compose the session-34 STATUS_LABELS seam —
            the timeline's words are the SAME words the pill and the history
            rows render. */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 p-6 pb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Timeline</h2>
          </div>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground px-6 pb-6 text-sm">No events recorded.</p>
          ) : (
            <ol className="px-6 pb-6 flex flex-col gap-3">
              {timeline.map((row) => {
                const Icon = TIMELINE_ICONS[row.type] ?? History;
                return (
                  <li key={row.key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimelineDate(row.at.toISOString())}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
