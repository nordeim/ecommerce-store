#!/usr/bin/env node
/**
 * Round-41 screenshots (216-220) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The ORDER-WINDOW round's captures: the deliverable's surfaces — each
 * screenshot is the visual proof the round's contract holds.
 *
 *   216 — the orders surface filtered by the date window (the round's
 *         deliverable: ?from=2026-03-01&to=2026-03-31 — the two date
 *         inputs populated, the "2 orders" count line, the March rows
 *         only, the February pair excluded)
 *   217 — the orders bar close-up (the two date inputs beside the status
 *         Select + the search input — the PAY-OPS-3 anatomy on the
 *         fulfillment surface; deviceScaleFactor 2 — the 14px label text
 *         is below the VLM's reliable OCR threshold at 1x, the round-38
 *         lesson)
 *   218 — the unfiltered orders surface (the calm state: the bar's
 *         resting form with EMPTY date inputs, all four rows)
 *   219 — the orders surface with the combined filter (status=delivered
 *         AND from=2026-03-01 — the AND composition, the URL's canonical
 *         order ?status=delivered&from=2026-03-01)
 *   220 — the mobile nav open (the standing 41-round watch surface —
 *         the trap-log-pinned left Sheet)
 *
 * Probe-first discipline (the round-32..40 lesson: describe reality, not
 * intention): the filtered count line, the date-input values, the row
 * census, and the canonical URL read from the live DOM BEFORE the VLM
 * descriptions are written. No dev-DB mutations (the surfaces rest in
 * their seeded state — the canonical 4 orders).
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

// ---- admin session (the operator surfaces) -------------------------------
const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const al = await adminCtx.newPage();
await al.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await al.getByLabel("Email").fill("admin@luxestore.com");
await al.getByLabel("Password").fill("Admin1234!");
await al.getByRole("button", { name: "Log in", exact: true }).click();
await al.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await al.waitForLoadState("networkidle");
await al.close();
console.log("admin login ok");

// ---- 216: the orders surface filtered by the date window ----------------
const p216 = await adminCtx.newPage();
await p216.goto(`${BASE}/admin/orders?from=2026-03-01&to=2026-03-31`, { waitUntil: "networkidle" });
await p216.evaluate(async () => { await document.fonts.ready; });
await p216.waitForTimeout(600);
probe.s216 = await p216.evaluate(() => {
  const count = document.querySelector("main p.text-sm")?.textContent ?? "";
  const fromVal = document.querySelector('input[aria-label="From date"]')?.value ?? "";
  const toVal = document.querySelector('input[aria-label="To date"]')?.value ?? "";
  const rows = [...document.querySelectorAll("main a[href^='/admin/orders/']")].map((a) => a.textContent?.trim()).filter(Boolean);
  return { url: location.search, count, from: fromVal, to: toVal, rows };
});
await p216.screenshot({ path: `${OUT}/216-orders-date-window.png`, fullPage: true });
await p216.close();
console.log("216 captured:", JSON.stringify(probe.s216));

// ---- 217: the orders bar close-up at 2x (the round-38 OCR lesson) -------
const closeCtx = await adminCtx.browser().newContext({
  viewport: { width: 1280, height: 400 },
  deviceScaleFactor: 2,
});
// Reuse the admin storage via a fresh login inside the 2x context (the
// sheet's geometry is per-context; a fresh login is the honest form).
const cl = await closeCtx.newPage();
await cl.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await cl.getByLabel("Email").fill("admin@luxestore.com");
await cl.getByLabel("Password").fill("Admin1234!");
await cl.getByRole("button", { name: "Log in", exact: true }).click();
await cl.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
const p217 = await closeCtx.newPage();
await p217.goto(`${BASE}/admin/orders?from=2026-03-01&to=2026-03-31`, { waitUntil: "networkidle" });
await p217.evaluate(async () => { await document.fonts.ready; });
await p217.waitForTimeout(600);
const bar217 = await p217.locator("div.bg-card.rounded-2xl").first();
await bar217.scrollIntoViewIfNeeded();
await bar217.screenshot({ path: `${OUT}/217-orders-bar-closeup.png` });
probe.s217 = await p217.evaluate(() => {
  const labels = [...document.querySelectorAll('input[aria-label]')].map((i) => i.getAttribute("aria-label"));
  return { labels };
});
await p217.close();
await cl.close();
closeCtx.close();
console.log("217 captured:", JSON.stringify(probe.s217));

// ---- 218: the unfiltered orders surface (the calm state) -----------------
const p218 = await adminCtx.newPage();
await p218.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
await p218.evaluate(async () => { await document.fonts.ready; });
await p218.waitForTimeout(600);
probe.s218 = await p218.evaluate(() => {
  const count = document.querySelector("main p.text-sm")?.textContent ?? "";
  const fromVal = document.querySelector('input[aria-label="From date"]')?.value ?? "";
  const toVal = document.querySelector('input[aria-label="To date"]')?.value ?? "";
  const rows = [...document.querySelectorAll("main a[href^='/admin/orders/']")].map((a) => a.textContent?.trim()).filter(Boolean);
  return { url: location.search, count, from: fromVal, to: toVal, rows };
});
await p218.screenshot({ path: `${OUT}/218-orders-calm-state.png`, fullPage: true });
await p218.close();
console.log("218 captured:", JSON.stringify(probe.s218));

// ---- 219: the combined filter (status AND from — the canonical URL) ------
const p219 = await adminCtx.newPage();
await p219.goto(`${BASE}/admin/orders?status=delivered&from=2026-03-01`, { waitUntil: "networkidle" });
await p219.evaluate(async () => { await document.fonts.ready; });
await p219.waitForTimeout(600);
probe.s219 = await p219.evaluate(() => {
  const count = document.querySelector("main p.text-sm")?.textContent ?? "";
  const rows = [...document.querySelectorAll("main a[href^='/admin/orders/']")].map((a) => a.textContent?.trim()).filter(Boolean);
  const statusTrigger = document.querySelector('[aria-label="Filter by status"]')?.textContent ?? "";
  return { url: location.search, count, rows, statusTrigger };
});
await p219.screenshot({ path: `${OUT}/219-orders-combined-filter.png`, fullPage: true });
await p219.close();
console.log("219 captured:", JSON.stringify(probe.s219));

// ---- 220: the mobile nav open (the standing watch surface) --------------
// A fresh CUSTOMER session for the storefront surface (the admin session's
// header carries the console links — the watch is the CUSTOMER nav).
const mobCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  hasTouch: true,
});
const ml = await mobCtx.newPage();
await ml.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await ml.getByLabel("Email").fill("john@example.com");
await ml.getByLabel("Password").fill("Demo1234!");
await ml.getByRole("button", { name: "Log in", exact: true }).click();
await ml.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await ml.waitForLoadState("networkidle");
const p220 = await mobCtx.newPage();
await p220.goto(`${BASE}/`, { waitUntil: "networkidle" });
await p220.waitForTimeout(900);
// The menu button (icon-based: the reference lacks the aria-label — the
// standing protocol's button-finding form: the FIRST button in the banner).
await p220.getByRole("banner").getByRole("button").first().click();
await p220.waitForTimeout(700);
probe.s220 = await p220.evaluate(() => {
  const sheet = document.querySelector('[data-state="open"][role="dialog"]') ?? document.querySelector('[role="dialog"]');
  const links = [...document.querySelectorAll('[role="dialog"] nav a')].map((a) => ({ text: a.textContent?.trim(), href: a.getAttribute("href") }));
  return { panelOpen: !!sheet, links };
});
await p220.screenshot({ path: `${OUT}/220-mobile-nav-open.png` });
await p220.close();
await ml.close();
mobCtx.close();
console.log("220 captured:", JSON.stringify(probe.s220));

await browser.close();
server.kill();
killPort(PORT);
console.log("\nPROBE SUMMARY");
console.log(JSON.stringify(probe, null, 2));
console.log("\ncapture complete — 5 shots (216-220)");
