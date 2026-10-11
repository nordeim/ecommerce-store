#!/usr/bin/env node
/**
 * Round-39 screenshots (206-210) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The capture target: the PRODUCTION standalone on :3001 — the exact
 * shipped artifact that ran 254/254 E2E ×2 and the sweep battery (the
 * session-63 capture-note precedent).
 *
 *   206 — the Thanksgiving-window ORD-2026-002 customer order detail
 *         (fullPage: the dev DB's placedAt TEMPORARILY set to
 *         2026-11-24T12:00:00Z — the estimate line reads "Estimated
 *         delivery: Nov 30 – Dec 4, 2026", the round-39 deliverable's
 *         headline visual: the +3 bound steps PAST Thu Nov 26 —
 *         Thanksgiving — and the +7 bound past the Nov 28-29 weekend)
 *   207 — the estimate line close-up (the element capture at
 *         deviceScaleFactor 2 — the round-38 VLM OCR lesson: 1x crops of
 *         14px text sit below the reliable threshold)
 *   208 — the placed-order confirmation (fullPage: a REAL order placed
 *         through the browser — the live window in the muted stack)
 *   209 — the ORD-2026-001 calm-state detail (fullPage: NO estimate line —
 *         the delivered order IS the answer)
 *   210 — home (the standing post-change parity capture)
 *
 * Probe-first discipline (the round-32..38 lesson: describe reality, not
 * intention): every estimate text/class read from the live DOM BEFORE the
 * VLM descriptions are written; the fresh order's placedAt read from the
 * DB; the ORD-2026-002 placedAt RESTORED to the canonical fixture instant
 * before exit.
 *
 * Boot → probe → capture → restore → kill by port.
 */
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
const OUT = "docs/screenshots";
const ORD002_PLACED_AT_CANONICAL = new Date("2026-03-15T10:22:00Z");
const ORD002_PLACED_AT_THANKSGIVING = new Date("2026-11-24T12:00:00Z");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
    return pids.join(",");
  } catch { return ""; }
};

// The dev DB via the injected process DATABASE_URL (absolute path — the
// hard-link convergence puts it on the same inode as <repo>/db/custom.db).
const db = new PrismaClient();

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

const openOrder = async (ctx, number) => {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: number }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  return page;
};

const browser = await chromium.launch();

// --- PROBE A: set ORD-2026-002's placedAt to the Thanksgiving-week instant ---
await db.order.update({
  where: { number: "ORD-2026-002" },
  data: { placedAt: ORD002_PLACED_AT_THANKSGIVING },
});
console.log("probe A: ORD-2026-002 placedAt -> 2026-11-24T12:00:00Z (temporary)");

// --- john's context (the demo user: the customer surfaces) ---
const john = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await login(john, "john@example.com", "Demo1234!");

// 206 — the Thanksgiving-window ORD-2026-002 detail (fullPage).
{
  const page = await openOrder(john, "ORD-2026-002");
  const probe = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="delivery-window"]');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent?.trim(),
      className: el.className,
      color: cs.color,
      fontSize: cs.fontSize,
      marginTop: cs.marginTop,
      y: Math.round(r.y),
      prevSiblingTag: el.previousElementSibling?.tagName ?? null,
    };
  });
  console.log("probe 206 (estimate line on the Thanksgiving-window detail):", JSON.stringify(probe));
  if (!probe || probe.text !== "Estimated delivery: Nov 30 – Dec 4, 2026") {
    console.error("PROBE FAILED: the Thanksgiving window did not render — aborting");
    await db.order.update({ where: { number: "ORD-2026-002" }, data: { placedAt: ORD002_PLACED_AT_CANONICAL } });
    process.exit(1);
  }
  await page.screenshot({ path: `${OUT}/206-ord002-thanksgiving-window-detail.png`, fullPage: true });
  console.log("206 captured");
  await page.close();
}

// 207 — the estimate line close-up at deviceScaleFactor 2 (the round-38
// VLM OCR lesson — 1x crops of 14px text sit below the reliable threshold).
{
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await login(ctx2, "john@example.com", "Demo1234!");
  const page = await openOrder(ctx2, "ORD-2026-002");
  const line = page.getByTestId("delivery-window");
  await line.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await line.screenshot({ path: `${OUT}/207-thanksgiving-window-closeup-2x.png` });
  console.log("207 captured (2x)");
  await page.close();
  await ctx2.close();
}

// 208 — the placed-order confirmation (a REAL order through the browser:
// the live window in the muted stack — the "when will it arrive" moment).
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
  // PROBE: read the live confirmation's estimate + order number + the
  // muted-stack composition BEFORE the capture (describe reality).
  const probe = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="delivery-window"]');
    const number = document.body.textContent?.match(/ORD-\d{4}-\d{3}/)?.[0] ?? null;
    if (!el) return { number, estimate: null };
    const cs = getComputedStyle(el);
    return {
      number,
      estimate: el.textContent?.trim(),
      className: el.className,
      color: cs.color,
      fontSize: cs.fontSize,
    };
  });
  console.log("probe 208 (the fresh confirmation):", JSON.stringify(probe));
  if (!probe.estimate) {
    console.error("PROBE FAILED: the fresh confirmation carries no estimate — aborting");
    process.exit(1);
  }
  await page.screenshot({ path: `${OUT}/208-confirmation-live-window.png`, fullPage: true });
  console.log("208 captured");
  // The fresh order's placedAt from the DB (the VLM description's math basis).
  const fresh = probe.number ? await db.order.findUnique({ where: { number: probe.number }, select: { number: true, placedAt: true, status: true } }) : null;
  console.log("probe 208 (the fresh order's DB row):", JSON.stringify(fresh));
  await page.close();
}

// 209 — the ORD-2026-001 calm-state detail (fullPage: NO estimate line —
// the delivered order IS the answer).
{
  const page = await openOrder(john, "ORD-2026-001");
  const calm = await page.getByTestId("delivery-window").count();
  console.log(`probe 209 (calm-state check on ORD-2026-001): estimate nodes = ${calm} (expect 0)`);
  if (calm !== 0) {
    console.error("PROBE FAILED: the delivered order rendered an estimate — aborting");
    process.exit(1);
  }
  await page.screenshot({ path: `${OUT}/209-ord001-calm-state-no-window.png`, fullPage: true });
  console.log("209 captured");
  await page.close();
}

// 210 — home (the standing post-change parity capture; the hero fills the
// viewport — a viewport capture, matching the round-35..38 anchor).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/210-home-postchange.png` });
  console.log("210 captured");
  await page.close();
  await ctx.close();
}

// --- RESTORE: the canonical fixture instant (the dev DB returns to seed state
// for this field; dev-cleanup handles the stray order + stock separately). ---
await db.order.update({
  where: { number: "ORD-2026-002" },
  data: { placedAt: ORD002_PLACED_AT_CANONICAL },
});
console.log("restored: ORD-2026-002 placedAt -> 2026-03-15T10:22:00Z (canonical)");

await browser.close();
await db.$disconnect();
killPort(PORT);
console.log("ALL CAPTURES COMPLETE");
