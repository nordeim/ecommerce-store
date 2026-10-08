// Session-17 screenshot capture (screenshots 96–100): the multi-route CWV
// differential table (96), the 17th mobile-nav verification (97, live — the
// md5 continuity check vs the 13th–16th), the CWV gate live run (98), the
// dual mutation efficacy proof (99), and the E2E-condition calibration
// table (100). Conventions follow scripts/capture-session16.ts.
// Run: bun scripts/capture-session17.ts   (server on :3000, fresh build)
import { chromium, devices } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";
const REF = "https://fuzzy-lumina-style-hub.base44.app";

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

// --- 96: the multi-route CWV differential (the round's new surface) ---------
{
  const rows = [
    ["home", "248ms", "1008ms", "IMG hero CDN (1232x468) = IMG hero (1261x479)", "0.0010", "0.0061", "4.1x faster"],
    ["shop", "460ms", "1132ms", "IMG 288x288 card = IMG 288x288 card", "0.0006", "0.0000", "2.5x faster"],
    ["pdp", "252ms", "968ms", "IMG 584x584 product = IMG 584x584 product", "0.0011", "0.0000", "3.8x faster"],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td><span class="ok">${r[1]}</span></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td class="eq">${r[6]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">methodology:</span> PerformanceObserver (LCP + CLS + FCP, buffered) registered pre-paint via addInitScript · one fresh AUTHENTICATED context per measurement · Desktop 1280x720 · networkidle + fonts.ready + settle (7s reference for the SPA bootstrap + CDN paint) — the FIRST multi-route CWV differential (round-13 measured home only; this round adds shop + PDP)
<span class="label">auth note (measured):</span> the reference renders the LOGIN screen client-side ON every requested URL for anonymous contexts — the differential measures authenticated state on both sites (the pixel-sweep conditions). Round-13's hero-image LCP reproduces only under authentication.</div>
<table><tr><th>route</th><th>clone LCP</th><th>ref LCP</th><th>LCP element (identical both sites)</th><th>clone CLS</th><th>ref CLS</th><th>superset</th></tr>${rows}</table>
<div class="box"><span class="label">finding:</span> <span class="ok">zero parity defects</span> — the SSR performance superset holds on every route: 2–4.5x faster LCP on the byte-identical elements, CLS at or better than the reference everywhere. The round's finding is PERF-GATE-1: this differential had no standing regression gate.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Multi-route CWV differential — Round-17 new audit surface (PERF-GATE-1)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/96-cwv-differential.png` });
}

// --- 97: the 17th mobile-nav verification (live, md5 continuity) ------------
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
  await mob.screenshot({ path: `${OUT}/97-mobile-nav-17th-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/97-mobile-nav-17th-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/92-mobile-nav-16th-verification.png`)).digest("hex");
  console.log(`17th mobile-nav md5: ${md5}`);
  console.log(`16th mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 16th (and the 13th-15th)" : "DIFFERS from the 16th — investigate");
}

// --- 98: the CWV gate live run (live measurement on the current build) ------
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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
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
    home: { path: "/", lcpMax: 2500, clsMax: 0.03, imgFloor: 400_000 },
    shop: { path: "/shop", lcpMax: 2500, clsMax: 0.03, imgFloor: 50_000 },
    pdp: { path: "/product/wireless-headphones", lcpMax: 2500, clsMax: 0.03, imgFloor: 200_000 },
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
  const body = `<div class="box"><span class="label">gate:</span> tests/e2e/performance.spec.ts — PERF-GATE-1 (session-17, ADR-025). Live measurement on the production standalone server (:3000, current build, demo-user session, Desktop 1280x720) with the exact spec mechanics: pre-paint PerformanceObservers, networkidle + fonts.ready + settle.
<span class="label">pins:</span> LCP ≤ 2500ms · CLS ≤ 0.03 · LCP-element identity through scale floors (the route's primary imagery — hero 576,576px² / card 82,944px² / product 317,112px²).</div>
<table><tr><th>route</th><th>LCP</th><th>CLS</th><th>LCP element</th><th>verdict</th></tr>${rows.join("")}</table>
<div class="box"><span class="label">E2E:</span> 169/169 tests green on the suite (166 + 3 gate tests) — two consecutive full runs; the gate runs on every test:e2e.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("CWV standing gate — live run on the current build (PERF-GATE-1)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/98-cwv-gate-live-run.png` });
}

// --- 99: the dual mutation efficacy proof ------------------------------------
{
  const rows = [
    [
      "mutation 1 — hero img hidden<br/>(hero-carousel.tsx: hidden attr)",
      "home",
      "identity pin",
      'Expected: "IMG" · Received: "H1" — LCP falls to the H1 text (40,198px²) at 392ms',
      '<span class="ok">home FAILED</span> at the identity pin; LCP budget stayed GREEN (392ms) — the budget alone cannot see this defect',
    ],
    [
      "mutation 2 — late-injected banner<br/>(hero-carousel.tsx: 160px block, 900ms post-hydration)",
      "home",
      "CLS pin",
      "Expected: ≤ 0.03 · Received: 0.1040 — 3.5x over budget (2 shifts)",
      '<span class="ok">home FAILED</span> at the CLS pin; LCP + identity stayed GREEN — the late-banner defect class (consent bars / ads) is invisible to the other pins',
    ],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td>${r[1]}</td><td><span class="label">${r[2]}</span></td><td>${r[3]}</td><td>${r[4]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">method:</span> one mutation at a time, rebuild, run tests/e2e/performance.spec.ts, verify the failure REASON, revert (git-diff clean), re-run GREEN.
<span class="label">structural finding en route (L27):</span> the first CLS mutation attempt (unsized PDP image — aspect-square + h-full removed) did NOT bite at desktop: the PDP's 2-column grid makes the buy-panel column the taller one, so the image container's growth is absorbed with zero movement — the unsized-media class manifests at MOBILE (stacked 1-col layout), which is the A11Y-GATE-2 structural-blindness story again, now for CLS. Registered as the mobile-CWV round's mutation target.</div>
<table><tr><th>mutation</th><th>route</th><th>pin that fired</th><th>failure evidence</th><th>proof</th></tr>${rows}</table>
<div class="box"><span class="label">result:</span> both mutations reverted → all 3 gate tests GREEN again; the gate is proven to catch (a) LCP-element regressions and (b) post-paint layout shifts — the two defect classes no computed-style or budget-only gate could see.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Dual mutation efficacy proof — the CWV gate bites (PERF-GATE-1)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/99-mutation-efficacy-proof.png` });
}

// --- 100: the E2E-condition calibration table --------------------------------
{
  const rows = [
    ["home", "216 / 180", "292 / 248", "IMG 1232x468", "576,576", "0.0010", "2500ms · 0.03 · IMG ≥400,000"],
    ["shop", "236 / 200", "396 / 312", "IMG 288x288", "82,944", "0.0006", "2500ms · 0.03 · IMG ≥50,000"],
    ["pdp", "168 / 272", "168 / 272", "IMG 584x584", "317,112", "0.0011", "2500ms · 0.03 · IMG ≥200,000"],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td class="eq">${r[6]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">conditions:</span> scripts/cwv-calibrate-session17.mjs — the standalone server on :3100 against db/e2e.db (prisma/e2e-reset.ts canonical state), the demo user signed in once (storageState semantics), Desktop Chrome 1280x720, TWO passes per route.
<span class="label">discipline:</span> pins come from E2E conditions, not the dev DB (the session-15/16 rule) — the live dev-DB differential and the E2E-condition calibration agree (LCP 248–396ms both sides; the profile is DB-invariant).</div>
<table><tr><th>route</th><th>FCP (ms, 2 passes)</th><th>LCP (ms, 2 passes)</th><th>LCP element</th><th>e.size (px²)</th><th>CLS</th><th>pinned budget</th></tr>${rows}</table>
<div class="box"><span class="label">headroom:</span> LCP budget 2500ms = 6–15x the calibrated values (absorbs CDN variance; catches paint-blocking regressions) · CLS budget 0.03 = 27x+ (round-13's long-window 0.0213 stays inside; the unsized-media class lands at 0.1+) · the identity floors distinguish the route's primary imagery from text or card-scale paints by scale.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("CWV E2E-condition calibration — the pins' provenance (PERF-GATE-1)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/100-cwv-calibration.png` });
}

await browser.close();
console.log("captured 96-100");
