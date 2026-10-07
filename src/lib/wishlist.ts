/**
 * Wishlist domain — mirrors the cart pattern: one wishlist per cookie token
 * (`luxe_wishlist`), at most one per user, guest wishlist merges on login.
 */
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const WISHLIST_COOKIE = "luxe_wishlist";

export type WishlistProductDto = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number; // cents
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  badge: string | null;
  categoryName: string;
  categorySlug: string;
};

export async function getWishlistProductIds(userId: string | null): Promise<string[]> {
  const wl = await resolveWishlistRow(userId, false);
  return wl ? wl.items.map((i) => i.productId) : [];
}

export async function getWishlistProducts(userId: string | null): Promise<WishlistProductDto[]> {
  const wl = await resolveWishlistRow(userId, false);
  if (!wl) return [];
  return wl.items.map((i) => ({
    productId: i.product.id,
    slug: i.product.slug,
    name: i.product.name,
    image: i.product.image,
    price: i.product.price,
    compareAtPrice: i.product.compareAtPrice,
    rating: i.product.rating,
    reviewCount: i.product.reviewCount,
    badge: i.product.badge,
    categoryName: i.product.category.name,
    categorySlug: i.product.category.slug,
  }));
}

async function resolveWishlistRow(
  userId: string | null,
  create: boolean,
): Promise<{ id: string; items: { productId: string; product: { id: string; slug: string; name: string; image: string; price: number; compareAtPrice: number | null; rating: number; reviewCount: number; badge: string | null; category: { name: string; slug: string } } }[] } | null> {
  const include = {
    items: {
      include: {
        product: { include: { category: true } },
      },
      orderBy: { createdAt: "asc" as const },
    },
  };
  if (userId) {
    const userWl = await db.wishlist.findUnique({ where: { userId }, include });
    if (userWl) return userWl;
    if (create) {
      const store = await cookies();
      const token = store.get(WISHLIST_COOKIE)?.value;
      if (token) {
        const guest = await db.wishlist.findUnique({ where: { token } });
        if (guest && !guest.userId) {
          return db.wishlist.update({ where: { id: guest.id }, data: { userId }, include });
        }
      }
      return db.wishlist.create({
        data: { token: randomBytes(24).toString("base64url"), userId },
        include,
      });
    }
    return null;
  }
  const store = await cookies();
  const token = store.get(WISHLIST_COOKIE)?.value;
  if (!token) {
    if (!create) return null;
    const newToken = randomBytes(24).toString("base64url");
    store.set(WISHLIST_COOKIE, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return db.wishlist.create({ data: { token: newToken }, include });
  }
  const existing = await db.wishlist.findUnique({ where: { token }, include });
  if (existing) return existing;
  if (!create) return null;
  return db.wishlist.create({ data: { token }, include });
}

/** Toggle: returns true when the product IS in the wishlist after the call. */
export async function toggleWishlist(userId: string | null, productId: string): Promise<boolean> {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new Error("Product not found");
  const wl = await resolveWishlistRow(userId, true);
  if (!wl) throw new Error("Wishlist unavailable");
  const existing = wl.items.find((i) => i.productId === productId);
  if (existing) {
    await db.wishlistItem.delete({
      where: { wishlistId_productId: { wishlistId: wl.id, productId } },
    });
    return false;
  }
  await db.wishlistItem.create({ data: { wishlistId: wl.id, productId } });
  return true;
}

/** Merge the guest wishlist into the user wishlist after login. */
export async function mergeGuestWishlistIntoUser(userId: string): Promise<void> {
  const store = await cookies();
  const token = store.get(WISHLIST_COOKIE)?.value;
  if (!token) return;
  const guest = await db.wishlist.findUnique({ where: { token } });
  if (!guest || guest.userId === userId) return;
  const userWl =
    (await db.wishlist.findUnique({ where: { userId } })) ??
    (await db.wishlist.create({ data: { token: randomBytes(24).toString("base64url"), userId } }));
  const guestItems = await db.wishlistItem.findMany({ where: { wishlistId: guest.id } });
  for (const item of guestItems) {
    const dupe = await db.wishlistItem.findFirst({
      where: { wishlistId: userWl.id, productId: item.productId },
    });
    if (!dupe) {
      await db.wishlistItem.create({ data: { wishlistId: userWl.id, productId: item.productId } });
    }
  }
  await db.wishlist.delete({ where: { id: guest.id } });
}
