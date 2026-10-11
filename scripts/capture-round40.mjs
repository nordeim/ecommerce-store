#!/usr/bin/env node
/**
 * Round-40 screenshots (211-215) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The DOCS-ALIGN round's captures: the surfaces the rewritten structural
 * docs DESCRIBE — each screenshot is the visual proof its doc row tells
 * the truth (the §3.2 tree, the §4.1 ER's StripeEvent, the rounds-34-39
 * customer read surface, the standing watch surfaces).
 *
 *   211 — home (the standing post-change parity anchor — the §3.2 tree's
 *         "(storefront)/page.tsx ← home: hero carousel + 4 sections")
 *   212 — the ORD-2026-002 customer order detail (fullPage — the tree's
 *         "account/orders/[id] ← customer order detail (ADR-042)": the
 *         timeline, the tracking link, the live estimate "Mar 18 – 24, 2026")
 *   213 — the checkout wizard step 1 (the tree's "checkout/ ← wizard page" +
 *         the stripe-pay island's resting state — env-gated demo form)
 *   214 — the admin payments console (the ER diagram's StripeEvent surface:
 *         the seeded reflection rows + the payment-family filters)
 *   215 — the mobile nav open (the standing 40-round watch surface — the
 *         trap-log-pinned left Sheet)
 *
 * Probe-first discipline (the round-32..39 lesson: describe reality, not
 * intention): the order detail's estimate text, the payments console's
 * row/family counts, and the mobile panel geometry read from the live DOM
 * BEFORE the VLM descriptions are written. No dev-DB mutations this round
 * (a docs round — every surface rests in its seeded state).
 *
 * Boot → probe → capture → kill by port.
 */
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
const OUT = "docs/screenshots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
    return pids.join(",");
  } catch { return ""; }
};

killPort(PORT);
const server = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1" },
  stdio: "ignore",
});
let up = false;
for (let i = 0; i < 40 && !up; i++) {
  await sleep(1000);
  try {
    const r = await fetch(`${BASE}/api/health`);
    up = (await r.json()).ok === true;
  } catch {}
}
if (!up) { console.error("server never came up on :3001"); process.exit(1); }
console.log("production standalone up on :3001 (the shipped artifact)");

const browser = await chromium.launch();
const probe = {};

// ---- 211: home (auth context reused for the customer surfaces) ----------
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lp = await ctx.newPage();
await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await lp.waitForLoadState("networkidle");
await lp.close();

const home = await ctx.newPage();
await home.goto(`${BASE}/`, { waitUntil: "networkidle" });
await home.evaluate(async () => { await document.fonts.ready; });
await home.waitForTimeout(1200);
probe.home = await home.evaluate(() => ({
  h1: document.querySelector("h1")?.textContent?.slice(0, 40),
  heroImgs: [...document.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().width > 500).length,
  productCards: document.querySelectorAll("main a[href^='/product/']").length,
}));
await home.screenshot({ path: `${OUT}/211-home-docs-align-anchor.png` });
await home.close();
console.log("211 home captured", JSON.stringify(probe.home));

// ---- 212: the ORD-2026-002 customer order detail --------------------------
// The E2E-mirroring navigation (account.spec.ts): the history rows link by
// DATABASE id (a cuid), never the public number — the GUEST-TOKEN-1
// discipline. Navigating by number renders the honest generic block.
const detail = await ctx.newPage();
await detail.goto(`${BASE}/account`, { waitUntil: "networkidle" });
await detail.getByRole("tab", { name: "Orders" }).click();
await detail.getByRole("link", { name: "ORD-2026-002" }).click();
await detail.waitForURL(/\/account\/orders\/[a-z0-9]+$/);
await detail.waitForLoadState("networkidle");
await detail.evaluate(async () => { await document.fonts.ready; });
await detail.waitForTimeout(900);
probe.orderDetail = await detail.evaluate(() => {
  const est = [...document.querySelectorAll("p, div")].find((el) => el.textContent?.startsWith("Estimated delivery"));
  const tracking = document.querySelector("a[href*='ups.com']");
  return {
    heading: document.querySelector("h1")?.textContent,
    estimate: est?.textContent?.trim() ?? null,
    timelineRows: document.querySelectorAll("main ol li, main ul li").length,
    trackingHref: tracking ? new URL(tracking.href).hostname + new URL(tracking.href).search : null,
  };
});
await detail.screenshot({ path: `${OUT}/212-ord002-customer-detail.png`, fullPage: true });
await detail.close();
console.log("212 order detail captured", JSON.stringify(probe.orderDetail));

