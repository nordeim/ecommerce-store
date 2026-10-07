import type { Metadata } from "next";
import { Search, X } from "lucide-react";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductCardData } from "@/components/store/product-card";
import { ShopFilters } from "@/components/store/shop-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
};

type SortKey = "featured" | "price_asc" | "price_desc" | "newest" | "rating";
type PriceKey = "all" | "under-50" | "50-100" | "100-200" | "over-200";

const CATEGORY_NAMES: Record<string, string> = {
  electronics: "Electronics",
  clothing: "Clothing",
  "home-living": "Home & Living",
  accessories: "Accessories",
  sports: "Sports",
  beauty: "Beauty",
};

function parseSearchParams(params: Record<string, string | string[] | undefined>) {
  const one = (k: string): string | undefined => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const category = one("category");
  const search = one("search")?.trim();
  const sort = (one("sort") as SortKey) || "featured";
  const price = (one("price") as PriceKey) || "all";
  return {
    category: category && CATEGORY_NAMES[category] ? category : undefined,
    search: search || undefined,
    sort,
    price,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { category, search, sort, price } = parseSearchParams(params);

  const where: {
    isActive: boolean;
    category?: { slug: string };
    OR?: { name: { contains: string } }[];
    price?: { gte?: number; lte?: number };
  } = { isActive: true };
  if (category) where.category = { slug: category };
  if (search) where.OR = [{ name: { contains: search } }];

  if (price === "under-50") where.price = { lte: 4999 };
  else if (price === "50-100") where.price = { gte: 5000, lte: 10000 };
  else if (price === "100-200") where.price = { gte: 10001, lte: 20000 };
  else if (price === "over-200") where.price = { gte: 20001 };

  const orderBy: Record<string, string> =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : sort === "newest"
          ? { createdAt: "desc" }
          : sort === "rating"
            ? { rating: "desc" }
            : { sortOrder: "asc" };

  const [products, allCategories] = await Promise.all([
    db.product.findMany({ where, include: { category: true }, orderBy }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const cards: ProductCardData[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.image,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    rating: p.rating,
    reviewCount: p.reviewCount,
    badge: p.badge,
    categoryName: p.category.name,
  }));

  const heading = search
    ? `Results for "${search}"`
    : category
      ? CATEGORY_NAMES[category]
      : "All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{heading}</h1>
        <p className="text-muted-foreground">
          {products.length} {products.length === 1 ? "product" : "products"} found
        </p>
      </div>

      <ShopFilters
        categories={allCategories.map((c) => ({ slug: c.slug, name: c.name }))}
        activeCategory={category ?? "all"}
        activePrice={price}
        activeSort={sort}
        activeSearch={search ?? ""}
      />

      {cards.length === 0 ? (
        <div className="py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No products found</h2>
          <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
          <Button asChild>
            <a href="/shop">Clear All</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
