"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { useStore } from "./store-provider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=electronics", label: "Electronics" },
  { href: "/shop?category=clothing", label: "Clothing" },
  { href: "/shop?category=accessories", label: "Accessories" },
];

/**
 * Header — the nav row only (h-16). The sticky <header> wrapper, the
 * announcement bar, and the search strip are composed by the root layout,
 * matching the reference DOM order.
 */
export function Header() {
  const { cart, setCartOpen, setMobileNavOpen, setSearchOpen, user } = useStore();

  return (
    <div className="flex items-center justify-between h-16">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Logo />
      </div>

      <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            {link.label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Search" aria-haspopup="dialog" onClick={() => setSearchOpen(true)}>
          <Search className="h-5 w-5" />
        </Button>
        <Link href="/wishlist" aria-label="Wishlist">
          <Button variant="ghost" size="icon" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={cart.itemCount > 0 ? `Cart, ${cart.itemCount} items` : "Cart"}
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag className="h-5 w-5" />
          {cart.itemCount > 0 && (
            <span className="absolute -top-1 -right-2 h-4 min-w-4 px-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
              {cart.itemCount}
            </span>
          )}
        </Button>
        <Link href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Log in"}>
          <Button variant="ghost" size="icon" aria-label={user ? "My account" : "Log in"}>
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
