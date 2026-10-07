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
  adjustCartItemAction,
  getCartAction,
  getWishlistIdsAction,
  removeCartItemAction,
  toggleWishlistAction,
} from "@/lib/actions/cart";
import { currentUserAction } from "@/lib/actions/auth";
import { ToastViewport, type ToastItem } from "./toast-viewport";

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
  adjustQuantity: (itemId: string, delta: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  notify: (message: string) => void;
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

  // Session-5 (CHECKOUT-BADGE-1): re-sync when a router.refresh() delivers
  // fresh server truth. `useState(initialCart)` only reads the initial value
  // on first render — after the checkout places an order (server clears the
  // cart) the refreshed layout passed a new `initialCart` prop that the
  // state ignored, so the header badge kept the stale count until a manual
  // reload. This is the adjust-state-during-render pattern (React docs);
  // the "last seen props" live in STATE (not a ref) per the repo's React
  // Compiler refs rule, and the repo's lint policy prefers it over
  // useEffect state sync. Server truth wins: prop identity changes only
  // when the layout actually re-renders server-side, and client-optimistic
  // updates land via action responses that the next refresh re-delivers
  // unchanged.
  const [lastServerCart, setLastServerCart] = React.useState(initialCart);
  const [lastServerUser, setLastServerUser] = React.useState<SessionUser | null>(initialUser);
  const [lastServerWishlistIds, setLastServerWishlistIds] = React.useState(initialWishlistIds);
  if (lastServerCart !== initialCart) {
    setLastServerCart(initialCart);
    setCart(initialCart);
  }
  if (lastServerUser !== initialUser) {
    setLastServerUser(initialUser);
    setUser(initialUser);
  }
  if (lastServerWishlistIds !== initialWishlistIds) {
    setLastServerWishlistIds(initialWishlistIds);
    setWishlist(new Set(initialWishlistIds));
  }

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

  // Session-4 (CART-RACE-1): steppers send DELTAS — the server applies them
  // transactionally, so rapid clicks each land exactly once.
  const adjustQuantity = React.useCallback(async (itemId: string, delta: number) => {
    const res = await adjustCartItemAction(itemId, delta);
    if (res.ok) setCart(res.data);
    else console.error("[adjustQuantity]", res.error.message);
  }, []);

  const removeItem = React.useCallback(async (itemId: string) => {
    const res = await removeCartItemAction(itemId);
    if (res.ok) setCart(res.data);
    else console.error("[removeItem]", res.error.message);
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

  // Toast subsystem (session-4, TOAST-1): 3000ms lifetime, ~350ms exit rise,
  // stacking without dedupe — the reference's measured behavior.
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const toastSeq = React.useRef(0);
  const notify = React.useCallback((message: string) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { id, message, exiting: false }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    }, 3000);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
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
      adjustQuantity,
      removeItem,
      toggleWishlist,
      refreshCart,
      notify,
    }),
    [cart, user, wishlist, hydrated, cartOpen, mobileNavOpen, searchOpen, addToCart, adjustQuantity, removeItem, toggleWishlist, refreshCart, notify],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} />
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
