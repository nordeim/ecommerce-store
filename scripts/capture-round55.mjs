#!/usr/bin/env node
/**
 * Round-55 screenshots (286-290) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The HEADER-ICONS-1 round's captures: the header's icon-button family —
 * each screenshot is the visual proof the round's contract holds.
 *
 *   286 — the icon cluster at rest (the four 36×36 ghost buttons in the
 *         gap-1 cluster — the family's resting anchor)
 *   287 — the search button HOVERED (the accent pair rgb(253,243,237) /
 *         rgb(138,64,15) — P5's proof state, REAL mouse)
 *   288 — the search button KEYBOARD-FOCUSED (the orange 1px ring —
 *         P6's proof state; the v4 ring against the transparent header)
 *   289 — the bag WITH the badge (the superset's proof: the orange 16×16
 *         count pill at the bag's top-right corner + THE FIX's aria
 *         "Cart, 1 item" probed in the same capture)
 *   290 — the mobile 390px header row (the 3-child justify-between row:
 *         menu + logo + the cluster at x=218 — P14's proof state)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * screenshots and BEFORE the VLM descriptions are written. ONE server:
 * the production standalone on :3001 (a FRESH process). The badge capture
 * (289) adds ONE cart item to the demo user's cart and REMOVES it after
 * (the drawer's remove) — the DB left as found, verified.
 *
 * Boot → login → probe → capture → cleanup → kill by port.
 */
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
    return pids.join(",");
  } catch { return ""; }
};

killPort(PROD_PORT);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db" },
  stdio: "ignore",
});
let prodUp = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${PROD}/api/health`); prodUp = (await r.json()).ok === true; } catch {}
  if (prodUp) break;
  await sleep(1000);
}
if (!prodUp) { console.error("production standalone never came up on :3001"); process.exit(1); }
console.log("production standalone up on :3001");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login as the demo user (the helpers convention)
const lp = await ctx.newPage();
await lp.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1200);
await lp.close();
console.log("logged in as the demo user");

const page = await ctx.newPage();
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const iconBtn = (svg) => page.locator("header button").filter({ has: page.locator(`svg.lucide-${svg}`) }).first();
const clusterBox = async () => {
  const cluster = iconBtn("heart").locator("xpath=../..");
  return cluster.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
};

// ---- 286: the cluster at rest ----------------------------------------------
{
  const cb = await clusterBox();
  const probe = await page.evaluate(() => {
    const header = document.querySelector("header");
    const btns = [...header.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().width > 0 && b.querySelector("svg.lucide-search, svg.lucide-heart, svg.lucide-shopping-bag, svg.lucide-user"));
    return btns.map((b) => {
      const r = b.getBoundingClientRect();
      const s = getComputedStyle(b);
      return `${Math.round(r.x)} ${Math.round(r.width)}x${Math.round(r.height)} bg=${s.backgroundColor}`;
    });
  });
  console.log(`[286 probe] cluster=${JSON.stringify(cb)} buttons=${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/286-headericons-cluster-resting.png`, clip: { x: Math.max(0, cb.x - 24), y: Math.max(0, cb.y - 28), width: cb.w + 48, height: cb.h + 56 } });
}

// ---- 287: the search button hovered (the accent pair) ------------------------
{
  const btn = iconBtn("search");
  await btn.hover();
  await page.waitForTimeout(450);
  const probe = await btn.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, color: s.color, radius: s.borderRadius };
  });
  console.log(`[287 probe] search hovered = ${JSON.stringify(probe)}`);
  const cb = await clusterBox();
  await page.screenshot({ path: `${OUT}/287-headericons-search-hovered.png`, clip: { x: Math.max(0, cb.x - 24), y: Math.max(0, cb.y - 28), width: cb.w + 48, height: cb.h + 56 } });
  await page.mouse.move(10, 700); // leave the hover
  await page.waitForTimeout(300);
}

// ---- 288: the search button keyboard-focused (the ring) ----------------------
{
  await page.mouse.move(10, 760); // parked, NO click (the r55d lesson)
  for (let i = 0; i < 7; i++) await page.keyboard.press("Tab");
  await page.waitForTimeout(350);
  const probe = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { svg: el.querySelector("svg")?.getAttribute("class"), outline: s.outlineStyle, ring: s.boxShadow, focusVisible: el.matches(":focus-visible") };
  });
  console.log(`[288 probe] focused = ${JSON.stringify(probe)}`);
  const cb = await clusterBox();
  await page.screenshot({ path: `${OUT}/288-headericons-search-focused-ring.png`, clip: { x: Math.max(0, cb.x - 24), y: Math.max(0, cb.y - 28), width: cb.w + 48, height: cb.h + 56 } });
}

// ---- 289: the bag WITH the badge (the superset + THE FIX's aria) -------------
{
  const pdp = await ctx.newPage();
  await pdp.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await pdp.getByRole("button", { name: "Add to Cart" }).first().click();
  await pdp.waitForTimeout(1000);
  const bagPdp = pdp.locator("header button").filter({ has: pdp.locator("svg.lucide-shopping-bag") }).first();
  const ariaProbe = await bagPdp.getAttribute("aria-label");
  const badgeProbe = await bagPdp.locator("span").evaluate((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { text: el.textContent.trim(), bg: s.backgroundColor, geom: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}` };
  });
  console.log(`[289 probe] aria=${JSON.stringify(ariaProbe)} badge=${JSON.stringify(badgeProbe)}`);
  const cb = await bagPdp.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
  await pdp.screenshot({ path: `${OUT}/289-headericons-bag-badge-superset.png`, clip: { x: Math.max(0, cb.x - 60), y: Math.max(0, cb.y - 32), width: 180, height: cb.h + 64 } });
  // cleanup: remove the item via the drawer — the DB left as found
  await bagPdp.click();
  await pdp.waitForTimeout(900);
  const remove = pdp.getByLabel(/^Remove /).first();
  if (await remove.isVisible().catch(() => false)) {
    await remove.click();
    await pdp.waitForTimeout(700);
  }
  await pdp.keyboard.press("Escape");
  await pdp.waitForTimeout(400);
  const after = await pdp.locator("header button").filter({ has: pdp.locator("svg.lucide-shopping-bag") }).first().getAttribute("aria-label");
  console.log(`[289 cleanup] cart aria after remove = ${JSON.stringify(after)} (expect "Cart")`);
  await pdp.close();
}

// ---- 290: the mobile 390px header row ---------------------------------------
{
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const probe = await page.evaluate(() => {
    const header = document.querySelector("header");
    const rows = [...header.querySelectorAll("div")].filter((d) => d.className.includes("justify-between"));
    const row = rows[0];
    const kids = [...row.children].filter((c) => getComputedStyle(c).display !== "none").map((c) => {
      const r = c.getBoundingClientRect();
      return `${c.tagName}:${Math.round(r.x)},${Math.round(r.width)}w`;
    });
    return { kids };
  });
  console.log(`[290 probe] mobile row children = ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/290-headericons-mobile-390-row.png`, clip: { x: 0, y: 0, width: 390, height: 130 } });
}

await browser.close();
killPort(PROD_PORT);
console.log("\n[r55 captures complete: 286-290]");
