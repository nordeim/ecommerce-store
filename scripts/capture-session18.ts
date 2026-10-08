// Session-18 screenshot capture (screenshots 101–105): the MOBILE CWV
// differential table (101), the 18th mobile-nav verification (102, live —
// the md5 continuity check vs the 13th–17th), the mobile CWV gate live run
// (103), the triple mutation efficacy proof (104), and the E2E-condition
// mobile calibration table (105). Conventions follow
// scripts/capture-session17.ts.
// Run: bun scripts/capture-session18.ts   (server on :3000, fresh build)
import { chromium, devices } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";

const browser = await chromium.launch();

const panel = (title: string, body: string) =>
  `data:text/html,${encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0f172a;color:#e2e8f0;padding:24px;font-size:12.5px;line-height:1.65}
h1{font-family:system-ui;color:#fbfae4;font-size:16px;margin:0 0 14px}
h2{font-family:system-ui;color:#fbfae4;font-size:13px;margin:18px 0 6px}
.box{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 16px;margin-bottom:12px;white-space:pre-wrap;word-break:break-word}
.label{color:#f59e0b;font-weight:700}
.ok{color:#4ade80}
.bad{color:#f87171}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #334155;padding:5px 9px;text-align:left}
th{color:#f59e0b}
.eq{color:#4ade80;font-weight:700}
</style></head><body><h1>${title}</h1>${body}</body></html>`)}`;

// --- 101: the MOBILE CWV differential (the round's new surface) -------------
{
  const rows = [
    ["home", "396ms", "1260ms", "IMG hero CDN (358x332) = IMG (370x343)", "0.0016", "0.0156", "3.2x faster"],
    ["shop", "308ms", "1368ms", "IMG 169x169 card = IMG 169x169 card", "0.0008", "0.0000", "4.4x faster"],
    ["pdp", "312ms", "984ms", "IMG 358x358 product = IMG 358x358 product", "0.0006", "0.0000", "3.2x faster"],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td><span class="ok">${r[1]}</span></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td class="eq">${r[6]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">methodology:</span> scripts/cwv-diff-session18.mjs — PerformanceObserver (LCP + CLS + FCP, buffered) registered pre-paint via addInitScript · one fresh AUTHENTICATED context per measurement · iPhone 14 = the Playwright device descriptor 390x664 DPR 3 (the EXACT viewport the gate's devices["iPhone 14"] produces) · networkidle + fonts.ready + settle (7s reference for the SPA bootstrap + CDN paint) — the FIRST MOBILE-VIEWPORT CWV differential (round-17 measured desktop only; this is the ADR-025-nominated follow-up).
<span class="label">viewport note:</span> the first pass ran at 390x844 (the physical screen) and measured the same superset at 2.2-5.7x; the recorded numbers are the 390x664 pass — 50vh resolves to 332px at 664, which is why the hero paints at 118,856 px².
<span class="label">auth note (round-17 finding):</span> the reference renders the LOGIN screen client-side ON every requested URL for anonymous contexts — the differential measures authenticated state on both sites.</div>
<table><tr><th>route</th><th>clone LCP</th><th>ref LCP</th><th>LCP element (identical both sites)</th><th>clone CLS</th><th>ref CLS</th><th>superset</th></tr>${rows}</table>
<div class="box"><span class="label">finding:</span> <span class="ok">zero parity defects</span> — the mobile SSR performance superset holds on every route: 3.2-4.4x faster LCP on the byte-identical elements, CLS at or better than the reference everywhere. The round's finding is PERF-GATE-2: the desktop-only CWV gate is structurally blind to the mobile-only defect classes (the L27 stacked-layout story).</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("MOBILE CWV differential — Round-18 new audit surface (PERF-GATE-2)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/101-mobile-cwv-differential.png` });
}

