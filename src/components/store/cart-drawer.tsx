"use client";

/**
 * CartDrawer — Sheet from the RIGHT (`flex flex-col w-full sm:max-w-md`),
 * matching the reference: Cart (N) heading, border-separated item rows with
 * quantity steppers AND a right-side line total, Subtotal / Shipping / Total
 * summary with separators, Checkout + View Cart actions. Reference anatomy
 * (captured live 2026-10-07): the item name is a plain single-line
 * truncated h4 and the image is NOT a link — we keep the production-correct
 * extras the reference lacks (aria-labels, disabled minus at qty 1).
 */
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "./store-provider";
import { formatCents } from "@/lib/money";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, adjustQuantity, removeItem } = useStore();

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
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-4 border-b border-border/50">
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-secondary/30 shrink-0">
                    { }
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.name}</h4>
                    <p className="text-sm font-bold mt-1">{formatCents(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          className="p-1.5 hover:bg-secondary transition-colors rounded-l-lg disabled:opacity-40"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={item.quantity <= 1}
                          onClick={() => adjustQuantity(item.id, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          className="p-1.5 hover:bg-secondary transition-colors rounded-r-lg"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => adjustQuantity(item.id, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold shrink-0">{formatCents(item.lineTotal)}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-3">
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCents(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-primary">
                  {cart.shipping === 0 ? "Free" : formatCents(cart.shipping)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCents(cart.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button asChild className="w-full h-10 px-8 rounded-xl" onClick={() => setCartOpen(false)}>
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
