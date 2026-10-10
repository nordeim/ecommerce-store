#!/usr/bin/env node
/**
 * Round-32 dev-server screenshots (171-175), two phases in ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls):
 *
 * PHASE A (the dev server on :3001, the honest demo environment — no
 * Stripe keys):
 *   175 — home (the parity surface, fresh desktop context)
 *   171 — ORD-2026-003's order detail, the two-step refund confirm visible
 *   172 — after Confirm refund: the demo-mode refusal (operator copy)
 *   174 — /admin/payments (the payments family surface)
 *
 * PHASE B (a probe server on :3002 — the PRODUCTION standalone booted on
 * a SCRATCH copy of the dev DB with fixture Stripe keys, the integration
 * harness's method): a signed charge.refunded for pi_demo_fixture_003
 * drives the REAL webhook reflection →
 *   173 — ORD-2026-003's detail: "Refunded (Stripe)" + the
 *         "Payment refunded" timeline entry + NO refund button (the
 *         post-reflection eligibility — the loop closed end-to-end)
 *
 * Boot → capture → kill by port. The scratch DB is deleted at the end.
 */
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
import { spawn, execSync } from "node:child_process";
import { copyFileSync, rmSync } from "node:fs";

const PORT_A = 3001;
const PORT_B = 3002;
const BASE_A = `http://localhost:${PORT_A}`;
const BASE_B = `http://localhost:${PORT_B}`;
const OUT = "docs/screenshots";
const SCRATCH = "db/refund-demo.db";
const WEBHOOK_SECRET = "whsc_capture_fixture";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
    return pids.join(",");
  } catch { return ""; }
};

// ============================ PHASE A =====================================
// NOTE: the dev server's turbopack cache crashed the home page this round
// (stale .next/dev from the rebuilt production tree); the PRODUCTION
// standalone — the exact shipped artifact, the one that ran 238/238 E2E
// and the sweep battery — is the deterministic capture target.
const dev = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(PORT_A),
    NODE_ENV: "production",
    HOSTNAME: "localhost",
    DATABASE_URL: "file:../db/custom.db",
  },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
dev.stdout.on("data", (d) => process.stdout.write(`[A] ${d}`));
dev.stderr.on("data", (d) => process.stderr.write(`[A:err] ${d}`));

let ready = false;
for (let i = 0; i < 90; i++) {
  try { const r = await fetch(`${BASE_A}/api/health`); if (r.ok) { ready = true; break; } } catch {}
  await sleep(2000);
}
if (!ready) { console.error("DEV SERVER NEVER READY"); try { process.kill(-dev.pid, "SIGKILL"); } catch {}; process.exit(1); }
console.log("dev server ready on", BASE_A);
for (const p of ["/", "/login", "/admin"]) { try { await fetch(BASE_A + p, { redirect: "manual" }); } catch {} await sleep(600); }

const browser = await chromium.launch();

// --- 175: home (fresh desktop context, hero settled) ---
const hctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const hp = await hctx.newPage();
await hp.goto(`${BASE_A}/`, { waitUntil: "networkidle", timeout: 90000 });
await hp.evaluate(async () => { await document.fonts.ready; });
await sleep(2500);
await hp.screenshot({ path: `${OUT}/175-home-dev-postchange.png` });
console.log("captured 175-home-dev-postchange.png");
await hctx.close();

// --- admin login on the dev server ---
const actx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const ap = await actx.newPage();
await ap.goto(`${BASE_A}/login`, { waitUntil: "networkidle", timeout: 90000 });
await ap.getByLabel("Email").fill("admin@luxestore.com");
await ap.getByLabel("Password").fill("Admin1234!");
await ap.getByRole("button", { name: "Log in", exact: true }).click();
await ap.waitForURL("**/account", { timeout: 30000 });

// --- 171: ORD-2026-003's detail with the two-step confirm open ---
await ap.goto(`${BASE_A}/admin/orders`, { waitUntil: "networkidle", timeout: 90000 });
await ap.getByRole("link", { name: "ORD-2026-003" }).click();
await ap.waitForLoadState("networkidle");
await ap.waitForTimeout(1200);
await ap.getByRole("button", { name: "Refund payment" }).click();
await ap.waitForTimeout(600);
await ap.screenshot({ path: `${OUT}/171-refund-control-confirm.png`, fullPage: true });
console.log("captured 171-refund-control-confirm.png");

