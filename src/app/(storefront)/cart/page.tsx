import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

import { CartClient } from "./cart-client";

// Reference parity (session-4, TITLE-1 + session-9, METADATA-OG-1): the
// reference titles this route "Cart | Lumina" with the static-page og set
// ("Cart on Lumina. " + site description) — measured live.
export const metadata: Metadata = pageMetadata({ title: "Cart", path: "/cart" });

/**
 * CartPage — server wrapper owning the route Metadata; the interactive body
 * lives in cart-client.tsx (the same server-page/client-island split the
 * auth routes use).
 */
export default function CartPage() {
  return <CartClient />;
}
