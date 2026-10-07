"use server";

/**
 * Cart + wishlist server actions — the only mutation seam for the storefront.
 * All inputs are Zod-validated; totals are ALWAYS re-derived server-side.
 */
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth";
import { addItem, changeQuantityBy, getCart, removeItem } from "../cart";
import { getWishlistProductIds, toggleWishlist } from "../wishlist";
import { addToCartSchema, cartItemDeltaSchema, cartItemSchema, wishlistToggleSchema } from "../validation";
import type { ActionResult } from "./auth";
import type { CartDto } from "../cart";

export async function addToCartAction(productId: string, quantity = 1): Promise<ActionResult<CartDto>> {
  const parsed = addToCartSchema.safeParse({ productId, quantity });
  if (!parsed.success) {
    return { ok: false, error: { message: parsed.error.issues[0]?.message ?? "Invalid input" } };
  }
  try {
    const user = await getCurrentUser();
    const cart = await addItem(user?.id ?? null, parsed.data.productId, parsed.data.quantity);
    revalidatePath("/", "layout");
    return { ok: true, data: cart };
  } catch (e) {
    console.error("[addToCartAction]", e);
    return { ok: false, error: { message: e instanceof Error && e.message === "Product not found" ? "Product not found" : "Could not add to cart" } };
  }
}

/**
 * Session-4 (CART-RACE-1): steppers send DELTAS — the server applies them
 * transactionally against the row's current quantity, so rapid clicks
 * cannot collapse into a lost update. `removeCartItemAction` replaces the
 * old absolute-quantity-0 removal.
 */
export async function adjustCartItemAction(itemId: string, delta: number): Promise<ActionResult<CartDto>> {
  const parsed = cartItemDeltaSchema.safeParse({ itemId, delta });
  if (!parsed.success) {
    return { ok: false, error: { message: parsed.error.issues[0]?.message ?? "Invalid input" } };
  }
  try {
    const user = await getCurrentUser();
    const cart = await changeQuantityBy(user?.id ?? null, parsed.data.itemId, parsed.data.delta);
    revalidatePath("/", "layout");
    return { ok: true, data: cart };
  } catch (e) {
    console.error("[adjustCartItemAction]", e);
    return { ok: false, error: { message: "Could not update the cart" } };
  }
}

export async function removeCartItemAction(itemId: string): Promise<ActionResult<CartDto>> {
  const parsed = cartItemSchema.safeParse({ itemId });
  if (!parsed.success) {
    return { ok: false, error: { message: "Invalid input" } };
  }
  try {
    const user = await getCurrentUser();
    const cart = await removeItem(user?.id ?? null, parsed.data.itemId);
    revalidatePath("/", "layout");
    return { ok: true, data: cart };
  } catch (e) {
    console.error("[removeCartItemAction]", e);
    return { ok: false, error: { message: "Could not update the cart" } };
  }
}

export async function getCartAction(): Promise<CartDto> {
  const user = await getCurrentUser();
  return getCart(user?.id ?? null);
}

export async function toggleWishlistAction(productId: string): Promise<ActionResult<{ inWishlist: boolean }>> {
  const parsed = wishlistToggleSchema.safeParse({ productId });
  if (!parsed.success) {
    return { ok: false, error: { message: "Invalid input" } };
  }
  try {
    const user = await getCurrentUser();
    const inWishlist = await toggleWishlist(user?.id ?? null, parsed.data.productId);
    revalidatePath("/", "layout");
    return { ok: true, data: { inWishlist } };
  } catch (e) {
    console.error("[toggleWishlistAction]", e);
    return { ok: false, error: { message: "Could not update the wishlist" } };
  }
}

export async function getWishlistIdsAction(): Promise<string[]> {
  const user = await getCurrentUser();
  return getWishlistProductIds(user?.id ?? null);
}
