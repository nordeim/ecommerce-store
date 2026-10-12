// Round-53 clone-side sanity probe A: the HERO CAROUSEL's dot/arrow
// interaction family — the prev/next arrows' resting anatomy + hover + focus,
// the dot pagination's active/inactive computed contract + transition, the
// crossfade duration, and the auto-advance cadence + hover-pause behavior.
// Run via: bash scripts/battery-runner.sh hero-clone-r53a.mjs prod
import { chromium } from "playwright-core";

const report = (k, v) => console.log(`  ${k.padEnd(52)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

line("A. THE ARROWS — locate + resting anatomy");
const arrowDump = await page.evaluate(() => {
  const prev = document.querySelector('button[aria-label="Previous slide"]');
  const next = document.querySelector('button[aria-label="Next slide"]');
  if (!prev || !next) return { found: false };
  const cs = getComputedStyle(prev);
  const svg = prev.querySelector("svg");
  const svgCs = svg ? getComputedStyle(svg) : null;
  return {
    found: true,
    prevCls: prev.className,
    prevRect: { w: prev.offsetWidth, h: prev.offsetHeight },
    prevPos: { left: prev.offsetLeft, topV: Math.round(prev.getBoundingClientRect().top) },
    transform: cs.transform,
    bg: cs.backgroundColor,
    backdropFilter: cs.backdropFilter,
    radius: cs.borderRadius,
    display: cs.display,
    justifyContent: cs.justifyContent,
    alignItems: cs.alignItems,
    color: cs.color,
    cursor: cs.cursor,
    transition: cs.transitionDuration + " " + cs.transitionProperty,
    svgSize: svgCs ? svgCs.width + " x " + svgCs.height : null,
    nextCls: next.className,
    nextRight: Math.round(next.getBoundingClientRect().right),
  };
});
for (const [k, v] of Object.entries(arrowDump)) report(`arrows.${k}`, JSON.stringify(v));

line("B. THE ARROW HOVER — bg white/30");
const arrowHover = await page.evaluate(async () => {
  const prev = document.querySelector('button[aria-label="Previous slide"]');
  prev.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 800));
  const cs = getComputedStyle(prev);
  return { bg: cs.backgroundColor, backdropFilter: cs.backdropFilter };
});
for (const [k, v] of Object.entries(arrowHover)) report(`hover.${k}`, JSON.stringify(v));

line("C. THE ARROW FOCUS — what computes on script focus (pointer-clean page)");
const arrowFocus = await page.evaluate(async () => {
  const prev = document.querySelector('button[aria-label="Previous slide"]');
  prev.focus();
  const cs = getComputedStyle(prev);
  const out = {
    outlineStyle: cs.outlineStyle,
    outlineWidth: cs.outlineWidth,
    outlineColor: cs.outlineColor,
    boxShadow: cs.boxShadow,
    borderStyle: cs.borderStyle,
    borderColor: cs.borderColor,
  };
  prev.blur();
  return out;
});
for (const [k, v] of Object.entries(arrowFocus)) report(`focus.${k}`, JSON.stringify(v));

line("D. THE DOTS — active/inactive computed contract");
const dotDump = await page.evaluate(() => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  if (!dots.length) return { found: false };
  const active = dots.find((d) => d.getAttribute("aria-current") === "true") || dots[0];
  const inactive = dots.find((d) => d !== active) || dots[1];
  const a = getComputedStyle(active);
  const i = getComputedStyle(inactive);
  const container = active.parentElement;
  const c = getComputedStyle(container);
  return {
    found: true,
    count: dots.length,
    activeCls: active.className,
    activeRect: { w: active.offsetWidth, h: active.offsetHeight },
    activeBg: a.backgroundColor,
    activeRadius: a.borderRadius,
    activeTransition: a.transitionDuration + " / " + a.transitionProperty,
    inactiveCls: inactive.className,
    inactiveRect: { w: inactive.offsetWidth, h: inactive.offsetHeight },
    inactiveBg: i.backgroundColor,
    inactiveTransition: i.transitionDuration + " / " + i.transitionProperty,
    containerCls: container.className,
    containerGap: c.columnGap,
    containerBottom: Math.round(container.getBoundingClientRect().bottom),
    heroBottom: Math.round(container.closest('[aria-roledescription="carousel"]').getBoundingClientRect().bottom),
    cursor: a.cursor,
    padding: a.padding,
  };
});
for (const [k, v] of Object.entries(dotDump)) report(`dots.${k}`, JSON.stringify(v));

line("E. THE DOT HOVER — the no-hover-variant claim");
const dotHover = await page.evaluate(async () => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  const inactive = dots.find((d) => d.getAttribute("aria-current") !== "true") || dots[1];
  inactive.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 500));
  const cs = getComputedStyle(inactive);
  return { bg: cs.backgroundColor, w: inactive.offsetWidth };
});
for (const [k, v] of Object.entries(dotHover)) report(`dotHover.${k}`, JSON.stringify(v));

line("F. THE DOT CLICK — width morphs 8 -> 32 (transition-all live proof)");
const dotClick = await page.evaluate(async () => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  const target = dots[2] || dots[dots.length - 1];
  const before = target.offsetWidth;
  target.click();
  await new Promise((r) => setTimeout(r, 700));
  const after = target.offsetWidth;
  const cs = getComputedStyle(target);
  return { before, after, bg: cs.backgroundColor, ariaCurrent: target.getAttribute("aria-current") };
});
for (const [k, v] of Object.entries(dotClick)) report(`dotClick.${k}`, JSON.stringify(v));

line("G. THE CROSSFADE — slide + text transition durations");
const fadeDump = await page.evaluate(() => {
  const carousel = document.querySelector('[aria-roledescription="carousel"]');
  const slides = [...carousel.querySelectorAll("img")].map((img) => img.parentElement);
  const s = slides[0] ? getComputedStyle(slides[0]) : null;
  const textBlock = carousel.querySelector(".max-w-lg > div");
  const t = textBlock ? getComputedStyle(textBlock) : null;
  return {
    slideTransition: s ? s.transitionDuration + " / " + s.transitionProperty : null,
    slideOpacityActive: s ? s.opacity : null,
    textTransition: t ? t.transitionDuration + " / " + t.transitionProperty : null,
  };
});
for (const [k, v] of Object.entries(fadeDump)) report(`fade.${k}`, JSON.stringify(v));

line("H. THE AUTO-ADVANCE — cadence + hover-pause");
const auto = await page.evaluate(async () => {
  const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")];
  const activeOf = () => dots.findIndex((d) => d.getAttribute("aria-current") === "true");
  const marks = [];
  const t0 = Date.now();
  // observe 2 flips unperturbed
  let last = activeOf();
  while (marks.length < 2) {
    await new Promise((r) => setTimeout(r, 200));
    const cur = activeOf();
    if (cur !== last) { marks.push(Date.now() - t0); last = cur; }
    if (Date.now() - t0 > 15000) break;
  }
  // hover-pause: enter the carousel, wait 7s, active must NOT change
  const carousel = document.querySelector('[aria-roledescription="carousel"]');
  const beforeHover = activeOf();
  carousel.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
  await new Promise((r) => setTimeout(r, 7000));
  const afterHover = activeOf();
  carousel.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
  return { flipsAtMs: marks, hoverBefore: beforeHover, hoverAfter7s: afterHover, paused: beforeHover === afterHover };
});
for (const [k, v] of Object.entries(auto)) report(`auto.${k}`, JSON.stringify(v));

await browser.close();
console.log("\nCLONE-SIDE HERO DOT/ARROW PROBE COMPLETE");
