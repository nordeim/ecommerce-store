import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/store/star-rating";
import { ProductCard, type ProductCardData } from "@/components/store/product-card";
import { BuyPanel } from "@/components/store/buy-panel";
import { discountPercent, formatCents } from "@/lib/money";
import { humanizeSlug } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product || !product.isActive) return null;
  return product;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  // Reference parity (session-4 TITLE-2 + session-7 TITLE-NF-1): the
  // reference's SPA derives the tab title from the URL slug regardless of
  // whether the product resolves — an unknown slug still titles as the
  // HUMANIZED SLUG ("wireless-noise-cancelling-headphones" → "Wireless Noise
  // Cancelling Headphones | Lumina", measured live). The h1/page body keeps
  // the not-found branch; only the metadata mirrors the URL. og:title follows
  // the product name for richer social cards (superset).
  if (!product) return { title: humanizeSlug(slug) };
  return {
    title: humanizeSlug(slug),
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  // Reference parity (captured live 2026-10-07): an unknown product slug
  // renders an in-chrome minimal block — h2 "Product not found" + the
  // default Back to Shop button — NOT the platform 404 (that is reserved
  // for unknown routes; see src/app/not-found.tsx).
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Button asChild>
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  // Reference rule (measured live 2026-10-07): "You May Also Like" lists ALL
  // same-category products excluding self, in array order — NO cap and NO
  // cross-category fill (headphones -> [speaker, pad]; planter -> [blanket]).
  const related = await db.product.findMany({
    where: { isActive: true, id: { not: product.id }, category: { slug: product.category.slug } },
    include: { category: true },
    orderBy: { sortOrder: "asc" },
  });

  const discount = discountPercent(product.price, product.compareAtPrice);
  const features: string[] = JSON.parse(product.features || "[]");
  const relatedCards: ProductCardData[] = related.map((p) => ({
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link className="hover:text-foreground transition-colors" href="/">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link className="hover:text-foreground transition-colors" href="/shop">
          Shop
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link className="hover:text-foreground transition-colors capitalize" href={`/shop?category=${product.category.slug}`}>
          {product.category.name.toLowerCase()}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16">
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary/30">
          { }
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          {product.badge && <Badge className="absolute top-4 left-4 rounded-full">{product.badge}</Badge>}
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground capitalize mb-1">{product.category.name.toLowerCase()}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{product.name}</h1>
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.rating} size="md" />
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold">{formatCents(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatCents(product.compareAtPrice)}</span>
            )}
            {discount !== null && (
              <Badge variant="destructive" className="rounded-full">
                -{discount}%
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {features.map((f) => (
                <Badge key={f} variant="secondary" className="rounded-full px-3 py-1 gap-1 font-medium">
                  <Check className="h-3 w-3" />
                  {f}
                </Badge>
              ))}
            </div>
          )}
          <Separator className="my-4" />
          <BuyPanel productId={product.id} name={product.name} stock={product.stock} />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              <span>30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="mb-16">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>
        <TabsContent value="description">
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            {features.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-4 mb-2">Key Features</h3>
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </TabsContent>
        <TabsContent value="reviews">
          {/* Reference parity (session-4): a centered, py-10 wrapper with a
              bare paragraph inside — measured live. */}
          <div className="text-center py-10 text-muted-foreground">
            <p>Customer reviews coming soon.</p>
          </div>
        </TabsContent>
        <TabsContent value="shipping">
          {/* Reference parity (session-4): plain paragraphs with a literal
              check character and space-y-3 — NO list, NO icons (only the
              Description tab's Key Features uses icons on the reference). */}
          <div className="space-y-3 text-muted-foreground">
            <p>&#10003; Free standard shipping on orders over $100</p>
            <p>&#10003; Express delivery available (2-3 business days)</p>
            <p>&#10003; International shipping to 50+ countries</p>
            <p>&#10003; 30-day hassle-free returns</p>
          </div>
        </TabsContent>
      </Tabs>

      <section>
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {relatedCards.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
