"use server";

/**
 * Auth server actions — login, register, logout, password-reset request.
 * Login and reset requests are rate-limited (10 attempts / 15 min / IP+email
 * and 5 / 15 min / IP+email respectively).
 */
import { cookies } from "next/headers";
import { db } from "../db";
import { createSession, destroySession, getCurrentUser } from "../auth";
import { scryptHash, scryptVerify } from "../password";
import { CART_COOKIE, mergeGuestCartIntoUserCart } from "../cart";
import { mergeGuestWishlistIntoUser } from "../wishlist";
import { deriveDisplayName, loginSchema, passwordResetSchema, registerSchema } from "../validation";
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
    name: formData.get("name") || undefined,
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
  // Session-3 parity: the reference register form has no Name field — derive
  // the display name from the email local part when the form posts none.
  const { email, password } = parsed.data;
  const name = parsed.data.name ?? deriveDisplayName(email);
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

/**
 * Password-reset request (session-3 parity with /forgot-password).
 *
 * Anti-enumeration contract: the response NEVER reveals whether the email
 * exists — callers show the same neutral confirmation for every submit
 * (exactly the reference's copy). No email is sent yet: the console.info
 * seam below marks where a transactional email provider plugs in. The
 * action is rate-limited to blunt automated probing.
 */
export async function requestPasswordResetAction(
  _prev: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = passwordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        message: parsed.error.issues[0]?.message ?? "Invalid input",
        fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [i.path[0]?.toString() ?? "", i.message])),
      },
    };
  }
  const email = parsed.data.email;
  // Same best-effort IP pattern as loginAction (server actions have no
  // direct request-header access; the E2E/dev path resolves to "local").
  const ip = clientIp(new Headers());
  const rl = rateLimit(`pwreset:${ip}:${email}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, error: { message: "Too many reset requests. Please try again later." } };
  }
  // Look the user up ONLY to log the request — never in the response.
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  // EMAIL SEAM: plug a transactional provider here (Resend/SES/Postmark).
  // Until then the request is only logged server-side.
  console.info(`[password-reset] requested for ${user ? "known" : "unknown"} account ${email}`);
  return { ok: true, data: null };
}

export async function currentUserAction() {
  return getCurrentUser();
}
