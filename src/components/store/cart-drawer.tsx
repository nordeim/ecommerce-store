"use client";

/**
 * CartDrawer — Sheet from the RIGHT (`flex flex-col w-full sm:max-w-md`),
 * matching the reference: Cart (N) heading, item rows with quantity
 * steppers, Subtotal / Shipping / Total, Checkout + View Cart actions.
 */
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "./store-provider";
import { formatCents } from "@/lib/money";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity } = useStore();

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetTitle asChild>
          <h2 className="flex items-center gap-2 text-lg font-semibold pr-8">
            <ShoppingBag className="h-5 w-5" />
            Cart ({cart.itemCount})
          </h2>
        </SheetTitle>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
            <Button asChild onClick={() => setCartOpen(false)}>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-2 px-2 mt-4 flex flex-col gap-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setCartOpen(false)}
                    className="shrink-0 h-20 w-20 rounded-xl overflow-hidden bg-secondary/30"
                  >
                    { }
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="block font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">{formatCents(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
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
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-4 flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCents(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{cart.shipping === 0 ? "Free" : formatCents(cart.shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold mt-1">
                <span>Total</span>
                <span>{formatCents(cart.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button asChild className="w-full h-10 rounded-xl" onClick={() => setCartOpen(false)}>
                <Link href="/checkout">Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-10 rounded-xl" onClick={() => setCartOpen(false)}>
                <Link href="/cart">View Cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