// --- 172: the demo-mode refusal after confirming ---
await ap.getByRole("button", { name: "Confirm refund" }).click();
await ap.getByText("Stripe is not configured — refund via the Stripe dashboard.").waitFor({ timeout: 15000 });
await ap.waitForTimeout(400);
await ap.screenshot({ path: `${OUT}/172-refund-demo-refusal.png` });
console.log("captured 172-refund-demo-refusal.png");

// --- 174: the payments surface ---
await ap.goto(`${BASE_A}/admin/payments`, { waitUntil: "networkidle", timeout: 90000 });
await ap.waitForTimeout(900);
await ap.screenshot({ path: `${OUT}/174-payments-surface.png` });
console.log("captured 174-payments-surface.png");
await actx.close();
await browser.close();

const killedA = killPort(PORT_A);
try { process.kill(-dev.pid, "SIGKILL"); } catch {}
console.log("phase A complete (dev server killed:", killedA + ")");

// ============================ PHASE B =====================================
copyFileSync("db/custom.db", SCRATCH);
const probe = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(PORT_B),
    NODE_ENV: "production",
    HOSTNAME: "localhost",
    DATABASE_URL: "file:../db/refund-demo.db",
    STRIPE_SECRET_KEY: "sk_test_capture_fixture",
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
probe.stdout.on("data", (d) => process.stdout.write(`[probe] ${d}`));
probe.stderr.on("data", (d) => process.stderr.write(`[probe:err] ${d}`));

let probeReady = false;
for (let i = 0; i < 45; i++) {
  try { const r = await fetch(`${BASE_B}/api/health`); if (r.ok) { probeReady = true; break; } } catch {}
  await sleep(1000);
}
if (!probeReady) { console.error("PROBE SERVER NEVER READY"); try { process.kill(-probe.pid, "SIGKILL"); } catch {}; rmSync(SCRATCH); process.exit(1); }
console.log("probe server ready on", BASE_B);

// The signed charge.refunded for pi_demo_fixture_003 (ORD-2026-003's
// intent, the seeded $524.97 — a FULL refund). Stripe's scheme:
// t=<unix>,v1=HMAC_SHA256(secret, "t.body").
const event = {
  id: "evt_capture_refund_1",
  type: "charge.refunded",
  data: {
    object: {
      id: "ch_capture_refund_1",
      object: "charge",
      amount: 52497,
      payment_intent: "pi_demo_fixture_003",
      refunded: true,
      amount_refunded: 52497,
    },
  },
};
const body = JSON.stringify(event);
const t = Math.floor(Date.now() / 1000);
const v1 = createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${body}`).digest("hex");
const res = await fetch(`${BASE_B}/api/stripe/webhook`, {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${v1}` },
  body,
});
console.log("probe webhook response:", res.status, JSON.stringify(await res.json()));

// 173: the reflected order — login on the probe server, open ORD-2026-003.
const browser2 = await chromium.launch();
const bctx = await browser2.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const bp = await bctx.newPage();
await bp.goto(`${BASE_B}/login`, { waitUntil: "networkidle", timeout: 90000 });
await bp.getByLabel("Email").fill("admin@luxestore.com");
await bp.getByLabel("Password").fill("Admin1234!");
await bp.getByRole("button", { name: "Log in", exact: true }).click();
await bp.waitForURL("**/account", { timeout: 30000 });
await bp.goto(`${BASE_B}/admin/orders`, { waitUntil: "networkidle", timeout: 90000 });
await bp.getByRole("link", { name: "ORD-2026-003" }).click();
await bp.waitForLoadState("networkidle");
await bp.waitForTimeout(1200);
await bp.getByText("Refunded (Stripe)").waitFor({ timeout: 15000 });
await bp.screenshot({ path: `${OUT}/173-refunded-order-reflection.png`, fullPage: true });
console.log("captured 173-refunded-order-reflection.png");
await bctx.close();
await browser2.close();

const killedB = killPort(PORT_B);
try { process.kill(-probe.pid, "SIGKILL"); } catch {}
rmSync(SCRATCH);
console.log("phase B complete (probe server killed:", killedB + "; scratch DB removed)");
console.log("ROUND-32 SCREENSHOTS COMPLETE: 171-175");
