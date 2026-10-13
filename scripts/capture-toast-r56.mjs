#!/usr/bin/env node
// Round-56 captures 291-295: the toast animation family — (291) the toast
// at rest (the full anatomy: the dark rounded-xl item, the orange
// CircleCheckBig, the corner position), (292) the toast mid-enter (the
// from-pose in flight — ty > 0, o < 1, THE FIX #1's visible effect), (293)
// the settled geometry (the tight corner crop — 320x64 at bottom-6
// right-6), (294) the toast mid-exit (+150ms past the first moving frame —
// the ease-out fade, o <= 0.40, THE FIX #2's visible effect), (295) the
// stacked pair (two toasts, the gap-8 column). Probe-first, single
// invocation, the production standalone on :3001 — a FRESH process. The
// captures add cart items; the script REMOVES them via the drawer (the DB
// left as found, verified — the r56 sweep-residue lesson mechanized).
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
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "capture-r56-secret" },
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
await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

const readItem = () =>
  page.evaluate(() => {
    const region = document.querySelector("div.fixed.bottom-6.right-6");
    const it = region && region.children[0];
    if (!it) return null;
    const cs = getComputedStyle(it);
    const r = it.getBoundingClientRect();
    return {
      text: it.textContent,
      o: +(+cs.opacity).toFixed(3),
      transform: cs.transform,
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      bg: cs.backgroundColor, radius: cs.borderRadius,
      kids: region.children.length,
    };
  });
const parseTy = (m) => {
  if (!m || m === "none") return 0;
  const v = m.match(/matrix\(([^)]+)\)/);
  return v ? +(v[1].split(",").map(Number)[5]).toFixed(2) : 0;
};

// (291 + 293) the toast AT REST — add one, wait for the settle (~450ms),
// probe, then capture: 291 the wide corner view, 293 the tight crop.
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(450);
const rest = await readItem();
console.log("291/293 probe (rest):", JSON.stringify(rest));
await page.screenshot({ path: `${OUT}/291-toast-rest-anatomy.png`, clip: { x: 624, y: 600, width: 400, height: 168 } });
await page.screenshot({ path: `${OUT}/293-toast-rest-corner-geometry.png`, clip: { x: 656, y: 656, width: 368, height: 112 } });

// wait out the first toast's life (unmount at ~3.4s) before the next cycle
await page.waitForTimeout(3100);

// (292) the toast MID-ENTER — the from-pose in flight. Install a
// move-marker, click, capture ~55ms in (the probe brackets the shot).
await page.evaluate(() => {
  window.__move = null;
  const mo = new MutationObserver(() => {
    const region = document.querySelector("div.fixed.bottom-6.right-6");
    if (window.__move || !region || region.children.length < 1) return;
    window.__move = performance.now();
    mo.disconnect();
  });
  mo.observe(document.body, { childList: true, subtree: true });
});
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(55);
const midEnter = await readItem();
await page.screenshot({ path: `${OUT}/292-toast-mid-enter-from-pose.png`, clip: { x: 624, y: 600, width: 400, height: 168 } });
console.log("292 probe (mid-enter, ~55ms):", JSON.stringify(midEnter));

// (294) the toast MID-EXIT — the ease-out fade. The first toast from 292
// is still alive; wait to ~2.9s past its insertion, then watch for the
// first moving frame and capture ~+140ms later (o ~0.25 post-fix).
const exitShot = await page.evaluate(async () => {
  const t0 = window.__move;
  await new Promise((r) => setTimeout(r, Math.max(0, 2850 - (performance.now() - t0))));
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    setTimeout(() => finish("(timeout)"), 6000);
    const poll = () => {
      if (done) return;
      const region = document.querySelector("div.fixed.bottom-6.right-6");
      const it = region && region.children[0];
      if (!it) { finish("(gone)"); return; }
      if (it.classList.contains("toast-exiting")) {
        const cs = getComputedStyle(it);
        if (+cs.opacity < 0.999 || cs.transform !== "matrix(1, 0, 0, 1, 0, 0)") {
          finish(performance.now());
          return;
        }
      }
      setTimeout(poll, 16);
    };
    setTimeout(poll, 16);
  });
});
await page.waitForTimeout(140);
const midExit = await readItem();
await page.screenshot({ path: `${OUT}/294-toast-mid-exit-fade.png`, clip: { x: 624, y: 580, width: 400, height: 188 } });
console.log("294 probe (mid-exit, +140ms past first move:", exitShot, "):", JSON.stringify(midExit));

// wait out this toast's remaining life
await page.waitForTimeout(3200);

// (295) the STACKED PAIR — two rapid adds, both resting, the gap-8 column.
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(450);
const stackProbe = await page.evaluate(() => {
  const region = document.querySelector("div.fixed.bottom-6.right-6");
  const kids = [...(region?.children ?? [])];
  return {
    kids: kids.length,
    gap: region ? getComputedStyle(region).rowGap : null,
    boxes: kids.map((k) => {
      const r = k.getBoundingClientRect();
      return { y: Math.round(r.y), h: Math.round(r.height), o: +(+getComputedStyle(k).opacity).toFixed(2) };
    }),
  };
});
await page.screenshot({ path: `${OUT}/295-toast-stack-pair.png`, clip: { x: 624, y: 560, width: 400, height: 208 } });
console.log("295 probe (stack):", JSON.stringify(stackProbe));

// wait out the pair's life, then CLEAN UP: remove the cart items via the
// drawer — the DB left as found (the r56 sweep-residue lesson mechanized).
await page.waitForTimeout(3400);
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
console.log("cleanup probe (the cart left as found):", JSON.stringify(cleanup));

await prod.kill();
killPort(PROD_PORT);
await browser.close();
console.log("captures 291-295 complete");
