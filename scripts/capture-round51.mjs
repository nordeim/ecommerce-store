#!/usr/bin/env node
/**
 * Round-51 screenshots (266-270) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The CARD-HOVER-1 round's captures: the product card's hover family —
 * each screenshot is the visual proof the round's contract holds.
 *
 *   266 — the HOVERED CARD: the full hover contract in one frame (the
 *         shadow-xl lift, the 1.05 zoom, the revealed Add to Cart bar,
 *         the orange title)
 *   267 — the RESTING CARD: the shadow-sm baseline, the addbar hidden
 *         (translate 0px 100%), the zoom none
 *   268 — the HEART at rest: the blur fix's surface (the 4px frosted
 *         glass over the photo — Fix #1's proof state)
 *   269 — the HERO badge + arrows: the md blur sites (12px)
 *   270 — the STICKY HEADER over scrolled content: the xl blur site (24px)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * screenshots and BEFORE the VLM descriptions are written. ONE server:
 * the production standalone on :3001 (a FRESH process). ZERO DB mutations
 * — hover states are CSS-only; no cart/wishlist writes anywhere in this
 * script (respected by construction).
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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// ---- 266/267: the hovered card + the resting card ------------------------
{
  await page.goto(`${PROD}/shop`, { waitUntil: "networkidle" });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(1200);

  // RESTING first (267's probe) — no hover yet
  const restProbe = await page.evaluate(() => {
    const link = document.querySelector("main a[href^='/product/']");
    const card = link.closest("div");
    let root = card; for (let i = 0; i < 2 && root.parentElement; i++) root = root.parentElement;
    const heart = [...root.querySelectorAll("button")].find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
    const btn = [...root.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
    const wrap = btn.closest("div.absolute");
    return {
      shadow: getComputedStyle(root).boxShadow.slice(0, 80),
      zoom: getComputedStyle(root.querySelector("img")).transform,
      titleColor: getComputedStyle(root.querySelector("h3")).color,
      addbarTranslate: getComputedStyle(wrap).translate,
      heartBlur: getComputedStyle(heart).backdropFilter,
      heartBg: getComputedStyle(heart).backgroundColor,
    };
  });
  console.log("[267 resting probe]", JSON.stringify(restProbe));
  const cardLoc = page.locator("main a[href^='/product/']").first().locator("xpath=ancestor::div[1]");
  await cardLoc.screenshot({ path: `${OUT}/267-resting-card-shadow-sm.png` });

  // HOVERED (266's probe) — the full contract
  await cardLoc.hover();
  await page.waitForTimeout(750); // settle beyond the 500ms zoom
  const hovProbe = await page.evaluate(() => {
    const link = document.querySelector("main a[href^='/product/']");
    const card = link.closest("div");
    let root = card; for (let i = 0; i < 2 && root.parentElement; i++) root = root.parentElement;
    const btn = [...root.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
    const wrap = btn.closest("div.absolute");
    return {
      shadow: getComputedStyle(root).boxShadow.slice(0, 110),
      zoom: getComputedStyle(root.querySelector("img")).scale,
      titleColor: getComputedStyle(root.querySelector("h3")).color,
      addbarTranslate: getComputedStyle(wrap).translate,
      btnBg: getComputedStyle(btn).backgroundColor,
    };
  });
  console.log("[266 hovered probe]", JSON.stringify(hovProbe));
  await cardLoc.screenshot({ path: `${OUT}/266-hovered-card-full-contract.png` });
}

// ---- 268: the heart at rest (the blur fix's surface) ----------------------
{
  await page.mouse.move(8, 500); // de-hover everything
  await page.waitForTimeout(700);
  const heartProbe = await page.evaluate(() => {
    const link = document.querySelector("main a[href^='/product/']");
    const card = link.closest("div");
    let root = card; for (let i = 0; i < 2 && root.parentElement; i++) root = root.parentElement;
    const heart = [...root.querySelectorAll("button")].find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
    const cs = getComputedStyle(heart);
    const svg = heart.querySelector("svg");
    return {
      blur: cs.backdropFilter, bg: cs.backgroundColor, size: `${cs.width}x${cs.height}`,
      svgColor: getComputedStyle(svg).color, cls: heart.className.slice(0, 100),
    };
  });
  console.log("[268 heart probe]", JSON.stringify(heartProbe));
  const cardLoc = page.locator("main a[href^='/product/']").first().locator("xpath=ancestor::div[1]");
  const heartLoc = cardLoc.locator("button.absolute").first();
  const box = await heartLoc.boundingBox();
  if (box) {
    await page.screenshot({
      path: `${OUT}/268-heart-blur4px-resting.png`,
      clip: { x: Math.max(0, box.x - 90), y: Math.max(0, box.y - 90), width: box.width + 180, height: box.height + 180 },
    });
  }
}

// ---- 269: the hero badge + arrows (the md blur sites) ---------------------
{
  await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(2600); // hero entrance
  const heroProbe = await page.evaluate(() => {
    const badge = document.querySelector("span.rounded-full.mb-4");
    const arrows = [...document.querySelectorAll("button")].filter((b) => {
      const cs = getComputedStyle(b);
      return cs.position === "absolute" && cs.backdropFilter !== "none";
    });
    return {
      badgeText: badge?.textContent?.trim(),
      badgeBlur: badge ? getComputedStyle(badge).backdropFilter : null,
      arrows: arrows.map((a) => getComputedStyle(a).backdropFilter),
    };
  });
  console.log("[269 hero probe]", JSON.stringify(heroProbe));
  const heroEl = page.locator("section, main").first();
  await page.screenshot({ path: `${OUT}/269-hero-blur-md-sites.png`, clip: { x: 0, y: 0, width: 1280, height: 560 } });
}

// ---- 270: the sticky header over scrolled content (the xl blur site) ------
{
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(900);
  const headerProbe = await page.evaluate(() => {
    const h = document.querySelector("header");
    const cs = getComputedStyle(h);
    return { position: cs.position, top: cs.top, blur: cs.backdropFilter, bg: cs.backgroundColor, scrollY: window.scrollY };
  });
  console.log("[270 header probe]", JSON.stringify(headerProbe));
  await page.screenshot({ path: `${OUT}/270-sticky-header-blur-xl.png`, clip: { x: 0, y: 0, width: 1280, height: 220 } });
}

await browser.close();
killPort(PROD_PORT);
try { prod.kill("SIGKILL"); } catch {}
console.log("ROUND-51 CAPTURES COMPLETE: 266-270");
