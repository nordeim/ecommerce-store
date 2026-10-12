// Round-53 clone-side probe B: REAL-mouse verification of the two
// interaction-gated behaviors the synthetic-event probe could not reach —
// (1) the arrow's :hover bg white/30 (CSS pseudo-class needs a trusted
// pointer event) and (2) the carousel's hover-pause (React onMouseEnter
// needs a real mouse move). Plus the arrow resting anatomy head that
// probe A's tail cut off.
// Run via: bash scripts/battery-runner.sh hero-clone-r53b.mjs prod
import { chromium } from "playwright-core";

const report = (k, v) => console.log(`  ${k.padEnd(52)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

line("A. THE ARROWS — resting anatomy (full)");
const arrows = await page.evaluate(() => {
  const prev = document.querySelector('button[aria-label="Previous slide"]');
  const next = document.querySelector('button[aria-label="Next slide"]');
  const cs = getComputedStyle(prev);
  const r = prev.getBoundingClientRect();
  const hero = prev.closest('[aria-roledescription="carousel"]').getBoundingClientRect();
  return {
    prevCls: prev.className,
    w: prev.offsetWidth, h: prev.offsetHeight,
    bg: cs.backgroundColor,
    radius: cs.borderRadius,
    transform: cs.transform,
    backdropFilter: cs.backdropFilter,
    inset: { left: Math.round(r.left - hero.left), topCenterOffset: Math.round(r.top + r.height / 2 - (hero.top + hero.height / 2)) },
    nextInsetRight: Math.round(hero.right - next.getBoundingClientRect().right),
    zIndex: cs.zIndex,
  };
});
for (const [k, v] of Object.entries(arrows)) report(`arrows.${k}`, JSON.stringify(v));

line("B. THE ARROW HOVER — real mouse (page.hover)");
const prev = page.locator('button[aria-label="Previous slide"]');
const bgBefore = await prev.evaluate((el) => getComputedStyle(el).backgroundColor);
await prev.hover();
await page.waitForTimeout(800);
const hoverRead = await prev.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, backdropFilter: cs.backdropFilter };
});
report("hover.restingBg", bgBefore);
report("hover.hoveredBg", hoverRead.bg);
report("hover.backdropFilter", hoverRead.backdropFilter);

line("C. THE CAROUSEL HOVER-PAUSE — real mouse, 7s dwell");
const pause = await page.evaluate(() => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  return dots.findIndex((d) => d.getAttribute("aria-current") === "true");
});
report("pause.activeBeforeHover", pause);
// real mouse move onto the carousel center (the image area, away from dots)
const heroBox = await page.locator('[aria-roledescription="carousel"]').boundingBox();
await page.mouse.move(heroBox.x + heroBox.width / 2, heroBox.y + heroBox.height / 2);
await page.waitForTimeout(7000);
const afterDwell = await page.evaluate(() => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  return dots.findIndex((d) => d.getAttribute("aria-current") === "true");
});
report("pause.activeAfter7sDwell", afterDwell);
report("pause.paused", afterDwell === pause);
// mouse leaves -> auto-advance resumes
await page.mouse.move(10, 10);
await page.waitForTimeout(300);
const resumeStart = await page.evaluate(() => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  return dots.findIndex((d) => d.getAttribute("aria-current") === "true");
});
await page.waitForTimeout(6000);
const resumeEnd = await page.evaluate(() => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  return dots.findIndex((d) => d.getAttribute("aria-current") === "true");
});
report("pause.resumeStart", resumeStart);
report("pause.resumeAfter6s", resumeEnd);
report("pause.resumed", resumeEnd !== resumeStart);

line("D. THE DOT HOVER — real mouse (the no-hover claim)");
const inactiveDot = page.locator("button[aria-label^='Go to slide']").nth(2);
const dotBefore = await inactiveDot.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, w: el.offsetWidth }));
await inactiveDot.hover();
await page.waitForTimeout(700);
const dotAfter = await inactiveDot.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, w: el.offsetWidth }));
report("dotHover.before", JSON.stringify(dotBefore));
report("dotHover.after", JSON.stringify(dotAfter));
report("dotHover.changed", JSON.stringify(dotBefore) !== JSON.stringify(dotAfter));

await browser.close();
console.log("\nCLONE-SIDE REAL-MOUSE PROBE COMPLETE");
