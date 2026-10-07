/**
 * Cart domain — server-side reads + mutations over the Prisma store.
 *
 * Model: one cart per cookie token (`luxe_cart`, random 192-bit value), and
 * at most one cart per user. Guest carts merge into the user cart on login
 * (see actions/auth.ts). Reads NEVER mint carts — only mutations do, because
 * a Server Component render cannot set cookies.
 */
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { clampToStock, nextQuantity } from "./cart-quantity";
import { shippingForSubtotal } from "./money";

export const CART_COOKIE = "luxe_cart";

export type CartItemDto = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number; // cents
  quantity: number;
  lineTotal: number; // cents
};

export type CartDto = {
  items: CartItemDto[];
  itemCount: number;
  subtotal: number; // cents
  shipping: number; // cents
  total: number; // cents
};

export const EMPTY_CART: CartDto = { items: [], itemCount: 0, subtotal: 0, shipping: 0, total: 0 };

function toDto(items: { id: string; quantity: number; product: { id: string; slug: string; name: string; image: string; price: number } }[]): CartDto {
  const dtoItems: CartItemDto[] = items.map((i) => ({
    id: i.id,
    productId: i.product.id,
    slug: i.product.slug,
    name: i.product.name,
    image: i.product.image,
    price: i.product.price,
    quantity: i.quantity,
    lineTotal: i.product.price * i.quantity,
  }));
  const subtotal = dtoItems.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = dtoItems.length === 0 ? 0 : shippingForSubtotal(subtotal);
  return {
    items: dtoItems,
    itemCount: dtoItems.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}

/** Read the cart for the current visitor WITHOUT creating one. */
export async function getCart(userId: string | null): Promise<CartDto> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const cart = await resolveCartRow(token, userId, false);
  if (!cart) return EMPTY_CART;
  return toDto(cart.items);
}

/**
 * Resolve (and optionally create) the cart row for this visitor.
 * Order of preference: the user's own cart, then the guest cookie cart.
 */
async function resolveCartRow(
  token: string | undefined,
  userId: string | null,
  create: boolean,
): Promise<{ id: string; items: { id: string; productId: string; quantity: number; product: { id: string; slug: string; name: string; image: string; price: number } }[] } | null> {
  if (userId) {
    const userCart = await db.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    });
    if (userCart) return userCart;
    if (create) {
      // Adopt the guest cart if one exists, else mint a user cart.
      if (token) {
        const guest = await db.cart.findUnique({ where: { token } });
        if (guest && !guest.userId) {
          return db.cart.update({
            where: { id: guest.id },
            data: { userId },
            include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
          });
        }
      }
      return db.cart.create({
        data: { token: randomBytes(24).toString("base64url"), userId },
        include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
      });
    }
    return null;
  }
  if (!token) {
    if (!create) return null;
    const newToken = randomBytes(24).toString("base64url");
    const store = await cookies();
    store.set(CART_COOKIE, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return db.cart.create({
      data: { token: newToken },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    });
  }
  const existing = await db.cart.findUnique({
    where: { token },
    include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
  });
  if (existing) return existing;
  if (!create) return null;
  return db.cart.create({
    data: { token },
    include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
  });
}

/** Merge a guest cart into the user's cart after login (quantity-max union). */
export async function mergeGuestCartIntoUserCart(token: string | undefined, userId: string): Promise<void> {
  if (!token) return;
  const guest = await db.cart.findUnique({ where: { token } });
  if (!guest || guest.userId === userId) return;
  const userCart =
    (await db.cart.findUnique({ where: { userId } })) ??
    (await db.cart.create({ data: { token: randomBytes(24).toString("base64url"), userId } }));
  for (const item of await db.cartItem.findMany({ where: { cartId: guest.id } })) {
    const existing = await db.cartItem.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
    });
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(99, Math.max(existing.quantity, item.quantity)) },
      });
    } else {
      await db.cartItem.create({
        data: { cartId: userCart.id, productId: item.productId, quantity: item.quantity },
      });
    }
  }
  await db.cart.delete({ where: { id: guest.id } });
}

export async function addItem(userId: string | null, productId: string, quantity: number): Promise<CartDto> {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new Error("Product not found");
  // Session-4 bug fix (found live): mutations MUST resolve the guest token
  // from the cookie like getCart does — passing undefined minted a NEW cart
  // on every guest add (orphaning previous items) and made guest steppers
  // read as empty. All E2E cart specs run authenticated, so the guest path
  // had never been exercised.
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const cart = await resolveCartRow(token, userId, true);
  if (!cart) throw new Error("Cart unavailable");
  const existing = cart.items.find((i) => i.productId === productId);
  // Session-6 (STOCK-1): the server — not just the PDP UI — enforces stock.
  // Increases clamp at the available stock (never reject: the resting UI
  // shows no error state the reference never shows); a new line on a
  // sold-out product clamps to 0 and is skipped entirely.
  const current = existing?.quantity ?? 0;
  const target = clampToStock(current + quantity, current, product.stock);
  if (target <= 0) return toDto(cart.items);
  if (existing) {
    if (target !== current) {
      await db.cartItem.update({ where: { id: existing.id }, data: { quantity: target } });
    }
  } else {
    await db.cartItem.create({ data: { cartId: cart.id, productId, quantity: target } });
  }
  return toDto(
    await db.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    }),
  );
}

/**
 * Delta-based stepper mutation (session-4, CART-RACE-1).
 *
 * The old absolute-quantity API let two rapid stepper clicks race a single
 * re-render — both computed the same `current + 1` and the second response
 * overwrote the first (lost update). Deltas are applied inside a
 * transaction against the row's CURRENT quantity, so SQLite's single-writer
 * serialization makes every +1 land exactly once.
 *
 * Session-6 (STOCK-1): increases clamp at the product's CURRENT stock —
 * re-read inside the transaction so an admin stock drop is honored — while
 * decreases and deletes always pass through.
 */
export async function changeQuantityBy(userId: string | null, itemId: string, delta: number): Promise<CartDto> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const cart = await resolveCartRow(token, userId, false);
  if (!cart) return EMPTY_CART;
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return toDto(cart.items);

  await db.$transaction(async (tx) => {
    const row = await tx.cartItem.findUnique({
      where: { id: itemId },
      select: { quantity: true, product: { select: { stock: true } } },
    });
    if (!row) return; // removed concurrently — nothing to adjust
    const next = clampToStock(nextQuantity(row.quantity, delta), row.quantity, row.product.stock);
    if (next <= 0) {
      await tx.cartItem.delete({ where: { id: itemId } });
    } else if (next !== row.quantity) {
      await tx.cartItem.update({ where: { id: itemId }, data: { quantity: next } });
    }
  });

  return toDto(
    await db.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    }),
  );
}

/** Remove a line outright (the trash button). */
export async function removeItem(userId: string | null, itemId: string): Promise<CartDto> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const cart = await resolveCartRow(token, userId, false);
  if (!cart) return EMPTY_CART;
  const item = cart.items.find((i) => i.id === itemId);
  if (item) {
    await db.cartItem.delete({ where: { id: itemId } });
  }
  return toDto(
    await db.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    }),
  );
}

export async function clearCart(cartId: string): Promise<void> {
  await db.cartItem.deleteMany({ where: { cartId } });
}

export async function getCartId(userId: string | null): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const row = await resolveCartRow(token, userId, false);
  return row?.id ?? null;
}
