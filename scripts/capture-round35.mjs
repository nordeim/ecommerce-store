#!/usr/bin/env node
/**
 * Round-35 screenshots (186-190), ONE invocation (L26 — the sandbox reaps
 * background processes between tool calls).
 *
 * The capture target: the PRODUCTION standalone on :3001 — the exact
 * shipped artifact that ran 250/250 E2E × 2 and the post-change battery
 * (the session-63 capture-note precedent).
 *
 *   186 — the ORD-2026-001 customer order detail (fullPage: the header,
 *         Payment, Shipping, Items + THE deliverable's Timeline card —
 *         the customer-safe story: Order placed → In Transit → Delivered)
 *   187 — the ORD-2026-004 refunded detail (fullPage: the Cancelled pill,
 *         the money line + the timeline carrying the money story —
 *         placed → cancelled → refunded)
 *   188 — the owner's checkout confirmation (ORD-2026-004: the surface
 *         whose "View Orders" now deep-links to the placed order's detail
 *         — the CHECKOUT-DEEPLINK-1 deliverable; the href is the delta)
 *   189 — the ORD-2026-002 in-transit detail (the minimal timeline —
 *         placed + one status change)
 *   190 — home (the standing post-change parity capture)
 *
 * Boot → capture → kill by port. The round-34 lesson applied: settle or
 * waitForURL before reading the DOM after Radix tab + Link clicks (the
 * hydration-race quirk, third form).
 */
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
const OUT = "docs/screenshots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf-8" }).trim().split("\n").filter(Boolean);
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

const settle = async (page) => {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
};

// The round-34 capture lesson: the tab click → link click races the Radix
// panel's React mount — deterministic navigation via waitForURL.
const gotoDetail = async (page, number) => {
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(900); // the Radix panel mount settle
  await page.getByRole("link", { name: number }).click();
  await page.waitForURL(new RegExp(`/account/orders/[a-z0-9]+$`), { timeout: 10_000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
};

const waitUp = async () => {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {}
    await sleep(1000);
  }
  throw new Error("server did not come up");
};

try {
  await waitUp();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // login (demo user john — the fixture orders' owner)
  const lp = await ctx.newPage();
  await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await lp.getByLabel("Email").fill("john@example.com");
  await lp.getByLabel("Password").fill("Demo1234!");
  await lp.getByRole("button", { name: "Log in", exact: true }).click();
  await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
  await lp.waitForLoadState("networkidle");
  await lp.close();

  // 186 — the ORD-2026-001 customer detail with the timeline (fullPage)
  {
    const page = await ctx.newPage();
    await gotoDetail(page, "ORD-2026-001");
    await page.screenshot({ path: `${OUT}/186-ord001-detail-timeline.png`, fullPage: true });
    console.log("186 captured");
    await page.close();
  }

  // 187 — the ORD-2026-004 refunded detail with the timeline (fullPage)
  {
    const page = await ctx.newPage();
    await gotoDetail(page, "ORD-2026-004");
    await page.screenshot({ path: `${OUT}/187-ord004-refunded-detail-timeline.png`, fullPage: true });
    console.log("187 captured");
    await page.close();
  }

  // 188 — the owner's checkout confirmation (the deep-linked surface)
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/checkout/success?order=ORD-2026-004`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${OUT}/188-owner-confirmation-deeplink.png`, fullPage: true });
    console.log("188 captured");
    await page.close();
  }

  // 189 — the ORD-2026-002 in-transit detail (the minimal timeline)
  {
    const page = await ctx.newPage();
    await gotoDetail(page, "ORD-2026-002");
    await page.screenshot({ path: `${OUT}/189-ord002-intransit-detail.png`, fullPage: true });
    console.log("189 captured");
    await page.close();
  }

  // 190 — home (the standing anchor)
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: `${OUT}/190-home-postchange.png` });
    console.log("190 captured");
    await page.close();
  }

  await browser.close();
} catch (e) {
  console.error("CAPTURE FAILED:", e.message);
  process.exitCode = 1;
} finally {
  // Session-35 hygiene: the statement form (lint 0/0 contract).
  if (server.pid) process.kill(-server.pid, "SIGKILL");
  killPort(PORT);
  console.log("done — server killed");
}
