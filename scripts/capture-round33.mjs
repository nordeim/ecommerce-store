#!/usr/bin/env node
/**
 * Round-33 screenshots (176-180), ONE invocation (L26 — the sandbox reaps
 * background processes between tool calls).
 *
 * The capture target: the PRODUCTION standalone on :3001 — the exact
 * shipped artifact that ran 240/240 E2E and the sweep battery (the
 * session-63 capture-note precedent: more deterministic than the dev
 * server's turbopack cache).
 *
 *   176 — the account orders tab: the refunded fixture row with the money
 *         line "Refunded · $79.99 returned" (THE deliverable's persistent
 *         surface) + the calm rows around it
 *   177 — the refunded confirmation (/checkout/success?order=ORD-2026-004,
 *         john's owner view): the "Payment refunded" line (the other
 *         deliverable's surface)
 *   178 — the admin orders list: 4 rows incl. ORD-2026-004 Cancelled +
 *         the "4 orders" count line (the fixture's admin reflection)
 *   179 — ORD-2026-004's admin order-detail: the muted "Refunded (Stripe)"
 *         Charge row + the Payment events card (the linked
 *         evt_demo_fixture_r "Refunded") + the "Payment refunded" Timeline
 *         entry (the fixture's full coherence)
 *   180 — home (the standing post-change parity capture)
 *
 * Boot → capture → kill by port.
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

const server = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: "production",
    HOSTNAME: "localhost",
    DATABASE_URL: "file:../db/custom.db",
  },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});

const waitHealthy = async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
};

if (!(await waitHealthy())) {
  console.error("capture server failed to boot");
  process.exit(1);
}

const settle = async (page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(800);
};

const login = async (ctx, email, password) => {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await page.close();
};

const browser = await chromium.launch();

// --- john's context (the demo user: the customer surfaces) ---
const john = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await login(john, "john@example.com", "Demo1234!");

// 176 — the account orders tab (fullPage: all four rows).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForLoadState("networkidle");
  await settle(page);
  await page.screenshot({ path: `${OUT}/176-account-orders-refunded-line.png`, fullPage: true });
  console.log("176 captured");
  await page.close();
}

// 177 — the refunded confirmation (viewport: the single-screen confirmation).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/checkout/success?order=ORD-2026-004`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/177-refunded-confirmation.png` });
  console.log("177 captured");
  await page.close();
}

// --- the admin context (the console surfaces) ---
const admin = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await login(admin, "admin@luxestore.com", "Admin1234!");

// 178 — the admin orders list (fullPage: all four rows + the count line).
{
  const page = await admin.newPage();
  await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/178-admin-orders-four-canonical.png`, fullPage: true });
  console.log("178 captured");
  await page.close();
}

// 179 — ORD-2026-004's admin order-detail (fullPage: the whole detail).
{
  const page = await admin.newPage();
  await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "ORD-2026-004" }).click();
  await page.waitForLoadState("networkidle");
  await settle(page);
  await page.screenshot({ path: `${OUT}/179-order-detail-refunded-coherence.png`, fullPage: true });
  console.log("179 captured");
  await page.close();
}

// --- the anonymous home capture (the standing parity surface) ---
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/180-home-postchange.png` });
  console.log("180 captured");
  await page.close();
}

await browser.close();
try { process.kill(-server.pid, "SIGKILL"); } catch {}
const killed = killPort(PORT);
console.log(`server killed (${killed || "already down"})`);
