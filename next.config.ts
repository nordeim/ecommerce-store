import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Hide the floating dev-tools indicator ("N" badge) — dev-only chrome
  // that polluted UI screenshots and has no parity with the reference.
  // No effect on production builds.
  devIndicators: false,
  // Pin file tracing to this project so the standalone server always lands
  // at .next/standalone/server.js — even when the repo is cloned inside a
  // parent workspace that has its own lockfile.
  outputFileTracingRoot: path.join(import.meta.dirname, "."),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Next 16 dev-origin protection silently blocks dev chunks served to a
  // 127.0.0.1 origin (unhydrated page / native form fallbacks) — allow both
  // loopback hostnames during development. No effect on production builds.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    // Product/hero art is served from the reference app's public media CDN;
    // optimization is disabled so the standalone server ships byte-identical
    // sources without a sharp dependency.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.base44.com",
      },
    ],
  },
  // Security headers (session-12, SEC-HEADERS-1). The reference's platform
  // (base44) ships referrer-policy / strict-transport-security /
  // x-content-type-options (live-measured 2026-10-08); a bare Next
  // standalone server ships none. These three restore parity;
  // X-Frame-Options: DENY is the superset (clickjacking hardening).
  // HSTS over plain HTTP is a spec-defined no-op (RFC 6797 §7.2 — UAs MUST
  // ignore it on non-secure transports), so the unconditional value is
  // safe for localhost/E2E. CSP and Permissions-Policy deferred: a
  // meaningful CSP needs nonce plumbing through Next's inline bootstrap.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
