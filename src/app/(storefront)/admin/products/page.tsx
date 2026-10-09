import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { AdminProductRow } from "@/components/account/admin-product-row";
import { AdminProductFilters } from "@/components/account/admin-product-filters";
import { Button } from "@/components/ui/button";
import { buildAdminProductWhere, parseAdminProductFilters } from "@/lib/admin-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Products",
};

// Admin products console (session-27, ADMIN-PRODUCTS-1, ADR-035): the
// console trifecta's last LIST surface takes the URL-deep-linkable
// treatment (?q= + ?category= + ?visibility=) exactly like the orders
// (session-13, ADMIN-SEARCH-1) and payments (sessions 24-26,
// PAY-OPS-1/2/3) bars. The category set arrives from the DB (the same
// query feeds the island's Select options — the seam's parser receives
// the slugs as pure input, so a future category validates the day it is
// seeded); a bad deep-link value falls through to the unfiltered list,
// never an error (the family contract). The count line reports the
// filtered-of-total size; the products list carries no take bound, so
// no "100+" form is needed.
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/products");
  if (!isAdmin(user)) redirect("/");

  // ONE query feeds both the island's Select options and the parser's
  // validation set (the placedIntentIds precedent — the set is pure
  // input, the seam never hard-codes the catalog).
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });

  const params = await searchParams;
  const filters = parseAdminProductFilters(
    params,
    categories.map((c) => c.slug),
  );

  const where = buildAdminProductWhere(filters);

  const [products, total, allTotal] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.product.count({ where }),
    db.product.count(),
  ]);

  const hasAnyFilter = !!(filters.q || filters.category || filters.visibility);
  const countLabel = hasAnyFilter
    ? `${total} of ${allTotal} products`
    : `${total} ${total === 1 ? "product" : "products"}`;

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Products</h1>
        </div>

        <AdminProductFilters
          activeQuery={filters.q ?? ""}
          activeCategory={filters.category ?? "all"}
          activeVisibility={filters.visibility ?? "all"}
          categories={categories}
        />

        <p className="text-sm text-muted-foreground mb-4">{countLabel}</p>

        {/* A11Y-HEADING-1 (session-25): the sr-only h2 labels the list
            region so the page's heading order is h1 → h2 → (empty-state h3 /
            the footer's h3 columns) — the console LIST family's
            best-practice heading-order observation resolved. */}
        <h2 className="sr-only">Products list</h2>

        {products.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No products match your filters</h3>
              <p className="text-muted-foreground mb-4">
                Try a different name, slug, category, or visibility.
              </p>
              <Button asChild>
                <Link href="/admin/products">Clear all filters</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="p-6 pt-0">
              <div className="flex flex-col gap-3">
                {products.map((p) => (
                  <AdminProductRow
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      image: p.image,
                      price: p.price,
                      categoryName: p.category.name,
                      stock: p.stock,
                      isActive: p.isActive,
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
