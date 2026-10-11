import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

// The CSP construction seam's pins (session-42, CSP-DEV-EVAL-1, ADR-049).
// The production forms are BYTE-EXACT pins — the session-14 string (ADR-022)
// and the session-22 Stripe-configured form (ADR-030) were never unit-pinned
// before (the E2E smoke spec held them); the seam extraction makes the
// construction testable at the unit layer for the first time. The dev forms
// pin the round's deliverable: the ONLY delta is the 'unsafe-eval' token in
// script-src (React's documented dev-mode requirement — the Turbopack RSC
// client's checkEvalAvailabilityOnceDev probe), never anything else.

const N = "dGVzdC1ub25jZQ=="; // "test-nonce" base64 — a realistic nonce shape

// The session-14 production form (byte-exact, nonce interpolated).
const PROD =
  "default-src 'self'; " +
  `script-src 'self' 'nonce-${N}' 'strict-dynamic'; ` +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' https://media.base44.com data:; " +
  "font-src 'self'; " +
  "connect-src 'self'; " +
  "frame-ancestors 'none'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

// The session-22 Stripe-configured production form (byte-exact): the script
// host appended, the connect-src swap, frame-src appended.
const PROD_STRIPE =
  "default-src 'self'; " +
  `script-src 'self' 'nonce-${N}' 'strict-dynamic' https://js.stripe.com; ` +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' https://media.base44.com data:; " +
  "font-src 'self'; " +
  "connect-src 'self' https://api.stripe.com; " +
  "frame-ancestors 'none'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "frame-src https://js.stripe.com https://hooks.stripe.com";

// The round's deliverable: dev = production + 'unsafe-eval' as script-src's
// fourth token — the ONLY delta.
const DEV =
  "default-src 'self'; " +
  `script-src 'self' 'nonce-${N}' 'strict-dynamic' 'unsafe-eval'; ` +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' https://media.base44.com data:; " +
  "font-src 'self'; " +
  "connect-src 'self'; " +
  "frame-ancestors 'none'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'";

const DEV_STRIPE =
  "default-src 'self'; " +
  `script-src 'self' 'nonce-${N}' 'strict-dynamic' 'unsafe-eval' https://js.stripe.com; ` +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' https://media.base44.com data:; " +
  "font-src 'self'; " +
  "connect-src 'self' https://api.stripe.com; " +
  "frame-ancestors 'none'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "frame-src https://js.stripe.com https://hooks.stripe.com";

describe("buildCsp — the production forms (byte-exact, the session-14/22 pins)", () => {
  it("renders the session-14 production CSP byte-exact", () => {
    expect(buildCsp({ nonce: N, isDev: false, stripeConfigured: false })).toBe(PROD);
  });
  it("renders the session-22 Stripe-configured production form byte-exact", () => {
    expect(buildCsp({ nonce: N, isDev: false, stripeConfigured: true })).toBe(PROD_STRIPE);
  });
  it("production NEVER carries 'unsafe-eval' (the strictness guard)", () => {
    expect(buildCsp({ nonce: N, isDev: false, stripeConfigured: false })).not.toContain(
      "'unsafe-eval'",
    );
    expect(buildCsp({ nonce: N, isDev: false, stripeConfigured: true })).not.toContain(
      "'unsafe-eval'",
    );
  });
});

describe("buildCsp — the dev forms (the round's deliverable, ADR-049)", () => {
  it("dev = production + 'unsafe-eval' as script-src's fourth token (the ONLY delta)", () => {
    expect(buildCsp({ nonce: N, isDev: true, stripeConfigured: false })).toBe(DEV);
  });
  it("the dev-vs-prod delta is exactly the one token", () => {
    const dev = buildCsp({ nonce: N, isDev: true, stripeConfigured: false });
    const prod = buildCsp({ nonce: N, isDev: false, stripeConfigured: false });
    expect(dev.replace(" 'unsafe-eval'", "")).toBe(prod);
  });
  it("dev + stripe: both tokens, the pinned order (unsafe-eval before the stripe host)", () => {
    expect(buildCsp({ nonce: N, isDev: true, stripeConfigured: true })).toBe(DEV_STRIPE);
  });
});

describe("buildCsp — the directive-set plumbing (the session-14 anatomy)", () => {
  it("interpolates the nonce into script-src and nowhere else", () => {
    const csp = buildCsp({ nonce: N, isDev: false, stripeConfigured: false });
    const nonceCount = (csp.match(new RegExp(`'nonce-${N}'`, "g")) ?? []).length;
    expect(nonceCount).toBe(1);
    expect(csp).toContain(`script-src 'self' 'nonce-${N}'`);
  });
  it("the ten directives join with '; ' in the pinned order (stripe appends frame-src)", () => {
    const csp = buildCsp({ nonce: N, isDev: false, stripeConfigured: false });
    expect(csp.split("; ").map((d) => d.split(" ")[0])).toEqual([
      "default-src",
      "script-src",
      "style-src",
      "img-src",
      "font-src",
      "connect-src",
      "frame-ancestors",
      "object-src",
      "base-uri",
      "form-action",
    ]);
    const stripe = buildCsp({ nonce: N, isDev: false, stripeConfigured: true });
    expect(stripe.split("; ").map((d) => d.split(" ")[0])).toEqual([
      "default-src",
      "script-src",
      "style-src",
      "img-src",
      "font-src",
      "connect-src",
      "frame-ancestors",
      "object-src",
      "base-uri",
      "form-action",
      "frame-src",
    ]);
  });
  it("two different nonces never collide in the emitted strings (the per-request minting contract)", () => {
    const a = buildCsp({ nonce: "bm9uY2UtYQ==", isDev: false, stripeConfigured: false });
    const b = buildCsp({ nonce: "bm9uY2UtYg==", isDev: false, stripeConfigured: false });
    expect(a).not.toBe(b);
    expect(a).toContain("bm9uY2UtYQ==");
    expect(b).toContain("bm9uY2UtYg==");
  });
});
