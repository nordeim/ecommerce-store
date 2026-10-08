// Live re-verification of the session-10 remediation against the production
// standalone server on :3000. Mirrors scripts/verify-session9.ts (Playwright
// drives the real UI). Run: bun scripts/verify-session10.ts
import { devices, chromium } from "@playwright/test";

const results: Array<{ check: string; ok: boolean; detail: string }> = [];
const pass = (check: string, ok: boolean, detail: string) => {
  results.push({ check, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${check}: ${detail}`);
};

const browser = await chromium.launch();
const BASE = "http://localhost:3000";

// --- 1. Hero h1 line-height follows the reference's v3 cascade (HERO-LH-1)
const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await desktop.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
const h1 = desktop.locator("main h1").first();
const lh = async (w: number) => {
  await desktop.setViewportSize({ width: w, height: 900 });
  const [fs, line] = await h1.evaluate((el) => {
    const cs = getComputedStyle(el);
    return [cs.fontSize, cs.lineHeight] as const;
  });
  return `${fs}/${line}`;
};
const base = await lh(630);
const sm = await lh(768);
const lg = await lh(1024);
pass(
  "hero h1 line-height 37.5px @630 (leading-tight wins below sm)",
  base === "30px/37.5px",
  base,
);
pass(
  "hero h1 line-height 40px @768 (v3 4xl companion re-wins)",
  sm === "36px/40px",
  sm,
);
pass(
  "hero h1 line-height 48px @1024 (v3 5xl companion re-wins)",
  lg === "48px/48px",
  lg,
);

// --- 2. Hover effects engage in touch contexts (HOVER-GATE-1) -------------
const ctx = await browser.newContext({ ...devices["iPhone 14"] });
const mobile = await ctx.newPage();
await mobile.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
const hvq = await mobile.evaluate(() => matchMedia("(hover: hover)").matches);
pass("touch context has (hover: hover) false", hvq === false, String(hvq));
const card = mobile.locator("main div.group").first();
await card.hover();
await mobile.waitForTimeout(600);
const hoverState = await card.evaluate((el) => {
  const img = el.querySelector("img");
  const h3 = el.querySelector("h3");
  return JSON.stringify({
    groupHover: el.matches(":hover"),
    scale: img ? getComputedStyle(img).scale : "no-img",
    title: h3 ? getComputedStyle(h3).color : "no-h3",
  });
});
pass(
  "card img scales 1.05 + title primary under touch hover",
  hoverState.includes('"scale":"1.05"') && hoverState.includes('"title":"rgb(230, 107, 26)"'),
  hoverState,
);
// plain hover: too (the chrome's hover-styled elements census)
const hoverCount = await mobile.evaluate(() => {
  const els = [...document.querySelectorAll("header a, header button, footer a, footer button")];
  return els.filter((el) => [...el.classList].some((c) => c.includes("hover:"))).length;
});
pass(
  "hover utilities present across the chrome (buttons/links)",
  hoverCount >= 3,
  `${hoverCount} elements carry hover:* classes`,
);
await ctx.close();

// --- 3. The emitted CSS carries no (hover:hover) media gates --------------
const cssHrefs = await desktop.evaluate(() =>
  [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute("href") ?? ""),
);
let gated = 0;
for (const href of cssHrefs) {
  const css = await (await fetch(`${BASE}${href}`)).text();
  gated += (css.match(/@media \(hover:hover\)/g) ?? []).length;
}
pass("0 @media (hover:hover) gates in the served CSS", gated === 0, `${gated} gates`);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks green`);
if (failed.length > 0) {
  console.error("FAILED:", failed.map((f) => f.check).join("; "));
  process.exit(1);
}
