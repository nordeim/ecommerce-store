"use server";

/**
 * Checkout server action — places the order in one transaction.
 *
 * The client-side 3-step wizard (shipping → payment → review) submits here.
 * Prices are re-derived from the DATABASE cart (never trusted from the
 * client); the cart is cleared in the same transaction; the order number is
 * `ORD-YYYY-NNNNNN` allocated under a serialized retry loop (SQLite has a
 * single writer, so count-then-increment is race-free within the tx).
 */
import { db } from "../db";
import { getCurrentUser } from "../auth";
import { getCart, getCartId } from "../cart";
import { checkoutSchema } from "../validation";
import { clientIp, rateLimit } from "../rate-limit";
import type { ActionResult } from "./auth";

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const count = await db.order.count({ where: { number: { startsWith: prefix } } });
  // Reference display format is ORD-YYYY-NNN (zero-padded to 3); past 999
  // orders the number simply grows a digit.
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

/** Customer-safe rejection thrown INSIDE the placement transaction. */
class StockRejectedError extends Error {}

export async function placeOrderAction(
  _prev: ActionResult<{ orderNumber: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ orderNumber: string }>> {
  const user = await getCurrentUser();
  const ip = clientIp(new Headers());
  const rl = rateLimit(`checkout:${user?.id ?? ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, error: { message: `Too many checkout attempts. Try again in ${rl.retryAfterSec}s.` } };
  }
  const parsed = checkoutSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    paymentMethod: formData.get("paymentMethod") || "card",
    cardNumber: formData.get("cardNumber") ?? "",
    cardExpiry: formData.get("cardExpiry") ?? "",
    cardCvc: formData.get("cardCvc") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        message: parsed.error.issues[0]?.message ?? "Invalid input",
        fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [i.path[0]?.toString() ?? "", i.message])),
      },
    };
  }
  const input = parsed.data;
  if (input.paymentMethod === "card") {
    const digits = (input.cardNumber ?? "").replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      return { ok: false, error: { message: "Enter a valid card number", fieldErrors: { cardNumber: "Invalid card number" } } };
    }
    if (!/^\d{2}\/\d{2}$/.test(input.cardExpiry ?? "")) {
      return { ok: false, error: { message: "Enter a valid expiry (MM/YY)", fieldErrors: { cardExpiry: "Invalid expiry" } } };
    }
    if (!/^\d{3,4}$/.test(input.cardCvc ?? "")) {
      return { ok: false, error: { message: "Enter a valid CVC", fieldErrors: { cardCvc: "Invalid CVC" } } };
    }
  }

  const cart = await getCart(user?.id ?? null);
  if (cart.items.length === 0) {
    return { ok: false, error: { message: "Your cart is empty" } };
  }
  const cartId = await getCartId(user?.id ?? null);
  if (!cartId) {
    return { ok: false, error: { message: "Your cart is empty" } };
  }

  const shippingAddress = JSON.stringify({
    fullName: `${input.firstName} ${input.lastName}`.trim(),
    street: input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: "United States",
  });

  try {
    const orderNumber = await db.$transaction(async (tx) => {
      // Session-6 (STOCK-1): re-read each line's stock INSIDE the
      // transaction — a cart assembled before an admin stock drop must not
      // oversell. Reject with a customer-safe message naming the product
      // and the remaining units; the cart stays intact for the shopper to
      // adjust. (The steppers already clamp, so this only fires when stock
      // moved AFTER the cart was assembled.)
      for (const item of cart.items) {
        const row = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true },
        });
        if (row && row.stock < item.quantity) {
          throw new StockRejectedError(
            `Sorry, ${row.name} only has ${row.stock} left in stock. Please update your quantity.`,
          );
        }
      }
      const number = await nextOrderNumber();
      const order = await tx.order.create({
        data: {
          number,
          userId: user?.id ?? null,
          email: input.email,
          status: "processing",
          subtotal: cart.subtotal,
          shipping: cart.shipping,
          total: cart.total,
          shippingAddress,
          paymentMethod: input.paymentMethod,
          cardLast4:
            input.paymentMethod === "card"
              ? (input.cardNumber ?? "").replace(/\D/g, "").slice(-4)
              : null,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              nameSnapshot: i.name,
              imageSnapshot: i.image,
              unitPrice: i.price,
              quantity: i.quantity,
            })),
          },
          events: { create: { type: "placed", note: `Placed via ${input.paymentMethod}` } },
        },
      });
      // Decrement inventory atomically with the order write (STOCK-1) —
      // the admin console's stock numbers now move with real sales.
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId } });
      return number;
    });
    return { ok: true, data: { orderNumber } };
  } catch (e) {
    if (e instanceof StockRejectedError) {
      return { ok: false, error: { message: e.message } };
    }
    console.error("[placeOrderAction]", e);
    return { ok: false, error: { message: "We could not place your order. Please try again." } };
  }
}
