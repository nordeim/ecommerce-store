/**
 * Zod schemas — the single validation dialect for every mutation boundary
 * (server actions, newsletter route, search typeahead).
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Session-3 parity: the reference register form has NO name field. The name
// stays optional here so internal callers can still pass one; the register
// ACTION derives a display name from the email local part when absent.
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long").max(128),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const passwordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

/** Session-4 (AUTH-VERIFY-1): the 6-digit one-time code form. */
export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/**
 * Derives a human display name from an email's local part
 * ("john.doe@x.com" -> "John Doe", "e2e-42@x.com" -> "E2e 42").
 * Used at registration because the reference form collects no name.
 */
export function deriveDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local
    .split(/[._+-]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "Customer";
  const name = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
    .slice(0, 80)
    .trim();
  return name.length >= 2 ? name : "Customer";
}

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

/** Session-4 (CART-RACE-1): steppers post signed deltas, not absolutes. */
export const cartItemDeltaSchema = z.object({
  itemId: z.string().min(1),
  delta: z.number().int().min(-99).max(99).refine((d) => d !== 0, "Delta must be non-zero"),
});

export const cartItemSchema = z.object({
  itemId: z.string().min(1),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal("")),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  street: z.string().trim().min(3, "Street address is required").max(120),
  city: z.string().trim().min(2, "City is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  country: z.string().trim().min(2).max(60).default("United States"),
  isDefault: z.boolean().default(false),
});

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  address: z.string().trim().min(3, "Address is required").max(120),
  city: z.string().trim().min(2, "City is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  paymentMethod: z.enum(["card", "paypal"]),
  cardNumber: z.string().trim().optional().or(z.literal("")),
  cardExpiry: z.string().trim().optional().or(z.literal("")),
  cardCvc: z.string().trim().optional().or(z.literal("")),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.number().int().min(1).max(10).default(6),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
