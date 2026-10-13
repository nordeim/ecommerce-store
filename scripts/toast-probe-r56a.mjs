// Round-56 REFERENCE probe A: the toast's enter/exit animation states —
// the sweep's fourteenth installment. The session-4 dark-box pins cover the
// RESTING anatomy (bg/color/radius/icon/position/stacking/lifetime); this
// probe measures the ANIMATION axis live on the reference:
//   1. the ENTER spring: the inline style at insertion (framer-motion's
//      "from" values) + rAF-frame samples of opacity/transform through the
//      spring (start values, overshoot, settle time)
//   2. the EXIT: the inline style through the unmount (target values, curve,
//      duration)
//   3. the auto-dismiss lifetime (insertion -> removal)
//   4. the region + item structure at rest (outerHTML, computed, z-index,
//      pointer-events — the click-through register)
// Run: node scripts/toast-probe-r56a.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(58)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// ---- login (the standing operator account) ----
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

// ---------------------------------------------------------------------------
// PHASE 1 — discovery + the ENTER curve. Install the in-page instrumentation
// BEFORE the click: a MutationObserver that catches the toast item's
// INSERTION (reads framer-motion's inline "from" style before the first
// frame) + a rAF sampler that records opacity/transform every frame.
// ---------------------------------------------------------------------------
await page.evaluate(() => {
  window.__toast = { insertedAt: null, inlineAtInsertion: null, frames: [], removedAt: null, exitFrames: [], regionHTML: null };
  const looksLikeRegion = (el) => {
    if (!(el instanceof HTMLElement)) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.position === "fixed" && r.right >= window.innerWidth - 60 && r.bottom >= window.innerHeight - 60 && r.width > 0 && r.height > 0;
  };
  const findRegion = () => [...document.querySelectorAll("body *")].find(looksLikeRegion) || null;
  const mo = new MutationObserver(() => {
    if (window.__toast.insertedAt) return;
    const region = findRegion();
    if (!region) return;
    const item = region.querySelector(":scope > *");
    if (!item) return;
    window.__toast.insertedAt = performance.now();
    window.__toast.inlineAtInsertion = {
      transform: item.style.transform || null,
      opacity: item.style.opacity || null,
      itemClass: item.getAttribute("class"),
    };
    window.__toast.regionHTML = region.outerHTML.slice(0, 400);
    // rAF sampler: every frame until 1500ms past insertion
    const tick = () => {
      const it = region.querySelector(":scope > *");
      if (!it) return;
      const cs = getComputedStyle(it);
      window.__toast.frames.push({
        t: +(performance.now() - window.__toast.insertedAt).toFixed(0),
        o: cs.opacity,
        m: cs.transform,
      });
      if (performance.now() - window.__toast.insertedAt < 1500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  mo.observe(document.body, { childList: true, subtree: true });
  window.__toast.mo = mo;
});

const atc = page.getByRole("button", { name: /add to cart/i }).first();
await atc.click();

// let the enter spring complete + settle to rest (~1.6s)
await page.waitForTimeout(1600);

// ---- the resting anatomy (region + item + computed) ----
const rest = await page.evaluate(() => {
  const region = [...document.querySelectorAll("body *")].find((el) => {
    if (!(el instanceof HTMLElement)) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.position === "fixed" && r.right >= window.innerWidth - 60 && r.bottom >= window.innerHeight - 60 && r.width > 0 && r.height > 0;
  });
  if (!region) return { found: false };
  const item = region.querySelector(":scope > *");
  const rcs = getComputedStyle(region);
  const ics = item ? getComputedStyle(item) : null;
  const ir = item ? item.getBoundingClientRect() : null;
  const svg = item ? item.querySelector("svg") : null;
  return {
    found: true,
    regionClass: region.getAttribute("class"),
    regionHTML: region.outerHTML,
    regionComputed: {
      position: rcs.position, zIndex: rcs.zIndex, display: rcs.display,
      flexDirection: rcs.flexDirection, gap: rcs.rowGap,
      pointerEvents: rcs.pointerEvents, bottom: rcs.bottom, right: rcs.right,
    },
    itemClass: item ? item.getAttribute("class") : null,
    itemComputed: item ? {
      bg: ics.backgroundColor, color: ics.color, radius: ics.borderRadius,
      padding: ics.padding, shadow: ics.boxShadow.slice(0, 90),
      font: ics.fontSize + "/" + ics.fontWeight, gap: ics.columnGap,
      maxWidth: ics.maxWidth, transition: ics.transitionDuration + " " + ics.transitionProperty.slice(0, 40),
      animation: ics.animationDuration + " " + ics.animationName,
      transform: ics.transform, opacity: ics.opacity,
      width: ir ? Math.round(ir.width) : null, height: ir ? Math.round(ir.height) : null,
    } : null,
    itemInlineStyle: item ? item.getAttribute("style") : null,
    svgClass: svg ? svg.getAttribute("class") : null,
    svgSize: svg ? getComputedStyle(svg).width + "/" + getComputedStyle(svg).height : null,
    text: item ? item.textContent : null,
  };
});

console.log("== PHASE 1: resting anatomy (post-enter) ==");
if (rest.found) {
  report("region class", rest.regionClass);
  report("region computed", JSON.stringify(rest.regionComputed));
  report("item class", rest.itemClass);
  report("item computed", JSON.stringify(rest.itemComputed));
  report("item inline style", rest.itemInlineStyle);
  report("svg", rest.svgClass + " " + rest.svgSize);
  report("text", rest.text);
} else {
  report("region", "NOT FOUND");
}

// ---- the enter curve ----
const enter = await page.evaluate(() => {
  const f = window.__toast.frames;
  const parse = (m) => {
    if (!m || m === "none") return { ty: 0, sx: 1 };
    const v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return { raw: m };
    const [a, , , , , e] = v[1].split(",").map(Number);
    return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
  };
  return {
    inlineAtInsertion: window.__toast.inlineAtInsertion,
    frames: f.map((x) => ({ t: x.t, o: x.o, ...parse(x.m) })),
  };
});
console.log("\n== PHASE 1: the ENTER curve ==");
report("inline style at insertion", JSON.stringify(enter.inlineAtInsertion));
report("frame count (1500ms window)", enter.frames.length);
// sample the curve at meaningful points: first frames, the extreme (overshoot), the settle
const first = enter.frames.slice(0, 5);
report("first frames", JSON.stringify(first));
const minTy = enter.frames.reduce((m, f) => (f.ty < m.ty ? f : m), { ty: 1e9 });
const maxTy = enter.frames.reduce((m, f) => (f.ty > m.ty ? f : m), { ty: -1e9 });
const minO = enter.frames.reduce((m, f) => (f.o < m.o ? f : m), { o: 2 });
report("min translateY (the overshoot floor)", JSON.stringify(minTy));
report("max translateY (the start ceiling)", JSON.stringify(maxTy));
report("min opacity", JSON.stringify(minO));
const settle = enter.frames.find((f) => f.t > 200 && f.ty === 0 && f.o === 1);
report("first t with ty=0 & o=1 (t>200)", settle ? settle.t + "ms" : "not in window");

// ---------------------------------------------------------------------------
// PHASE 2 — the EXIT curve. The toast from phase 1 is still alive (lifetime
// ~3000ms; we are ~1.6s in). Start the exit sampler NOW and let the
// auto-dismiss fire while sampling.
// ---------------------------------------------------------------------------
const exitData = await page.evaluate(() => {
  const region = [...document.querySelectorAll("body *")].find((el) => {
    if (!(el instanceof HTMLElement)) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.position === "fixed" && r.right >= window.innerWidth - 60 && r.bottom >= window.innerHeight - 60 && r.width > 0 && r.height > 0;
  });
  if (!region) return { found: false };
  const item = region.querySelector(":scope > *");
  if (!item) return { found: false, reason: "no item" };
  const t0 = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      const it = region.isConnected ? region.querySelector(":scope > *") : null;
      if (!it || !region.isConnected) {
        window.__toast.removedAt = performance.now();
        resolve({ found: true, t0: window.__toast.insertedAt, removedAt: window.__toast.removedAt, frames: window.__toast.exitFrames });
        return;
      }
      const cs = getComputedStyle(it);
      window.__toast.exitFrames.push({
        t: +(performance.now() - t0).toFixed(0),
        o: cs.opacity,
        m: cs.transform,
        inline: it.style.transform + " | " + it.style.opacity,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});

console.log("\n== PHASE 2: the EXIT curve + lifetime ==");
if (exitData.found) {
  const parse = (m) => {
    if (!m || m === "none") return { ty: 0, sx: 1 };
    const v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return { raw: m };
    const [a, , , , , e] = v[1].split(",").map(Number);
    return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
  };
  const frames = exitData.frames.map((f) => ({ t: f.t, o: f.o, ...parse(f.m) }));
  report("lifetime (insertion->removal)", Math.round(exitData.removedAt - exitData.t0) + "ms");
  report("exit frames", frames.length);
  report("exit first 6 frames", JSON.stringify(frames.slice(0, 6)));
  report("exit last 4 frames", JSON.stringify(frames.slice(-4)));
  const lastO = frames.reduce((m, f) => (f.o < m.o ? f : m), { o: 2 });
  report("min opacity in exit", JSON.stringify(lastO));
  const minTy = frames.reduce((m, f) => (f.ty < m.ty ? f : m), { ty: 1e9 });
  report("min translateY in exit (the rise)", JSON.stringify(minTy));
  const minSx = frames.reduce((m, f) => (f.sx < m.sx ? f : m), { sx: 2 });
  report("min scaleX in exit (the shrink)", JSON.stringify(minSx));
  // the inline styles seen during exit (framer writes the target inline)
  const inlines = exitData.frames.slice(0, 3).map((f) => f.inline);
  report("exit inline styles (first 3 frames)", JSON.stringify(inlines));
} else {
  report("exit", "NOT FOUND: " + (exitData.reason || "region gone"));
}

await browser.close();
console.log("\nprobe r56a complete");
