import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { signOrderViewToken, verifyOrderViewToken } from "./order-view-token";

/**
 * GUEST-TOKEN-1 (session-31) — the guest order confirmation token's pure
 * contracts. The seam signs `order-view:<number>` with an HMAC keyed by
 * AUTH_SECRET (the session-cookie secret resolution, mirrored) so the
 * sequential, guessable order number alone can never unlock a guest
 * order's confirmation details on /checkout/success.
 */

describe("signOrderViewToken / verifyOrderViewToken (GUEST-TOKEN-1)", () => {
  it("round-trips: a signed token verifies for its own order number", () => {
    const token = signOrderViewToken("ORD-2026-004", "test-secret");
    expect(verifyOrderViewToken("ORD-2026-004", token, "test-secret")).toBe(true);
  });

  it("rejects a wrong token", () => {
    const token = signOrderViewToken("ORD-2026-004", "test-secret");
    expect(verifyOrderViewToken("ORD-2026-004", `${token.slice(0, -1)}x`, "test-secret")).toBe(false);
  });

  it("a token for order A does not verify order B (the enumeration boundary)", () => {
    const tokenA = signOrderViewToken("ORD-2026-004", "test-secret");
    expect(verifyOrderViewToken("ORD-2026-005", tokenA, "test-secret")).toBe(false);
  });

  it("rejects a tampered token (every position is load-bearing)", () => {
    const token = signOrderViewToken("ORD-2026-004", "test-secret");
    // Flip one character somewhere in the middle of the digest.
    const mid = Math.floor(token.length / 2);
    const flipped = token.slice(0, mid) + (token[mid] === "a" ? "b" : "a") + token.slice(mid + 1);
    expect(verifyOrderViewToken("ORD-2026-004", flipped, "test-secret")).toBe(false);
  });

  it("rejects a truncated or padded token (the length guard)", () => {
    const token = signOrderViewToken("ORD-2026-004", "test-secret");
    expect(verifyOrderViewToken("ORD-2026-004", token.slice(0, -1), "test-secret")).toBe(false);
    expect(verifyOrderViewToken("ORD-2026-004", `${token}=`, "test-secret")).toBe(false);
    expect(verifyOrderViewToken("ORD-2026-004", "", "test-secret")).toBe(false);
  });

  it("the secret is load-bearing: different keys never cross-verify", () => {
    const token = signOrderViewToken("ORD-2026-004", "secret-one");
    expect(verifyOrderViewToken("ORD-2026-004", token, "secret-two")).toBe(false);
    // …and the same key is deterministic (stable across calls).
    expect(signOrderViewToken("ORD-2026-004", "secret-one")).toBe(token);
  });

  it("domain separation: a session-cookie-shaped HMAC of the same number does not verify", () => {
    // The session cookie signs the BARE token (no prefix) — a signature
    // captured from a cookie must never double as an order-view token.
    const cookieShaped = createHmac("sha256", "test-secret").update("ORD-2026-004").digest("base64url").slice(0, 22);
    expect(verifyOrderViewToken("ORD-2026-004", cookieShaped, "test-secret")).toBe(false);
  });

  it("the token is a 22-char base64url digest (url-safe, no padding)", () => {
    const token = signOrderViewToken("ORD-2026-004", "test-secret");
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
});
