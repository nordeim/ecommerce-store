/**
 * Email-verification domain (session-4, AUTH-VERIFY-1).
 *
 * The reference gates registration behind an email-verification step: after
 * signup it renders a 6-digit "Verify your email" screen, and logging in
 * before verification is blocked ("Please verify your email before logging
 * in. Check your email for the verification code." — measured live
 * 2026-10-07). Wrong codes decrement a 5-attempt budget
 * ("Invalid verification code. N attempts remaining.").
 *
 * The clone ships the full machinery but env-GATES enforcement behind
 * AUTH_REQUIRE_EMAIL_VERIFICATION: with no transactional email provider
 * wired (the repo's documented posture — see the reset-email seam), an
 * always-on gate would lock every new user out of the app. Default off =
 * frictionless registration (the session-1..3 behavior); flip the flag once
 * an email provider is plugged into the console.info seams.
 */

export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_VERIFICATION_ATTEMPTS = 5;

/** The reference's exact unverified-login block copy. */
export const UNVERIFIED_LOGIN_MESSAGE =
  "Please verify your email before logging in. Check your email for the verification code.";

export function isVerificationRequired(): boolean {
  return process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true";
}

/** Wrong-code copy with the remaining attempt budget (reference form). */
export function invalidCodeMessage(attemptsUsed: number): string {
  const remaining = MAX_VERIFICATION_ATTEMPTS - attemptsUsed;
  if (remaining <= 0) {
    return "Too many attempts. Please request a new code.";
  }
  return `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
}

/** True when login should be blocked for an unverified account. */
export function shouldBlockUnverifiedLogin(emailVerified: boolean, verificationRequired: boolean): boolean {
  return verificationRequired && !emailVerified;
}
