#!/usr/bin/env node
/**
 * Round-31 dev-server screenshots (166-170): boots `bun run dev` on :3001,
 * waits for ready, then captures the remediated surfaces:
 *   166 — home (the parity surface, desktop)
 *   167 — checkout wizard shipping step (the autoComplete fix, CHECKOUT-AC-1)
 *   168 — guest confirmation WITH the view token (details render — GUEST-TOKEN-1)
 *   169 — the bare-number enumeration view (the generic block — the fix visible)
 *   170 — mobile nav open (the standing watch, iPhone 14)
 * One invocation end-to-end (L26): boot → wait → capture → kill by port.
 */
import { chromium, devices } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
const OUT = "docs/screenshots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- boot the dev server (background within this invocation) ---
// NOTE: `bun run dev` hardcodes `-p 3000` (and tees dev.log) — spawn the
// dev server directly on our port instead.
const dev = spawn("bun", ["x", "next", "dev", "-p", String(PORT)], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: "file:../db/custom.db" },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
dev.stdout.on("data", (d) => process.stdout.write(`[dev] ${d}`));
dev.stderr.on("data", (d) => process.stderr.write(`[dev:err] ${d}`));

// --- wait for ready (dev compiles routes on first hit — poll generously) ---
let ready = false;
for (let i = 0; i < 90; i++) {
  try {
    const res = await fetch(`${BASE}/api/health`);
    if (res.ok) { ready = true; break; }
  } catch { /* not up yet */ }
  await sleep(2000);
}
if (!ready) {
  console.error("DEV SERVER NEVER BECAME READY");
  try { process.kill(-dev.pid, "SIGKILL"); } catch {}
  process.exit(1);
}
console.log("dev server ready on", BASE);
// warm the routes we'll capture (first-hit compilation)
for (const p of ["/", "/checkout", "/product/charging-pad", "/login"]) {
  try { await fetch(BASE + p, { redirect: "manual" }); } catch {}
  await sleep(500);
}

const browser = await chromium.launch();

// --- desktop context: home + checkout shipping step ---
const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const dp = await dctx.newPage();
await dp.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90000 });
await dp.evaluate(async () => { await document.fonts.ready; });
await sleep(2500); // hero paint + carousel settle
await dp.screenshot({ path: `${OUT}/166-home-dev-postchange.png` });
console.log("captured 166-home-dev-postchange.png");

// checkout shipping step (autoComplete fix): guest adds to cart first
await dp.goto(`${BASE}/product/charging-pad`, { waitUntil: "networkidle", timeout: 90000 });
await dp.getByRole("button", { name: "Add to Cart" }).first().click();
await dp.waitForTimeout(900);
await dp.goto(`${BASE}/checkout`, { waitUntil: "networkidle", timeout: 90000 });
await dp.waitForTimeout(1200);
await dp.getByRole("main").getByLabel("First Name").fill("Ada");
await dp.getByRole("main").getByLabel("Last Name").fill("Guest");
await dp.getByRole("main").getByLabel("Email").fill("ada-guest@example.com");
await dp.getByRole("main").getByLabel("Address").fill("5 Round Lane");
await dp.getByRole("main").getByLabel("City").fill("Austin");
await dp.getByRole("main").getByLabel("State").fill("TX");
await dp.getByRole("main").getByLabel("ZIP").fill("73301");
await dp.screenshot({ path: `${OUT}/167-checkout-shipping-autocomplete.png` });
console.log("captured 167-checkout-shipping-autocomplete.png");

// place the order (PayPal path — no Stripe keys on the dev box)
await dp.getByRole("button", { name: "Continue to Payment" }).click();
await dp.waitForTimeout(800);
await dp.getByRole("radio", { name: "PayPal" }).check();
await dp.getByRole("button", { name: "Review Order" }).click();
await dp.waitForTimeout(800);
await dp.getByRole("button", { name: /Place Order/ }).click();
await dp.waitForURL(/\/checkout\/success\?order=.+&t=/, { timeout: 30000 });
await dp.waitForLoadState("networkidle");
await dp.waitForTimeout(1500);
const tokenedUrl = dp.url();
console.log("guest tokened URL:", tokenedUrl);
await dp.screenshot({ path: `${OUT}/168-guest-confirmation-tokened.png` });
console.log("captured 168-guest-confirmation-tokened.png");
const orderNumber = new URL(tokenedUrl).searchParams.get("order");
await dctx.close();

// --- anonymous context: the bare-number enumeration view (the fix) ---
const actx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const ap = await actx.newPage();
await ap.goto(`${BASE}/checkout/success?order=${encodeURIComponent(orderNumber)}`, { waitUntil: "networkidle", timeout: 90000 });
await ap.waitForTimeout(1000);
await ap.screenshot({ path: `${OUT}/169-bare-number-generic-block.png` });
console.log("captured 169-bare-number-generic-block.png");
await actx.close();

// --- mobile context: the nav panel (standing watch) ---
const mctx = await browser.newContext({ ...devices["iPhone 14"] });
const mp = await mctx.newPage();
await mp.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90000 });
await mp.waitForTimeout(1200);
await mp.getByRole("banner").getByRole("button").first().click();
await mp.waitForTimeout(900);
await mp.screenshot({ path: `${OUT}/170-mobile-nav-dev-postchange.png` });
console.log("captured 170-mobile-nav-dev-postchange.png");
await mctx.close();

await browser.close();

// --- kill the dev server (by port, the L25 lesson) ---
try {
  const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${PORT}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  console.log("dev server killed (pids:", pids.join(", ") + ")");
} catch { console.log("port cleanup: no pid found (already down)"); }
try { process.kill(-dev.pid, "SIGKILL"); } catch {}
console.log("ROUND-31 SCREENSHOTS COMPLETE: 166-170");
