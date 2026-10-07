"use client";

/**
 * CartPage — full-page cart. The reference hardcodes this route to the
 * empty state (verified live, 2026-10-07); the clone ships a REAL cart page
 * (superset): item rows with steppers, order summary, and the checkout CTA,
 * reusing the drawer's design language. The empty state matches the
 * reference byte-for-byte ("Continue Shopping" CTA).
 */
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/store/store-provider";
import { formatCents } from "@/lib/money";

export default function CartPage() {
  const { cart, updateQuantity } = useStore();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Button asChild className="h-10 px-8 rounded-xl">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="flex flex-col gap-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-sm"
            >
              <Link
                href={`/product/${item.slug}`}
                className="shrink-0 h-24 w-24 rounded-xl overflow-hidden bg-secondary/30"
              >
                { }
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0 flex flex-col">
                <Link
                  href={`/product/${item.slug}`}
                  className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-0.5">{formatCents(item.price)}</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      className="p-1.5 hover:bg-secondary transition-colors rounded-l-lg disabled:opacity-40"
                      aria-label={`Decrease quantity of ${item.name}`}
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[2.25rem] text-center">{item.quantity}</span>
                    <button
                      className="p-1.5 hover:bg-secondary transition-colors rounded-r-lg"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCents(item.lineTotal)}</span>
                    <button
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => updateQuantity(item.id, 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border/50 shadow-sm lg:sticky lg:top-32">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCents(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">{cart.shipping === 0 ? "Free" : formatCents(cart.shipping)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCents(cart.total)}</span>
            </div>
          </div>
          <Button asChild className="w-full h-10 rounded-xl mt-6">
            <Link href="/checkout">Checkout</Link>
          </Button>
          <Button asChild variant="outline" className="w-full h-10 rounded-xl mt-2">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
