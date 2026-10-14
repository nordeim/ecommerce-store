// Round-58 CLONE probe B: the search panel's computed geometry on the clone —
// the same axes as the reference probe (search-panel-probe-r58a.mjs):
//   1. the resting (closed) header height
//   2. the panel's full computed set at 1024w: strip, container, form (+ its
//      FULL child enumeration — the reference's input leaves 44px of form
//      width unaccounted), input, Search button
//   3. the enter-animation frames (opacity + transform sampled 50ms x 12)
//   4. the input's focus state after open (the reference auto-focuses)
//   5. the mobile pass at 375w
//   6. the superset popover's own geometry (the typeahead — the reference has
//      none; the clone's own contract): panel, the first suggestion row, its
//      image/name/category/price columns
// Run (via battery): bash scripts/battery-runner.sh search-panel-clone-r58b.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const log = (m) => console.log(m);

const browser = await chromium.launch();

// --- login (the demo user) ---
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
const loginPath = new URL(lp.url()).pathname;
log("clone login -> " + loginPath);
await lp.close();

const page = await ctx.newPage();
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// --- the resting (closed) header geometry ---
const closed = await page.evaluate(() => {
  const header = document.querySelector("header");
  const r = header?.getBoundingClientRect();
  return {
    headerH: r ? Math.round(r.height) : null,
    headerCls: header ? (header.className || "").toString().slice(0, 200) : null,
  };
});
log("RESTING HEADER: " + JSON.stringify(closed));

// --- open the search panel ---
const searchBtn = page.locator('header button[aria-label="Search"]');
await searchBtn.click();
await page.waitForTimeout(300);
await page.waitForTimeout(1200);

// --- the panel's full computed geometry ---
const panel = await page.evaluate(() => {
  const comp = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      cls: (el.className || "").toString().slice(0, 220),
      c: {
        display: cs.display, flexDirection: cs.flexDirection, gap: cs.gap,
        padding: cs.padding, margin: cs.margin, borderTop: cs.borderTop,
        borderBottom: cs.borderBottom, radius: cs.borderRadius,
        bg: cs.backgroundColor, color: cs.color, font: cs.fontSize + "/" + cs.fontWeight,
        animation: cs.animationName + " " + cs.animationDuration + " " + cs.animationTimingFunction,
        transform: cs.transform, opacity: cs.opacity,
        boxShadow: cs.boxShadow.slice(0, 80), height: cs.height,
      },
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  };
  const header = document.querySelector("header");
  const input = header?.querySelector("input");
  const form = header?.querySelector("form");
  const formBtn = form ? [...form.querySelectorAll("button")].find((b) => b.textContent?.trim()) : null;
  const strip = input ? input.closest("div[class*='border-t']") : null;
  const container = input ? input.closest("form")?.parentElement : null;
  const formChildren = form
    ? [...form.children].map((c) => ({
        tag: c.tagName, cls: (c.className || "").toString().slice(0, 80),
        w: Math.round(c.getBoundingClientRect().width),
      }))
    : null;
  return {
    input: comp(input),
    form: comp(form),
    formChildren,
    searchButton: comp(formBtn),
    strip: comp(strip),
    container: comp(container),
    inputPlaceholder: input?.getAttribute("placeholder") ?? null,
    inputAriaLabel: input?.getAttribute("aria-label") ?? null,
    buttonText: formBtn?.textContent?.trim() ?? null,
    activeElement: document.activeElement?.tagName + ":" + (document.activeElement?.getAttribute("aria-label") ?? ""),
  };
});
log("PANEL (settled): " + JSON.stringify(panel, null, 1));

// --- the enter-animation frames (reopen + sample) ---
await searchBtn.click(); // toggle close
await page.waitForTimeout(900);
await searchBtn.click(); // reopen
const anim = await page.evaluate(async () => {
  const header = document.querySelector("header");
  const strip = header?.querySelector("div[class*='border-t']");
  if (!strip) return { err: "no strip" };
  const frames = [];
  const t0 = performance.now();
  for (let i = 0; i < 12; i++) {
    const cs = getComputedStyle(strip);
    frames.push({
      t: Math.round(performance.now() - t0),
      op: cs.opacity,
      tf: cs.transform.slice(0, 60),
      anim: cs.animationName + "@" + cs.animationDuration,
    });
    await new Promise((r) => setTimeout(r, 50));
  }
  return frames;
});
log("ANIM FRAMES: " + JSON.stringify(anim));

// --- the input's focus state (the reference auto-focuses on open) ---
const focusState = await page.evaluate(() => {
  const input = document.querySelector("header input");
  const active = document.activeElement === input;
  const cs = input ? getComputedStyle(input) : null;
  return { inputFocused: active, shadow: cs ? cs.boxShadow.slice(0, 120) : null };
});
log("FOCUS STATE: " + JSON.stringify(focusState));

// --- the superset popover (the clone's own contract): type "serum" ---
const input = page.locator('header input[aria-label="Search products"]');
await input.fill("serum");
await page.waitForResponse((r) => r.url().includes("/api/search"));
await page.waitForTimeout(600);
const popover = await page.evaluate(() => {
  const header = document.querySelector("header");
  const pop = header?.querySelector(".bg-popover");
  if (!pop) return { err: "no popover" };
  const comp = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      cls: (el.className || "").toString().slice(0, 180),
      c: {
        display: cs.display, gap: cs.gap, padding: cs.padding,
        radius: cs.borderRadius, bg: cs.backgroundColor, border: cs.border,
        shadow: cs.boxShadow.slice(0, 90), font: cs.fontSize + "/" + cs.fontWeight,
        color: cs.color, h: cs.height, w: cs.width,
      },
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  };
  const row = pop.querySelector("button");
  return {
    panel: comp(pop),
    row: comp(row),
    rowImg: comp(row?.querySelector("img")),
    rowName: comp(row?.querySelector(".font-medium")),
    rowCategory: comp(row?.querySelector(".text-xs")),
    rowPrice: comp(row?.querySelector(".font-semibold")),
    rowCount: pop.querySelectorAll("button").length,
  };
});
log("POPOVER (superset): " + JSON.stringify(popover, null, 1));

// --- mobile pass at 375w ---
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(600);
const panel375 = await page.evaluate(() => {
  const header = document.querySelector("header");
  const inp = header?.querySelector("input");
  const form = header?.querySelector("form");
  const strip = inp?.closest("div[class*='border-t']");
  const comp = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), font: cs.fontSize, pad: cs.padding, gap: cs.gap };
  };
  return { strip: comp(strip), input: comp(inp), form: comp(form) };
});
log("PANEL @375: " + JSON.stringify(panel375));

await browser.close();
log("PROBE r58b COMPLETE");
