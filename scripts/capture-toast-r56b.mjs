#!/usr/bin/env node
// Round-56 RE-CAPTURES for 292 + 294 (the screenshot-latency lesson): a
// Playwright screenshot rasterizes 100-250ms AFTER the call — past the
// 300ms animation's window. The mid-animation states are therefore captured
// with the FREEZE technique: probe the LIVE computed mid-animation state,
// then freeze the element at EXACTLY those probed values (inline style +
// transition:none), capture at leisure, restore. The portrait is faithful —
// every frozen value is a live measurement, and the capture script prints
// them for the VLM description.
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
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "capture-r56b-secret" },
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
console.log("login ok");

const page = await ctx.newPage();
await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

// (292) MID-ENTER, frozen at the live probed state: click, wait ~55ms,
// read the computed pose, freeze, capture, verify the blend by pixels.
await page.evaluate(() => {
  window.__ins = null;
  const mo = new MutationObserver(() => {
    const region = document.querySelector("div.fixed.bottom-6.right-6");
    if (window.__ins || !region || region.children.length < 1) return;
    window.__ins = performance.now();
    mo.disconnect();
  });
  mo.observe(document.body, { childList: true, subtree: true });
});
await page.getByRole("button", { name: "Add to Cart" }).first().click();
const enterFrozen = await page.evaluate(async () => {
  // The t0 poll (the P9/P10 lesson — the click resolves BEFORE the MO fires)
  const t0 = await new Promise((resolve) => {
    const check = () => {
      if (window.__ins) resolve(window.__ins);
      else setTimeout(check, 8);
    };
    check();
  });
  await new Promise((r) => setTimeout(r, Math.max(0, 55 - (performance.now() - t0))));
  const region = document.querySelector("div.fixed.bottom-6.right-6");
  const it = region && region.children[0];
  if (!it) return null;
  const cs = getComputedStyle(it);
  const pose = { transform: cs.transform, o: +(+cs.opacity).toFixed(3) };
  // FREEZE at the probed state
  it.style.transition = "none";
  it.style.transform = pose.transform;
  it.style.opacity = String(pose.o);
  const r = it.getBoundingClientRect();
  return { ...pose, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
});
if (enterFrozen) {
  await page.screenshot({ path: `${OUT}/292-toast-mid-enter-from-pose.png`, clip: { x: Math.max(0, enterFrozen.x - 16), y: Math.max(0, enterFrozen.y - 16), width: enterFrozen.w + 32, height: enterFrozen.h + 32 } });
}
console.log("292 re-capture (frozen at the live probed pose):", JSON.stringify(enterFrozen));

// restore + wait out the toast's life, then reset the insertion marker
await page.evaluate(() => {
  const region = document.querySelector("div.fixed.bottom-6.right-6");
  const it = region && region.children[0];
  if (it) { it.style.transition = ""; it.style.transform = ""; it.style.opacity = ""; }
});
await page.waitForTimeout(3500);

// (294) MID-EXIT, frozen at the live probed state: click, watch for the
// first moving frame, wait ~+140ms, read, freeze, capture.
await page.evaluate(() => {
  window.__ins = null;
  const mo = new MutationObserver(() => {
    const region = document.querySelector("div.fixed.bottom-6.right-6");
    if (window.__ins || !region || region.children.length < 1) return;
    window.__ins = performance.now();
    mo.disconnect();
  });
  mo.observe(document.body, { childList: true, subtree: true });
});
await page.getByRole("button", { name: "Add to Cart" }).first().click();
const exitFrozen = await page.evaluate(async () => {
  // The t0 poll (the P9/P10 lesson — the click resolves BEFORE the MO fires)
  const t0 = await new Promise((resolve) => {
    const check = () => {
      if (window.__ins) resolve(window.__ins);
      else setTimeout(check, 8);
    };
    check();
  });
  // wait for the exit's first moving frame (the class + the animated value)
  const moved = await new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    setTimeout(() => finish(null), 6000);
    const poll = () => {
      if (done) return;
      const region = document.querySelector("div.fixed.bottom-6.right-6");
      const it = region && region.children[0];
      if (!it) { finish(null); return; }
      if (it.classList.contains("toast-exiting")) {
        const cs = getComputedStyle(it);
        if (+cs.opacity < 0.999 || cs.transform !== "matrix(1, 0, 0, 1, 0, 0)") { finish(performance.now()); return; }
      }
      setTimeout(poll, 16);
    };
    setTimeout(poll, Math.max(0, 2900 - (performance.now() - t0)));
  });
  if (moved === null) return null;
  await new Promise((r) => setTimeout(r, 140));
  const region = document.querySelector("div.fixed.bottom-6.right-6");
  const it = region && region.children[0];
  if (!it) return { gone: true };
  const cs = getComputedStyle(it);
  const pose = { transform: cs.transform, o: +(+cs.opacity).toFixed(3) };
  it.style.transition = "none";
  it.style.transform = pose.transform;
  it.style.opacity = String(pose.o);
  const r = it.getBoundingClientRect();
  return { ...pose, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
});
if (exitFrozen && !exitFrozen.gone) {
  await page.screenshot({ path: `${OUT}/294-toast-mid-exit-fade.png`, clip: { x: Math.max(0, exitFrozen.x - 16), y: Math.max(0, exitFrozen.y - 16), width: exitFrozen.w + 32, height: exitFrozen.h + 32 } });
}
console.log("294 re-capture (frozen at the live probed pose):", JSON.stringify(exitFrozen));

// restore + wait out + CLEAN UP (the DB left as found)
await page.evaluate(() => {
  const region = document.querySelector("div.fixed.bottom-6.right-6");
  const it = region && region.children[0];
  if (it) { it.style.transition = ""; it.style.transform = ""; it.style.opacity = ""; }
});
await page.waitForTimeout(3200);
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.getByRole("button", { name: /^Cart/ }).click();
await page.getByRole("dialog").waitFor({ state: "visible" });
for (let guard = 0; guard < 10; guard++) {
  const remove = page.getByLabel(/^Remove /).first();
  if (!(await remove.isVisible().catch(() => false))) break;
  await remove.click();
  await page.waitForTimeout(400);
}
const cleanup = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("header button")].find((b) => (b.getAttribute("aria-label") || "").startsWith("Cart"));
  return { aria: btn?.getAttribute("aria-label") ?? null, badge: btn ? btn.querySelectorAll("span").length : -1 };
});
console.log("cleanup probe:", JSON.stringify(cleanup));

await prod.kill();
killPort(PROD_PORT);
await browser.close();
console.log("re-captures 292 + 294 complete");
