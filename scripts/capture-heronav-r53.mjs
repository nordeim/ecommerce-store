#!/usr/bin/env node
// Round-53 captures 276-280: the hero carousel's dot/arrow interaction
// family — (276) the control layer at rest, (277) the prev arrow hovered
// (the /0.3 tint), (278) dot 3 activated (the 32px pill + 8px inactives),
// (279) the arrow focused (the ring/50 outline), (280) the crossfade
// mid-transition (two slides at intermediate opacity — the superset's
// signature). Probe-first, single invocation, the production standalone on
// :3001 — a FRESH process, ZERO DB mutations by construction.
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
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "capture-r53-secret" },
  stdio: "ignore",
});
let up = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {}
  if (up) break; await sleep(1000);
}
if (!up) { console.error("standalone never came up"); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(2600);

// the hero's bounding box (the clip basis)
const heroBox = await page.locator('[aria-roledescription="carousel"]').boundingBox();
const clip = { x: Math.max(0, Math.round(heroBox.x)), y: Math.max(0, Math.round(heroBox.y)), width: Math.min(1280, Math.round(heroBox.width)), height: Math.min(900, Math.round(heroBox.height)) };
console.log("[hero box]", JSON.stringify(clip));

// (276) the control layer at rest — pause the auto-advance with a real
// dwell first (a stable frame), then probe + capture.
await page.mouse.move(clip.x + clip.width / 2, clip.y + clip.height / 2);
await sleep(400);
const rest = await page.evaluate(() => {
  const prev = document.querySelector('button[aria-label="Previous slide"]');
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  const active = dots.find((d) => d.getAttribute("aria-current") === "true");
  return {
    prevBg: getComputedStyle(prev).backgroundColor,
    prevW: prev.offsetWidth,
    activeDotW: active.offsetWidth,
    activeDotBg: getComputedStyle(active).backgroundColor,
    inactiveW: dots.find((d) => d !== active).offsetWidth,
  };
});
console.log("[276 probe: at rest]", JSON.stringify(rest));
await page.screenshot({ path: `${OUT}/276-heronav-controls-resting.png`, clip });
await page.mouse.move(5, 5);
await sleep(300);

// (277) the prev arrow hovered — the /0.3 tint
const prevLoc = page.locator('button[aria-label="Previous slide"]');
await prevLoc.hover();
await sleep(700);
const hoverProbe = await prevLoc.evaluate((el) => getComputedStyle(el).backgroundColor);
console.log("[277 probe: hovered bg]", hoverProbe);
await page.screenshot({ path: `${OUT}/277-heronav-arrow-hovered.png`, clip: { x: clip.x, y: clip.y + clip.height / 2 - 120, width: 320, height: 240 } });
await page.mouse.move(5, 5);
await sleep(300);

// (278) dot 3 activated — the 32px pill + the 8px inactives
const dot3 = page.locator("button[aria-label^='Go to slide']").nth(2);
await dot3.click();
await sleep(700); // the 0.3s morph settles
const dotProbe = await page.evaluate(() => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  return dots.map((d) => ({ w: d.offsetWidth, bg: getComputedStyle(d).backgroundColor, cur: d.getAttribute("aria-current") }));
});
console.log("[278 probe: dots after click]", JSON.stringify(dotProbe));
await page.screenshot({ path: `${OUT}/278-heronav-dot3-activated.png`, clip: { x: clip.x + clip.width / 2 - 200, y: clip.y + clip.height - 80, width: 400, height: 80 } });

// (279) the arrow focused — the ring/50 outline (keyboard affordance).
// Pointer-clean page + script focus = :focus-visible in Chromium's UA
// heuristic; the outline is read BEFORE any state change (L58).
await page.mouse.move(5, 5);
await sleep(200);
const focusProbe = await prevLoc.evaluate((el) => {
  el.focus();
  const cs = getComputedStyle(el);
  const out = { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor };
  return out; // el stays focused for the capture
});
console.log("[279 probe: focus outline]", JSON.stringify(focusProbe));
await page.screenshot({ path: `${OUT}/279-heronav-arrow-focused.png`, clip: { x: clip.x, y: clip.y + clip.height / 2 - 120, width: 320, height: 240 } });
await page.evaluate(() => { const el = document.querySelector('button[aria-label="Previous slide"]'); if (el) el.blur(); });
await sleep(200);

// (280) the crossfade mid-transition — click next and capture ~300ms into
// the 700ms fade (two slides at intermediate opacity).
await page.locator('button[aria-label="Next slide"]').click();
await sleep(300);
const fadeProbe = await page.evaluate(() => {
  const hero = document.querySelector('[aria-roledescription="carousel"]');
  const slides = [...hero.querySelectorAll("img")].map((im) => ({
    op: getComputedStyle(im.parentElement).opacity,
    src: (im.currentSrc || im.src).split("/").pop().slice(0, 24),
  }));
  return slides;
});
console.log("[280 probe: mid-fade opacities]", JSON.stringify(fadeProbe));
await page.screenshot({ path: `${OUT}/280-heronav-crossfade-midtransition.png`, clip });
await sleep(600); // let the fade settle before teardown

await browser.close();
killPort(PROD_PORT);
try { prod.kill("SIGKILL"); } catch {}
console.log("CAPTURES 276-280 DONE");
