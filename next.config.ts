import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
};

export default nextConfig;
