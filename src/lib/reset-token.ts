/**
 * Password-reset token domain (session-20, RESET-ROUTE-1).
 *
 * The reference ships a real `/reset-password` route (measured live
 * 2026-10-09 via its own sitemap, which lists it): no token -> the
 * "Invalid reset link" screen; any token -> the "New password" form;
 * a bogus token on submit -> the tinted error box with "Invalid or
 * expired reset token".
 *
 * The clone's machinery follows the ADR-010/011 posture: the request
 * flow (forgot-password) issues a single-use opaque token — 32 random
 * bytes, indexed in the DB by its SHA-256 (the Session-token pattern:
 * deterministic indexing for HIGH-entropy tokens; scrypt's per-call
 * random salt is for low-entropy passwords and can never serve as a
 * lookup key) — with a 30-minute window, logged at the `console.info`
 * seam where a transactional email provider plugs in. Enforcement is
 * NOT env-gated: the token only exists if the request flow issued it,
 * so there is no lockout risk (unlike the ADR-011 verification gate).
 *
 * On a successful reset the action deletes the token row AND every
 * Session for the user — the standard security behavior (a password
 * reset invalidates all active sessions). The reference's post-success
 * behavior is unmeasurable without a real reset email; this is the
 * registered superset decision.
 */

import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** The reference's exact invalid-token error copy (measured live). */
export const INVALID_RESET_TOKEN_MESSAGE = "Invalid or expired reset token";

/**
 * Generates an opaque URL-safe token: 32 random bytes, base64url-encoded
 * (43 chars, no `+`/`/`/`=` — safe in a query param without encoding).
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The deterministic DB index for a token (the Session-token pattern:
 * sha256 hex — high-entropy tokens need indexed lookups, not salted
 * password hashing; plaintext tokens never touch the DB).
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
