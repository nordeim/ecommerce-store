"use client";

/**
 * BuyPanel — quantity stepper + Add to Cart + wishlist toggle on the PDP.
 * Classes are a byte-parity port of the reference buy box.
 */
import * as React from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "./store-provider";
import { cn } from "@/lib/utils";

export function BuyPanel({ productId, name, stock }: { productId: string; name: string; stock: number }) {
  const { addToCart, toggleWishlist, wishlist, setCartOpen } = useStore();
  const [quantity, setQuantity] = React.useState(1);
  const [adding, setAdding] = React.useState(false);
  const inWishlist = wishlist.has(productId);
  const soldOut = stock <= 0;

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center border border-border rounded-xl">
          <button
            className="p-3 hover:bg-secondary transition-colors rounded-l-xl disabled:opacity-40"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-5 font-medium min-w-[3rem] text-center">{quantity}</span>
          <button
            className="p-3 hover:bg-secondary transition-colors rounded-r-xl disabled:opacity-40"
            aria-label="Increase quantity"
            disabled={quantity >= Math.min(99, stock)}
            onClick={() => setQuantity((q) => Math.min(99, stock > 0 ? stock : 99, q + 1))}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <Button
          className="h-10 px-8 flex-1 rounded-xl gap-2"
          disabled={adding || soldOut}
          onClick={async () => {
            setAdding(true);
            const ok = await addToCart(productId, quantity);
            setAdding(false);
            if (ok) setCartOpen(true);
          }}
        >
          <ShoppingBag className="h-4 w-4" />
          {soldOut ? "Out of Stock" : adding ? "Adding…" : "Add to Cart"}
        </Button>
        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl"
          aria-label={inWishlist ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={inWishlist}
          onClick={() => void toggleWishlist(productId)}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-primary text-primary")} />
        </Button>
      </div>
    </>
  );
}
