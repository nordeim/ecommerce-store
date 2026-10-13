#!/usr/bin/env node
// Round-57 captures 296-300: the order-detail family — (296) ORD-2026-001
// at desktop (the full read surface: the header row + the Delivered pill +
// the two cards + the item rows + the totals + the timeline), (297)
// ORD-2026-002 at desktop (the in-transit surface: the tracking line + the
// delivery estimate + the In-Transit pill + the 3-row timeline), (298)
// ORD-2026-001 at 375w (the responsive collapse: the wrapped header, the
// single-column grid), (299) the tracking link's HOVER (the live underline
// — the real-mouse dwell held through the capture), (300) the back link's
// FOCUS ring (the real-Tab walk, the 1px orange ring held through the
// capture). Probe-first (the DOM-probed facts recorded for each capture —
// the VLM descriptions cite probed facts only); single invocation, the
// production standalone on :3001 — a FRESH process. The detail pages are
// READ-ONLY (no cart mutations — the DB is left as found trivially).
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PROD_PORT = 3001;
const PROD = `http://localhost:${PROD_PORT}`;
const OUT = "docs/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  } catch {}
};

killPort(PROD_PORT);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "capture-r57-secret" },
  stdio: "ignore",
});
let up = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {}
  if (up) break; await sleep(1000);
}
if (!up) { console.error("standalone never came up"); process.exit(1); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login (the demo user)
const lp = await ctx.newPage();
await lp.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await lp.waitForLoadState("networkidle");
await lp.close();
console.log("login ok");

const page = await ctx.newPage();

async function openDetail(order) {
  await page.goto(`${PROD}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(400);
  await page.getByRole("link", { name: `ORD-2026-${order}` }).click();
  await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
  await page.waitForTimeout(700);
}

// ---- 296: ORD-2026-001 desktop — the full read surface ----
await openDetail("001");
const p296 = await page.evaluate(() => {
  const pill = document.querySelector("main h1 ~ span.inline-flex");
  const pb = pill?.getBoundingClientRect();
  const cards = document.querySelectorAll("main .bg-card");
  const circles = document.querySelectorAll("main span.h-8.w-8");
  return {
    pill: { text: pill?.textContent, w: Math.round(pb?.width ?? 0), h: Math.round(pb?.height ?? 0), bg: getComputedStyle(pill).backgroundColor },
    cards: cards.length,
    timelineRows: circles.length,
    h1: document.querySelector("main h1")?.textContent,
    total: document.querySelector("main .ml-auto")?.textContent,
  };
});
console.log("296 probe: " + JSON.stringify(p296));
await page.screenshot({ path: `${OUT}/296-orderdetail-001-desktop-full-read-surface.png`, fullPage: true });

// ---- 297: ORD-2026-002 desktop — the in-transit surface ----
await openDetail("002");
const p297 = await page.evaluate(() => {
  const pill = document.querySelector("main h1 ~ span.inline-flex");
  const track = document.querySelector('[data-testid="tracking-line"]');
  const est = document.querySelector('[data-testid="delivery-window"]');
  const link = track?.querySelector("a");
  return {
    pill: { text: pill?.textContent, bg: getComputedStyle(pill).backgroundColor },
    tracking: track?.textContent?.replace(/\s+/g, " ").trim().slice(0, 60),
    linkColor: link ? getComputedStyle(link).color : null,
    estimate: est?.textContent,
    timelineRows: document.querySelectorAll("main span.h-8.w-8").length,
  };
});
console.log("297 probe: " + JSON.stringify(p297));
await page.screenshot({ path: `${OUT}/297-orderdetail-002-intransit-tracking-estimate.png`, fullPage: true });

// ---- 298: ORD-2026-001 at 375w — the responsive collapse ----
await openDetail("001");
await page.setViewportSize({ width: 375, height: 900 });
await page.waitForTimeout(500);
const p298 = await page.evaluate(() => {
  const row = document.querySelector("main .max-w-5xl div.flex-wrap");
  const back = row.querySelector("a").getBoundingClientRect();
  const pill = row.querySelector("span.inline-flex").getBoundingClientRect();
  const grid = document.querySelector("main .max-w-5xl div.grid");
  return {
    rowH: Math.round(row.getBoundingClientRect().height),
    wrapped: pill.y > back.y + 4,
    tracks: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
    pillText: row.querySelector("span.inline-flex").textContent,
  };
});
console.log("298 probe: " + JSON.stringify(p298));
await page.screenshot({ path: `${OUT}/298-orderdetail-001-mobile-375-collapse.png`, fullPage: true });
await page.setViewportSize({ width: 1024, height: 768 });

// ---- 299: the tracking link's hover (002) — the live underline ----
await openDetail("002");
const link = page.locator('[data-testid="tracking-line"] a');
await link.hover();
await page.waitForTimeout(400);
const p299 = await page.evaluate(() => {
  const a = document.querySelector('[data-testid="tracking-line"] a');
  const cs = getComputedStyle(a);
  const r = a.getBoundingClientRect();
  return { textDecoration: cs.textDecorationLine, color: cs.color, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
});
console.log("299 probe: " + JSON.stringify(p299));
await page.screenshot({ path: `${OUT}/299-orderdetail-tracking-link-hover-underline.png` });

// ---- 300: the back link's focus ring — the real-Tab walk ----
await openDetail("002");
let focused = false;
for (let i = 0; i < 30 && !focused; i++) {
  await page.keyboard.press("Tab");
  focused = await page.evaluate(() => {
    const el = document.activeElement;
    return !!el && el.textContent?.trim() === "← Orders" && el.matches(":focus-visible");
  });
}
const p300 = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    stop: el?.textContent?.trim(),
    focusVisible: el.matches(":focus-visible"),
    ring: cs.boxShadow.includes("rgb(230, 107, 26) 0px 0px 0px 1px"),
    x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
  };
});
console.log("300 probe: " + JSON.stringify(p300));
await page.screenshot({ path: `${OUT}/300-orderdetail-backlink-focus-ring.png` });

await browser.close();
prod.kill("SIGKILL");
console.log("== r57 captures complete ==");
