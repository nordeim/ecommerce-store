// Round-18 CWV differential (the round's primary new surface): the MOBILE-
// VIEWPORT extension of round-17's multi-route differential. LCP + CLS +
// LCP-element identity measured on BOTH sites across the three top-traffic
// routes (home, shop, PDP) at iPhone 14 viewport (390x844, DPR 3, isMobile,
// hasTouch) — the A11Y-GATE-2 pattern (session-16) applied to CWV.
//
// Why this surface exists (L27): round-17's first CLS mutation attempt (the
// PDP aspect-square + h-full removed) did NOT bite at desktop — the PDP 2-col
// grid makes the buy-panel column taller, absorbing the image growth with
// zero movement. The SAME defect at mobile (stacked 1-col layout) shifts the
// whole buy panel. The desktop CWV gate (PERF-GATE-1) is therefore
// structurally blind to the mobile CLS class — the same blindness story as
// the desktop-only axe gate before A11Y-GATE-2.
//
// PerformanceObservers registered via addInitScript (pre-paint, buffered),
// one fresh context per route, authenticated on both sites (the reference
// auth-gates every route — round-17's methodological finding), settle after
// networkidle. The full LCP entry list is captured (carousel auto-advance
// appends later candidates; geometry captured at entry time survives
// re-renders).
// Run: node scripts/cwv-diff-session18.mjs   (clone server must be up on :3000)
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
  // iPhone 14 viewport semantics — same descriptor the a11y mobile gate uses
  // (390x844, DPR 3, isMobile, hasTouch). Deltas: 390px-wide layout (not
  // 1280), touch pointer (no mouse), mobile UA.
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });
  if (creds) await login(ctx, base, creds.email, creds.password);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await page.goto(base + route.path, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Long settle for the reference (SPA bootstrap + CDN hero image paint well
  // after networkidle); the clone settles fast, the same window fits both.
  await page.waitForTimeout(settleMs);
  const cwv = await page.evaluate(() => window.__cwv);
  await ctx.close();
  return cwv;
};

const browser = await chromium.launch();
console.log("=== Round-18 MOBILE CWV differential (iPhone 14 390x664 DPR3, authenticated (the Playwright iPhone 14 device viewport)) ===\n");
const results = {};
for (const site of [
  { key: "ref", base: REF, settle: 7000, creds: { email: "sepnetflix2023@outlook.com", password: "$Abcd1234" } },
  { key: "clone", base: CLONE, settle: 2500, creds: { email: "john@example.com", password: "Demo1234!" } },
]) {
  results[site.key] = {};
  for (const route of ROUTES) {
    const r = await measure(browser, site.base, route, site.settle, site.creds);
    results[site.key][route.name] = r;
    const top = r.lcpEntries[0] || null;
    console.log(
      `${site.key.padEnd(5)} ${route.name.padEnd(5)} ` +
        `FCP ${String(r.fcp).padStart(5)}ms | ` +
        `LCP(biggest) ${top ? top.startTime + "ms " + top.tag + " " + top.w + "x" + top.h : "-"} | ` +
        `CLS ${r.cls.toFixed(4)} (${r.shiftCount} shifts) | entries ${r.lcpEntries.length}` +
        (top ? ` | top.src ${(top.src || "").slice(0, 30)}` : ""),
    );
  }
}
console.log("\n=== comparison (LCP = biggest entry; CLS at read time) ===");
for (const route of ROUTES) {
  const ref = results.ref[route.name];
  const clone = results.clone[route.name];
  const refL = ref.lcpEntries[0] || null;
  const cloneL = clone.lcpEntries[0] || null;
  console.log(
    `${route.name}: LCP ${cloneL ? cloneL.startTime : "?"}ms (clone ${cloneL ? cloneL.tag + " " + cloneL.w + "x" + cloneL.h : "?"}) vs ${refL ? refL.startTime : "?"}ms (ref ${refL ? refL.tag + " " + refL.w + "x" + refL.h : "?"})` +
      ` | CLS ${clone.cls.toFixed(4)} vs ${ref.cls.toFixed(4)} (${ref.shiftCount}/${clone.shiftCount} shifts)`,
  );
}
await browser.close();
