#!/usr/bin/env node
// Round-58 re-capture of 303 (the mid-exit collapse) — v3, the r56b FREEZE
// technique: the first capture fired too late (the animation ended); the
// second fired too early (the click resolves before the React commit —
// the L34 lesson). The freeze: at ~+100ms into the exit, READ the strip's
// live computed pose (height + opacity), then LOCK it with explicit inline
// styles + transition:none (the frozen portrait IS the mid-animation
// state), capture at leisure, restore. Read-only.
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
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "capture-r58-secret" },
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
const lp = await ctx.newPage();
await lp.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await lp.waitForLoadState("networkidle");
await lp.close();

const page = await ctx.newPage();
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// open the panel and let the enter settle
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(600);

// close via the toggle; at ~+100ms read the live pose and FREEZE it.
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(100);
const frozen = await page.evaluate(() => {
  const strip = document.querySelector("header div[class*='border-t']");
  if (!strip) return { gone: true };
  const cs = getComputedStyle(strip);
  const h = Math.round(strip.getBoundingClientRect().height);
  const op = cs.opacity;
  // FREEZE at the probed pose (the r56b technique)
  strip.style.transition = "none";
  strip.style.height = `${h}px`;
  strip.style.opacity = op;
  return { h, op, overflow: cs.overflow };
});
console.log("303 frozen pose:", JSON.stringify(frozen));
await page.screenshot({ path: `${OUT}/303-searchpanel-exit-collapse-mid.png` });

// restore so the timeout unmount proceeds normally (the inline locks
// would otherwise pin the element open past its unmount — the effect's
// cleanup clears the same properties, but do it explicitly here).
await page.evaluate(() => {
  const strip = document.querySelector("header div[class*='border-t']");
  if (strip) {
    strip.style.transition = "";
    strip.style.height = "";
    strip.style.opacity = "";
  }
});
await page.waitForTimeout(600);
const afterRestore = await page.evaluate(() => {
  const input = document.querySelector("header input");
  return { inputGone: !input };
});
console.log("303 after restore (input gone):", JSON.stringify(afterRestore));

await browser.close();
killPort(PROD_PORT);
console.log("RE-CAPTURE 303 (frozen) COMPLETE");
