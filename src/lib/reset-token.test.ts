import { describe, expect, it } from "vitest";

import {
  INVALID_RESET_TOKEN_MESSAGE,
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
} from "./reset-token";

describe("reset-token lib (session-20, RESET-ROUTE-1)", () => {
  it("generates URL-safe opaque tokens", () => {
    const token = generateResetToken();
    // 32 random bytes -> base64url: 43 chars, no +/=
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateResetToken()).not.toBe(token);
  });

  it("the token index is deterministic sha256 hex (the Session-token pattern)", () => {
    // High-entropy tokens are indexed by a DETERMINISTIC hash so the
    // lookup key matches the stored value (scrypt's random salt can
    // never serve as a lookup key — same input, different digest).
    expect(hashResetToken("abc")).toBe(hashResetToken("abc"));
    expect(hashResetToken("abc")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetToken("abc")).not.toBe(hashResetToken("abd"));
  });

  it("the TTL is the 30-minute window", () => {
    expect(RESET_TOKEN_TTL_MS).toBe(30 * 60 * 1000);
  });

  it("the invalid-token copy matches the reference (measured live)", () => {
    expect(INVALID_RESET_TOKEN_MESSAGE).toBe("Invalid or expired reset token");
  });
});
