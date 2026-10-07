import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const cart = await getCart(user?.id ?? null);

  if (cart.items.length === 0) {
    return (
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some items before checking out.</p>
          <Button asChild className="h-10 px-8 rounded-xl">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <CheckoutFlow
          cart={cart}
          defaults={{
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            email: user?.email ?? "",
          }}
        />
      </div>
    </main>
  );
}
