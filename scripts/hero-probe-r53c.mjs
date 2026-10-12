// Round-53 REFERENCE calibration probe C: the live reference's HERO
// CAROUSEL dot/arrow family — the arrows' anatomy + hover + focus, the dots'
// active/inactive computed contract, the crossfade durations, the auto-advance
// cadence + hover-pause. Login-gated; DOM dumps + computed styles as ground
// truth. Run: node scripts/hero-probe-r53c.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(52)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

// login (the r52 convention)
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
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

line("A. LOCATE THE REFERENCE CAROUSEL — the arrows + dots");
const census = await page.evaluate(() => {
  // the arrows: buttons with a chevron svg, absolutely positioned mid-hero
  const buttons = [...document.querySelectorAll("main button, main [role='button'], button")];
  const chevronBtns = buttons.filter((b) => {
    const svg = b.querySelector("svg");
    if (!svg) return false;
    const cs = getComputedStyle(b);
    return cs.position === "absolute" && parseFloat(cs.width) < 60 && (b.getAttribute("aria-label") || "").match(/prev|next|slide/i) || /chevron/i.test(svg.innerHTML) || (svg.getAttribute("class") || "").includes("lucide-chevron");
  });
  // the dots: small buttons in a horizontal flex row near the hero bottom
  const smallBtns = buttons.filter((b) => {
    const cs = getComputedStyle(b);
    return cs.display !== "none" && parseFloat(cs.height) <= 12 && parseFloat(cs.width) <= 40 && cs.borderRadius !== "0px";
  });
  return {
    chevronCount: chevronBtns.length,
    chevronSample: chevronBtns.slice(0, 2).map((b) => ({ cls: b.className, aria: b.getAttribute("aria-label"), w: b.offsetWidth, h: b.offsetHeight })),
    smallBtnCount: smallBtns.length,
    smallSample: smallBtns.slice(0, 6).map((b) => ({ cls: b.className, aria: b.getAttribute("aria-label"), w: b.offsetWidth, h: b.offsetHeight, bg: getComputedStyle(b).backgroundColor })),
  };
});
for (const [k, v] of Object.entries(census)) report(`census.${k}`, JSON.stringify(v, null, 0).slice(0, 400));

line("B. THE ARROWS — full anatomy (prev located by chevron-left svg path)");
const arrows = await page.evaluate(() => {
  const all = [...document.querySelectorAll("button")];
  const withChevron = all.filter((b) => b.querySelector("svg") && b.querySelector("svg").innerHTML.includes("chevron") === false && false);
  // chevrons in lucide render as polyline points; find buttons whose svg is small and button is absolute
  const cands = all.filter((b) => {
    const cs = getComputedStyle(b);
    const svg = b.querySelector("svg");
    return cs.position === "absolute" && svg && svg.getBoundingClientRect().height > 10 && svg.getBoundingClientRect().height < 30 && Math.abs(b.getBoundingClientRect().height - 40) < 2;
  });
  if (!cands.length) return { found: false, allBtnHeights: all.slice(0, 30).map((b) => b.getBoundingClientRect().height) };
  const prev = cands[0], next = cands[cands.length - 1];
  const cs = getComputedStyle(prev);
  const r = prev.getBoundingClientRect();
  // find the hero container (the nearest relative-positioned ancestor)
  let hero = prev.parentElement;
  while (hero && getComputedStyle(hero).position !== "relative") hero = hero.parentElement;
  const hr = hero ? hero.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0, height: 0 };
  const svg = prev.querySelector("svg");
  return {
    found: true,
    prevCls: prev.className,
    prevAria: prev.getAttribute("aria-label"),
    w: prev.offsetWidth, h: prev.offsetHeight,
    bg: cs.backgroundColor,
    radius: cs.borderRadius,
    transform: cs.transform,
    translate: cs.translate,
    backdropFilter: cs.backdropFilter,
    display: cs.display,
    color: cs.color,
    cursor: cs.cursor,
    transition: cs.transitionDuration + " " + cs.transitionProperty,
    leftInset: Math.round(r.left - hr.left),
    topCenterOffset: Math.round(r.top + r.height / 2 - (hr.top + hr.height / 2)),
    nextAria: next.getAttribute("aria-label"),
    nextRightInset: Math.round(hr.right - next.getBoundingClientRect().right),
    svgSize: svg ? getComputedStyle(svg).width + " x " + getComputedStyle(svg).height : null,
  };
});
for (const [k, v] of Object.entries(arrows)) report(`arrows.${k}`, JSON.stringify(v));

