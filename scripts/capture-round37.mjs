#!/usr/bin/env node
/**
 * Round-37 screenshots (196-200), ONE invocation (L26 — the sandbox reaps
 * background processes between tool calls).
 *
 * The capture target: the PRODUCTION standalone on :3001 — the exact
 * shipped artifact that ran 254/254 E2E ×2 and the sweep battery (the
 * session-63 capture-note precedent).
 *
 *   196 — the ORD-2026-002 customer order detail (fullPage: the In
 *         Transit pill + THE DELIVERABLE — the estimate line under the
 *         header row "Estimated delivery: Mar 18 – 22, 2026" — the
 *         Payment card, the Shipping card with the tracking line, the
 *         Items card, the three-row Timeline)
 *   197 — the estimate line close-up (the element capture: the muted
 *         "Estimated delivery:" text under the order header)
 *   198 — the placed-order confirmation (fullPage: a REAL order placed
 *         through the browser — "Order Confirmed" + the estimate line in
 *         the muted stack + the items card)
 *   199 — the ORD-2026-001 calm-state detail (fullPage: NO estimate line —
 *         the delivered order IS the answer)
 *   200 — home (the standing post-change parity capture)
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

// 196 — the ORD-2026-002 customer order detail (fullPage: every card +
// the estimate line — THE deliverable's read surface).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-002" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("196 URL:", page.url());
  await page.screenshot({ path: `${OUT}/196-ord002-delivery-window-detail.png`, fullPage: true });
  console.log("196 captured");
  await page.close();
}

// 197 — the estimate line close-up (the element capture: the header block
// with the order row + the muted estimate under it).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-002" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  const line = page.getByTestId("delivery-window");
  await line.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await line.screenshot({ path: `${OUT}/197-delivery-window-closeup.png` });
  console.log("197 captured");
  await page.close();
}

// 198 — the placed-order confirmation (a REAL order through the browser:
// the estimate in the muted line stack — the "when will it arrive" moment).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await settle(page);
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Cart, 1 items/ }).click();
  await page.waitForTimeout(600);
  await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
  await page.waitForURL(/\/checkout/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  await page.getByRole("main").getByLabel("First Name").fill("John");
  await page.getByRole("main").getByLabel("Last Name").fill("Doe");
  await page.getByRole("main").getByLabel("Email").fill("john@example.com");
  await page.getByRole("main").getByLabel("Address").fill("123 Main St");
  await page.getByRole("main").getByLabel("City").fill("New York");
  await page.getByRole("main").getByLabel("State").fill("NY");
  await page.getByRole("main").getByLabel("ZIP").fill("10001");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("main").getByLabel("Card Number").fill("4242424242424242");
  await page.getByRole("main").getByLabel("Expiry").fill("12/28");
  await page.getByRole("main").getByLabel("CVC").fill("123");
  await page.getByRole("button", { name: "Review Order" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Place Order — \$299\.99/ }).click();
  await page.waitForURL(/\/checkout\/success\?order=/, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("198 URL:", page.url());
  await page.screenshot({ path: `${OUT}/198-confirmation-delivery-window.png`, fullPage: true });
  console.log("198 captured");
  await page.close();
}

// 199 — the ORD-2026-001 calm-state detail (fullPage: NO estimate line —
// the delivered order IS the answer).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-001" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("199 URL:", page.url());
  await page.screenshot({ path: `${OUT}/199-ord001-calm-state-no-window.png`, fullPage: true });
  console.log("199 captured");
  await page.close();
}

// 200 — home (the standing post-change parity capture; the hero fills the
// viewport — a viewport capture, not fullPage, matching the round-35/36
// anchor).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/200-home-postchange.png` });
  console.log("200 captured");
  await page.close();
  await ctx.close();
}

await browser.close();
try { process.kill(-server.pid, "SIGKILL"); } catch {}
const killed = killPort(PORT);
console.log("capture server killed:", killed || "(already gone)");
