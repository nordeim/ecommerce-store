#!/usr/bin/env node
/**
 * Round-49 screenshots (256-260) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The CART-STEPPER-1 round's captures: the quantity-stepper boundary
 * states — each screenshot is the visual proof the round's contract holds.
 *
 *   256 — the PDP RESTING stepper at qty 1: the minus ENABLED at full
 *         opacity (Fix #1's proof state — the reference's resting anatomy)
 *   257 — the drawer at qty 1: the minus ENABLED at full opacity + the
 *         reference's exact stepper anatomy (Fix #2's proof state)
 *   258 — the drawer AFTER the minus-at-1 click: "Cart (0)" + the empty
 *         state ("Your cart is empty" + Start Shopping) — the
 *         decrement-to-remove proof (the doubly-measured reference parity)
 *   259 — the /cart AFTER the minus-at-1 click: the empty state with
 *         "Continue Shopping" (Fix #3's consistency proof — the same
 *         design language as the drawer)
 *   260 — the PDP plus at the stock ceiling: qty 25 of 25, the plus
 *         DISABLED at opacity 0.4 (P8's registered-superset proof —
 *         reached by 24 client-state clicks, ZERO DB mutations)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * screenshots and BEFORE the VLM descriptions are written. ONE server: the
 * production standalone on :3001 (a FRESH process). The drawer//cart
 * captures use the GUEST cart (cookie-only); the only DB writes are the
 * guest cart rows, removed by prisma/dev-cleanup.ts after the run (the
 * round's dev-DB hygiene lesson).
 *
 * Boot → probe → capture → kill by port.
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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const drawerQuery = (body) =>
  page.evaluate(`(() => {
    const els = [...document.querySelectorAll("[role=dialog],[data-state=open]")];
    const dlg = els.find((e) => /Cart \\(\\d+\\)/.test(e.textContent || ""));
    if (!dlg) return { found: false };
    const $ = (sel) => [...dlg.querySelectorAll(sel)];
    return ({ dlg, $, cs: (el) => getComputedStyle(el) });
  })() ? (() => {
    const els = [...document.querySelectorAll("[role=dialog],[data-state=open]")];
    const dlg = els.find((e) => /Cart \\(\\d+\\)/.test(e.textContent || ""));
    const $ = (sel) => [...dlg.querySelectorAll(sel)];
    const cs = (el) => getComputedStyle(el);
    ${body}
  })() : { found: false }`);

// ---- 256: the PDP resting stepper at qty 1 (the minus ENABLED) -------------
{
  await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const probe = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
    const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
    const c = b?.parentElement;
    const span = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
    return {
      minusDisabled: b?.disabled === true,
      minusOpacity: b ? getComputedStyle(b).opacity : null,
      minusCursor: b ? getComputedStyle(b).cursor : null,
      minusClass: b?.getAttribute("class"),
      qty: span?.textContent?.trim(),
      atcLabel: [...document.querySelectorAll("button")].find((x) => /add to cart/i.test(x.textContent || ""))?.textContent?.trim(),
    };
  });
  console.log("[256 probe]", JSON.stringify(probe));
  // frame the buy box (the stepper + ATC row)
  const box = await page.getByRole("button", { name: "Add to Cart" }).first().boundingBox();
  if (box) {
    await page.screenshot({ path: `${OUT}/256-pdp-stepper-qty1-minus-enabled.png`, clip: { x: Math.max(0, box.x - 380), y: Math.max(0, box.y - 16), width: Math.min(1280, 720), height: 100 } });
  } else {
    await page.screenshot({ path: `${OUT}/256-pdp-stepper-qty1-minus-enabled.png`, fullPage: true });
  }
}

// ---- 257 + 258: the drawer at qty 1 → the minus-at-1 removal ---------------
{
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.waitForTimeout(1800);
  await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
  await page.waitForTimeout(1500);

  const probe1 = await drawerQuery(`
    const btns = $("button");
    const minus = btns.find((b) => b.querySelector("svg.lucide-minus"));
    const plus = btns.find((b) => b.querySelector("svg.lucide-plus"));
    const container = minus?.parentElement;
    const span = container ? [...container.children].find((c) => c !== minus && c !== plus) : null;
    return {
      found: true,
      heading: dlg.querySelector("h2")?.textContent?.trim(),
      minusDisabled: minus?.disabled === true,
      minusOpacity: minus ? cs(minus).opacity : null,
      minusCursor: minus ? cs(minus).cursor : null,
      minusClass: minus?.getAttribute("class"),
      qty: span?.textContent?.trim(),
      rowTotal: $("p").map((e) => e.textContent?.trim()).filter((t) => /^\\$/.test(t || "")).slice(-1)[0],
    };`);
  console.log("[257 probe]", JSON.stringify(probe1));
  await page.screenshot({ path: `${OUT}/257-drawer-qty1-minus-enabled.png` });

  // THE REMOVAL CLICK — the round's headline behavior
  await page.locator("[role=dialog] button", { has: page.locator("svg.lucide-minus") }).first().click();
  await page.waitForTimeout(1500);
  const probe2 = await drawerQuery(`
    return {
      found: true,
      heading: dlg.querySelector("h2")?.textContent?.trim(),
      emptyMsg: /cart is empty/.test(dlg.textContent || ""),
      startShopping: (dlg.textContent || "").includes("Start Shopping"),
      imgs: $("img").length,
    };`);
  console.log("[258 probe]", JSON.stringify(probe2));
  await page.screenshot({ path: `${OUT}/258-drawer-after-minus-at1-empty.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
}

// ---- 259: the /cart after the minus-at-1 removal (Fix #3's consistency) ----
{
  await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.waitForTimeout(1800);
  await page.goto(`${PROD}/cart`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const probe1 = await page.evaluate(() => {
    const m = [...document.querySelectorAll("main button")].find((x) => x.querySelector("svg.lucide-minus"));
    return { minusDisabled: m?.disabled === true, minusOpacity: m ? getComputedStyle(m).opacity : null, minusCursor: m ? getComputedStyle(m).cursor : null, heading: document.querySelector("main h1")?.textContent?.trim() };
  });
  console.log("[259 pre-click probe]", JSON.stringify(probe1));
  await page.getByRole("main").getByLabel(/Decrease quantity/).click();
  await page.waitForTimeout(1500);
  const probe2 = await page.evaluate(() => {
    const main = document.querySelector("main");
    return { heading: main?.querySelector("h1")?.textContent?.trim(), continueShopping: (main?.textContent || "").includes("Continue Shopping") };
  });
  console.log("[259 post-click probe]", JSON.stringify(probe2));
  await page.screenshot({ path: `${OUT}/259-cart-after-minus-at1-empty.png` });
}

// ---- 260: the PDP plus at the stock ceiling (qty 25 of 25) -----------------
{
  await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  // 24 client-state clicks: qty 1 -> 25 (the seeded stock; ZERO DB writes —
  // the PDP stepper is pure client state until Add to Cart).
  for (let i = 0; i < 24; i++) {
    await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
    await page.waitForTimeout(90);
  }
  const probe = await page.evaluate(() => {
    const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
    const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
    const c = b?.parentElement;
    const span = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
    return {
      qty: span?.textContent?.trim(),
      plusDisabled: p?.disabled === true,
      plusOpacity: p ? getComputedStyle(p).opacity : null,
      minusDisabled: b?.disabled === true,
    };
  });
  console.log("[260 probe]", JSON.stringify(probe));
  const box = await page.getByRole("button", { name: "Add to Cart" }).first().boundingBox();
  if (box) {
    await page.screenshot({ path: `${OUT}/260-pdp-plus-at-stock-ceiling.png`, clip: { x: Math.max(0, box.x - 380), y: Math.max(0, box.y - 16), width: Math.min(1280, 720), height: 100 } });
  } else {
    await page.screenshot({ path: `${OUT}/260-pdp-plus-at-stock-ceiling.png`, fullPage: true });
  }
}

await browser.close();
killPort(PROD_PORT);
console.log("\nCAPTURES COMPLETE — 256-260 in " + OUT);