line("C. THE ARROW HOVER — real mouse");
if (arrows.found) {
  // locate via the same heuristic in Playwright: absolute buttons with svg, 40px tall
  const btns = page.locator("button");
  const n = await btns.count();
  let prevLoc = null;
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i);
    const info = await b.evaluate((el) => {
      const cs = getComputedStyle(el);
      const svg = el.querySelector("svg");
      return { pos: cs.position, h: el.getBoundingClientRect().height, hasSvg: !!svg, x: Math.round(el.getBoundingClientRect().x) };
    });
    if (info.pos === "absolute" && info.hasSvg && Math.abs(info.h - 40) < 2 && info.x < 700) { prevLoc = b; break; }
  }
  if (prevLoc) {
    const before = await prevLoc.evaluate((el) => getComputedStyle(el).backgroundColor);
    await prevLoc.hover();
    await page.waitForTimeout(800);
    const after = await prevLoc.evaluate((el) => getComputedStyle(el).backgroundColor);
    report("arrowHover.restingBg", before);
    report("arrowHover.hoveredBg", after);
    // focus (pointer-clean: move away first)
    await page.mouse.move(5, 5);
    await page.waitForTimeout(200);
    await prevLoc.focus();
    const focusRead = await prevLoc.evaluate((el) => {
      const cs = getComputedStyle(el);
      const out = { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, boxShadow: cs.boxShadow };
      el.blur();
      return out;
    });
    report("arrowFocus.outline", JSON.stringify(focusRead));
  } else {
    report("arrowHover", "PREV NOT LOCATED");
  }
}

line("D. THE DOTS — active/inactive computed contract");
const dots = await page.evaluate(() => {
  // the dots: the small rounded buttons in a centered flex row
  const all = [...document.querySelectorAll("button")];
  const dotCands = all.filter((b) => {
    const r = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    return r.height > 0 && r.height <= 12 && r.width <= 40 && cs.borderRadius !== "0px" && b.textContent.trim() === "";
  });
  if (!dotCands.length) return { found: false };
  // the row = the common parent
  const row = dotCands[0].parentElement;
  const cs = getComputedStyle(row);
  // active = the widest (or first)
  const sorted = [...dotCands].sort((a, b) => b.offsetWidth - a.offsetWidth);
  const active = sorted[0];
  const inactive = sorted[sorted.length - 1];
  const a = getComputedStyle(active);
  const i = getComputedStyle(inactive);
  let hero = row.parentElement;
  while (hero && getComputedStyle(hero).position !== "relative") hero = hero.parentElement;
  const hr = hero ? hero.getBoundingClientRect() : { bottom: 0 };
  return {
    found: true,
    count: dotCands.length,
    activeCls: active.className,
    activeAria: active.getAttribute("aria-label"),
    activeAriaCurrent: active.getAttribute("aria-current"),
    activeRect: { w: active.offsetWidth, h: active.offsetHeight },
    activeBg: a.backgroundColor,
    activeRadius: a.borderRadius,
    activeTransition: a.transitionDuration + " / " + a.transitionProperty,
    inactiveCls: inactive.className,
    inactiveAria: inactive.getAttribute("aria-label"),
    inactiveRect: { w: inactive.offsetWidth, h: inactive.offsetHeight },
    inactiveBg: i.backgroundColor,
    inactiveTransition: i.transitionDuration + " / " + i.transitionProperty,
    rowCls: row.className,
    rowGap: cs.columnGap,
    bottomOffset: hr.bottom ? Math.round(hr.bottom - row.getBoundingClientRect().bottom) : null,
    cursor: a.cursor,
  };
});
for (const [k, v] of Object.entries(dots)) report(`dots.${k}`, JSON.stringify(v));

