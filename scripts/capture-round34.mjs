#!/usr/bin/env node
/**
 * Round-34 screenshots (181-185), ONE invocation (L26 — the sandbox reaps
 * background processes between tool calls).
 *
 * The capture target: the PRODUCTION standalone on :3001 — the exact
 * shipped artifact that ran 246/246 E2E and the sweep battery (the
 * session-63 capture-note precedent).
 *
 *   181 — the account orders tab: the four canonical rows — the numbers
 *         are now LINKS to the customer detail (THE deliverable's
 *         affordance; the resting visual byte-identical to the reference)
 *   182 — the ORD-2026-001 customer order detail (fullPage: the header
 *         with the Delivered pill, the Payment card, the Shipping card,
 *         the Items card with the totals block — THE deliverable's
 *         surface)
 *   183 — the ORD-2026-004 refunded detail (fullPage: the Cancelled pill
 *         + the "Payment refunded" money line + the planter row — the
 *         seam's consistency story)
 *   184 — the not-found block: the ADMIN context visiting john's order
 *         URL (the GUEST-TOKEN-1 discipline — a non-owner is a non-owner
 *         regardless of role)
 *   185 — home (the standing post-change parity capture)
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

// 181 — the account orders tab (fullPage: all four rows, the linked numbers).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForLoadState("networkidle");
  await settle(page);
  await page.screenshot({ path: `${OUT}/181-account-orders-linked-numbers.png`, fullPage: true });
  console.log("181 captured");
  await page.close();
}

// 182 — the ORD-2026-001 customer order detail (fullPage: every card).
// Navigated via the history link (the cuid is the address; the flow is
// the deliverable).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  // The hydration-race settle (AGENTS.md quirk): the link must be mounted
  // + stable before the click — an immediate click races the tab panel's
  // React mount and the navigation is lost (debugged this round).
  await page.waitForTimeout(600);
  const link = page.getByRole("link", { name: "ORD-2026-001" });
  const detailHref = await link.getAttribute("href");
  await link.click();
  // Deterministic: wait for the client-side navigation to LAND (the
  // networkidle form resolves instantly on a Link navigation).
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("182 URL:", page.url());
  await page.screenshot({ path: `${OUT}/182-customer-order-detail.png`, fullPage: true });
  console.log("182 captured");
  await page.close();
  globalThis.detailHref = detailHref;
}

// 183 — the ORD-2026-004 refunded detail (fullPage).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-004" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  console.log("183 URL:", page.url());
  await page.screenshot({ path: `${OUT}/183-refunded-order-detail.png`, fullPage: true });
  console.log("183 captured");
  await page.close();
}

// --- the admin context (the non-owner probe) ---
const admin = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await login(admin, "admin@luxestore.com", "Admin1234!");

// 184 — the not-found block (the GUEST-TOKEN-1 discipline: the admin is a
// non-owner on the CUSTOMER route — the generic block, never the order).
{
  const page = await admin.newPage();
  await page.goto(`${BASE}${globalThis.detailHref}`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/184-order-detail-owner-gate.png` });
  console.log("184 captured");
  await page.close();
}

// 185 — home (the standing post-change parity capture).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/185-home-postchange.png` });
  console.log("185 captured");
  await page.close();
}

await browser.close();
server.pid && process.kill(-server.pid, "SIGKILL");
killPort(PORT);
console.log("done — server killed");
