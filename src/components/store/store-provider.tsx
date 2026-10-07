"use client";

/**
 * StoreProvider — the single client-side seam for commerce UI state.
 *
 * Domain truth (cart contents, wishlist ids, session user) is SERVER truth,
 * hydrated on mount through server actions and re-derived after every
 * mutation. The provider also owns the cart-drawer / mobile-nav / search
 * open state so any surface (header, product card, drawer) can open them.
 *
 * `setUser` exists because the provider's state survives client-side
 * navigations inside the (storefront) layout: logout destroys the session
 * server-side, and without an explicit clear the header would keep the
 * stale logged-in icon (found by the route-group refactor, 2026-10-07).
 */
import * as React from "react";
import type { CartDto } from "@/lib/cart";
import type { SessionUser } from "@/lib/auth";
import {
  addToCartAction,
  getCartAction,
  getWishlistIdsAction,
  toggleWishlistAction,
  updateCartItemAction,
} from "@/lib/actions/cart";
import { currentUserAction } from "@/lib/actions/auth";

type StoreContextValue = {
  cart: CartDto;
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  wishlist: Set<string>;
  hydrated: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
};

const StoreContext = React.createContext<StoreContextValue | null>(null);

const EMPTY_CART: CartDto = { items: [], itemCount: 0, subtotal: 0, shipping: 0, total: 0 };

export function StoreProvider({
  children,
  initialUser = null,
  initialCart = EMPTY_CART,
  initialWishlistIds = [],
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
  initialCart?: CartDto;
  initialWishlistIds?: string[];
}) {
  const [cart, setCart] = React.useState<CartDto>(initialCart);
  const [user, setUser] = React.useState<SessionUser | null>(initialUser);
  const [wishlist, setWishlist] = React.useState<Set<string>>(new Set(initialWishlistIds));
  const [hydrated, setHydrated] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Hydrate from the server on mount — the SSR payload may be stale (e.g. a
  // guest cart mutated in another tab) and this is cheap.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [serverCart, ids, serverUser] = await Promise.all([
          getCartAction(),
          getWishlistIdsAction(),
          currentUserAction(),
        ]);
        if (cancelled) return;
        setCart(serverCart);
        setWishlist(new Set(ids));
        setUser(serverUser);
      } catch (e) {
        console.error("[StoreProvider] hydrate failed", e);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = React.useCallback(async (productId: string, quantity = 1) => {
    const res = await addToCartAction(productId, quantity);
    if (res.ok) {
      setCart(res.data);
      return true;
    }
    console.error("[addToCart]", res.error.message);
    return false;
  }, []);

  const updateQuantity = React.useCallback(async (itemId: string, quantity: number) => {
    const res = await updateCartItemAction(itemId, quantity);
    if (res.ok) setCart(res.data);
    else console.error("[updateQuantity]", res.error.message);
  }, []);

  const toggleWishlist = React.useCallback(async (productId: string) => {
    const res = await toggleWishlistAction(productId);
    if (res.ok) {
      setWishlist((prev) => {
        const next = new Set(prev);
        if (res.data.inWishlist) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return res.data.inWishlist;
    }
    console.error("[toggleWishlist]", res.error.message);
    return false;
  }, []);

  const refreshCart = React.useCallback(async () => {
    const c = await getCartAction();
    setCart(c);
  }, []);

  const value = React.useMemo<StoreContextValue>(
    () => ({
      cart,
      user,
      setUser,
      wishlist,
      hydrated,
      cartOpen,
      setCartOpen,
      mobileNavOpen,
      setMobileNavOpen,
      searchOpen,
      setSearchOpen,
      addToCart,
      updateQuantity,
      toggleWishlist,
      refreshCart,
    }),
    [cart, user, wishlist, hydrated, cartOpen, mobileNavOpen, searchOpen, addToCart, updateQuantity, toggleWishlist, refreshCart],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
