import { randomInt } from "node:crypto";

/**
 * Pure formatting / code-generation helpers (session-4).
 */

/**
 * Title-case a dash-separated slug: "wireless-headphones" -> "Wireless
 * Headphones". The reference's PDP document.title uses the humanized SLUG,
 * not the product name (measured live across all 11 catalog slugs,
 * 2026-10-07: "Wireless Headphones | Lumina" while the h1 stays "Wireless
 * Noise-Cancelling Headphones").
 */
export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * A cryptographically random 6-digit numeric code for the email-verification
 * flow (the reference's "one-time-code" input accepts exactly 6 digits).
 * Uniform over [0, 999999] — no modulo bias (randomInt is rejection-sampled).
 */
export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
