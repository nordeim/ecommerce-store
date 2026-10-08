import { PrismaClient } from "@prisma/client";
import { scryptHash } from "../src/lib/password";
import { hashResetToken } from "../src/lib/reset-token";

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

  // Session-7 (ADMIN-COV-2): spec-placed orders accumulate across runs (the
  // e2e DB file persists between runs) — they push the demo fixtures out of
  // take-limited lists (the admin dashboard's take:5 Recent Orders) and pile
  // status_changed events onto the demo timelines (the admin order-detail
  // page renders every event). Delete anything outside the seed's canonical
  // set and restore the demo statuses/timelines so each run starts identical.
  const CANONICAL_ORDERS = ["ORD-2026-001", "ORD-2026-002", "ORD-2026-003"];
  await db.order.deleteMany({ where: { number: { notIn: CANONICAL_ORDERS } } });
  await db.orderEvent.deleteMany({
    where: { type: "status_changed", order: { number: { in: CANONICAL_ORDERS } } },
  });
  await db.order.update({ where: { number: "ORD-2026-001" }, data: { status: "delivered" } });
  await db.order.update({ where: { number: "ORD-2026-002" }, data: { status: "in_transit" } });
  await db.order.update({ where: { number: "ORD-2026-003" }, data: { status: "delivered" } });

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

  // Session-20 (RESET-ROUTE-1): the reset spec CONSUMES the fixture's token
  // (the action deletes the row on success) and rotates the fixture user's
  // password — restore both so every run can drive the happy path.
  await db.user.update({
    where: { email: "resetuser@example.com" },
    data: { passwordHash: scryptHash("Reset1234!") },
  });
  await db.passwordResetToken.deleteMany({ where: {} });
  await db.passwordResetToken.create({
    data: {
      tokenHash: hashResetToken("reset-fixture-token"),
      userId: (
        await db.user.findUnique({
          where: { email: "resetuser@example.com" },
          select: { id: true },
        })
      )!.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
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
