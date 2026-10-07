"use client";

/**
 * ProductCard — byte-parity port of the reference card:
 * group hover image zoom, badge stack (top-left), circular wishlist button
 * (top-right), slide-up Add to Cart, category/title/rating/price block.
 */
import * as React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStore } from "./store-provider";
import { discountPercent, formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  badge: string | null;
  categoryName: string;
};

export function ProductCard({ product, animate = true }: { product: ProductCardData; animate?: boolean }) {
  const { addToCart, toggleWishlist, wishlist, notify } = useStore();
  const discount = discountPercent(product.price, product.compareAtPrice);
  const inWishlist = wishlist.has(product.id);

  return (
    <div className={animate ? "animate-in fade-in duration-500" : undefined}>
      <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300">
        <Link className="block relative aspect-square overflow-hidden bg-secondary/30" href={`/product/${product.slug}`}>
          { }
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {(product.badge || discount !== null) && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.badge && (
                <Badge className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full">{product.badge}</Badge>
              )}
              {discount !== null && (
                <Badge variant="destructive" className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  -{discount}%
                </Badge>
              )}
            </div>
          )}
          <button
            type="button"
            aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={inWishlist}
            className={cn(
              "absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-background transition-colors",
              inWishlist && "text-primary",
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Toast on ADD only — the reference shows no toast when a
              // product is removed from the wishlist (verified live).
              void toggleWishlist(product.id).then((added) => {
                if (added) notify(`${product.name} added to wishlist!`);
              });
            }}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-primary")} />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs w-full rounded-xl shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Reference parity: a successful add only bumps the header
                // badge — the drawer opens via the header cart button only,
                // and the dark bottom-right toast confirms the add (both
                // verified live on the reference, 2026-10-07).
                void addToCart(product.id, 1).then((ok) => {
                  if (ok) notify(`${product.name} added to cart!`);
                });
              }}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          </div>
        </Link>
        <Link className="block p-4" href={`/product/${product.slug}`}>
          <p className="text-xs text-muted-foreground capitalize mb-1">{product.categoryName}</p>
          <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium">{product.rating}</span>
              </div>
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{formatCents(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatCents(product.compareAtPrice)}</span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
