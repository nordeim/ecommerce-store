import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  // Session-6 (REDIRECT-1): carry the intent for the anonymous admin too
  // (a non-admin landing on /admin after login bounces to / — no loop).
  if (!user) redirect("/login?redirect=/admin");
  if (!isAdmin(user)) redirect("/");

  const [orderCount, productCount, userCount, revenueAgg, recentOrders] = await Promise.all([
    db.order.count(),
    db.product.count(),
    db.user.count(),
    db.order.aggregate({ _sum: { total: true } }),
    db.order.findMany({ orderBy: { placedAt: "desc" }, take: 5, include: { items: true } }),
  ]);
  const revenue = revenueAgg._sum.total ?? 0;

  const stats = [
    { label: "Revenue", value: formatCents(revenue), icon: DollarSign },
    { label: "Orders", value: String(orderCount), icon: ShoppingBag },
    { label: "Products", value: String(productCount), icon: Package },
    { label: "Customers", value: String(userCount), icon: Users },
  ];

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-muted-foreground">Store overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/products">Products</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/admin/orders">Orders</Link>
            </Button>
            {/* Session-24 (PAY-OPS-1): the payment-ops surface's entry point. */}
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/payments">Payments</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center justify-between p-6">
            <h2 className="font-semibold">Recent Orders</h2>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50"
                  >
                    <div>
                      {/* Session-7 (ADMIN-DETAIL-1): the number deep-links to the
                          order-detail view (items + event timeline). */}
                      <p className="font-medium">
                        <Link href={`/admin/orders/${o.id}`} className="hover:text-primary transition-colors">
                          {o.number}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {o.email} · {o.items.reduce((s, i) => s + i.quantity, 0)} items
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="rounded-full capitalize">
                        {o.status.replace("_", " ")}
                      </Badge>
                      <span className="font-semibold">{formatCents(o.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
