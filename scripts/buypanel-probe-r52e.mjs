// Round-52 calibration probe E (REFERENCE): the focus-visible ring family —
// the ATC + heart + stepper buttons' keyboard-focus ring (ring-1 ring-ring:
// the --ring token, never reference-measured), plus the ATC width register.
// Run: node scripts/buypanel-probe-r52e.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

line("A. THE FOCUS-VISIBLE RING — script focus on a keyboard-clean page");
const rings = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const row = atc.closest(".flex.items-center.gap-4") || atc.parentElement;
  const heart = [...row.querySelectorAll("button")].find((b) => {
    const svg = b.querySelector("svg");
    return svg && (svg.getAttribute("class") || "").includes("heart");
  });
  const read = (el, name) => {
    el.focus();
    const cs = getComputedStyle(el);
    const out = {
      name, focused: document.activeElement === el,
      boxShadow: cs.boxShadow, outline: cs.outline,
      ringCls: (el.className || "").includes("focus-visible:ring-1") ? "ring-1-in-class" : "no-ring-class",
    };
    el.blur();
    return out;
  };
  return [read(atc, "atc"), read(heart, "heart")];
});
for (const r of rings) {
  report(`ring.${r.name}.focused`, r.focused);
  report(`ring.${r.name}.boxShadow`, r.boxShadow);
  report(`ring.${r.name}.outline`, r.outline);
  report(`ring.${r.name}.class`, r.ringCls);
}

line("B. TAB-KEY FOCUS — the honest keyboard path");
// Tab from the top; stop when the ATC or heart is activeElement
let tabbed = null;
for (let i = 0; i < 30; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(60);
  const active = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const t = (el.textContent || "").trim();
    const svg = el.querySelector("svg");
    const svgCls = svg ? svg.getAttribute("class") || "" : "";
    return {
      tag: el.tagName, text: t.slice(0, 24), heart: svgCls.includes("heart"),
      boxShadow: getComputedStyle(el).boxShadow.slice(0, 120),
    };
  });
  if (active && (active.heart || /add to cart/i.test(active.text))) {
    tabbed = { tabs: i + 1, ...active };
    break;
  }
}
if (tabbed) {
  report("tabFocus.tabs", tabbed.tabs);
  report("tabFocus.element", (tabbed.heart ? "heart" : "atc") + " '" + tabbed.text + "'");
  report("tabFocus.boxShadow", tabbed.boxShadow);
} else {
  report("tabFocus", "NOT REACHED in 30 tabs");
}

line("C. THE ATC GEOMETRY — width register");
const geom = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const row = atc.closest(".flex.items-center.gap-4") || atc.parentElement;
  const r = atc.getBoundingClientRect();
  return { atcW: Math.round(r.width), atcH: Math.round(r.height), rowW: Math.round(row.getBoundingClientRect().width) };
});
for (const [k, v] of Object.entries(geom)) report(k, v);

await browser.close();
console.log("\nPROBE r52e COMPLETE");
