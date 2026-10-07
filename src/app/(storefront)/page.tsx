import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { HeroCarousel, type HeroSlide } from "@/components/store/hero-carousel";
import { CategoryCard, FeatureBar } from "@/components/store/category-card";
import { ProductCard, type ProductCardData } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const HERO_SLIDES: HeroSlide[] = [
  {
    promo: "Up to 40% Off",
    title: "Spring Collection 2026",
    subtitle: "Discover the latest trends in fashion and lifestyle",
    cta: "Shop Now",
    href: "/shop",
    image: "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/7cfe01108_generated_076a6d07.png",
  },
  {
    promo: "New Arrivals",
    title: "Tech Essentials",
    subtitle: "Premium gadgets for modern living",
    cta: "Explore",
    href: "/shop?category=electronics",
    image: "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/f0ae76854_generated_31ca432d.png",
  },
  {
    promo: "Free Shipping",
    title: "Home & Comfort",
    subtitle: "Transform your living space with curated pieces",
    cta: "Browse",
    href: "/shop?category=home-living",
    image: "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/54a27de93_generated_4ebfd375.png",
  },
];

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  badge: string | null;
  category: { name: string };
};

function toCardData(rows: DbProduct[]): ProductCardData[] {
  return rows.map((p) => ({
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
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
      <Button asChild variant="ghost" className="gap-2 group" size="default">
        <Link href={href}>
          View All
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
}

export default async function HomePage() {
  const [categories, trending, newArrivals, onSale] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { isActive: true, isTrending: true },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    db.product.findMany({
      where: { isActive: true, isNewArrival: true },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    db.product.findMany({
      where: { isActive: true, isOnSale: true },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
  ]);

  return (
    <div>
      <HeroCarousel slides={HERO_SLIDES} />
      <FeatureBar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeader title="Trending Now" href="/shop" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {toCardData(trending).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Shop by Category</h2>
          <p className="text-muted-foreground">Find exactly what you&apos;re looking for</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <CategoryCard key={c.id} name={c.name} slug={c.slug} icon={c.icon} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeader title="New Arrivals" href="/shop" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {toCardData(newArrivals).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <SectionHeader title="On Sale" href="/shop" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {toCardData(onSale).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
