"use server";

/**
 * Auth server actions — login, register, logout.
 * Login is rate-limited (10 attempts / 15 min / IP+email).
 */
import { cookies } from "next/headers";
import { db } from "../db";
import { createSession, destroySession, getCurrentUser } from "../auth";
import { scryptHash, scryptVerify } from "../password";
import { CART_COOKIE, mergeGuestCartIntoUserCart } from "../cart";
import { mergeGuestWishlistIntoUser } from "../wishlist";
import { loginSchema, registerSchema } from "../validation";
import { clientIp, rateLimit } from "../rate-limit";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; fieldErrors?: Record<string, string> } };

export async function loginAction(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
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
  const { email, password } = parsed.data;
  const ip = clientIp(new Headers());
  const rl = rateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, error: { message: `Too many attempts. Try again in ${rl.retryAfterSec}s.` } };
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !scryptVerify(password, user.passwordHash)) {
    return { ok: false, error: { message: "Invalid email or password" } };
  }
  await createSession(user.id);
  // Merge any guest cart/wishlist created before login.
  const store = await cookies();
  await mergeGuestCartIntoUserCart(store.get(CART_COOKIE)?.value, user.id);
  await mergeGuestWishlistIntoUser(user.id);
  return { ok: true, data: null };
}

export async function registerAction(_prev: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
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
  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: { message: "An account with this email already exists", fieldErrors: { email: "Email already registered" } } };
  }
  const user = await db.user.create({
    data: { name, email, passwordHash: scryptHash(password) },
  });
  await createSession(user.id);
  const store = await cookies();
  await mergeGuestCartIntoUserCart(store.get(CART_COOKIE)?.value, user.id);
  await mergeGuestWishlistIntoUser(user.id);
  return { ok: true, data: null };
}

export async function logoutAction(): Promise<ActionResult<null>> {
  await destroySession();
  return { ok: true, data: null };
}

export async function currentUserAction() {
  return getCurrentUser();
}
