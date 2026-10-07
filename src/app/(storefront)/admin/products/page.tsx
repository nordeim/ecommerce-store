import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminProductRow } from "@/components/account/admin-product-row";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Products",
};

export default async function AdminProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (!isAdmin(user)) redirect("/");

  const products = await db.product.findMany({
    include: { category: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Products</h1>
        </div>

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
      </div>
    </main>
  );
}
