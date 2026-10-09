import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { AdminOrderRow } from "@/components/account/admin-order-row";
import { AdminOrderFilters } from "@/components/account/admin-order-filters";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { buildAdminOrderWhere, parseAdminOrderFilters } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Orders",
};

// Admin order-list filters (session-13, ADMIN-SEARCH-1): URL-deep-linkable
// ?status= + ?q= (the shop's filter-bar pattern, applied to the console's
// fulfillment surface). The take stays bounded at 100; the count line makes
// the filtered size visible so truncation can never read as "everything".
const TAKE = 100;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/orders");
  if (!isAdmin(user)) redirect("/");

  const params = await searchParams;
  const filters = parseAdminOrderFilters(params);
  const where = buildAdminOrderWhere(filters);

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      include: { items: true },
      take: TAKE,
    }),
    db.order.count({ where }),
  ]);

  const countLabel =
    total > TAKE ? `${TAKE}+ of ${total} orders` : `${total} ${total === 1 ? "order" : "orders"}`;

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>

        <AdminOrderFilters
          activeStatus={filters.status ?? "all"}
          activeQuery={filters.q ?? ""}
        />

        <p className="text-sm text-muted-foreground mb-4">{countLabel}</p>

        {/* A11Y-HEADING-1 (session-25): the sr-only h2 labels the list
            region so the page's heading order is h1 → h2 → (empty-state h3 /
            the footer's h3 columns) — the console LIST family's
            best-practice heading-order observation resolved. */}
        <h2 className="sr-only">Orders list</h2>

        {orders.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No orders match your filters</h3>
              <p className="text-muted-foreground mb-4">
                Try a different order number, email, or status.
              </p>
              <Button asChild>
                <Link href="/admin/orders">Clear all filters</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="p-6 pt-0">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
