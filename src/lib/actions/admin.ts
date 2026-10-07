"use server";

/**
 * Admin server actions — order status transitions + product visibility.
 * Every action re-checks the admin role server-side (defense in depth).
 */
import { revalidatePath } from "next/cache";
import { db } from "../db";
import { getCurrentUser, isAdmin } from "../auth";
import type { ActionResult } from "./auth";

const ORDER_STATUSES = ["processing", "in_transit", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export async function updateOrderStatusAction(orderId: string, status: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, error: { message: "Invalid status" } };
  }
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: { message: "Order not found" } };
  if (order.status === status) return { ok: true, data: null };
  await db.order.update({ where: { id: orderId }, data: { status } });
  await db.orderEvent.create({
    data: { orderId, type: "status_changed", note: `${order.status} → ${status} by ${user?.email}` },
  });
  revalidatePath("/admin");
  revalidatePath("/account");
  return { ok: true, data: null };
}

export async function toggleProductActiveAction(productId: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: { message: "Product not found" } };
  await db.product.update({ where: { id: productId }, data: { isActive: !product.isActive } });
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true, data: null };
}

export async function updateProductStockAction(productId: string, stock: number): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return { ok: false, error: { message: "Invalid stock value" } };
  }
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: { message: "Product not found" } };
  await db.product.update({ where: { id: productId }, data: { stock } });
  revalidatePath("/admin");
  return { ok: true, data: null };
}
