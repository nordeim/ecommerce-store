#!/usr/bin/env node
/**
 * Round-52 screenshots (271-275) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The BUY-PANEL-1 round's captures: the PDP buy-panel action family —
 * each screenshot is the visual proof the round's contract holds.
 *
 *   271 — the ACTION ROW at rest: the full family in one frame (the
 *         stepper + qty span + the ATC + the outline heart)
 *   272 — the ATC HOVERED: the /90 tint (the primary at 90% alpha)
 *   273 — the HEART HOVERED: the accent pair (the warm tint + the brown
 *         icon color — the round's key parity confirmation)
 *   274 — the STEPPER'S MINUS HOVERED: the secondary tint + the qty span
 *   275 — the ATC FOCUSED: the orange 1px ring (the keyboard affordance)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * screenshots and BEFORE the VLM descriptions are written. ONE server:
 * the production standalone on :3001 (a FRESH process). ZERO DB mutations
 * — hover/focus states are CSS-only; no cart/wishlist writes anywhere in
 * this script (respected by construction).
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

const ROW_SEL = "main .flex.items-center.gap-4.mb-4";

await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

// ---- 271: the action row at rest ------------------------------------------
{
  const probe = await page.locator(ROW_SEL).first().evaluate((row) => {
    const atc = [...row.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent ?? ""));
    const heart = [...row.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? "").includes("wishlist"));
    return {
      atcBg: getComputedStyle(atc).backgroundColor,
      atcShadowPair: getComputedStyle(atc).boxShadow.includes("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px"),
      heartBorder: getComputedStyle(heart).border,
      spanText: row.querySelector("div.flex.items-center.border > span")?.textContent?.trim(),
    };
  });
  console.log("271 probe:", JSON.stringify(probe));
  await page.locator(ROW_SEL).first().screenshot({ path: `${OUT}/271-buypanel-action-row-resting.png` });
  console.log("271 captured: the action row at rest");
}

// ---- 272: the ATC hovered ---------------------------------------------------
{
  const atc = page.locator(ROW_SEL).getByRole("button", { name: "Add to Cart" });
  await atc.hover();
  await page.waitForTimeout(700);
  const probe = await atc.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, cursor: getComputedStyle(el).cursor }));
  console.log("272 probe:", JSON.stringify(probe));
  await page.locator(ROW_SEL).first().screenshot({ path: `${OUT}/272-buypanel-atc-hovered.png` });
  console.log("272 captured: the ATC hovered (the /90 tint)");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
}

// ---- 273: the heart hovered (THE ACCENT PAIR) ------------------------------
{
  const heart = page.locator(ROW_SEL).getByRole("button", { name: /to wishlist/ });
  await heart.hover();
  await page.waitForTimeout(700);
  const probe = await heart.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, color: cs.color };
  });
  console.log("273 probe:", JSON.stringify(probe));
  await page.locator(ROW_SEL).first().screenshot({ path: `${OUT}/273-buypanel-heart-hovered-accent.png` });
  console.log("273 captured: the heart hovered (the accent pair)");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
}

// ---- 274: the stepper's minus hovered --------------------------------------
{
  const minus = page.getByRole("button", { name: "Decrease quantity" });
  await minus.hover();
  await page.waitForTimeout(700);
  const probe = await minus.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor }));
  console.log("274 probe:", JSON.stringify(probe));
  await page.locator(ROW_SEL).locator("div.flex.items-center.border").screenshot({ path: `${OUT}/274-buypanel-stepper-minus-hovered.png` });
  console.log("274 captured: the stepper's minus hovered (the secondary tint)");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
}

// ---- 275: the ATC focused (the orange ring) --------------------------------
{
  const atc = page.locator(ROW_SEL).getByRole("button", { name: "Add to Cart" });
  const probe = await atc.evaluate((el) => {
    el.focus();
    const shadow = getComputedStyle(el).boxShadow;
    return { focused: document.activeElement === el, ring: shadow.includes("rgb(230, 107, 26) 0px 0px 0px 1px") };
  });
  console.log("275 probe:", JSON.stringify(probe));
  await page.locator(ROW_SEL).first().screenshot({ path: `${OUT}/275-buypanel-atc-focused-ring.png` });
  console.log("275 captured: the ATC focused (the orange ring)");
}

await browser.close();
killPort(PROD_PORT);
console.log("\nCAPTURE ROUND 52 COMPLETE — 271-275 in " + OUT);
