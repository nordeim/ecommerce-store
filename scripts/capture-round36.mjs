#!/usr/bin/env node
/**
 * Round-36 screenshots (191-195), ONE invocation (L26 — the sandbox reaps
 * background processes between tool calls).
 *
 * The capture target: the PRODUCTION standalone on :3001 — the exact
 * shipped artifact that ran 252/252 E2E ×2 and the sweep battery (the
 * session-63 capture-note precedent).
 *
 *   191 — the ORD-2026-002 customer order detail (fullPage: the In
 *         Transit pill, the Payment card, the Shipping card WITH the
 *         tracking line — "UPS · 1Z999AA10123456784", the number linked
 *         to the carrier's public tracking page — THE deliverable's read
 *         surface), the Items card, and the THREE-row Timeline (placed →
 *         In Transit → Tracking added)
 *   192 — the tracking line close-up (the element capture: the muted
 *         "Tracking" label, the carrier, the linked number)
 *   193 — the ADMIN order-detail for ORD-2026-002 (the write surface: the
 *         "Current: UPS · 1Z…" read row + the carrier/tracking-number
 *         form island on the Shipping card)
 *   194 — the ORD-2026-001 calm-state detail (fullPage: NO tracking row —
 *         the not-set order ships nothing)
 *   195 — home (the standing post-change parity capture)
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

// 191 — the ORD-2026-002 customer order detail (fullPage: every card).
// Navigated via the history link (the cuid is the address; the session-34
// flow), with the hydration-race settle before the click.
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-002" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("191 URL:", page.url());
  await page.screenshot({ path: `${OUT}/191-ord002-tracking-detail.png`, fullPage: true });
  console.log("191 captured");
  await page.close();
}

// 192 — the tracking line close-up (the element capture on :3001's page).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-002" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  const line = page.getByTestId("tracking-line");
  await line.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await line.screenshot({ path: `${OUT}/192-tracking-line-closeup.png` });
  console.log("192 captured");
  await page.close();
}

// 193 — the ADMIN order-detail for ORD-2026-002 (the write surface).
{
  const admin = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await login(admin, "admin@luxestore.com", "Admin1234!");
  const page = await admin.newPage();
  await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "ORD-2026-002" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("193 URL:", page.url());
  await page.screenshot({ path: `${OUT}/193-admin-tracking-form.png`, fullPage: true });
  console.log("193 captured");
  await page.close();
  await admin.close();
}

// 194 — the ORD-2026-001 calm-state detail (fullPage: NO tracking row).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-001" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("194 URL:", page.url());
  await page.screenshot({ path: `${OUT}/194-ord001-calm-state.png`, fullPage: true });
  console.log("194 captured");
  await page.close();
}

// 195 — home (the standing post-change parity capture; the hero fills the
// viewport — a viewport capture, not fullPage, matching the round-35
// anchor).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/195-home-postchange.png` });
  console.log("195 captured");
  await page.close();
  await ctx.close();
}

await browser.close();
try { process.kill(-server.pid, "SIGKILL"); } catch {}
const killed = killPort(PORT);
console.log("capture server killed:", killed || "(already gone)");
