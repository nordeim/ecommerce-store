#!/usr/bin/env node
/**
 * Round-50 screenshots (261-265) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The SHOP-FILTERS-1 round's captures: the shop filter bar's interaction
 * states — each screenshot is the visual proof the round's contract holds.
 *
 *   261 — the FILTERED BAR with the reference-anatomy Clear
 *         (?category=electronics): the ghost/sm Clear at 32px/12px/10px
 *         beside the three triggers (Fix #1's proof state)
 *   262 — the CATEGORY POPOVER open: the 7 reference options with the
 *         active item's check (P4's proof state)
 *   263 — the PRICE POPOVER open: the 5 byte-exact labels (P5's proof)
 *   264 — the SORT POPOVER with the keyboard highlight mid-contract:
 *         ArrowDown on "Price: Low to High" — the accent pair (P8/P12's
 *         proof state)
 *   265 — the BAR SEARCH result (?search=SERUM typed + Enter): the
 *         case-insensitive match + the heading + the count line (P10/P11)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * screenshots and BEFORE the VLM descriptions are written. ONE server: the
 * production standalone on :3001 (a FRESH process). ZERO DB mutations —
 * filters are URL state; no cart/wishlist writes anywhere in this script
 * (the round-49 dev-DB hygiene lesson, respected by construction).
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

// ---- 261: the filtered bar with the reference-anatomy Clear ----------------
{
  await page.goto(`${PROD}/shop?category=electronics`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800); // hydration: SelectValue fills after mount
  const probe = await page.evaluate(() => {
    const clear = [...document.querySelectorAll("main button")].find((b) =>
      /^clear$/i.test(b.textContent.trim()),
    );
    const combos = [...document.querySelectorAll("button[role='combobox']")];
    const cs = clear ? getComputedStyle(clear) : null;
    return {
      clearClasses: clear?.getAttribute("class"),
      clearH: cs?.height,
      clearFont: cs?.fontSize,
      clearRadius: cs?.borderRadius,
      clearColor: cs?.color,
      svgClasses: clear?.querySelector("svg")?.getAttribute("class"),
      svgSize: clear?.querySelector("svg") ? getComputedStyle(clear.querySelector("svg")).width : null,
      triggers: combos.map((b) => b.textContent.trim()),
      count: document.querySelector("main p")?.textContent?.trim(),
    };
  });
  console.log("[261 probe]", JSON.stringify(probe));
  const box = await page
    .locator("main button")
    .filter({ hasText: /^Clear$/ })
    .first()
    .boundingBox();
  if (box) {
    await page.screenshot({
      path: `${OUT}/261-filtered-bar-reference-clear.png`,
      clip: { x: 0, y: Math.max(0, box.y - 120), width: 1280, height: Math.min(900, box.y - Math.max(0, box.y - 120) + box.height + 60) },
    });
  } else {
    await page.screenshot({ path: `${OUT}/261-filtered-bar-reference-clear.png`, fullPage: false });
  }
}

// ---- 262: the category popover open (the 7 options + the active check) -----
{
  await page.goto(`${PROD}/shop`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.getByRole("combobox").nth(0).click();
  await page.waitForTimeout(600); // the entrance animation settles
  const probe = await page.evaluate(() => {
    const pop = document.querySelector("[role='listbox']");
    const items = pop ? [...pop.querySelectorAll("[role='option']")] : [];
    return {
      radius: pop ? getComputedStyle(pop).borderRadius : null,
      options: items.map((o) => ({
        t: o.textContent.trim(),
        selected: o.getAttribute("aria-selected"),
        check: !!o.querySelector("svg"),
      })),
    };
  });
  console.log("[262 probe]", JSON.stringify(probe));
  await page.screenshot({ path: `${OUT}/262-category-popopen-seven-options.png`, fullPage: false });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

// ---- 263: the price popover open (the 5 byte-exact labels) -----------------
{
  await page.getByRole("combobox").nth(1).click();
  await page.waitForTimeout(600);
  const probe = await page.evaluate(() =>
    [...document.querySelectorAll("[role='listbox'] [role='option']")].map((o) => ({
      t: o.textContent.trim(),
      selected: o.getAttribute("aria-selected"),
    })),
  );
  console.log("[263 probe]", JSON.stringify(probe));
  await page.screenshot({ path: `${OUT}/263-price-popover-five-labels.png`, fullPage: false });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

// ---- 264: the sort popover with the keyboard highlight (the accent pair) ---
{
  await page.getByRole("combobox").nth(2).click();
  await page.waitForTimeout(600);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(350); // the highlight move settles
  const probe = await page.evaluate(() => {
    const it = [...document.querySelectorAll("[role='listbox'] [role='option']")].find(
      (o) => o.getAttribute("data-highlighted") === "",
    );
    if (!it) return { found: false };
    const cs = getComputedStyle(it);
    return { found: true, t: it.textContent.trim(), bg: cs.backgroundColor, color: cs.color };
  });
  console.log("[264 probe]", JSON.stringify(probe));
  await page.screenshot({ path: `${OUT}/264-sort-popover-keyboard-highlight.png`, fullPage: false });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

// ---- 265: the bar search result (SERUM typed + Enter) ----------------------
{
  await page.goto(`${PROD}/shop`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.locator("main input[placeholder='Search products...']").fill("SERUM");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1800);
  const probe = await page.evaluate(() => ({
    url: location.pathname + location.search,
    heading: document.querySelector("main h1")?.textContent?.trim(),
    count: document.querySelector("main p")?.textContent?.trim(),
    inputValue: document.querySelector("main input[placeholder='Search products...']")?.value,
    clearVisible: [...document.querySelectorAll("main button")].some((b) =>
      /^clear$/i.test(b.textContent.trim()),
    ),
  }));
  console.log("[265 probe]", JSON.stringify(probe));
  await page.screenshot({ path: `${OUT}/265-bar-search-serum-result.png`, fullPage: false });
}

await browser.close();
killPort(PROD_PORT);
console.log("\nCAPTURES 261-265 DONE — zero DB mutations by construction");
