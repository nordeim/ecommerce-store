import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/metadata";
import { getWishlistProducts } from "@/lib/wishlist";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({ title: "Wishlist", path: "/wishlist" });

export default async function WishlistPage() {
  const user = await getCurrentUser();
  const products = await getWishlistProducts(user?.id ?? null);

  if (products.length === 0) {
    return (
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-8">Save items you love to find them later.</p>
          <Button asChild className="h-10 px-8 rounded-xl">
            <Link href="/shop">Explore Products</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Wishlist</h1>
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.productId}
              animate={false}
              product={{
                id: p.productId,
                slug: p.slug,
                name: p.name,
                image: p.image,
                price: p.price,
                compareAtPrice: p.compareAtPrice,
                rating: p.rating,
                reviewCount: p.reviewCount,
                badge: p.badge,
                categoryName: p.categoryName,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
