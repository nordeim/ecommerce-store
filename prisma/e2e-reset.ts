import { PrismaClient } from "@prisma/client";

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

  console.log("[e2e-reset] transient state cleared");
}

main()
  .catch((e) => {
    console.error("[e2e-reset] failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
