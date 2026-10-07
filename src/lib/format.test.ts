import { describe, expect, it } from "vitest";

import { generateVerificationCode, humanizeSlug, notFoundPageTitle } from "./format";

// humanizeSlug (session-4, TITLE-2): the reference's PDP document.title is
// the slug with dashes title-cased ("wireless-headphones" -> "Wireless
// Headphones"), NOT the product name — measured live across all 11 catalog
// slugs on 2026-10-07.

describe("humanizeSlug", () => {
  it("title-cases dash-separated words", () => {
    expect(humanizeSlug("wireless-headphones")).toBe("Wireless Headphones");
    expect(humanizeSlug("yoga-mat")).toBe("Yoga Mat");
    expect(humanizeSlug("vitamin-c-serum")).toBe("Vitamin C Serum");
  });

  it("handles the full seeded catalog (all 11 reference titles)", () => {
    expect(humanizeSlug("leather-watch")).toBe("Leather Watch");
    expect(humanizeSlug("running-shoes")).toBe("Running Shoes");
    expect(humanizeSlug("smart-speaker")).toBe("Smart Speaker");
    expect(humanizeSlug("charging-pad")).toBe("Charging Pad");
    expect(humanizeSlug("ceramic-planter")).toBe("Ceramic Planter");
    expect(humanizeSlug("linen-blanket")).toBe("Linen Blanket");
    expect(humanizeSlug("titanium-sunglasses")).toBe("Titanium Sunglasses");
    expect(humanizeSlug("silk-pajama")).toBe("Silk Pajama");
  });

  it("survives edge shapes without throwing", () => {
    expect(humanizeSlug("")).toBe("");
    expect(humanizeSlug("single")).toBe("Single");
    expect(humanizeSlug("trailing-")).toBe("Trailing");
  });

  // Session-8 (TITLE-404-1): the reference's SPA humanizes underscore
  // separators the same as dashes and preserves case otherwise (measured
  // live: /FOO_BAR titles "FOO BAR | Lumina"; /foo123 titles "Foo123").
  it("splits underscores like dashes and preserves non-leading case (session-8)", () => {
    expect(humanizeSlug("FOO_BAR")).toBe("FOO BAR");
    expect(humanizeSlug("some_page")).toBe("Some Page");
    expect(humanizeSlug("foo123")).toBe("Foo123");
  });

  it("leaves digit-leading words untouched (session-8)", () => {
    expect(humanizeSlug("123abc")).toBe("123abc");
    expect(humanizeSlug("42")).toBe("42");
  });
});

// notFoundPageTitle (session-8, TITLE-404-1): the reference titles unknown
// routes from the LAST path segment containing a letter, humanized; null
// when no segment has letters (the title stays the plain "Lumina" default).
// Rule decoded from 12 live probes on the reference, 2026-10-08.

describe("notFoundPageTitle", () => {
  it("humanizes the last letter-bearing segment", () => {
    expect(notFoundPageTitle(["nonexistent-route-xyz"])).toBe("Nonexistent Route Xyz");
    expect(notFoundPageTitle(["foo", "bar-baz"])).toBe("Bar Baz");
    expect(notFoundPageTitle(["a", "b", "c", "d"])).toBe("D");
  });

  it("falls back to earlier segments when later ones are numeric", () => {
    expect(notFoundPageTitle(["products", "42"])).toBe("Products");
    expect(notFoundPageTitle(["foo123", "456"])).toBe("Foo123");
  });

  it("returns null when no segment contains a letter", () => {
    expect(notFoundPageTitle(["12345"])).toBeNull();
    expect(notFoundPageTitle(["1", "23", "456"])).toBeNull();
  });

  it("handles empty input defensively", () => {
    expect(notFoundPageTitle([])).toBeNull();
  });
});

// generateVerificationCode (session-4, AUTH-VERIFY-1): 6-digit numeric codes
// for the email-verification flow ("one-time-code" input on the reference).

describe("generateVerificationCode", () => {
  it("produces exactly 6 digits", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateVerificationCode()).toMatch(/^\d{6}$/);
    }
  });

  it("is randomized across calls (crypto-backed)", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateVerificationCode()));
    // 50 draws over 10^6 codes: collision chance is tiny; require > 45 unique.
    expect(codes.size).toBeGreaterThan(45);
  });
});
