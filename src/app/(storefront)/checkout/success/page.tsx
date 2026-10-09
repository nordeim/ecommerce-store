import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

// Clone-only route (superset): the static-page og pattern for consistency.
export const metadata: Metadata = pageMetadata({ title: "Order Confirmed", path: "/checkout/success" });

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = Array.isArray(params.order) ? params.order[0] : params.order;
  const user = await getCurrentUser();
  const order = orderNumber
    ? await db.order.findUnique({
        where: { number: orderNumber },
        include: { items: true },
      })
    : null;
  const visible = order && (!order.userId || order.userId === user?.id);

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
            <p className={`text-muted-foreground ${order!.paymentStatus === "paid" ? "mb-1" : "mb-8"}`}>
              A confirmation was sent to <span className="font-medium text-foreground">{order!.email}</span>.
            </p>
            {/* PAY-STRIPE-1 (session-22): the paid-order confirmation — one
                muted line, only when a real payment was captured (demo
                orders render exactly as before). */}
            {order!.paymentStatus === "paid" && (
              <p className="text-sm text-muted-foreground mb-8">
                Payment received — charged by Stripe.
              </p>
            )}
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
            <Link href="/account">View Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
