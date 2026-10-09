import { createHmac } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { shippingForSubtotal } from "@/lib/money";
import type { NextRequest } from "next/server";

/**
 * PAY-STRIPE-2 (session-23) — the webhook backstop INTEGRATION gate.
 *
 * Drives the REAL route handler (`POST /api/stripe/webhook`) with REAL
 * HMAC-signed event bodies against a scratch SQLite database — no network,
 * no Stripe keys. The signature is computed exactly as Stripe computes it
 * (`t=<unix>,v1=HMAC_SHA256(secret, "t.body")` — `constructEvent` is a
 * local HMAC check; the SDK client constructs offline), so the full path
 * runs: signature verification → structural parse → classification →
 * dedup → backstop placement (metadata rebuild → cart reload → re-price →
 * verification → the transactional placement).
 *
 * The contract pinned here (docs/remediation-plan-session23.md):
 * - The H4d/L9 rule (the reference skill's hard-won lesson, transplanted):
 *   the StripeEvent dedup row commits IN THE SAME TRANSACTION as the
 *   placement. A TRANSIENT placement failure rolls the event row back and
 *   answers 500 — Stripe retries, and the retry re-attempts the full
 *   placement (the recovery the backstop exists for). A DETERMINISTIC
 *   failure (amount mismatch, stock-short) records the event and answers
 *   200 + the ops refund trail (a retry could never succeed).
 * - Duplicate delivery → 200 duplicate no-op (never double-place).
 * - Client-path precedence: an order already holding the intent id wins.
 *
 * Scratch-DB isolation: `DATABASE_URL` is set to an ABSOLUTE `file:` URL
 * (passes through db-path untouched) pointing at `db/webhook-test.db`
 * (git-ignored), the stale file is removed at load, and the schema is
 * pushed in `beforeAll`. Fixtures are created per-test with fresh ids —
 * no cross-test state, no dev-DB pollution.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url)); // <repo>/tests
const REPO_ROOT = path.resolve(HERE, "..");
const SCRATCH_DB = path.join(REPO_ROOT, "db", "webhook-test.db");
const WEBHOOK_SECRET = "whsc_integration_fixture";

// BEFORE any module that reads env loads (db.ts resolves + OVERWRITES
// DATABASE_URL at import; the stripe module reads the keys lazily but the
// route + db modules must see these from their first evaluation).
process.env.DATABASE_URL = `file:${SCRATCH_DB}`;
process.env.STRIPE_SECRET_KEY = "sk_test_integration_fixture";
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
if (existsSync(SCRATCH_DB)) rmSync(SCRATCH_DB);
if (existsSync(`${SCRATCH_DB}-journal`)) rmSync(`${SCRATCH_DB}-journal`);

// Dynamically imported after the env contract above is in place.
let POST: typeof import("@/app/api/stripe/webhook/route")["POST"];
let makeRequest: (body: string, headers: Record<string, string>) => NextRequest;
let db: typeof import("@/lib/db")["db"];

const SHIPPING = {
  firstName: "Web",
  lastName: "Hook",
  email: "buyer@example.test",
  address: "123 Integration Way",
  city: "Testville",
  state: "TX",
  zip: "78701",
};

/** A fixture cart with two products: subtotal 6997c + shipping = total. */
type Fixture = { cartId: string; productIds: [string, string]; subtotal: number; total: number };

async function seedFixture(suffix: string, stock = 10): Promise<Fixture> {
  const cat = await db.category.create({
    data: { id: `cat_wh_${suffix}`, slug: `wh-${suffix}`, name: `WH ${suffix}`, icon: "star" },
  });
  const p1 = await db.product.create({
    data: {
      id: `prod_wh_a_${suffix}`,
      slug: `wh-widget-a-${suffix}`,
      name: "Webhook Widget A",
      description: "fixture",
      categoryId: cat.id,
      price: 2999,
      image: "https://example.com/a.png",
      stock,
    },
  });
  const p2 = await db.product.create({
    data: {
      id: `prod_wh_b_${suffix}`,
      slug: `wh-widget-b-${suffix}`,
      name: "Webhook Widget B",
      description: "fixture",
      categoryId: cat.id,
      price: 1999,
      image: "https://example.com/b.png",
      stock,
    },
  });
  const cart = await db.cart.create({
    data: { id: `cart_wh_${suffix}`, token: `tok_wh_${suffix}` },
  });
  await db.cartItem.create({
    data: { cartId: cart.id, productId: p1.id, quantity: 1 },
  });
  await db.cartItem.create({
    data: { cartId: cart.id, productId: p2.id, quantity: 2 },
  });
  const subtotal = 2999 * 1 + 1999 * 2; // 6997
  return { cartId: cart.id, productIds: [p1.id, p2.id], subtotal, total: subtotal + shippingForSubtotal(subtotal) };
}

