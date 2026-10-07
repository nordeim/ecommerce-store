import { describe, expect, it } from "vitest";
import {
  addToCartSchema,
  checkoutSchema,
  deriveDisplayName,
  loginSchema,
  newsletterSchema,
  registerSchema,
  searchSchema,
  validateRedirectPath,
} from "./validation";

describe("loginSchema", () => {
  it("normalizes emails to lowercase", () => {
    const r = loginSchema.safeParse({ email: "  JOHN@Example.COM ", password: "x" });
    expect(r.success && r.data.email).toBe("john@example.com");
  });
  it("rejects malformed emails", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});

describe("registerSchema (session-3: reference has no Name field)", () => {
  const base = { email: "jane@example.com", password: "longenough1" };
  it("accepts matching passwords WITHOUT a name (reference form)", () => {
    expect(registerSchema.safeParse({ ...base, confirmPassword: "longenough1" }).success).toBe(true);
  });
  it("still accepts an explicit name (internal/API callers)", () => {
    expect(
      registerSchema.safeParse({ ...base, name: "Jane Doe", confirmPassword: "longenough1" }).success,
    ).toBe(true);
  });
  it("rejects a too-short explicit name", () => {
    expect(
      registerSchema.safeParse({ ...base, name: "J", confirmPassword: "longenough1" }).success,
    ).toBe(false);
  });
  it("rejects mismatched passwords with a field error on confirmPassword", () => {
    const r = registerSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "confirmPassword")).toBe(true);
    }
  });
  it("rejects short passwords", () => {
    expect(registerSchema.safeParse({ ...base, confirmPassword: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "short", confirmPassword: "short" }).success).toBe(false);
  });
});

describe("deriveDisplayName (session-3)", () => {
  it("splits dotted local parts into capitalized words", () => {
    expect(deriveDisplayName("john.doe@example.com")).toBe("John Doe");
  });
  it("splits dashed and underscored local parts", () => {
    expect(deriveDisplayName("e2e-1728@example.com")).toBe("E2e 1728");
    expect(deriveDisplayName("jane_doe@example.com")).toBe("Jane Doe");
  });
  it("capitalizes a single token", () => {
    expect(deriveDisplayName("admin@example.com")).toBe("Admin");
  });
  it("falls back to Customer for empty local parts", () => {
    expect(deriveDisplayName("@example.com")).toBe("Customer");
  });
  it("clamps to 80 characters", () => {
    const long = "a".repeat(100);
    expect(deriveDisplayName(`${long}@example.com`).length).toBeLessThanOrEqual(80);
  });
});

describe("addToCartSchema", () => {
  it("clamps into the 1..99 range", () => {
    expect(addToCartSchema.safeParse({ productId: "p1", quantity: 1 }).success).toBe(true);
    expect(addToCartSchema.safeParse({ productId: "p1", quantity: 99 }).success).toBe(true);
    expect(addToCartSchema.safeParse({ productId: "p1", quantity: 0 }).success).toBe(false);
    expect(addToCartSchema.safeParse({ productId: "p1", quantity: 100 }).success).toBe(false);
    expect(addToCartSchema.safeParse({ productId: "p1", quantity: 1.5 }).success).toBe(false);
  });
  it("defaults the quantity to 1", () => {
    const r = addToCartSchema.safeParse({ productId: "p1" });
    expect(r.success && r.data.quantity).toBe(1);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zip: "10001",
    paymentMethod: "card",
    cardNumber: "4242 4242 4242 4242",
    cardExpiry: "12/28",
    cardCvc: "123",
  };
  it("accepts a complete card checkout", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });
  it("accepts PayPal without card fields", () => {
    const r = checkoutSchema.safeParse({ ...valid, paymentMethod: "paypal", cardNumber: "", cardExpiry: "", cardCvc: "" });
    expect(r.success).toBe(true);
  });
  it("rejects bad ZIP codes", () => {
    expect(checkoutSchema.safeParse({ ...valid, zip: "ABCDE" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, zip: "1000" }).success).toBe(false);
  });
  it("rejects unknown payment methods", () => {
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: "crypto" }).success).toBe(false);
  });
});

describe("newsletterSchema / searchSchema", () => {
  it("validates newsletter emails", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
  it("bounds the search query and limit", () => {
    expect(searchSchema.safeParse({ q: "x", limit: 6 }).success).toBe(true);
    expect(searchSchema.safeParse({ q: "", limit: 6 }).success).toBe(false);
    expect(searchSchema.safeParse({ q: "x", limit: 11 }).success).toBe(false);
  });
});

// Redirect-after-login (session-6, REDIRECT-1): /account and /admin send
// guests to /login?redirect=<their path>; the login form may only send the
// user back to a SAME-ORIGIN relative path — everything else (open-redirect
// payloads, protocol-relative URLs, backslash tricks, oversized strings)
// must fall through to null so the caller uses its safe default.
describe("validateRedirectPath (session-6)", () => {
  it("accepts same-origin relative paths", () => {
    expect(validateRedirectPath("/account")).toBe("/account");
    expect(validateRedirectPath("/admin")).toBe("/admin");
    expect(validateRedirectPath("/shop?category=electronics")).toBe("/shop?category=electronics");
    expect(validateRedirectPath("/product/wireless-headphones")).toBe("/product/wireless-headphones");
  });

  it("rejects protocol-relative and backslash payloads", () => {
    expect(validateRedirectPath("//evil.com")).toBeNull();
    expect(validateRedirectPath("/\\evil.com")).toBeNull();
    expect(validateRedirectPath("\\/evil.com")).toBeNull();
  });

  it("rejects absolute URLs and scheme-bearing strings", () => {
    expect(validateRedirectPath("https://evil.com")).toBeNull();
    expect(validateRedirectPath("http://localhost:3000/account")).toBeNull();
    expect(validateRedirectPath("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty, missing, and non-path input", () => {
    expect(validateRedirectPath("")).toBeNull();
    expect(validateRedirectPath(undefined)).toBeNull();
    expect(validateRedirectPath("account")).toBeNull();
    expect(validateRedirectPath("/")).toBeNull(); // no bare root — use the default
  });

  it("rejects oversized values", () => {
    expect(validateRedirectPath("/shop?x=" + "a".repeat(600))).toBeNull();
  });
});
