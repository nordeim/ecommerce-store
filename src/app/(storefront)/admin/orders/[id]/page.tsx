import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { History, Mail, MapPin, Package, ReceiptText } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";

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
            </dl>
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
                      ) : (
                        <History className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {event.type === "placed" ? "Order placed" : "Status changed"}
                      </p>
                      {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
                      <p className="text-xs text-muted-foreground">
                        {event.createdAt.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
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
