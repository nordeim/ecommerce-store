"use server";

/**
 * Auth server actions — login, register, logout, password-reset request,
 * email verification (session-4). Login and reset requests are rate-limited
 * (10 attempts / 15 min / IP+email and 5 / 15 min / IP+email respectively);
 * verification resends 3 / 10 min.
 */
import { cookies } from "next/headers";
import { db } from "../db";
import { createSession, destroySession, getCurrentUser } from "../auth";
import { scryptHash, scryptVerify } from "../password";
import { CART_COOKIE, mergeGuestCartIntoUserCart } from "../cart";
import { mergeGuestWishlistIntoUser } from "../wishlist";
import { deriveDisplayName, loginSchema, passwordResetSchema, registerSchema, verifyEmailSchema } from "../validation";
import { clientIp, rateLimit } from "../rate-limit";
import { generateVerificationCode } from "../format";
import {
  MAX_VERIFICATION_ATTEMPTS,
  UNVERIFIED_LOGIN_MESSAGE,
  VERIFICATION_CODE_TTL_MS,
  invalidCodeMessage,
  isVerificationRequired,
  shouldBlockUnverifiedLogin,
} from "../verification";

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
  // Session-4 (AUTH-VERIFY-1): unverified accounts cannot log in while the
  // verification gate is on — the reference's exact block copy.
  if (shouldBlockUnverifiedLogin(user.emailVerified, isVerificationRequired())) {
    return { ok: false, error: { message: UNVERIFIED_LOGIN_MESSAGE } };
  }
  await createSession(user.id);
  // Merge any guest cart/wishlist created before login.
  const store = await cookies();
  await mergeGuestCartIntoUserCart(store.get(CART_COOKIE)?.value, user.id);
  await mergeGuestWishlistIntoUser(user.id);
  return { ok: true, data: null };
}

export async function registerAction(
  _prev: ActionResult<{ verificationRequired: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ verificationRequired: boolean }>> {
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
    // Reference copy (measured live, session-4): "A user with this email
    // already exists" — shown in the shared alert box.
    return { ok: false, error: { message: "A user with this email already exists", fieldErrors: { email: "Email already registered" } } };
  }
  const user = await db.user.create({
    data: { name, email, passwordHash: scryptHash(password), emailVerified: !isVerificationRequired() },
  });
  // Session-4 (AUTH-VERIFY-1): under the verification gate the registration
  // creates NO session — the client routes to /verify-email and the code is
  // delivered at the console seam (email provider plugs in here).
  if (isVerificationRequired()) {
    const code = generateVerificationCode();
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationHash: scryptHash(code),
        verificationExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
        verificationAttempts: 0,
      },
    });
    console.info("[verify-email seam] delivery ready", { email, code });
    return { ok: true, data: { verificationRequired: true as const } };
  }
  await createSession(user.id);
  const store = await cookies();
  await mergeGuestCartIntoUserCart(store.get(CART_COOKIE)?.value, user.id);
  await mergeGuestWishlistIntoUser(user.id);
  return { ok: true, data: { verificationRequired: false as const } };
}

/**
 * Email verification (session-4, AUTH-VERIFY-1). Attempt-limited (5), TTL'd
 * (15 min), anti-enum on unknown emails. A successful verify marks the
 * account and creates the session (the user just proved mailbox control).
 */
export async function verifyEmailAction(
  _prev: ActionResult<{ verified: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ verified: boolean }>> {
  const parsed = verifyEmailSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
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
  const { email, code } = parsed.data;
  try {
    const user = await db.user.findUnique({ where: { email } });
    // Anti-enum: unknown / already-verified / codeless accounts all read the
    // same as a wrong code (the screen is only reachable post-signup).
    if (!user || user.emailVerified || !user.verificationHash) {
      return { ok: false, error: { message: invalidCodeMessage(MAX_VERIFICATION_ATTEMPTS - 1) } };
    }
    if (user.verificationExpiresAt && user.verificationExpiresAt.getTime() < Date.now()) {
      return { ok: false, error: { message: "Verification code expired. Please request a new one." } };
    }
    if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      return { ok: false, error: { message: "Too many attempts. Please request a new code." } };
    }
    if (!scryptVerify(code, user.verificationHash)) {
      const attempts = user.verificationAttempts + 1;
      await db.user.update({ where: { id: user.id }, data: { verificationAttempts: attempts } });
      return { ok: false, error: { message: invalidCodeMessage(attempts) } };
    }
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationHash: null,
        verificationExpiresAt: null,
        verificationAttempts: 0,
      },
    });
    await createSession(user.id);
    const store = await cookies();
    await mergeGuestCartIntoUserCart(store.get(CART_COOKIE)?.value, user.id);
    await mergeGuestWishlistIntoUser(user.id);
    return { ok: true, data: { verified: true } };
  } catch (e) {
    console.error("[verifyEmailAction]", e);
    return { ok: false, error: { message: "Could not verify the code" } };
  }
}

/** Regenerate + re-TTL the code (rate-limited 3/10min/IP+email). */
export async function resendVerificationAction(email: string): Promise<ActionResult<null>> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: { message: "Invalid email" } };
  }
  const ip = clientIp(new Headers());
  const rl = rateLimit(`verify-resend:${ip}:${normalized}`, 3, 10 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, error: { message: `Too many attempts. Try again in ${rl.retryAfterSec}s.` } };
  }
  try {
    const user = await db.user.findUnique({ where: { email: normalized } });
    if (user && !user.emailVerified) {
      const code = generateVerificationCode();
      await db.user.update({
        where: { id: user.id },
        data: {
          verificationHash: scryptHash(code),
          verificationExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
          verificationAttempts: 0,
        },
      });
      console.info("[verify-email seam] delivery ready (resend)", { email: normalized, code });
    }
    // Reference parity: the resend gives NO visible feedback (verified live).
    return { ok: true, data: null };
  } catch (e) {
    console.error("[resendVerificationAction]", e);
    return { ok: false, error: { message: "Could not resend the code" } };
  }
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
