#!/usr/bin/env node
// Round-51 re-capture of 270 ONLY: the first capture scrolled to y=600
// where a WHITE section sits behind the sticky header — the frosted-glass
// effect was invisible (nothing colorful to blur) and the VLM read it as
// "solid light gray". This re-capture scrolls to the HERO region (y=350)
// so colorful photo content passes beneath the frosted bar. The DOM probe
// (blur 24px + bg /0.8) is unchanged — only the visual context improves.
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
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db" },
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
await page.evaluate(() => window.scrollTo(0, 350));
await page.waitForTimeout(900);
const probe = await page.evaluate(() => {
  const h = document.querySelector("header");
  const cs = getComputedStyle(h);
  return { scrollY: window.scrollY, position: cs.position, blur: cs.backdropFilter, bg: cs.backgroundColor };
});
console.log("[270 re-capture probe]", JSON.stringify(probe));
await page.screenshot({ path: `${OUT}/270-sticky-header-blur-xl.png`, clip: { x: 0, y: 0, width: 1280, height: 220 } });
await browser.close();
killPort(PROD_PORT);
try { prod.kill("SIGKILL"); } catch {}
console.log("270 RE-CAPTURED");