function succeededEvent(args: { evtId: string; intentId: string; amount: number; cartId: string }) {
  return {
    id: args.evtId,
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: args.intentId,
        object: "payment_intent",
        status: "succeeded",
        amount: args.amount,
        currency: "usd",
        metadata: {
          cartId: args.cartId,
          userId: "",
          email: SHIPPING.email,
          shipping: JSON.stringify(SHIPPING),
        },
      },
    },
  };
}

/** Stripe's signature scheme: t=<unix>,v1=HMAC_SHA256(secret, "t.body"). */
function sign(body: string): string {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${body}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

function post(body: string, signature?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature) headers["stripe-signature"] = signature;
  return POST(makeRequest(body, headers));
}

function postEvent(event: unknown) {
  const body = JSON.stringify(event);
  return post(body, sign(body));
}

/**
 * Fault injection at the REAL transaction's order.write seam (T7/T11):
 * wraps `db.$transaction` ONCE so the route's callback receives a proxy tx
 * whose `order.create` rejects with `cause`. Everything else (the event
 * insert, the stock re-check, the rollback semantics) runs against the
 * REAL transaction — the rollback proof is real, not simulated.
 */
async function injectTxOrderCreateFailure(cause: unknown, run: () => Promise<Response>) {
  const real = (db.$transaction as (cb: (tx: any) => unknown, opts?: unknown) => Promise<unknown>).bind(
    db,
  );
  const spy = vi.spyOn(db, "$transaction").mockImplementationOnce(async (cb: any, opts?: any) => {
    return real(async (tx: any) => {
      const proxied = new Proxy(tx, {
        get(target: any, prop) {
          if (prop === "order") {
            return new Proxy(target.order, {
              get(t: any, p) {
                if (p === "create") return () => Promise.reject(cause);
                const v = t[p];
                return typeof v === "function" ? v.bind(t) : v;
              },
            });
          }
          const v = target[prop];
          return typeof v === "function" ? v.bind(target) : v;
        },
      });
      return cb(proxied);
    }, opts);
  });
  try {
    return await run();
  } finally {
    spy.mockRestore();
  }
}

beforeAll(async () => {
  execSync(`${path.join(REPO_ROOT, "node_modules", ".bin", "prisma")} db push --skip-generate --accept-data-loss`, {
    cwd: REPO_ROOT,
    env: { ...process.env, DATABASE_URL: `file:${SCRATCH_DB}` },
    stdio: "pipe",
  });
  const route = await import("@/app/api/stripe/webhook/route");
  POST = route.POST;
  const { NextRequest: NR } = await import("next/server");
  makeRequest = (body, headers) =>
    new NR("http://localhost/api/stripe/webhook", { method: "POST", body, headers });
  const dbMod = await import("@/lib/db");
  db = dbMod.db;
});

afterAll(async () => {
  if (db) await db.$disconnect();
});

