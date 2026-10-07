import { describe, expect, it } from "vitest";
import {
  addToCartSchema,
  checkoutSchema,
  loginSchema,
  newsletterSchema,
  registerSchema,
  searchSchema,
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

describe("registerSchema", () => {
  const base = { name: "Jane Doe", email: "jane@example.com", password: "longenough1" };
  it("accepts matching passwords", () => {
    expect(registerSchema.safeParse({ ...base, confirmPassword: "longenough1" }).success).toBe(true);
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
