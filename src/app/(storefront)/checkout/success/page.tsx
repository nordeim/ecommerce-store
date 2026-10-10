import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/metadata";
import { verifyOrderViewToken } from "@/lib/order-view-token";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
// Session-33 (CUSTOMER-MONEY-1): the confirmation's money line composes the
// pure seam — the paid wording byte-exact (session-22), the refunded state
// carried by the customer-safe copy.
import { confirmationMoneyLineView } from "@/lib/order-money-state";

export const dynamic = "force-dynamic";

// Clone-only route (superset): the static-page og pattern for consistency.
// GUEST-TOKEN-1 (session-31): noindex — the confirmation is a personal,
// token-gated page (belt-and-suspenders with the robots.txt disallow).
export const metadata: Metadata = {
  ...pageMetadata({ title: "Order Confirmed", path: "/checkout/success" }),
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = Array.isArray(params.order) ? params.order[0] : params.order;
  const viewToken = Array.isArray(params.t) ? params.t[0] : params.t;
  const user = await getCurrentUser();
  const order = orderNumber
    ? await db.order.findUnique({
        where: { number: orderNumber },
        include: { items: true },
      })
    : null;
  // GUEST-TOKEN-1 (session-31): the details gate. Before this, ANY visitor
  // (authenticated or not) could read ANY GUEST order's email/items/total
  // by walking the sequential ORD-YYYY-NNN space (`!order.userId` was the
  // only check — verified as a live exploit). Now: the signed-in OWNER or
  // the holder of the placement redirect's HMAC view token. Everyone else
  // gets the generic confirmation block below.
  const ownerView = !!order && !!user && order.userId === user.id;
  const tokenView =
    !!order && typeof viewToken === "string" && verifyOrderViewToken(order.number, viewToken);
  const visible = order && (ownerView || tokenView);
  // Session-35 (CHECKOUT-DEEPLINK-1, ADR-043): the owner's confirmation
  // deep-links "View Orders" to the placed order's detail page (session-34's
  // persistent read surface) — the account root defaults to the PROFILE
  // tab, two clicks away from the order the customer just placed. The
  // non-owner paths (the guest's token view, the generic view) keep the
  // generic /account href: a guest order's detail route renders the
  // not-found block for everyone but the token (the GUEST-TOKEN-1
  // discipline) — a deep-linked button would land the guest on "Order not
  // found". The href is the ONLY delta (the zero-visual-delta superset
  // pattern; the guest-checkout spec pins the non-owner paths).
  const ordersHref =
    visible && ownerView && order ? `/account/orders/${order.id}` : "/account";

  return (
    // session-12 (A11Y-MAIN-1): <div>, not a nested <main> — the layout owns the single landmark.
    <div className="flex-1">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed</h1>
        {visible ? (
          <>
            <p className="text-muted-foreground mb-1">
              Thank you! Your order <span className="font-semibold text-foreground">{order!.number}</span> has been
              placed.
            </p>
            {/* The confirmation's money line (PAY-STRIPE-1 session-22 +
                CUSTOMER-MONEY-1 session-33): one muted line when the order
                carries a money state — paid (session-22's wording, byte-exact)
                or refunded (the customer-side mirror). Demo orders (null)
                render exactly as before; the mb rhythm keys off the
                line's visibility. */}
            {(() => {
              const money = confirmationMoneyLineView(order!.paymentStatus);
              return (
                <>
                  <p className={`text-muted-foreground ${money.visible ? "mb-1" : "mb-8"}`}>
                    A confirmation was sent to{" "}
                    <span className="font-medium text-foreground">{order!.email}</span>.
                  </p>
                  {money.visible && (
                    <p className="text-sm text-muted-foreground mb-8">{money.text}</p>
                  )}
                </>
              );
            })()}
            <div className="text-left bg-card border border-border/50 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="font-medium">
                  {order!.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                  {order!.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "item" : "items"}
                </span>
                <span className="font-semibold">{formatCents(order!.total)}</span>
              </div>
              {order!.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 py-2 border-t border-border/50">
                  { }
                  <img src={i.imageSnapshot} alt={i.nameSnapshot} className="h-10 w-10 rounded-md object-cover bg-secondary/30" />
                  <span className="flex-1 text-sm line-clamp-1">{i.nameSnapshot}</span>
                  <span className="text-sm text-muted-foreground">×{i.quantity}</span>
                  <span className="text-sm font-medium">{formatCents(i.unitPrice * i.quantity)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground mb-8">Your order has been placed.</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button asChild className="h-10 px-8 rounded-xl">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 px-8 rounded-xl">
            <Link href={ordersHref}>View Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
