#!/usr/bin/env node
/**
 * Round-46 screenshots (241-245) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The SEARCH-BEHAVIOR-1 round's captures: the search family's behavioral
 * surfaces — each screenshot is the visual proof the round's contract holds.
 *
 *   241 — the search panel's RESTING anatomy (the standing round anchor:
 *         the border-t strip with the input + the Search button, empty)
 *   242 — the typeahead's LOADING state (the deferred /api/search holds ~1.5s;
 *         the "Searching…" line in the popover while the fetch is in flight —
 *         the state machine's in-flight branch)
 *   243 — the typeahead's SUGGESTION popover (the serum row — the name, the
 *         lowercase category, the price; the loaded branch)
 *   244 — the REOPENED panel with the PRESERVED query + the cached popover
 *         (Escape-close → toggle-reopen: the input STILL carries "serum" and
 *         the popover re-appears — the round's parity fix #1's proof state;
 *         measured live on the reference: the query survives close/reopen)
 *   245 — the results page's PLURAL count copy (/shop?search=wireless →
 *         "2 products found" — the reference-measured plural template)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * VLM descriptions are written. ONE server: the production standalone on
 * :3001 (a FRESH process). ZERO mutations (the search family is read-only —
 * no dev-cleanup needed this round).
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
for (let i = 0; i < 60 && !prodUp; i++) {
  await sleep(1000);
  try { const r = await fetch(`${PROD}/api/health`); prodUp = (await r.json()).ok === true; } catch {}
}
if (!prodUp) { console.error("production standalone never came up on :3001"); process.exit(1); }
console.log("production standalone up on :3001");

const browser = await chromium.launch();
const probe = {};

// The search family is PUBLIC — no login needed (and zero residue).
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });

const toggle = page.locator('header button[aria-label="Search"]');

// ---- 241: the panel's resting anatomy (the standing anchor) ----------------
await toggle.click();
await page.waitForTimeout(900); // the focus effect + the slide-in
probe.s241 = await page.evaluate(() => {
  const input = document.querySelector("header input");
  return {
    inputVisible: !!input,
    value: input?.value ?? null,
    placeholder: input?.getAttribute("placeholder") ?? null,
    searchBtn: !!document.querySelector("header form button"),
  };
});
await page.screenshot({ path: `${OUT}/241-search-panel-resting.png` });
console.log("241 probe:", JSON.stringify(probe.s241));

// ---- 242: the typeahead LOADING state (deferred route) ---------------------
await page.route("**/api/search*", async (route) => {
  await new Promise((r) => setTimeout(r, 1500));
  await route.continue();
});
await page.getByLabel("Search products").fill("serum");
await page.waitForTimeout(500); // debounce (250ms) + the held fetch: mid-flight
probe.s242 = await page.evaluate(() => {
  const popover = document.querySelector("header .bg-popover");
  return {
    popoverVisible: !!popover,
    searchingLine: (document.body.textContent ?? "").includes("Searching…"),
  };
});
await page.screenshot({ path: `${OUT}/242-typeahead-loading.png` });
console.log("242 probe:", JSON.stringify(probe.s242));

// ---- 243: the suggestion popover (the loaded branch) -----------------------
const suggestion = page.locator("header button").filter({ hasText: "Vitamin C Serum" });
await suggestion.waitFor({ state: "visible", timeout: 15000 });
await page.waitForTimeout(400);
probe.s243 = await page.evaluate(() => {
  const row = [...document.querySelectorAll("header .bg-popover button")].find((b) =>
    (b.textContent ?? "").includes("Vitamin C Serum"),
  );
  return {
    rowVisible: !!row,
    rowText: row?.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ?? null,
    categoryLowercase: row?.textContent?.includes("beauty") ?? false,
  };
});
await page.screenshot({ path: `${OUT}/243-typeahead-suggestion.png` });
console.log("243 probe:", JSON.stringify(probe.s243));
await page.unroute("**/api/search*");

// ---- 244: the reopened panel — the PRESERVED query + cached popover --------
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
const closedInput = await page.evaluate(() => !!document.querySelector("header input"));
await toggle.click(); // reopen (the toggle-close parity is exercised in the spec's P4)
await page.waitForTimeout(900);
probe.s244 = await page.evaluate(() => {
  const input = document.querySelector("header input");
  const popover = document.querySelector("header .bg-popover");
  const row = popover
    ? [...popover.querySelectorAll("button")].find((b) => (b.textContent ?? "").includes("Vitamin C Serum"))
    : null;
  return {
    inputVisible: !!input,
    preservedValue: input?.value ?? null,
    cachedPopover: !!row,
  };
});
probe.s244.wasClosedBeforeReopen = closedInput === false;
await page.screenshot({ path: `${OUT}/244-reopen-preserved-query.png` });
console.log("244 probe:", JSON.stringify(probe.s244));

// ---- 245: the results page's PLURAL count copy -----------------------------
await page.goto(`${PROD}/shop?search=wireless`, { waitUntil: "networkidle" });
probe.s245 = await page.evaluate(() => {
  const main = document.querySelector("main");
  const text = main?.textContent?.replace(/\s+/g, " ") ?? "";
  return {
    heading: main?.querySelector("h1")?.textContent?.trim() ?? null,
    countLine: text.match(/\d+ products? found/)?.[0] ?? null,
    headphones: text.includes("Wireless Noise-Cancelling Headphones"),
    chargingPad: text.includes("Wireless Charging Pad"),
  };
});
await page.screenshot({ path: `${OUT}/245-results-plural-copy.png` });
console.log("245 probe:", JSON.stringify(probe.s245));

await browser.close();
killPort(PROD_PORT);
console.log("CAPTURES DONE: 241-245");
