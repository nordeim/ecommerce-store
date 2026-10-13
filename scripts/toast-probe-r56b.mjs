// Round-56 REFERENCE probe B: the toast curves, refined — (1) the ENTER
// spring's full frame series t=0..700ms (the settle time, the opacity
// curve's arrival), (2) the EXIT sampled ONLY near the dismissal (every
// frame + the inline styles framer writes during the exit), (3) the exit
// duration (first moving frame -> removal). Defensive form: synchronous
// progress log + a global watchdog + hard-bounded evaluate promises.
// Run: node scripts/toast-probe-r56b.mjs
import { chromium } from "playwright-core";
import { appendFileSync } from "node:fs";

const LOG = "/tmp/probe-r56b.log";
const progress = (m) => { appendFileSync(LOG, `[${new Date().toISOString().slice(11, 19)}] ${m}\n`); console.log(m); };
progress("probe start");
setTimeout(() => { progress("WATCHDOG EXIT (90s)"); process.exit(2); }, 90000).unref?.();

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(58)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

progress("logging in");
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle", timeout: 45000 });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();
progress("login done, opening PDP");

const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1500);
progress("PDP ready");

// find the region helper (injected)
await page.evaluate(() => {
  window.__findRegion = () =>
    [...document.querySelectorAll("body *")].find((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.position === "fixed" && r.right >= window.innerWidth - 60 && r.bottom >= window.innerHeight - 60 && r.width > 0 && r.height > 0;
    }) || null;
});

// ---- the ENTER: insertion marker + tight rAF series ----
await page.evaluate(() => {
  window.__enter = { t0: null, frames: [] };
  const mo = new MutationObserver(() => {
    if (window.__enter.t0) return;
    const region = window.__findRegion();
    const item = region && region.querySelector(":scope > *");
    if (!item) return;
    window.__enter.t0 = performance.now();
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

progress("clicking ATC");
await page.getByRole("button", { name: /add to cart/i }).first().click();
await page.waitForTimeout(750); // the enter window only
progress("enter window elapsed");

progress("reading enter frames");
const enter = await page.evaluate(() => {
  const parse = (m) => {
    if (!m || m === "none") return { ty: 0, sx: 1 };
    const v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return { raw: m };
    const [a, , , , , e] = v[1].split(",").map(Number);
    return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
  };
  return { t0: window.__enter.t0, frames: window.__enter.frames.map((f) => ({ t: f.t, o: f.o, ...parse(f.m) })) };
});

console.log("== ENTER: full frame series (0..700ms) ==");
report("frames", enter.frames.length);
for (const f of enter.frames) {
  console.log(`    t=${String(f.t).padStart(4)}  o=${f.o.toFixed(3).padStart(6)}  ty=${f.ty.toFixed(2).padStart(7)}  sx=${(f.sx ?? "?").toString().padStart(6)}`);
}
progress("enter reported");

// ---- the EXIT: wait until ~2.6s after insertion, then sample tightly ----
progress("starting exit sampler (hard-bounded 10s)");
const exit = await page.evaluate(async () => {
  const region = window.__findRegion();
  const item = region && region.querySelector(":scope > *");
  if (!item) return { found: false };
  const t0 = window.__enter.t0;
  // wait until 2600ms past insertion
  await new Promise((r) => setTimeout(r, Math.max(0, 2600 - (performance.now() - t0))));
  // hard bound: resolve with whatever we have after 10s of sampling
  return new Promise((resolve) => {
    const frames = [];
    let firstMove = null;
    let done = false;
    const finish = (removed) => { if (!done) { done = true; resolve({ found: true, t0, removedAt: removed, firstMove, frames }); } };
    const killer = setTimeout(() => finish(performance.now()), 10000);
    const tick = () => {
      if (done) return;
      const it = window.__findRegion()?.querySelector(":scope > *");
      const now = performance.now();
      if (!it) { clearTimeout(killer); finish(now); return; }
      const cs = getComputedStyle(it);
      const rec = {
        t: +(now - t0).toFixed(0),
        o: +(+cs.opacity).toFixed(3),
        m: cs.transform,
        inlineT: it.style.transform || "(none)",
        inlineO: it.style.opacity || "(none)",
      };
      if (!firstMove && (rec.o < 0.999 || rec.m !== "none")) firstMove = rec.t;
      frames.push(rec);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});
progress("exit sampler done");

console.log("\n== EXIT: tight frame series (from 2.6s past insertion) ==");
if (exit.found) {
  const parse = (m) => {
    if (!m || m === "none") return { ty: 0, sx: 1 };
    const v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return { raw: m };
    const [a, , , , , e] = v[1].split(",").map(Number);
    return { ty: +e.toFixed(2), sx: +a.toFixed(3) };
  };
  report("lifetime (insertion->removal)", exit.removedAt ? Math.round(exit.removedAt - exit.t0) + "ms" : "not removed in window");
  report("first moving frame (t past insertion)", exit.firstMove + "ms");
  const moving = exit.frames.filter((f) => f.t >= (exit.firstMove ?? 0) - 20);
  report("exit frames (incl. 20ms pre-roll)", moving.length);
  for (const f of moving) {
    const p = parse(f.m);
    console.log(`    t=${String(f.t).padStart(4)}  o=${f.o.toFixed(3).padStart(6)}  ty=${p.ty.toFixed(2).padStart(7)}  sx=${(p.sx ?? "?").toString().padStart(6)}  inline="${f.inlineT} ${f.inlineO}"`);
  }
  if (exit.firstMove && exit.removedAt) {
    report("exit duration (first move->removal)", Math.round(exit.removedAt - exit.firstMove) + "ms");
  }
} else {
  report("exit", "region gone before sampler");
}

await browser.close();
progress("probe r56b complete");
console.log("\nprobe r56b complete");