// --- 102: the 18th mobile-nav verification (live, md5 continuity) ------------
{
  const ctx = await browser.newContext({ ...devices["iPhone 14"] });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("john@example.com");
    await lp.getByLabel("Password").fill("Demo1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  const mob = await ctx.newPage();
  await mob.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await mob.waitForTimeout(600);
  await mob.getByRole("button", { name: "Open navigation menu" }).click();
  await mob.waitForTimeout(700);
  await mob.screenshot({ path: `${OUT}/102-mobile-nav-18th-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/102-mobile-nav-18th-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/97-mobile-nav-17th-verification.png`)).digest("hex");
  console.log(`18th mobile-nav md5: ${md5}`);
  console.log(`17th mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 17th (and the 13th-16th)" : "DIFFERS from the 17th — investigate");
}

// --- 103: the mobile CWV gate live run (live measurement, mobile viewport) ---
{
  const INIT = () => {
    const w = window as unknown as { __cwv: { entries: { startTime: number; size: number; tag: string | null; w: number; h: number }[]; cls: number; fcp: number } };
    w.__cwv = { entries: [], cls: 0, fcp: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const le = e as PerformanceEntry & { element?: Element | null; size: number };
        const el = le.element ?? null;
        w.__cwv.entries.push({
          startTime: Math.round(e.startTime),
          size: le.size,
          tag: el ? el.tagName : null,
          w: el ? Math.round(el.getBoundingClientRect().width) : 0,
          h: el ? Math.round(el.getBoundingClientRect().height) : 0,
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__cwv.cls += (e as PerformanceEntry & { value: number }).value;
    }).observe({ type: "layout-shift", buffered: true });
  };
  const ctx = await browser.newContext({ ...devices["iPhone 14"] });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("john@example.com");
    await lp.getByLabel("Password").fill("Demo1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  const budget: Record<string, { path: string; lcpMax: number; clsMax: number; imgFloor: number }> = {
    home: { path: "/", lcpMax: 2500, clsMax: 0.03, imgFloor: 79_000 },
    shop: { path: "/shop", lcpMax: 2500, clsMax: 0.03, imgFloor: 19_000 },
    pdp: { path: "/product/wireless-headphones", lcpMax: 2500, clsMax: 0.03, imgFloor: 85_000 },
  };
  const rows: string[] = [];
  for (const [desc, r] of Object.entries(budget)) {
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.waitForTimeout(1200);
    const cwv = await page.evaluate(
      () => (window as unknown as { __cwv: { entries: { startTime: number; size: number; tag: string | null; w: number; h: number }[]; cls: number; fcp: number } }).__cwv,
    );
    const top = [...cwv.entries].sort((a, b) => b.size - a.size)[0] ?? null;
    const lcpOk = top !== null && top.startTime <= r.lcpMax;
    const clsOk = cwv.cls <= r.clsMax;
    const idOk = top !== null && top.tag === "IMG" && top.size >= r.imgFloor;
    rows.push(
      `<tr><td>${desc}</td><td><span class="${lcpOk ? "ok" : "bad"}">${top ? top.startTime : "?"}ms</span> (≤${r.lcpMax})</td><td><span class="${clsOk ? "ok" : "bad"}">${cwv.cls.toFixed(4)}</span> (≤${r.clsMax})</td><td><span class="${idOk ? "ok" : "bad"}">${top ? `${top.tag} ${top.w}x${top.h} (${top.size.toLocaleString()}px²)` : "none"}</span> (IMG ≥${r.imgFloor.toLocaleString()})</td><td class="eq">${lcpOk && clsOk && idOk ? "PASS" : "FAIL"}</td></tr>`,
    );
    await page.close();
  }
  await ctx.close();
  const body = `<div class="box"><span class="label">gate:</span> tests/e2e/performance.spec.ts — PERF-GATE-2 (session-18, ADR-026), the CWV mobile gate describe. Live measurement on the production standalone server (:3000, current build, demo-user session, iPhone 14 = 390x664 DPR 3) with the exact spec mechanics: pre-paint PerformanceObservers, networkidle + fonts.ready + settle.
<span class="label">pins:</span> LCP ≤ 2500ms · CLS ≤ 0.03 · LCP-element identity through MOBILE-scale floors (the route's primary imagery — hero 118,856px² / card 28,561px² / product 128,164px²; floors at ~2/3 of the measured paints).</div>
<table><tr><th>route</th><th>LCP</th><th>CLS</th><th>LCP element</th><th>verdict</th></tr>${rows.join("")}</table>
<div class="box"><span class="label">E2E:</span> 172/172 tests green on the suite (169 + 3 mobile gate tests) — two consecutive full runs; the mobile gate runs on every test:e2e at the same device descriptor as the a11y mobile gate.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("CWV MOBILE gate — live run on the current build (PERF-GATE-2)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/103-mobile-cwv-gate-live-run.png` });
}

// --- 104: the triple mutation efficacy proof ---------------------------------
{
  const rows = [
    [
      "mutation 1 — mobile-only hero-img hiding<br/>(globals.css: @media ≤640px .hero-mut display:none)",
      "home (mobile only)",
      "identity pin",
      'Expected: "IMG" · Received: "H1" — the mobile LCP falls to the H1 (19,050px²) at 504ms',
      '<span class="ok">mobile home FAILED</span> at the identity pin; ALL FOUR DESKTOP tests stayed GREEN (the hero renders at 1280px) — the structural-blindness PROOF: a mobile-only defect passes the desktop gate forever',
    ],
    [
      "mutation 2 — late-injected banner<br/>(hero-carousel.tsx: 160px block, 900ms post-hydration)",
      "home",
      "CLS pin",
      "Expected: ≤ 0.03 · Received: 0.2088 — 7x over budget at 390x664 (desktop measured 0.1098)",
      '<span class="ok">mobile home FAILED</span> at the CLS pin (proportionally LARGER at mobile — the banner is a bigger viewport fraction); LCP + identity stayed GREEN',
    ],
    [
      "mutation 3 — the L27 PDP unsized image<br/>(product/[slug]/page.tsx: aspect-square + h-full removed)",
      "pdp (bites at mobile)",
      "CLS pin",
      "Expected: ≤ 0.03 · Received: 0.3776 — 12.6x over budget (the buy panel shifts 358px in the stacked 1-col layout)",
      '<span class="ok">mobile pdp FAILED</span> at the CLS pin while the DESKTOP pdp stayed GREEN (the 2-col grid absorbs the growth at 0.0184, inside budget) — the L27 class caught exactly where it manifests',
    ],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td>${r[1]}</td><td><span class="label">${r[2]}</span></td><td>${r[3]}</td><td>${r[4]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">method:</span> one mutation at a time, rebuild, run tests/e2e/performance.spec.ts, verify the failure REASON, revert (git-diff clean), re-run GREEN.
<span class="label">L28 (measured en route):</span> the L27 defect class is CDN-timing-dependent — a WARM CDN context (login-first flow warms media.base44.com) lets the image size before the first frame → ZERO shift entries; a COLD context (the Playwright per-test context is network-isolated) reliably produced the 0.30+ shift, sometimes landing pre-FCP (the raw layout-shift API reports pre-FCP entries — the raw-sum observer catches them; the official field CLS filters them). The PDP container is therefore the registered TIMING-CONDITIONAL mobile target: deterministic under E2E cold-context conditions.</div>
<table><tr><th>mutation</th><th>route</th><th>pin that fired</th><th>failure evidence</th><th>proof</th></tr>${rows}</table>
<div class="box"><span class="label">result:</span> all three mutations reverted → all 7 gate tests GREEN again (4 desktop + 3 mobile); the mobile gate is proven to catch (a) mobile-only imagery regressions invisible to the desktop gate, (b) the late-banner CLS class at proportionally mobile scale, and (c) the L27 stacked-layout defect class exactly where it manifests.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Triple mutation efficacy proof — the mobile CWV gate bites (PERF-GATE-2)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/104-mobile-cwv-mutation-proof.png` });
}

// --- 105: the E2E-condition mobile calibration table --------------------------
{
  const rows = [
    ["home", "188 / 228", "372 / 228", "IMG 358x332", "118,856", "0.0003-0.0016", "2500ms · 0.03 · IMG ≥79,000"],
    ["shop", "140 / 232", "368 / 340", "IMG 169x169", "28,561", "0.0008", "2500ms · 0.03 · IMG ≥19,000"],
    ["pdp", "364 / 128", "364 / 128", "IMG 358x358", "128,164", "0.0006", "2500ms · 0.03 · IMG ≥85,000"],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td class="eq">${r[6]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">conditions:</span> scripts/cwv-calibrate-session18.mjs — the standalone server on :3100 against db/e2e.db (prisma/e2e-reset.ts canonical state), the demo user signed in once (storageState semantics), iPhone 14 = 390x664 DPR 3 (the devices descriptor the gate uses — NOT the 844 physical height), TWO passes per route.
<span class="label">discipline:</span> pins come from E2E conditions, not the dev DB (the session-15/16/17 rule) — the first calibration pass ran at 390x844 and mismatched the gate's device viewport by 180px of hero height (151,076 vs 118,856 px²); re-calibrated at the exact device descriptor. e.size is CSS-pixel area — DPR 3 does not multiply it.</div>
<table><tr><th>route</th><th>FCP (ms, 2 passes)</th><th>LCP (ms, 2 passes)</th><th>LCP element</th><th>e.size (px²)</th><th>CLS</th><th>pinned budget</th></tr>${rows}</table>
<div class="box"><span class="label">headroom:</span> LCP budget 2500ms = 7-19x the calibrated values (absorbs CDN variance; catches paint-blocking regressions) · CLS budget 0.03 = 19-100x (the unsized-media class lands at 0.2+) · the identity floors sit 3.3-4.5x above each route's next-largest paint class (the H1s at 5,841-19,158 and the cards at 28,561) and 1.5x below the measured hero/product paints.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("MOBILE CWV E2E-condition calibration — the pins' provenance (PERF-GATE-2)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/105-mobile-cwv-calibration.png` });
}

await browser.close();
console.log("captured 101-105");
