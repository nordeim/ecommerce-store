import { PrismaClient } from "@prisma/client";
import { scryptHash } from "../src/lib/password";

/**
 * Resets transient commerce state so every E2E run starts identical:
 * carts, wishlists, run-generated users/addresses, and the demo profile
 * fields the account specs edit. Seeded catalog + demo orders are kept
 * (the seed itself is idempotent and skips existing orders).
 */
const db = new PrismaClient();

async function main() {
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.wishlist.deleteMany();

  // Spec-generated users (auth specs register throwaway accounts).
  await db.user.deleteMany({
    where: { OR: [{ email: { startsWith: "e2e-" } }, { email: { startsWith: "logout-" } }, { email: { startsWith: "mismatch-" } }] },
  });

  // Spec-generated addresses (keep the seeded demo default).
  await db.address.deleteMany({ where: { id: { not: "demo-address-main" } } });

  // The account spec edits the demo phone; restore the reference value.
  await db.user.update({
    where: { email: "john@example.com" },
    data: { phone: "+1 (555) 123-4567", firstName: "John", lastName: "Doe", name: "John Doe" },
  });

  // Session-4 (AUTH-VERIFY-1): the verify-email spec CONSUMES the fixture's
  // code (flips emailVerified) — restore its unverified state + the
  // deterministic code so every run can drive the happy path.
  await db.user.update({
    where: { email: "unverified@example.com" },
    data: {
      emailVerified: false,
      verificationHash: scryptHash("123456"),
      verificationExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      verificationAttempts: 0,
    },
  });

  console.log("[e2e-reset] transient state cleared");
}

main()
  .catch((e) => {
    console.error("[e2e-reset] failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
