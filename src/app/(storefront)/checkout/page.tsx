import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const cart = await getCart(user?.id ?? null);

  if (cart.items.length === 0) {
    // Byte-parity with the reference's empty checkout (captured live
    // 2026-10-07): minimal centered block, h1 + default button, no icon,
    // no paragraph, default button size (h-9 px-4).
    return (
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">No items in cart</h1>
          <Button asChild>
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
