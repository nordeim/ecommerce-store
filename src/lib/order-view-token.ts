import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * GUEST-TOKEN-1 (session-31, ADR-039) — the guest order confirmation
 * token. `/checkout/success` renders a guest order's details (email,
 * items, total) ONLY for the signed-in owner or the holder of this
 * token; the bare sequential order number (`ORD-YYYY-NNN`, guessable by
 * construction) must never be enough — the enumeration probe
 * (`scripts/guest-order-enumeration-probe.mjs`) demonstrated the
 * pre-fix leak live.
 *
 * The token is `HMAC-SHA256(AUTH_SECRET, "order-view:<number>")`,
 * base64url, 22 chars (132 bits) — the Shopify per-order-key posture:
 * the customer's confirmation URL carries it after placement, a
 * bookmarked link keeps working (no expiry — it gates exactly what the
 * customer already saw), and no other number or context verifies.
 *
 * ⚠️ SERVER-ONLY: this module imports node:crypto (like
 * `stripe-payment.ts`) — never import from a client component.
 *
 * Pure + SDK-free by design (the repo's seam pattern): every function
 * works on plain strings, unit-pinned in `order-view-token.test.ts`.
 * The optional `secret` parameter is the test seam (the `rate-limit.ts`
 * `now()` pattern); production resolution mirrors `src/lib/auth.ts`
 * exactly — `AUTH_SECRET`, with the same documented dev-only fallback.
 */

function resolveSecret(secret?: string): string {
  return secret ?? process.env.AUTH_SECRET ?? "insecure-dev-only-secret-change-me";
}

/**
 * Sign an order number into its confirmation view token. The
 * `order-view:` prefix is domain separation: a session-cookie signature
 * (which signs the BARE token — see auth.ts) can never verify as an
 * order-view token, and vice versa.
 */
export function signOrderViewToken(orderNumber: string, secret?: string): string {
  return createHmac("sha256", resolveSecret(secret))
    .update(`order-view:${orderNumber}`)
    .digest("base64url")
    .slice(0, 22);
}

/**
 * Constant-time verification of a confirmation view token. The length
 * guard runs BEFORE `timingSafeEqual` (it throws on mismatched lengths);
 * a malformed input can never verify.
 */
export function verifyOrderViewToken(orderNumber: string, token: string, secret?: string): boolean {
  const expected = signOrderViewToken(orderNumber, secret);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