// ---- 213: the checkout wizard (a REAL cart item first — the PDP ATC) -----
const pdp = await ctx.newPage();
await pdp.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
await pdp.waitForTimeout(900);
await pdp.getByRole("button", { name: /Add to Cart/i }).first().click();
await pdp.waitForTimeout(1500); // the action + router.refresh land asynchronously
await pdp.close();
const checkout = await ctx.newPage();
await checkout.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
await checkout.evaluate(async () => { await document.fonts.ready; });
await checkout.waitForTimeout(900);
probe.checkout = await checkout.evaluate(() => ({
  heading: document.querySelector("h1")?.textContent?.slice(0, 60),
  contactField: !!document.querySelector("input[type='email'], #email"),
  summaryItems: [...document.querySelectorAll("main img")].length,
}));
await checkout.screenshot({ path: `${OUT}/213-checkout-wizard-resting.png` });
await checkout.close();
console.log("213 checkout captured", JSON.stringify(probe.checkout));

// ---- 214: the admin payments console (admin context) ----------------------
const actx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const alp = await actx.newPage();
await alp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await alp.getByLabel("Email").fill("admin@luxestore.com");
await alp.getByLabel("Password").fill("Admin1234!");
await alp.getByRole("button", { name: "Log in", exact: true }).click();
await alp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await alp.waitForLoadState("networkidle");
await alp.close();

const payments = await actx.newPage();
await payments.goto(`${BASE}/admin/payments`, { waitUntil: "networkidle" });
await payments.evaluate(async () => { await document.fonts.ready; });
await payments.waitForTimeout(900);
probe.payments = await payments.evaluate(() => ({
  heading: document.querySelector("h1")?.textContent,
  filterLinks: [...document.querySelectorAll("a")].map((a) => a.textContent?.trim()).filter((t) => t && t.length < 20).slice(0, 8),
  rows: document.querySelectorAll("table tbody tr, [class*='row']").length,
}));
await payments.screenshot({ path: `${OUT}/214-admin-payments-console.png`, fullPage: true });
await payments.close();
console.log("214 admin payments captured", JSON.stringify(probe.payments));

// ---- 215: the mobile nav open (iPhone 14, the standing watch) -------------
const { devices } = await import("playwright-core");
const mctx = await browser.newContext({ ...devices["iPhone 14"] });
const mlp = await mctx.newPage();
await mlp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await mlp.getByLabel("Email").fill("john@example.com");
await mlp.getByLabel("Password").fill("Demo1234!");
await mlp.getByRole("button", { name: "Log in", exact: true }).click();
await mlp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await mlp.waitForLoadState("networkidle");
await mlp.close();
const mobile = await mctx.newPage();
await mobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mobile.waitForTimeout(800);
await mobile.getByRole("banner").getByRole("button").first().click();
await mobile.waitForTimeout(900);
probe.mobileNav = await mobile.evaluate(() => {
  const dlg = document.querySelector('[data-state="open"][role="dialog"]');
  const cs = dlg ? getComputedStyle(dlg) : null;
  const links = dlg ? [...dlg.querySelectorAll("nav a")].map((a) => a.textContent?.trim()) : [];
  return { panelWidth: cs?.width, panelBg: cs?.backgroundColor, links };
});
await mobile.screenshot({ path: `${OUT}/215-mobile-nav-standing-watch.png` });
await mobile.close();
console.log("215 mobile nav captured", JSON.stringify(probe.mobileNav));

await browser.close();
killPort(PORT);
// cart hygiene AFTER the server is down: dev-cleanup removes the cart residue
try {
  execSync("bun prisma/dev-cleanup.ts", { cwd: process.cwd(), stdio: "pipe" });
  console.log("dev-cleanup run (cart residue removed)");
} catch (e) { console.log("dev-cleanup:", String(e).slice(0, 120)); }
console.log("\nPROBE SUMMARY (the VLM descriptions must match THESE readings):");
console.log(JSON.stringify(probe, null, 1));
