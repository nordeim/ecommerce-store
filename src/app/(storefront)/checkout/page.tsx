import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { pageMetadata } from "@/lib/metadata";
import { resolveStripeConfig } from "@/lib/stripe-payment";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({ title: "Checkout", path: "/checkout" });

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const cart = await getCart(user?.id ?? null);

  if (cart.items.length === 0) {
    // Byte-parity with the reference's empty checkout (captured live
    // 2026-10-07): minimal centered block, h1 + default button, no icon,
    // no paragraph, default button size (h-9 px-4).
    return (
      // session-12 (A11Y-MAIN-1): <div>, not a nested <main> — the layout owns the single landmark.
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">No items in cart</h1>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    // session-12 (A11Y-MAIN-1): <div>, not a nested <main> — the layout owns the single landmark.
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        {/* PAY-STRIPE-1 (session-22): the server-side config resolution —
            with no keys (the default) the wizard renders the reference's
            exact 3-step mock flow; with real keys the combined
            Payment & Review island takes over (the superset activation). */}
        <CheckoutFlow
          cart={cart}
          defaults={{
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            email: user?.email ?? "",
          }}
          stripeEnabled={resolveStripeConfig(process.env).serverConfigured}
          publishableKey={resolveStripeConfig(process.env).publishableKey}
        />
      </div>
    </div>
  );
}
