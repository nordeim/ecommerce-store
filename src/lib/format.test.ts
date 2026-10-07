import { describe, expect, it } from "vitest";

import { generateVerificationCode, humanizeSlug } from "./format";

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
