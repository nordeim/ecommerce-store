#!/usr/bin/env node
// Round-58 captures 301-305: the search panel family — (301) the panel
// OPEN at 1024w (the three-child form: the input + the sm Search button +
// the X close button — the round's headline anatomy), (302) the X's HOVER
// state (the accent pair held through the capture), (303) the mid-EXIT
// collapse (the ~+120ms frame — the height collapsing with the fade), (304)
// the enter fade's SETTLED state (the panel fully open, the input focused
// with its ring), (305) the superset typeahead POPOVER (typing "serum" —
// the suggestion row whole and unclipped). Probe-first (the DOM-probed
// facts recorded for each capture — the descriptions cite probed facts
// only); single invocation, the production standalone on :3001 — a FRESH
// process. Read-only (no cart mutations — the DB left as found trivially).
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

// login (the demo user)
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

// ---------- 301: the panel OPEN (the three-child form) ----------
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(600); // the enter fade settles
const probe301 = await page.evaluate(() => {
  const form = document.querySelector("header form");
  const input = document.querySelector("header input");
  const btns = form ? [...form.querySelectorAll("button")] : [];
  const search = btns.find((b) => b.textContent?.trim() === "Search");
  const x = btns[btns.length - 1];
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const r = (el) => (el ? el.getBoundingClientRect() : null);
  return {
    formChildren: form?.children.length,
    inputW: Math.round(r(input)?.width ?? 0),
    searchBtn: search ? `${Math.round(r(search).width)}x${Math.round(r(search).height)} ${cs(search).fontSize}/${cs(search).fontWeight} bg ${cs(search).backgroundColor}` : null,
    xBtn: x ? `${Math.round(r(x).width)}x${Math.round(r(x).height)} ${cs(x).backgroundColor}` : null,
    stripH: Math.round(document.querySelector("header div[class*='border-t']")?.getBoundingClientRect().height ?? 0),
  };
});
console.log("301 probe:", JSON.stringify(probe301));
await page.screenshot({ path: `${OUT}/301-searchpanel-open-three-child-form.png` });

// ---------- 302: the X's hover (the accent pair) ----------
const xBtn = page.locator('header form button[aria-label="Close search"]');
await xBtn.hover();
await page.waitForTimeout(400);
const probe302 = await page.evaluate(() => {
  const x = document.querySelector('header form button[aria-label="Close search"]');
  const cs = x ? getComputedStyle(x) : null;
  return x ? { bg: cs.backgroundColor, color: cs.color } : null;
});
console.log("302 probe:", JSON.stringify(probe302));
await page.screenshot({ path: `${OUT}/302-searchpanel-x-hover-accent.png` });

// ---------- 303: the mid-EXIT collapse ----------
// Close via the toggle; capture the ~+120ms frame (the height mid-collapse).
await page.locator('header button[aria-label="Search"]').click(); // toggle close
await page.waitForTimeout(120);
const probe303 = await page.evaluate(() => {
  const strip = document.querySelector("header div[class*='border-t']");
  if (!strip) return { gone: true };
  const cs = getComputedStyle(strip);
  return { h: Math.round(strip.getBoundingClientRect().height), op: cs.opacity, overflow: cs.overflow };
});
console.log("303 probe:", JSON.stringify(probe303));
await page.screenshot({ path: `${OUT}/303-searchpanel-exit-collapse-mid.png` });
// wait out the exit so the next capture starts clean
await page.waitForTimeout(600);

// ---------- 304: the enter fade SETTLED (the focused input + ring) ----------
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(600);
const probe304 = await page.evaluate(() => {
  const input = document.querySelector("header input");
  const strip = document.querySelector("header div[class*='border-t']");
  const cs = input ? getComputedStyle(input) : null;
  return {
    focused: document.activeElement === input,
    ring: cs ? cs.boxShadow.slice(0, 90) : null,
    stripOp: strip ? getComputedStyle(strip).opacity : null,
    stripAnim: strip ? getComputedStyle(strip).animationName + "@" + getComputedStyle(strip).animationDuration : null,
  };
});
console.log("304 probe:", JSON.stringify(probe304));
await page.screenshot({ path: `${OUT}/304-searchpanel-settled-focus-ring.png` });

// ---------- 305: the superset typeahead POPOVER ----------
await page.fill('header input[aria-label="Search products"]', "serum");
await page.waitForResponse((r) => r.url().includes("/api/search"));
await page.waitForTimeout(500);
const probe305 = await page.evaluate(() => {
  const pop = document.querySelector("header .bg-popover");
  if (!pop) return { err: "no popover" };
  const r = pop.getBoundingClientRect();
  const row = pop.querySelector("button");
  return {
    w: Math.round(r.width), h: Math.round(r.height),
    rowH: row ? Math.round(row.getBoundingClientRect().height) : null,
    rowText: row?.textContent?.replace(/\s+/g, " ").trim().slice(0, 60) ?? null,
    stripOverflow: getComputedStyle(document.querySelector("header div[class*='border-t']")).overflow,
  };
});
console.log("305 probe:", JSON.stringify(probe305));
await page.screenshot({ path: `${OUT}/305-searchpanel-typeahead-popover.png` });

await browser.close();
killPort(PROD_PORT);
console.log("CAPTURES 301-305 COMPLETE");
