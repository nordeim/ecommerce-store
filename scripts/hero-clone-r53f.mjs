// Round-53 clone-side probe F: the translate-register reads — v4 emits the
// STANDALONE `translate` property for -translate-y-1/2 / -translate-x-1/2
// (the reference's v3 emits transform: matrix(...)). Also captures the dot
// row's centering values for the register documentation.
// Run via: bash scripts/battery-runner.sh hero-clone-r53f.mjs prod
import { chromium } from "playwright-core";

const report = (k, v) => console.log(`  ${k.padEnd(52)} ${v}`);

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

const read = await page.evaluate(() => {
  const prev = document.querySelector('button[aria-label="Previous slide"]');
  const cs = prev ? getComputedStyle(prev) : null;
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  const row = dots[0] ? dots[0].parentElement : null;
  const rcs = row ? getComputedStyle(row) : null;
  const hero = prev ? prev.closest('[aria-roledescription="carousel"]').getBoundingClientRect() : null;
  const rowRect = row ? row.getBoundingClientRect() : null;
  return {
    arrowTransform: cs ? cs.transform : null,
    arrowTranslate: cs ? cs.translate : null,
    arrowRotate: cs ? cs.rotate : null,
    arrowScale: cs ? cs.scale : null,
    rowTransform: rcs ? rcs.transform : null,
    rowTranslate: rcs ? rcs.translate : null,
    rowCenteredOffset: rowRect && hero ? Math.round(rowRect.left + rowRect.width / 2 - (hero.left + hero.width / 2)) : null,
  };
});
for (const [k, v] of Object.entries(read)) report(k, JSON.stringify(v));

await browser.close();
console.log("\nCLONE TRANSLATE-REGISTER PROBE COMPLETE");
