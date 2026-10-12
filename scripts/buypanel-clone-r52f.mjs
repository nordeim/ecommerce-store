// Round-52 clone probe F: the clone's buy-panel focus rings + geometry +
// the missing r52a outputs (ATC width, row, heart transition) — completing
// the paired calibration table.
// Run (via battery): bash scripts/battery-runner.sh buypanel-clone-r52f.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

const page = await ctx.newPage();
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

line("A. THE FOCUS-VISIBLE RING");
const rings = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const row = atc.closest(".flex.items-center.gap-4") || atc.parentElement;
  const heart = [...row.querySelectorAll("button")].find((b) => b.getAttribute("aria-label")?.includes("wishlist"));
  const read = (el, name) => {
    el.focus();
    const cs = getComputedStyle(el);
    const out = { name, boxShadow: cs.boxShadow, outline: cs.outline };
    el.blur();
    return out;
  };
  return [read(atc, "atc"), read(heart, "heart")];
});
for (const r of rings) {
  report(`ring.${r.name}.boxShadow`, r.boxShadow);
  report(`ring.${r.name}.outline`, r.outline);
}

line("B. THE GEOMETRY — the paired table's missing numbers");
const geom = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const row = atc.closest(".flex.items-center.gap-4") || atc.parentElement;
  const heart = [...row.querySelectorAll("button")].find((b) => b.getAttribute("aria-label")?.includes("wishlist"));
  const stepper = row.querySelector("div.flex.items-center.border");
  const r = atc.getBoundingClientRect();
  return {
    atcW: Math.round(r.width), atcH: Math.round(r.height),
    rowW: Math.round(row.getBoundingClientRect().width),
    heartW: Math.round(heart.getBoundingClientRect().width),
    stepperW: Math.round(stepper.getBoundingClientRect().width),
    stepperH: Math.round(stepper.getBoundingClientRect().height),
  };
});
for (const [k, v] of Object.entries(geom)) report(k, v);

line("C. THE HEART TRANSITION + THE PLUS HOVER");
const extras = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const row = atc.closest(".flex.items-center.gap-4") || atc.parentElement;
  const heart = [...row.querySelectorAll("button")].find((b) => b.getAttribute("aria-label")?.includes("wishlist"));
  return { heartTransition: getComputedStyle(heart).transitionDuration + " " + getComputedStyle(heart).transitionProperty.slice(0, 70) };
});
for (const [k, v] of Object.entries(extras)) report(k, v);
const plus = page.getByRole("button", { name: "Increase quantity" });
await plus.hover();
await page.waitForTimeout(500);
const plusHover = await plus.evaluate((el) => getComputedStyle(el).backgroundColor);
report("plusHoverBg", plusHover);

await browser.close();
console.log("\nPROBE r52f COMPLETE");