describe("stripe webhook backstop (integration, PAY-STRIPE-2)", () => {
  test("a valid signed succeeded event places the orphaned payment (the backstop)", async () => {
    const fx = await seedFixture("t1");
    const res = await postEvent(
      succeededEvent({ evtId: "evt_t1", intentId: "pi_t1", amount: fx.total, cartId: fx.cartId }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(typeof json.order).toBe("string");

    const order = await db.order.findUnique({
      where: { stripePaymentIntentId: "pi_t1" },
      include: { items: true, events: true },
    });
    expect(order).not.toBeNull();
    expect(order!.paymentStatus).toBe("paid");
    expect(order!.paymentMethod).toBe("card");
    expect(order!.status).toBe("processing");
    expect(order!.total).toBe(fx.total);
    expect(order!.email).toBe(SHIPPING.email);
    expect(order!.items).toHaveLength(2);
    // Stock decremented with the placement (STOCK-1 contract).
    const s1 = await db.product.findUnique({ where: { id: fx.productIds[0] }, select: { stock: true } });
    const s2 = await db.product.findUnique({ where: { id: fx.productIds[1] }, select: { stock: true } });
    expect(s1!.stock).toBe(9);
    expect(s2!.stock).toBe(8);
    // The cart is cleared.
    const items = await db.cartItem.findMany({ where: { cartId: fx.cartId } });
    expect(items).toHaveLength(0);
    // The dedup row is committed WITH the placement (the H4d/L9 rule).
    const evt = await db.stripeEvent.findUnique({ where: { eventId: "evt_t1" } });
    expect(evt).not.toBeNull();
  });

  test("a duplicate delivery of the same event is a 200 no-op (never double-place)", async () => {
    const fx = await seedFixture("t2");
    const event = succeededEvent({ evtId: "evt_t2", intentId: "pi_t2", amount: fx.total, cartId: fx.cartId });
    const first = await postEvent(event);
    expect(first.status).toBe(200);
    const before = await db.order.count();

    const second = await postEvent(event);
    expect(second.status).toBe(200);
    const json = await second.json();
    expect(json.duplicate).toBe(true);
    expect(await db.order.count()).toBe(before);
  });

  test("the client path wins: an order already holding the intent id is returned, no new order", async () => {
    const fx = await seedFixture("t3");
    await db.order.create({
      data: {
        number: "ORD-INT-777",
        email: SHIPPING.email,
        status: "processing",
        subtotal: fx.subtotal,
        shipping: fx.total - fx.subtotal,
        total: fx.total,
        shippingAddress: "{}",
        paymentMethod: "card",
        stripePaymentIntentId: "pi_t3",
        paymentStatus: "paid",
      },
    });
    const res = await postEvent(
      succeededEvent({ evtId: "evt_t3", intentId: "pi_t3", amount: fx.total, cartId: fx.cartId }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.order).toBe("ORD-INT-777");
    // No second order; the event is still recorded (the delivery happened).
    expect(await db.order.count({ where: { stripePaymentIntentId: "pi_t3" } })).toBe(1);
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t3" } })).not.toBeNull();
  });

  test("an amount mismatch is a permanent outcome: 200, NO order, the event recorded (refund trail)", async () => {
    const fx = await seedFixture("t4");
    const res = await postEvent(
      succeededEvent({ evtId: "evt_t4", intentId: "pi_t4", amount: fx.total + 100, cartId: fx.cartId }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.order).toBeUndefined();
    expect(await db.order.findUnique({ where: { stripePaymentIntentId: "pi_t4" } })).toBeNull();
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t4" } })).not.toBeNull();
  });

  test("a missing stripe-signature header is a 400 with safe copy", async () => {
    const res = await post(JSON.stringify({ id: "evt_x", type: "x", data: { object: { id: "pi_x" } } }));
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).not.toMatch(/whsec_|sk_test|STRIPE_SECRET/i);
  });

  test("an invalid signature (wrong HMAC) is a 400", async () => {
    const body = JSON.stringify({ id: "evt_x", type: "x", data: { object: { id: "pi_x" } } });
    const res = await post(body, "t=123,v1=deadbeef");
    expect(res.status).toBe(400);
  });

  test("THE H4d PROOF: a transient placement failure rolls the event row back, answers 500, and the retry places the order", async () => {
    const fx = await seedFixture("t7");
    const event = succeededEvent({ evtId: "evt_t7", intentId: "pi_t7", amount: fx.total, cartId: fx.cartId });

    // Inject a TRANSIENT failure at the order write (the ECONNRESET class —
    // any non-deterministic TX failure). The proxy wraps the REAL tx: the
    // event insert runs, the failure rolls the whole transaction back.
    const first = await injectTxOrderCreateFailure(new Error("ECONNRESET (injected)"), () => postEvent(event));
    expect(first.status).toBe(500);
    // The dedup row rolled back WITH the transaction — the retry is NOT
    // swallowed (this is the exact session-22 defect: the pre-committed
    // row + a 200 made the captured payment unplaceable).
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t7" } })).toBeNull();
    expect(await db.order.findUnique({ where: { stripePaymentIntentId: "pi_t7" } })).toBeNull();

    // Stripe's retry (same event, same id): the full placement re-attempts
    // and SUCCEEDS — the recovery the backstop exists for.
    const second = await postEvent(event);
    expect(second.status).toBe(200);
    const json = await second.json();
    expect(typeof json.order).toBe("string");
    const order = await db.order.findUnique({ where: { stripePaymentIntentId: "pi_t7" } });
    expect(order).not.toBeNull();
    expect(order!.paymentStatus).toBe("paid");
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t7" } })).not.toBeNull();
  });

  test("stock-short is a permanent outcome: 200, NO order, the event recorded (refund trail)", async () => {
    // Stock 1 < quantity 2 on product B — unfulfillable at decision time.
    const fx = await seedFixture("t8", 1);
    const res = await postEvent(
      succeededEvent({ evtId: "evt_t8", intentId: "pi_t8", amount: fx.total, cartId: fx.cartId }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.order).toBeUndefined();
    expect(await db.order.findUnique({ where: { stripePaymentIntentId: "pi_t8" } })).toBeNull();
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t8" } })).not.toBeNull();
    // Stock was NOT decremented (no placement).
    const s2 = await db.product.findUnique({ where: { id: fx.productIds[1] }, select: { stock: true } });
    expect(s2!.stock).toBe(1);
  });

  test("payment_intent.payment_failed: recorded + 200, no placement attempted", async () => {
    const res = await postEvent({
      id: "evt_t9",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_t9", status: "requires_payment_method" } },
    });
    expect(res.status).toBe(200);
    expect(await db.order.findUnique({ where: { stripePaymentIntentId: "pi_t9" } })).toBeNull();
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t9" } })).not.toBeNull();
  });

  test("an unrelated event type is recorded + 200 ignored", async () => {
    const res = await postEvent({
      id: "evt_t10",
      type: "charge.refunded",
      data: { object: { id: "ch_t10", status: "succeeded" } },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ignored).toBe(true);
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t10" } })).not.toBeNull();
  });

  test("a P2002 on the order NUMBER classifies transient: 500 + the event row rolled back (the retry re-attempts with a fresh number)", async () => {
    const fx = await seedFixture("t11");
    const event = succeededEvent({ evtId: "evt_t11", intentId: "pi_t11", amount: fx.total, cartId: fx.cartId });
    // The number-race shape: two concurrent placements minted the same
    // ORD-YYYY-NNN; the unique constraint fires on `number` (NOT on the
    // intent anchor). The failure is transient — a retry computes a fresh
    // count and places.
    const fake = Object.assign(new Error("Unique constraint failed on the fields: (`number`)"), {
      code: "P2002",
      meta: { target: ["number"] },
    });
    const res = await injectTxOrderCreateFailure(fake, () => postEvent(event));
    expect(res.status).toBe(500);
    expect(await db.stripeEvent.findUnique({ where: { eventId: "evt_t11" } })).toBeNull();
    expect(await db.order.findUnique({ where: { stripePaymentIntentId: "pi_t11" } })).toBeNull();

    // The retry (Stripe re-delivers the same event after the 500):
    const retry = await postEvent(event);
    expect(retry.status).toBe(200);
    const order = await db.order.findUnique({ where: { stripePaymentIntentId: "pi_t11" } });
    expect(order).not.toBeNull();
    expect(order!.paymentStatus).toBe("paid");
  });

  // session-25, PAY-OPS-2b: the recorded rows carry the event AMOUNT — the
  // operator reading the payments surface sees the magnitude beside the
  // outcome ("how much needs refunding?"), not just the signal.
  test("the recorded event rows persist the payload amount (PAY-OPS-2b)", async () => {
    const failedRes = await postEvent({
      id: "evt_t12",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_t12", status: "requires_payment_method", amount: 8999, currency: "usd" } },
    });
    expect(failedRes.status).toBe(200);
    const failedRow = await db.stripeEvent.findUnique({ where: { eventId: "evt_t12" } });
    expect(failedRow).not.toBeNull();
    expect(failedRow!.amount).toBe(8999);

    // The backstop placement path: the in-tx insert records the captured amount.
    const fx = await seedFixture("t13");
    const res = await postEvent(
      succeededEvent({ evtId: "evt_t13", intentId: "pi_t13", amount: fx.total, cartId: fx.cartId }),
    );
    expect(res.status).toBe(200);
    const placedRow = await db.stripeEvent.findUnique({ where: { eventId: "evt_t13" } });
    expect(placedRow).not.toBeNull();
    expect(placedRow!.amount).toBe(fx.total);
  });

  // session-25, PAY-OPS-2c: a charge-family event records the REAL intent id
  // (the payload's payment_intent), not the charge id — the payments surface's
  // q-search over the intent column stays honest for the charge family.
  test("a charge-family event records the payload's payment_intent, not the charge id (PAY-OPS-2c)", async () => {
    const res = await postEvent({
      id: "evt_t14",
      type: "charge.refunded",
      data: { object: { id: "ch_t14", payment_intent: "pi_t14", amount: 7999, currency: "usd" } },
    });
    expect(res.status).toBe(200);
    const row = await db.stripeEvent.findUnique({ where: { eventId: "evt_t14" } });
    expect(row).not.toBeNull();
    expect(row!.paymentIntentId).toBe("pi_t14");
    expect(row!.amount).toBe(7999);

    // The fallback shape (no payment_intent on the object) keeps the object id.
    const fallback = await postEvent({
      id: "evt_t15",
      type: "charge.dispute.created",
      data: { object: { id: "dp_t15", amount: 1499, currency: "usd" } },
    });
    expect(fallback.status).toBe(200);
    const fallbackRow = await db.stripeEvent.findUnique({ where: { eventId: "evt_t15" } });
    expect(fallbackRow).not.toBeNull();
    expect(fallbackRow!.paymentIntentId).toBe("dp_t15");
  });
});
