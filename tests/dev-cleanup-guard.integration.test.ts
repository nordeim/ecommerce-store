import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, expect, test } from "vitest";

/**
 * ORDER-DETAIL-GEO-1 (session-57) — the dev-cleanup fixture-guard
 * INTEGRATION test. THE ROUND'S HONEST RED.
 *
 * The probe-first capture discipline caught it: the r57 capture probes
 * read 1-row timelines on the DEV DB while the E2E DB told the 3-row
 * stories — the dev DB's OrderEvent table was missing the seed's five
 * fixture rows (evt-ord1-transit/delivered, evt-ord2-transit/tracking,
 * evt-ord4-cancelled; evt-ord4-refunded survived only because
 * payment_refunded was missing from the type list). Root cause: the r56
 * round's documented post-audit hygiene (`bun prisma/dev-cleanup.ts`,
 * run after the r56c probe's cart residue) — the script's Session-7
 * block deletes status_changed/tracking_added events on the canonical
 * orders WITHOUT the fixture-id guard its own comment claims ("the
 * e2e-reset guard's dev-DB twin" — the twin's SEEDED_ORDER_EVENT_IDS
 * notIn guard was never ported, and payment_refunded never joined the
 * type list). The comment's intent — "restore the canonical timelines
 * so post-audit dev state matches the seed" — is exactly what the
 * implementation betrays.
 *
 * This test drives the REAL script (`bun prisma/dev-cleanup.ts`, the
 * same CLI every round runs) against a scratch DB seeded by the REAL
 * seed (`bun prisma/seed.ts`), with live-verification residue planted
 * on top (the exact state the script exists to clean):
 *
 *  - T1 THE GUARD (the fix's pin): the seed's six canonical timeline
 *    fixtures SURVIVE the cleanup.
 *  - T2 the residue wipe: the planted live-verification residue
 *    (status_changed, tracking_added, AND payment_refunded — the type
 *    list must match the e2e-reset twin) is gone.
 *  - T3 the restore blocks: the canonical statuses + tracking columns
 *    still converge (the fix must not break the script's other work).
 *
 * Scratch-DB isolation: `DATABASE_URL` is an ABSOLUTE `file:` URL
 * (passes through db-path untouched) pointing at db/devcleanup-test.db
 * (git-ignored), the stale file is removed at load, schema pushed and
 * the seed run in beforeAll. No dev-DB pollution.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url)); // <repo>/tests
const REPO_ROOT = path.resolve(HERE, "..");
const SCRATCH_DB = path.join(REPO_ROOT, "db", "devcleanup-test.db");

process.env.DATABASE_URL = `file:${SCRATCH_DB}`;
if (existsSync(SCRATCH_DB)) rmSync(SCRATCH_DB);

const SEED_FIXTURE_IDS = [
  "evt-ord1-transit",
  "evt-ord1-delivered",
  "evt-ord2-transit",
  "evt-ord2-tracking",
  "evt-ord4-cancelled",
  "evt-ord4-refunded",
] as const;

/** Live-verification residue the script exists to clean (planted pre-run). */
const RESIDUE = [
  { id: "residue-r57-a", order: "ORD-2026-001", type: "status_changed", note: "processing → in_transit by admin@luxestore.com" },
  { id: "residue-r57-b", order: "ORD-2026-002", type: "tracking_added", note: "FEDEX 9999 set by admin@luxestore.com" },
  { id: "residue-r57-c", order: "ORD-2026-004", type: "payment_refunded", note: "Refunded $1.00 via Stripe" },
] as const;

const run = (script: string) =>
  execSync(`bun ${path.join(REPO_ROOT, script)}`, {
    cwd: REPO_ROOT,
    env: { ...process.env, DATABASE_URL: `file:${SCRATCH_DB}` },
    stdio: "pipe",
  });

let db: PrismaClient;

beforeAll(async () => {
  execSync(`${path.join(REPO_ROOT, "node_modules", ".bin", "prisma")} db push --skip-generate --accept-data-loss`, {
    cwd: REPO_ROOT,
    env: { ...process.env, DATABASE_URL: `file:${SCRATCH_DB}` },
    stdio: "pipe",
  });
  // The REAL seed — the convergence block upserts the timeline fixtures.
  run("prisma/seed.ts");

  // Plant the live-verification residue on the canonical orders.
  db = new PrismaClient();
  for (const r of RESIDUE) {
    const order = await db.order.findUniqueOrThrow({ where: { number: r.order } });
    await db.orderEvent.create({
      data: { id: r.id, orderId: order.id, type: r.type, note: r.note, createdAt: new Date() },
    });
  }
  // The residue must be visible pre-run (the test's honesty anchor).
  const planted = await db.orderEvent.count({ where: { id: { in: RESIDUE.map((r) => r.id) } } });
  expect(planted).toBe(RESIDUE.length);
  const fixtures = await db.orderEvent.count({ where: { id: { in: [...SEED_FIXTURE_IDS] } } });
  expect(fixtures).toBe(SEED_FIXTURE_IDS.length);
  await db.$disconnect();
}, 240_000);

afterAll(async () => {
  if (existsSync(SCRATCH_DB)) rmSync(SCRATCH_DB);
});

test("T1 THE GUARD: the seed's canonical timeline fixtures survive dev-cleanup", async () => {
  run("prisma/dev-cleanup.ts");
  db = new PrismaClient();
  const survivors = await db.orderEvent.findMany({ where: { id: { in: [...SEED_FIXTURE_IDS] } }, select: { id: true, type: true } });
  const byId = new Map(survivors.map((e) => [e.id, e.type]));
  for (const id of SEED_FIXTURE_IDS) {
    expect(byId.get(id), `fixture ${id} must survive dev-cleanup (the seed's canonical timeline)`).toBeDefined();
  }
  await db.$disconnect();
}, 120_000);

test("T2 the residue wipe: planted live-verification events are gone (all three types)", async () => {
  db = new PrismaClient();
  const left = await db.orderEvent.findMany({ where: { id: { in: RESIDUE.map((r) => r.id) } }, select: { id: true } });
  expect(left.map((e) => e.id).sort(), "live-verification residue must be wiped (status_changed, tracking_added, AND payment_refunded — the e2e-reset twin's type list)").toEqual([]);
  await db.$disconnect();
});

test("T3 the restore blocks: canonical statuses + tracking columns still converge", async () => {
  db = new PrismaClient();
  const o1 = await db.order.findUniqueOrThrow({ where: { number: "ORD-2026-001" } });
  expect(o1.status).toBe("delivered");
  const o2 = await db.order.findUniqueOrThrow({ where: { number: "ORD-2026-002" } });
  expect(o2.status).toBe("in_transit");
  expect(o2.carrier).toBe("UPS");
  expect(o2.trackingNumber).toBe("1Z999AA10123456784");
  await db.$disconnect();
});