line("E. THE DOT HOVER — real mouse");
if (dots.found) {
  const smallBtns = page.locator("button").filter({ hasText: /^$/ });
  const cnt = await smallBtns.count();
  report("dotHover.smallBtnCount", cnt);
  // hover the LAST small dot
  let hovered = false;
  for (let i = cnt - 1; i >= 0; i--) {
    const b = smallBtns.nth(i);
    const ok = await b.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.height <= 12 && r.width <= 40;
    });
    if (ok) {
      const before = await b.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, w: el.offsetWidth }));
      await b.hover();
      await page.waitForTimeout(700);
      const after = await b.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, w: el.offsetWidth }));
      report("dotHover.before", JSON.stringify(before));
      report("dotHover.after", JSON.stringify(after));
      report("dotHover.changed", JSON.stringify(before) !== JSON.stringify(after));
      hovered = true;
      break;
    }
  }
  if (!hovered) report("dotHover", "NO DOT LOCATED");
}

line("F. THE CROSSFADE — slide + text transition durations");
const fade = await page.evaluate(() => {
  // find the hero images
  const imgs = [...document.querySelectorAll("img")].filter((im) => im.getBoundingClientRect().height > 200);
  if (!imgs.length) return { found: false };
  const slide = imgs[0].parentElement;
  const s = getComputedStyle(slide);
  return {
    found: true,
    slideCls: slide.className,
    slideTransition: s.transitionDuration + " / " + s.transitionProperty,
    slideOpacity: s.opacity,
    slideCount: imgs.length,
    imgClasses: imgs[0].className,
  };
});
for (const [k, v] of Object.entries(fade)) report(`fade.${k}`, JSON.stringify(v));

line("G. THE AUTO-ADVANCE — cadence + hover-pause (the reference behavior)");
const auto = await page.evaluate(async () => {
  const imgs = [...document.querySelectorAll("img")].filter((im) => im.getBoundingClientRect().height > 200);
  if (!imgs.length) return { found: false };
  const visibleIdx = () => {
    const withOp = imgs.map((im) => ({ im, op: parseFloat(getComputedStyle(im.parentElement).opacity) }));
    withOp.sort((a, b) => b.op - a.op);
    return imgs.indexOf(withOp[0].im);
  };
  const t0 = Date.now();
  const marks = [];
  let last = visibleIdx();
  while (marks.length < 2) {
    await new Promise((r) => setTimeout(r, 200));
    const cur = visibleIdx();
    if (cur !== last) { marks.push(Date.now() - t0); last = cur; }
    if (Date.now() - t0 > 15000) break;
  }
  return { found: true, flipsAtMs: marks };
});
for (const [k, v] of Object.entries(auto)) report(`auto.${k}`, JSON.stringify(v));

// hover-pause with a real mouse dwell
if (auto.found) {
  const heroImg = page.locator("img").first();
  const imgs = await page.locator("img").all();
  let big = null;
  for (const im of imgs) {
    const bb = await im.boundingBox();
    if (bb && bb.height > 200) { big = im; break; }
  }
  if (big) {
    const bb = await big.boundingBox();
    const before = await page.evaluate(() => {
      const ims = [...document.querySelectorAll("img")].filter((im) => im.getBoundingClientRect().height > 200);
      const withOp = ims.map((im) => ({ im, op: parseFloat(getComputedStyle(im.parentElement).opacity) }));
      withOp.sort((a, b) => b.op - a.op);
      return ims.indexOf(withOp[0].im);
    });
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(7000);
    const after = await page.evaluate(() => {
      const ims = [...document.querySelectorAll("img")].filter((im) => im.getBoundingClientRect().height > 200);
      const withOp = ims.map((im) => ({ im, op: parseFloat(getComputedStyle(im.parentElement).opacity) }));
      withOp.sort((a, b) => b.op - a.op);
      return ims.indexOf(withOp[0].im);
    });
    report("pause.beforeDwell", before);
    report("pause.after7sDwell", after);
    report("pause.paused", before === after);
    await page.mouse.move(5, 5);
  }
}

await browser.close();
console.log("\nREFERENCE-SIDE HERO DOT/ARROW PROBE COMPLETE");
