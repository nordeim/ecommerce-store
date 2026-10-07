import { randomInt } from "node:crypto";

/**
 * Pure formatting / code-generation helpers (session-4).
 */

/**
 * Title-case a dash/underscore-separated slug: "wireless-headphones" ->
 * "Wireless Headphones", "FOO_BAR" -> "FOO BAR" (leading case preserved,
 * first char uppercased when it is a letter). The reference's PDP
 * document.title uses the humanized SLUG, not the product name (measured
 * live across all 11 catalog slugs on 2026-10-07: "Wireless Headphones |
 * Lumina" while the h1 stays "Wireless Noise-Cancelling Headphones").
 * Session-8 (TITLE-404-1) extended the splitter to underscores — the
 * reference's SPA humanizes both separators identically (measured live:
 * /FOO_BAR titles "FOO BAR | Lumina").
 */
export function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The reference's unknown-route title rule (session-8, TITLE-404-1),
 * decoded from 12 live probes on 2026-10-08: the page title is the LAST
 * path segment that contains a letter, humanized; segments without any
 * letter ("42", "12345") are skipped, falling back to earlier segments
 * ("/products/42" -> "Products"). Returns null when NO segment has a
 * letter ("/12345") — the title then stays the plain default "Lumina"
 * (which the caller must render with title.absolute to bypass the
 * "%s | Lumina" template).
 */
export function notFoundPageTitle(segments: string[]): string | null {
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (segment && /[a-zA-Z]/.test(segment)) {
      return humanizeSlug(segment);
    }
  }
  return null;
}

/**
 * A cryptographically random 6-digit numeric code for the email-verification
 * flow (the reference's "one-time-code" input accepts exactly 6 digits).
 * Uniform over [0, 999999] — no modulo bias (randomInt is rejection-sampled).
 */
export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
