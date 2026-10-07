import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminOrderRow } from "@/components/account/admin-order-row";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Orders",
};

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/orders");
  if (!isAdmin(user)) redirect("/");

  const orders = await db.order.findMany({
    orderBy: { placedAt: "desc" },
    include: { items: true },
    take: 100,
  });

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
          <div className="p-6 pt-0">
            {orders.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((o) => (
                  <AdminOrderRow
                    key={o.id}
                    order={{
                      id: o.id,
                      number: o.number,
                      email: o.email,
                      status: o.status,
                      total: o.total,
                      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
                      placedAt: o.placedAt.toISOString(),
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
