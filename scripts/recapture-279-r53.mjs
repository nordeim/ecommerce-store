#!/usr/bin/env node
// Round-53 re-capture of 279 ONLY: the first capture's page had seen REAL
// mouse interaction (the 277 hover + the 278 click), so Chromium's
// :focus-visible heuristic rejected the script focus (outline-style none —
// nothing rendered). The fix: a FRESH page load (pointer-clean), then an
// immediate script focus — the exact method the P4 pin uses (15/15 green).
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
// FRESH load — no mouse events on this page, ever (the pointer-clean state).
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(2600);

const heroBox = await page.locator('[aria-roledescription="carousel"]').boundingBox();
const clip = { x: Math.round(heroBox.x), y: Math.round(heroBox.y), width: Math.round(heroBox.width), height: Math.round(heroBox.height) };

// Pause the auto-advance WITHOUT a mouse event: the dwell would taint the
// pointer-clean state. Instead read fast — the 5s cadence gives a wide
// margin (the probe + capture take < 1.5s).
const prevLoc = page.locator('button[aria-label="Previous slide"]');
const focusProbe = await prevLoc.evaluate((el) => {
  el.focus();
  const cs = getComputedStyle(el);
  return { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, boxShadow: cs.boxShadow };
});
console.log("[279 re-capture probe]", JSON.stringify(focusProbe));
if (focusProbe.outlineStyle === "none") {
  console.error("STILL NOT FOCUS-VISIBLE — capturing anyway for the record");
}
await page.screenshot({ path: `${OUT}/279-heronav-arrow-focused.png`, clip: { x: clip.x, y: clip.y + clip.height / 2 - 120, width: 320, height: 240 } });

await browser.close();
killPort(PROD_PORT);
try { prod.kill("SIGKILL"); } catch {}
console.log("279 RE-CAPTURED");
