import type { Metadata } from "next";

import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  // Reference parity (session-4, TITLE-1): the reference titles this route
  // "Cart | Lumina" — measured live 2026-10-07.
  title: "Cart",
};

/**
 * CartPage — server wrapper owning the route Metadata; the interactive body
 * lives in cart-client.tsx (the same server-page/client-island split the
 * auth routes use).
 */
export default function CartPage() {
  return <CartClient />;
}
