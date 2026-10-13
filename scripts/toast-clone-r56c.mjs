// Round-56 CLONE probe C: the toast's enter/exit animation states on the
// CLONE (the production standalone on :3000, run via the battery runner).
// The same instrumentation as toast-probe-r56a/b: the enter from-pose +
// frame series, the exit curve + trigger timing, the resting anatomy, the
// unmount. Ground truth for the r56 plan's comparison table.
// Run (via battery): bash scripts/battery-runner.sh toast-clone-r56c.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(58)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// ---- login (the demo user) ----
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();
console.log("clone login ok");

const page = await ctx.newPage();
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
console.log("PDP ready");

await page.evaluate(() => {
  window.__findRegion = () => document.querySelector("div.fixed.bottom-6.right-6") || null;
});

// ---- the ENTER: insertion marker + tight rAF series ----
await page.evaluate(() => {
  window.__enter = { t0: null, frames: [], insertPose: null };
  const mo = new MutationObserver(() => {
    if (window.__enter.t0) return;
    const region = window.__findRegion();
    const item = region && region.querySelector(":scope > *");
    if (!item) return;
    window.__enter.t0 = performance.now();
    window.__enter.insertPose = {
      cls: item.getAttribute("class"),
      inlineT: item.style.transform || null,
      inlineO: item.style.opacity || null,
    };
    mo.disconnect();
    const tick = () => {
      const it = window.__findRegion()?.querySelector(":scope > *");
      if (!it) return;
      const cs = getComputedStyle(it);
      window.__enter.frames.push({ t: +(performance.now() - window.__enter.t0).toFixed(0), o: +(+cs.opacity).toFixed(3), m: cs.transform });
      if (performance.now() - window.__enter.t0 < 700) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  mo.observe(document.body, { childList: true, subtree: true });
});

console.log("clicking ATC");
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(750);
console.log("enter window elapsed");

const enter = await page.evaluate(() => {
  const parse = (m) => {
    if (!m || m === "none") return { ty: 0, sx: 1 };
    const v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return { raw: m };
    const [a, , , , , e] = v[1].split(",").map(Number);
    return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
  };
  return { t0: window.__enter.t0, insertPose: window.__enter.insertPose, frames: window.__enter.frames.map((f) => ({ t: f.t, o: f.o, ...parse(f.m) })) };
});

console.log("== CLONE ENTER (0..700ms) ==");
report("insertion class", JSON.stringify(enter.insertPose));
report("frames", enter.frames.length);
for (const f of enter.frames) {
  console.log(`    t=${String(f.t).padStart(4)}  o=${f.o.toFixed(3).padStart(6)}  ty=${f.ty.toFixed(2).padStart(7)}  sx=${(f.sx ?? "?").toString().padStart(6)}`);
}

// ---- resting anatomy at ~1s ----
const rest = await page.evaluate(() => {
  const region = window.__findRegion();
  const item = region && region.querySelector(":scope > *");
  if (!item) return { found: false };
  const rcs = getComputedStyle(region);
  const ics = getComputedStyle(item);
  const ir = item.getBoundingClientRect();
  const svg = item.querySelector("svg");
  return {
    found: true,
    regionClass: region.getAttribute("class"),
    regionComputed: { position: rcs.position, zIndex: rcs.zIndex, display: rcs.display, flexDirection: rcs.flexDirection, gap: rcs.rowGap, pointerEvents: rcs.pointerEvents, bottom: rcs.bottom, right: rcs.right },
    itemClass: item.getAttribute("class"),
    itemComputed: {
      bg: ics.backgroundColor, color: ics.color, radius: ics.borderRadius,
      padding: ics.padding, shadow: ics.boxShadow.slice(0, 90),
      font: ics.fontSize + "/" + ics.fontWeight, gap: ics.columnGap,
      maxWidth: ics.maxWidth, transition: ics.transitionDuration + " " + ics.transitionProperty.slice(0, 40),
      transitionTF: ics.transitionTimingFunction,
      animation: ics.animationDuration + " " + ics.animationName,
      transform: ics.transform, opacity: ics.opacity,
      width: Math.round(ir.width), height: Math.round(ir.height),
    },
    svgClass: svg ? svg.getAttribute("class") : null,
    svgSize: svg ? getComputedStyle(svg).width + "/" + getComputedStyle(svg).height : null,
    text: item.textContent,
  };
});
console.log("\n== CLONE resting anatomy (~1s) ==");
if (rest.found) {
  report("region class", rest.regionClass);
  report("region computed", JSON.stringify(rest.regionComputed));
  report("item class", rest.itemClass);
  report("item computed", JSON.stringify(rest.itemComputed));
  report("svg", rest.svgClass + " " + rest.svgSize);
  report("text", rest.text);
} else {
  report("region", "NOT FOUND");
}

// ---- the EXIT: poll for the toast-exiting class from 2.8s, then sample ----
const exit = await page.evaluate(async () => {
  const t0 = window.__enter.t0;
  // wait until 2800ms past insertion
  await new Promise((r) => setTimeout(r, Math.max(0, 2800 - (performance.now() - t0))));
  // poll for the exiting class (lands at 3000ms)
  let item = null;
  const pollStart = performance.now();
  while (performance.now() - pollStart < 2000) {
    const region = window.__findRegion();
    item = region && region.querySelector(":scope > *");
    if (item && item.classList.contains("toast-exiting")) break;
    await new Promise((r) => setTimeout(r, 16));
  }
  if (!item || !item.classList.contains("toast-exiting")) return { found: false };
  const exitStart = performance.now();
  return new Promise((resolve) => {
    const frames = [];
    let done = false;
    const finish = (removed) => { if (!done) { done = true; resolve({ found: true, t0, exitStart, removedAt: removed, frames }); } };
    const killer = setTimeout(() => finish(performance.now()), 2500);
    const tick = () => {
      if (done) return;
      const region = window.__findRegion();
      const it = region ? region.querySelector(":scope > *") : null;
      const now = performance.now();
      const gone = !it || ![...(it.classList || [])].includes("toast-exiting") && now - exitStart > 400;
      // unmount: the region's child disappears (or the child loses the class via re-render) —
      // the authoritative unmount signal is the element's removal from the DOM.
      if (!it || !it.isConnected) { clearTimeout(killer); finish(now); return; }
      const cs = getComputedStyle(it);
      frames.push({ t: +(now - exitStart).toFixed(0), o: +(+cs.opacity).toFixed(3), m: cs.transform, exiting: it.classList.contains("toast-exiting") });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});

console.log("\n== CLONE EXIT (from the toast-exiting class) ==");
if (exit.found) {
  const parse = (m) => {
    if (!m || m === "none") return { ty: 0, sx: 1 };
    const v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return { raw: m };
    const [a, , , , , e] = v[1].split(",").map(Number);
    return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
  };
  report("exiting-class landing (t past insertion)", Math.round(exit.exitStart - exit.t0) + "ms");
  report("removal (t past insertion)", exit.removedAt ? Math.round(exit.removedAt - exit.t0) + "ms" : "not removed in window");
  const frames = exit.frames.map((f) => ({ t: f.t, o: f.o, exiting: f.exiting, ...parse(f.m) }));
  report("exit frames", frames.length);
  for (const f of frames) {
    console.log(`    t=${String(f.t).padStart(4)}  o=${f.o.toFixed(3).padStart(6)}  ty=${f.ty.toFixed(2).padStart(7)}  sx=${(f.sx ?? "?").toString().padStart(6)}  exiting=${f.exiting}`);
  }
} else {
  report("exit", "toast-exiting class not observed");
}

await browser.close();
console.log("\nclone probe r56c complete");
