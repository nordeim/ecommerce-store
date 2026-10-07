"use server";

/**
 * Account server actions — profile edits, password change, address CRUD.
 */
import { revalidatePath } from "next/cache";
import { db } from "../db";
import { getCurrentUser } from "../auth";
import { scryptHash, scryptVerify } from "../password";
import { addressSchema, passwordChangeSchema, profileSchema } from "../validation";
import type { ActionResult } from "./auth";

export async function updateProfileAction(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "Please log in to update your profile" } };
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
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
  const { firstName, lastName, email, phone } = parsed.data;
  if (email !== user.email) {
    const dupe = await db.user.findUnique({ where: { email } });
    if (dupe) return { ok: false, error: { message: "Email already in use", fieldErrors: { email: "Email already in use" } } };
  }
  await db.user.update({
    where: { id: user.id },
    data: { firstName, lastName, email, phone: phone || null, name: `${firstName} ${lastName}`.trim() },
  });
  revalidatePath("/account");
  return { ok: true, data: null };
}

export async function changePasswordAction(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "Please log in to change your password" } };
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
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
  const row = await db.user.findUnique({ where: { id: user.id } });
  if (!row?.passwordHash || !scryptVerify(parsed.data.currentPassword, row.passwordHash)) {
    return { ok: false, error: { message: "Current password is incorrect", fieldErrors: { currentPassword: "Incorrect password" } } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: scryptHash(parsed.data.newPassword) } });
  return { ok: true, data: null };
}

export async function saveAddressAction(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "Please log in to manage addresses" } };
  const parsed = addressSchema.safeParse({
    label: formData.get("label") || "Home",
    fullName: formData.get("fullName"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    country: formData.get("country") || "United States",
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
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
  const id = formData.get("id");
  const data = parsed.data;
  if (data.isDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }
  if (typeof id === "string" && id) {
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return { ok: false, error: { message: "Address not found" } };
    }
    await db.address.update({ where: { id }, data });
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    await db.address.create({
      data: { ...data, userId: user.id, isDefault: data.isDefault || count === 0 },
    });
  }
  revalidatePath("/account");
  revalidatePath("/checkout");
  return { ok: true, data: null };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "Please log in to manage addresses" } };
  const existing = await db.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: { message: "Address not found" } };
  }
  await db.address.delete({ where: { id: addressId } });
  revalidatePath("/account");
  return { ok: true, data: null };
}
