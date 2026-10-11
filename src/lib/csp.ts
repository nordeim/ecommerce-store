/**
 * The CSP construction seam (session-42, CSP-DEV-EVAL-1, ADR-049) — the
 * Content-Security-Policy string builder extracted from src/proxy.ts (the
 * session-35 shared-seam precedent: the construction was inline in the
 * proxy and only E2E-pinned; the seam makes it unit-testable and gives the
 * dev-mode carve-out a pure home).
 *
 * PURE: Prisma-free, Next-free, node-dependency-free — importable from any
 * seam (the pure-to-pure import convention).
 *
 * The contract (the session-14 directive set, ADR-022, unchanged in
 * production — plus the session-42 dev carve-out):
 * - `script-src 'self' 'nonce-…' 'strict-dynamic'` — the per-request nonce
 *   pipeline; no inline scripts survive outside the nonce.
 * - **Dev mode (`isDev: true`) gains `'unsafe-eval'`** — React's dev builds
 *   require eval() for debugging features (callstack reconstruction). The
 *   Turbopack-compiled RSC client runs `checkEvalAvailabilityOnceDev` on
 *   every dev page load; a strict CSP blocks it, logging a console error on
 *   every route (measured 100% deterministic, session-42) and disabling
 *   React's dev tooling. The canonical Next.js CSP guidance: development
 *   requires 'unsafe-eval'.
 * - **Production NEVER carries `'unsafe-eval'`** — React never evals in
 *   production (the production RSC client ships no probe), and the token
 *   would re-open the eval-based XSS vector the session-14 policy closed.
 *   The E2E smoke spec pins this negative (the NODE_ENV boundary guard).
 * - Stripe-configured mode (ADR-030, PAY-STRIPE-1): script-src gains the
 *   js.stripe.com host (ignored by strict-dynamic-capable browsers; the
 *   fallback for the rest), connect-src gains api.stripe.com, and frame-src
 *   (js.stripe.com + hooks.stripe.com) is appended — the Payment Element
 *   iframe family. Byte-identical to the session-22 forms.
 */

/** The seam's inputs: the per-request nonce + the two environment gates. */
export interface CspOptions {
  /** The base64 per-request nonce (the proxy mints it via crypto.randomUUID). */
  nonce: string;
  /**
   * True when the runtime is NOT production (the dev server sets
   * NODE_ENV=development; the standalone server + E2E webServer set
   * NODE_ENV=production). Governs the 'unsafe-eval' dev carve-out.
   */
  isDev: boolean;
  /** True when Stripe keys are configured (ADR-030's env gate). */
  stripeConfigured: boolean;
}

/**
 * Build the full CSP string. The ten base directives join with "; " in the
 * pinned order; stripeConfigured swaps connect-src and appends frame-src;
 * isDev (and only isDev) appends 'unsafe-eval' to script-src.
 */
export function buildCsp({ nonce, isDev, stripeConfigured }: CspOptions): string {
  const scriptSrcParts = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // The dev carve-out (ADR-049): React's dev builds require eval().
    // Production never carries this token (the E2E negative pin guards it).
    ...(isDev ? ["'unsafe-eval'"] : []),
    // The Stripe host allowlist (ADR-030): ignored by strict-dynamic-capable
    // browsers — it remains the fallback for the rest.
    ...(stripeConfigured ? ["https://js.stripe.com"] : []),
  ];
  const parts = [
    "default-src 'self'",
    `script-src ${scriptSrcParts.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://media.base44.com data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (stripeConfigured) {
    // The Payment Element family (ADR-030): the SDK's API calls + the
    // element iframe's inner frames.
    parts[5] = "connect-src 'self' https://api.stripe.com";
    parts.push("frame-src https://js.stripe.com https://hooks.stripe.com");
  }
  return parts.join("; ");
}
