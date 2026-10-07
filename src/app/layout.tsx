import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
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

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lumina",
    template: "%s | Lumina",
  },
  description:
    "LUXE Store — curated collection of premium products for modern living. Quality meets style in every piece.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default async function RootLayout({
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
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>
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
      </body>
    </html>
  );
}
