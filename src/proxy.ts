import { NextRequest, NextResponse } from "next/server";

/**
 * Content-Security-Policy with a per-request nonce (session-14, SEC-CSP-1,
 * ADR-022) — the last nominated security item. The reference ships no CSP
 * at all, so this is superset hardening (like X-Frame-Options before it).
 *
 * File convention: Next 16 deprecated the `middleware` filename in favor of
 * `proxy` (same request/matcher API) — this repo ships the current
 * convention; the build emits no deprecation warnings.
 *
 * Mechanism (the documented Next.js middleware pattern): generate a nonce
 * per request, set the full CSP as a REQUEST header — Next's
 * getScriptNonceFromHeader parses it and applies the nonce to every
 * bootstrap/flight <script> it renders — and as a RESPONSE header for
 * browser enforcement. Per-request nonces require per-request rendering:
 * the two static auth screens (/register, /forgot-password) opt into
 * force-dynamic; every other HTML route was already dynamic.
 *
 * Directive set pinned to the codebase's measured footprint:
 * - script-src 'self' 'nonce-…' 'strict-dynamic' — no inline scripts
 *   survive outside the nonce (host allowlists are ignored by
 *   strict-dynamic-capable browsers; 'self' remains as the fallback)
 * - style-src 'self' 'unsafe-inline' — the app ships ZERO inline styles
 *   (measured), but framework-injected style attributes get insurance;
 *   styles are not the XSS vector scripts are
 * - img-src: media.base44.com is the sole image/favicon CDN (the pinned
 *   remote-art parity contract); data: covers any inline SVG data URLs
 * - font-src 'self': the self-hosted Plus Jakarta Sans woff2 (trap 13)
 * - connect-src 'self': RSC fetches, server actions, /api/* — all
 *   same-origin; no third-party calls exist
 * - frame-ancestors 'none' + object-src 'none' + base-uri/form-action
 *   'self': the standard hardening set
 * - NO upgrade-insecure-requests: the app runs on plain-HTTP localhost
 *   in dev/E2E — that directive would rewrite same-origin subresources
 *   to https and break them; TLS termination is the reverse-proxy layer
 *   (docs/DEPLOYMENT.md), where it belongs.
 *
 * The matcher excludes hashed static assets (immutable-cached, no
 * documents) and the extension-bearing files; everything else — HTML
 * routes, RSC fetches, server-action POSTs, /api — passes through (the
 * CSP header on non-document responses is inert).
 *
 * PAY-STRIPE-1 (session-22): when (and only when) Stripe is configured,
 * the directive set gains the Payment Element hosts — js.stripe.com (the
 * element iframe + stripe.js), hooks.stripe.com (the iframe's inner
 * frames), api.stripe.com (connect-src — the SDK's API calls). With
 * Stripe unconfigured (the default) the CSP string is byte-identical to
 * the session-14 pin — the standing CSP smoke test stays green.
 */
import { resolveStripeConfig } from "@/lib/stripe-config";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspParts = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://media.base44.com data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (resolveStripeConfig(process.env).serverConfigured) {
    // script-src host allowlist: ignored by strict-dynamic-capable
    // browsers (it remains the fallback for the rest).
    cspParts[1] = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`;
    cspParts[5] = "connect-src 'self' https://api.stripe.com";
    cspParts.push("frame-src https://js.stripe.com https://hooks.stripe.com");
  }
  const csp = cspParts.join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js parses the CSP from the REQUEST header to extract the nonce
  // for its script tags.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Browser enforcement rides on the response.
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|fonts/|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
    },
  ],
};
