// Round-17 CWV differential (the round's primary new surface): LCP + CLS +
// LCP-element identity measured on BOTH sites across the three top-traffic
// routes (home, shop, PDP) — the multi-route expansion of round-13's
// home-only differential. PerformanceObservers registered via
// addInitScript (pre-paint, buffered), one fresh context per route, settle
// after networkidle (fonts ready + fixed delay). The full LCP entry list is
// captured (carousel auto-advance can append later candidates on the
// reference's DOM-swap carousel — round-13's lesson: read element identity,
// not just the last entry).
// Run: node scripts/cwv-diff-session17.mjs   (clone server must be up on :3000)
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";

const ROUTES = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "pdp", path: "/product/wireless-headphones" },
];

const INIT = () => {
  window.__cwv = { lcpEntries: [], cls: 0, shiftCount: 0, fcp: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__cwv.lcpEntries.push({
          startTime: Math.round(e.startTime),
          size: e.size,
          tag: e.element ? e.element.tagName : "?",
          src: e.element && e.element.currentSrc ? e.element.currentSrc.split("/").pop() : null,
          w: e.element ? Math.round(e.element.getBoundingClientRect().width) : 0,
          h: e.element ? Math.round(e.element.getBoundingClientRect().height) : 0,
        });
      }
      window.__cwv.lcpEntries.sort((a, b) => b.size - a.size);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__cwv.cls += e.value;
        window.__cwv.shiftCount++;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === "first-contentful-paint") window.__cwv.fcp = Math.round(e.startTime);
      }
    }).observe({ type: "paint", buffered: true });
  } catch {
    /* older engine */
  }
};

const login = async (ctx, base, email, password) => {
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const path = new URL(page.url()).pathname;
  await page.close();
  return path;
};

const measure = async (browser, base, route, settleMs, creds) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  // The reference auth-gates every route for anonymous visitors (it renders
  // the login screen client-side ON the requested URL — measured this round).
  // The differential therefore measures authenticated state on both sites,
  // exactly like the pixel sweep.
  if (creds) await login(ctx, base, creds.email, creds.password);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await page.goto(base + route.path, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Long settle for the reference (SPA bootstrap + CDN hero image paint well
  // after networkidle — round-13's lesson: read element identity, and read
  // it LATE). The clone settles fast; the same window is fine for both.
  await page.waitForTimeout(settleMs);
  const cwv = await page.evaluate(() => window.__cwv);
  await ctx.close();
  return cwv;
};

const browser = await chromium.launch();
console.log("=== Round-17 multi-route CWV differential (Desktop 1280x720, authenticated) ===\n");
const results = {};
for (const site of [
  { key: "ref", base: REF, settle: 7000, creds: { email: "sepnetflix2023@outlook.com", password: "$Abcd1234" } },
  { key: "clone", base: CLONE, settle: 2500, creds: { email: "john@example.com", password: "Demo1234!" } },
]) {
  results[site.key] = {};
  for (const route of ROUTES) {
    const r = await measure(browser, site.base, route, site.settle, site.creds);
    results[site.key][route.name] = r;
    // The hero-image LCP = the FIRST entry with an image ≥ 400k px^2 on home
    // (carousel re-paints append later same-size candidates — round-13's
    // "true LCP" discipline); on shop/PDP the first big IMG entry.
    const bigImg = r.lcpEntries.find((e) => e.tag === "IMG" && e.w * e.h >= 400000) || null;
    const top = r.lcpEntries[0] || null;
    console.log(
      `${site.key.padEnd(5)} ${route.name.padEnd(5)} ` +
        `FCP ${String(r.fcp).padStart(5)}ms | ` +
        `LCP(biggest) ${top ? top.startTime + "ms " + top.tag + " " + top.w + "x" + top.h : "-"} | ` +
        `LCP(firstBigImg) ${bigImg ? bigImg.startTime + "ms " + bigImg.w + "x" + bigImg.h + " " + (bigImg.src || "").slice(0, 22) : "-"} | ` +
        `CLS ${r.cls.toFixed(4)} (${r.shiftCount} shifts) | entries ${r.lcpEntries.length}`,
    );
  }
}
console.log("\n=== comparison (LCP = first big image paint; CLS at read time) ===");
for (const route of ROUTES) {
  const ref = results.ref[route.name];
  const clone = results.clone[route.name];
  const pick = (r) => r.lcpEntries.find((e) => e.tag === "IMG" && e.w * e.h >= 400000) || r.lcpEntries[0] || null;
  const refL = pick(ref);
  const cloneL = pick(clone);
  console.log(
    `${route.name}: LCP ${cloneL ? cloneL.startTime : "?"}ms (clone ${cloneL ? cloneL.tag + " " + cloneL.w + "x" + cloneL.h : "?"}) vs ${refL ? refL.startTime : "?"}ms (ref ${refL ? refL.tag + " " + refL.w + "x" + refL.h : "?"})` +
      ` | CLS ${clone.cls.toFixed(4)} vs ${ref.cls.toFixed(4)} (${ref.shiftCount}/${clone.shiftCount} shifts)`,
  );
}
await browser.close();
