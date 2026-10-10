/**
 * Dev-DB hygiene: returns the DEV database (db/custom.db) to the canonical
 * seeded state after live-audit/manual testing — removes stray orders the
 * seed doesn't own (live-placed test orders), test newsletter subscribers,
 * and demo-user cart/wishlist residue. Complements `prisma/e2e-reset.ts`
 * (which resets the E2E DB but deliberately KEEPS seeded demo orders).
 *
 * Uses targeted deletes — NOT `prisma migrate reset`, which would recreate
 * the DB file and break the sandbox hard-link contract (see AGENTS.md
 * "Environment shadowing").
 *
 * If the seed's demo-order set ever changes, update CANONICAL_ORDERS.
 *
 * Usage: bun prisma/dev-cleanup.ts
 */
import { PrismaClient } from "@prisma/client";
import { resolveProcessDatabaseUrl } from "../src/lib/db-path";

const db = new PrismaClient({
  datasources: { db: { url: resolveProcessDatabaseUrl() } },
});

/** Order numbers owned by prisma/seed.ts (the demo fixtures). */
const CANONICAL_ORDERS = new Set(["ORD-2026-001", "ORD-2026-002", "ORD-2026-003", "ORD-2026-004"]);
/** Throwaway subscribers created by manual testing (the seed's stay). */
const TEST_SUBSCRIBERS = ["newsletter-test@example.com"];

async function main() {
  const allOrders = await db.order.findMany({ select: { id: true, number: true } });
  const strayIds = allOrders.filter((o) => !CANONICAL_ORDERS.has(o.number)).map((o) => o.id);
  if (strayIds.length > 0) {
    await db.orderEvent.deleteMany({ where: { orderId: { in: strayIds } } });
    await db.orderItem.deleteMany({ where: { orderId: { in: strayIds } } });
    await db.order.deleteMany({ where: { id: { in: strayIds } } });
  }

  // Session-6 (STOCK-1): placements now DECREMENT stock — restore the
  // canonical 25 so post-audit dev state matches the seed.
  const stockReset = await db.product.updateMany({ where: { stock: { not: 25 } }, data: { stock: 25 } });

  // Session-7 (ADMIN-COV-2/ADMIN-DETAIL-1): live-verification status
  // transitions leave status_changed events on the demo orders (the admin
  // order-detail timeline renders every event). Restore the canonical
  // statuses + timelines so post-audit dev state matches the seed.
  // Session-36 (ORDER-TRACKING-1): tracking_added joins the wiped types
  // (live-verification tracking writes leave the same residue) and the
  // tracking columns restore with the statuses (the e2e-reset guard's
  // dev-DB twin).
  const demoEvents = await db.orderEvent.deleteMany({
    where: {
      type: { in: ["status_changed", "tracking_added"] },
      order: { number: { in: [...CANONICAL_ORDERS] } },
    },
  });
  await db.order.update({ where: { number: "ORD-2026-001" }, data: { status: "delivered" } });
  await db.order.update({
    where: { number: "ORD-2026-002" },
    data: { status: "in_transit", carrier: "UPS", trackingNumber: "1Z999AA10123456784" },
  });
  await db.order.update({
    where: { number: "ORD-2026-003" },
    data: { status: "delivered", carrier: null, trackingNumber: null },
  });
  // Session-33 (CUSTOMER-MONEY-1): the refunded fixture's canonical status +
  // money columns (the e2e-reset guard's dev-DB twin).
  await db.order.update({
    where: { number: "ORD-2026-004" },
    data: { status: "cancelled", stripePaymentIntentId: "pi_demo_fixture_005", paymentStatus: "refunded" },
  });

  await db.newsletterSubscriber.deleteMany({ where: { email: { in: TEST_SUBSCRIBERS } } });

  // Wishlist + cart residue on every user (the seed starts both empty; the
  // reference's wishlist is cosmetic — see AGENTS.md divergence register).
  await db.wishlistItem.deleteMany({});
  await db.cartItem.deleteMany({});
  // Guest carts minted by anonymous browser sessions.
  await db.cart.deleteMany({ where: { userId: null } });

  const [orders, wish, subs] = await Promise.all([
    db.order.findMany({ select: { number: true }, orderBy: { number: "asc" } }),
    db.wishlistItem.count(),
    db.newsletterSubscriber.count(),
  ]);
  console.log(`[dev-cleanup] removed ${strayIds.length} stray order(s)`);
  console.log(`[dev-cleanup] reset ${stockReset.count} product stock value(s) to 25`);
  console.log(`[dev-cleanup] removed ${demoEvents.count} demo-order status_changed event(s)`);
  console.log(`[dev-cleanup] orders: ${orders.map((o) => o.number).join(", ")}`);
  console.log(`[dev-cleanup] wishlist items: ${wish}, newsletter: ${subs}`);
}

main()
  .catch((e) => {
    console.error("[dev-cleanup]", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
