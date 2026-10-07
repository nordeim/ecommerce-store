import { AnnouncementBar } from "@/components/store/announcement-bar";
import { Header } from "@/components/store/header";
import { SearchBar } from "@/components/store/search-bar";
import { MobileNav } from "@/components/store/mobile-nav";
import { CartDrawer } from "@/components/store/cart-drawer";
import { Footer } from "@/components/store/footer";
import { StoreProvider } from "@/components/store/store-provider";
import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getWishlistProductIds } from "@/lib/wishlist";

/**
 * Storefront chrome (route group `(storefront)` — URL-neutral). Everything a
 * shopper sees renders inside this layout: announcement bar, sticky header
 * with search, footer, plus the two portal-mounted overlays (mobile nav,
 * cart drawer). The client store is hydrated server-side here so the cart
 * badge, wishlist hearts, and account icon never flash.
 *
 * Reference parity (verified live 2026-10-07): the reference renders
 * /login and /register WITHOUT this chrome (standalone screens — see the
 * `(auth)` group) and renders unknown routes on a chrome-less platform 404
 * (see src/app/not-found.tsx). Only shopper surfaces carry the chrome.
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side hydration for the client store — no first-paint flash for
  // the cart badge, wishlist hearts, or the account icon.
  const user = await getCurrentUser();
  const [cart, wishlistIds] = await Promise.all([
    getCart(user?.id ?? null),
    getWishlistProductIds(user?.id ?? null),
  ]);

  return (
    <StoreProvider initialUser={user} initialCart={cart} initialWishlistIds={wishlistIds}>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
          <AnnouncementBar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Header />
          </div>
          <SearchBar />
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <MobileNav />
      <CartDrawer />
    </StoreProvider>
  );
}
