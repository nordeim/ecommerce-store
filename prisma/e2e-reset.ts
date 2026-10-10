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

const FIXTURE_EVENT_IDS = [
  "evt_demo_fixture_s",
  "evt_demo_fixture_f",
  "evt_demo_fixture_r",
  "evt_demo_fixture_n",
];

const FIXTURE_STRIPE_EVENTS = [
  {
    eventId: "evt_demo_fixture_s",
    type: "payment_intent.succeeded",
    paymentIntentId: "pi_demo_fixture_003",
    amount: 52497,
    receivedAt: new Date("2026-02-20T18:45:40Z"),
  },
  {
    eventId: "evt_demo_fixture_f",
    type: "payment_intent.payment_failed",
    paymentIntentId: "pi_demo_fixture_004",
    amount: 8999,
    receivedAt: new Date("2026-02-21T09:12:00Z"),
  },
  {
    eventId: "evt_demo_fixture_r",
    type: "charge.refunded",
    paymentIntentId: "pi_demo_fixture_005",
    amount: 7999,
    receivedAt: new Date("2026-02-22T14:03:00Z"),
  },
  {
    // Session-25, PAY-OPS-2a: the refund-needed family's fixture — a
    // succeeded event with NO linked order. Session-30, REASON-TRAIL-1:
    // the row carries the canonical deterministic-failure code (the
    // amount-mismatch story — see prisma/seed.ts).
    eventId: "evt_demo_fixture_n",
    type: "payment_intent.succeeded",
    paymentIntentId: "pi_demo_fixture_006",
    amount: 14900,
    failureReason: "amount-mismatch",
    receivedAt: new Date("2026-02-23T11:27:00Z"),
  },
];

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
  const CANONICAL_ORDERS = ["ORD-2026-001", "ORD-2026-002", "ORD-2026-003", "ORD-2026-004"];
  await db.order.deleteMany({ where: { number: { notIn: CANONICAL_ORDERS } } });
  // Session-35 (CUSTOMER-TIMELINE-1): the delete now PRESERVES the seeded
  // timeline fixtures by deterministic id (the FIXTURE_EVENT_IDS pattern the
  // StripeEvent cleanup below uses) — the combobox spec's per-run
  // status_changed events are wiped while the canonical story (the
  // session-35 seed's fixture chain) survives every reset. payment_refunded
  // joins the guard: the pre-session-35 un-timed refund row on ORD-2026-004
  // is a legacy duplicate of evt-ord4-refunded.
  const SEEDED_ORDER_EVENT_IDS = [
    "evt-ord1-transit",
    "evt-ord1-delivered",
    "evt-ord2-transit",
    "evt-ord4-cancelled",
    "evt-ord4-refunded",
  ];
  await db.orderEvent.deleteMany({
    where: {
      type: { in: ["status_changed", "payment_refunded"] },
      order: { number: { in: CANONICAL_ORDERS } },
      id: { notIn: SEEDED_ORDER_EVENT_IDS },
    },
  });
  await db.order.update({ where: { number: "ORD-2026-001" }, data: { status: "delivered" } });
  await db.order.update({ where: { number: "ORD-2026-002" }, data: { status: "in_transit" } });
  await db.order.update({ where: { number: "ORD-2026-003" }, data: { status: "delivered" } });
  // Session-33 (CUSTOMER-MONEY-1): the refunded fixture's canonical status.
  await db.order.update({ where: { number: "ORD-2026-004" }, data: { status: "cancelled" } });

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

  // Session-24 (PAY-OPS-1) + session-25 (PAY-OPS-2): the payment-ops
  // fixtures — the canonical four-event StripeEvent set (incl. the
  // refund-needed family's instance + the persisted amounts) + the
  // Stripe-paid ORD-2026-003 columns. The unconfigured webhook 400s before
  // any write (the E2E default), so this normally only restores the seed's
  // own fixtures; the guard keeps the surface's state canonical even if a
  // future spec ever records events.
  await db.stripeEvent.deleteMany({ where: { eventId: { notIn: FIXTURE_EVENT_IDS } } });
  for (const e of FIXTURE_STRIPE_EVENTS) {
    await db.stripeEvent.upsert({ where: { eventId: e.eventId }, create: e, update: e });
  }
  await db.order.update({
    where: { number: "ORD-2026-003" },
    data: { stripePaymentIntentId: "pi_demo_fixture_003", paymentStatus: "paid" },
  });
  // Session-33 (CUSTOMER-MONEY-1): the refunded fixture's columns — the
  // same guard shape (a status flip by a spec must never drift the
  // money-state fixture).
  await db.order.update({
    where: { number: "ORD-2026-004" },
    data: { stripePaymentIntentId: "pi_demo_fixture_005", paymentStatus: "refunded" },
  });

  console.log("[e2e-reset] transient state cleared");
}

main()
  .catch((e) => {
    console.error("[e2e-reset] failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
