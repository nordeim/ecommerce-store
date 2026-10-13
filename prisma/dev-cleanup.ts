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
  // Session-57 (ORDER-DETAIL-GEO-1): THE GUARD THIS BLOCK ALWAYS CLAIMED
  // — the e2e-reset twin's SEEDED_ORDER_EVENT_IDS list, ported verbatim,
  // and payment_refunded joining the type list. The unguarded form deleted
  // the SEED'S OWN canonical timeline fixtures (evt-ord1-transit/delivered,
  // evt-ord2-transit/tracking, evt-ord4-cancelled; evt-ord4-refunded
  // survived only because payment_refunded was missing from the type
  // list) — running the documented post-audit hygiene destroyed the very
  // state it exists to restore. Found by the probe-first capture
  // discipline (the r57 capture probes read 1-row timelines on the dev DB
  // while the e2e DB told the 3-row stories); pinned by
  // tests/dev-cleanup-guard.integration.test.ts.
  const SEEDED_ORDER_EVENT_IDS = [
    "evt-ord1-transit",
    "evt-ord1-delivered",
    "evt-ord2-transit",
    "evt-ord2-tracking",
    "evt-ord4-cancelled",
    "evt-ord4-refunded",
  ];
  const demoEvents = await db.orderEvent.deleteMany({
    where: {
      type: { in: ["status_changed", "payment_refunded", "tracking_added"] },
      order: { number: { in: [...CANONICAL_ORDERS] } },
      id: { notIn: SEEDED_ORDER_EVENT_IDS },
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

  // Session-45 (ACCOUNT-VALIDATION-1): live-audit address residue — the
  // capture/battery walk adds addresses and flips the default badge; remove
  // the non-seeded rows and restore the canonical fixture (the e2e-reset
  // guard's dev-DB twin).
  await db.address.deleteMany({ where: { id: { not: "demo-address-main" } } });
  await db.address.update({
    where: { id: "demo-address-main" },
    data: {
      label: "Home",
      fullName: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
      isDefault: true,
    },
  });

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
