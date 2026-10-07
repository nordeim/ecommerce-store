import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/store/star-rating";
import { ProductCard, type ProductCardData } from "@/components/store/product-card";
import { BuyPanel } from "@/components/store/buy-panel";
import { discountPercent, formatCents } from "@/lib/money";

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
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
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
  if (!product) notFound();

  const related = await db.product.findMany({
    where: { isActive: true, id: { not: product.id }, category: { slug: product.category.slug } },
    include: { category: true },
    take: 4,
    orderBy: { sortOrder: "asc" },
  });
  const relatedFallback =
    related.length >= 4
      ? related
      : [
          ...related,
          ...(await db.product.findMany({
            where: { isActive: true, id: { not: product.id }, category: { slug: { not: product.category.slug } } },
            include: { category: true },
            take: 4 - related.length,
            orderBy: { sortOrder: "asc" },
          })),
        ];

  const discount = discountPercent(product.price, product.compareAtPrice);
  const features: string[] = JSON.parse(product.features || "[]");
  const relatedCards: ProductCardData[] = relatedFallback.map((p) => ({
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
          <p className="text-muted-foreground">Customer reviews coming soon.</p>
        </TabsContent>
        <TabsContent value="shipping">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Free standard shipping on orders over $100
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Express delivery available (2-3 business days)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              International shipping to 50+ countries
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              30-day hassle-free returns
            </li>
          </ul>
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
