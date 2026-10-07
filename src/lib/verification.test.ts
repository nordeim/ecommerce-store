import { describe, expect, it } from "vitest";

import {
  MAX_VERIFICATION_ATTEMPTS,
  UNVERIFIED_LOGIN_MESSAGE,
  invalidCodeMessage,
  shouldBlockUnverifiedLogin,
} from "./verification";

// Auth-verification domain (session-4, AUTH-VERIFY-1). Copy + budget rules
// measured live on the reference 2026-10-07.

describe("invalidCodeMessage", () => {
  it("counts down the attempt budget like the reference", () => {
    expect(invalidCodeMessage(1)).toBe("Invalid verification code. 4 attempts remaining.");
    expect(invalidCodeMessage(2)).toBe("Invalid verification code. 3 attempts remaining.");
    expect(invalidCodeMessage(4)).toBe("Invalid verification code. 1 attempt remaining.");
  });

  it("saturates into the too-many-attempts copy", () => {
    expect(invalidCodeMessage(MAX_VERIFICATION_ATTEMPTS)).toBe(
      "Too many attempts. Please request a new code.",
    );
    expect(invalidCodeMessage(99)).toBe("Too many attempts. Please request a new code.");
  });
});

describe("shouldBlockUnverifiedLogin", () => {
  it("blocks only when the gate is on AND the account is unverified", () => {
    expect(shouldBlockUnverifiedLogin(false, true)).toBe(true);
    expect(shouldBlockUnverifiedLogin(true, true)).toBe(false);
    expect(shouldBlockUnverifiedLogin(false, false)).toBe(false);
    expect(shouldBlockUnverifiedLogin(true, false)).toBe(false);
  });
});

describe("unverified login copy", () => {
  it("matches the reference exactly", () => {
    expect(UNVERIFIED_LOGIN_MESSAGE).toBe(
      "Please verify your email before logging in. Check your email for the verification code.",
    );
  });
});
