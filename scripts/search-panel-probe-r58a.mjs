// Round-58 probe A: the reference's SEARCH PANEL computed geometry — the
// sweep's sixteenth installment (the search-drawer's panel geometry;
// session-46 pinned the BEHAVIOR, the computed-geometry axis is unpinned).
// Captures the panel's full computed set at 1024w: the strip (border-t +
// the slide-in animation), the container (max-w-7xl px-4 py-3), the form
// row (flex gap-2), the Input, and the Search button — plus the strip's
// open-animation timing and the resting (closed) header height delta.
// Run: node scripts/search-panel-probe-r58a.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r58";
mkdirSync(OUT, { recursive: true });

const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// --- login (the reference gates the storefront) ---
const lp = await ctx.newPage();
await withTimeout(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch { /* fall through — the path check reports */ }
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
const loginPath = new URL(lp.url()).pathname;
console.log("ref login ->", loginPath);
await lp.close();

const page = await ctx.newPage();
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home-goto");
await page.waitForLoadState("networkidle");
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
console.log("RESTING HEADER:", JSON.stringify(closed));

// --- open the search panel (the header's SECOND button — the lucide-search
// icon, NO aria-label on the reference; the r58a0 enumeration) ---
const searchBtn = page.locator("header button").nth(1);
await withTimeout(searchBtn.click(), 8000, "search-click");
await page.waitForTimeout(300); // mid-animation read
await page.waitForTimeout(1200); // settled read

// --- the panel's full computed geometry (settled) ---
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
  // the strip = the panel wrapper containing the input (the border-t div)
  const strip = input ? input.closest("div[class*='border-t']") ?? input.closest("form")?.parentElement?.parentElement : null;
  const container = input ? input.closest("form")?.parentElement : null;
  return {
    input: comp(input),
    form: comp(form),
    searchButton: comp(formBtn),
    strip: comp(strip),
    container: comp(container),
    inputPlaceholder: input?.getAttribute("placeholder") ?? null,
    inputAriaLabel: input?.getAttribute("aria-label") ?? null,
    buttonText: formBtn?.textContent?.trim() ?? null,
  };
});
console.log("PANEL (settled):", JSON.stringify(panel, null, 1));
await page.screenshot({ path: OUT + "/ref-search-panel-1024.png" });

// --- the open-animation timing: reopen and sample early frames ---
await withTimeout(searchBtn.click(), 5000, "toggle-close");
await page.waitForTimeout(900);
await withTimeout(searchBtn.click(), 5000, "reopen");
const anim = await page.evaluate(async () => {
  // sample the strip's opacity/transform for ~600ms
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
console.log("ANIM FRAMES:", JSON.stringify(anim));

// --- the strip's border + spacing detail (one-sided reads, full values) ---
const stripDetail = await page.evaluate(() => {
  const header = document.querySelector("header");
  const strip = header?.querySelector("div[class*='border-t']");
  if (!strip) return null;
  const cs = getComputedStyle(strip);
  return {
    borderTopWidth: cs.borderTopWidth, borderTopStyle: cs.borderTopStyle, borderTopColor: cs.borderTopColor,
    paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
  };
});
console.log("STRIP DETAIL:", JSON.stringify(stripDetail));

// --- mobile pass at 375w: the panel + input + button at the narrow viewport ---
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(600);
const panel375 = await page.evaluate(() => {
  const header = document.querySelector("header");
  const input = header?.querySelector("input");
  const form = header?.querySelector("form");
  const strip = input?.closest("div[class*='border-t']");
  const comp = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), font: cs.fontSize, pad: cs.padding, gap: cs.gap };
  };
  return { strip: comp(strip), input: comp(input), form: comp(form) };
});
console.log("PANEL @375:", JSON.stringify(panel375));
await page.screenshot({ path: OUT + "/ref-search-panel-375.png" });

await browser.close();
console.log("PROBE r58a COMPLETE");
