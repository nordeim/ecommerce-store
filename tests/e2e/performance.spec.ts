import { expect, test, type Page } from "@playwright/test";

// PERF-GATE-1 (session-17, ADR-025): the standing Core Web Vitals budget
// gate. Round-13 quantified the performance superset once (home only:
// clone LCP 252ms vs reference 1576ms on the byte-identical hero CDN
// image, CLS 0.0213 = 0.0213); round-17 extended the differential to the
// three top-traffic routes (authenticated, both sites — see
// scripts/cwv-diff-session17.mjs + docs/remediation-plan-session17.md):
//
//   route | clone LCP | ref LCP | LCP element (identical both sites)
//   home  | 248ms     | 1008ms  | IMG hero CDN asset (1232x468)
//   shop  | 460ms     | 1132ms  | IMG 288x288 product card
//   pdp   | 252ms     | 968ms   | IMG 584x584 product image
//   CLS   | <=0.0011 on every route (ref 0.0000-0.0061)
//
// Zero parity defects — the SSR superset holds on every route. The finding
// is the coverage gap: the differential was a MANUAL audit no gate runs.
// The defect classes that ship silently today:
//   - LCP-ELEMENT regressions: the hero image failing to eager-load (a
//     stray loading="lazy", a broken CDN pin) silently moves the LCP to
//     text; the settled-state computed-style specs cannot see it.
//   - CLS regressions: an unsized media container shifting layout after
//     first paint (the PDP's aspect-square container and the hero's
//     h-[50vh] wrapper are the load-bearing reservations).
//   - Paint-blocking regressions: bundle/CSS growth delaying first paint.
//
// The pins are BUDGETS (a QUALITY gate — the reference's slower SPA
// numbers are not a parity target; same distinction as the admin axe
// census), calibrated under exact E2E conditions (:3100 standalone, e2e
// DB, demo-user session, Desktop Chrome 1280x720 — scripts/
// cwv-calibrate-session17.mjs):
//   home: LCP 248-292ms, LCP element IMG e.size 576,576, CLS 0.0010
//   shop: LCP 312-396ms, LCP element IMG e.size  82,944, CLS 0.0006
//   pdp:  LCP 168-272ms, LCP element IMG e.size 317,112, CLS 0.0011
// Budgets: LCP <= 2500ms (6-15x headroom over calibration; catches
// paint-blocking regressions), CLS <= 0.03 (27x+ headroom; round-13's
// long-window 0.0213 stays inside — the unsized-media class lands at
// 0.1+), LCP-element identity through scale floors (the largest paint on
// each route is the route's primary product imagery).
//
// Mechanics (load-bearing): the PerformanceObservers are registered via
// page.addInitScript — BEFORE first paint — with buffered:true, so no
// candidate is missed; per LCP entry the ELEMENT GEOMETRY is captured at
// entry time (a DOM-swap carousel replaces elements — geometry captured
// in the callback survives re-renders; round-13's lesson: read element
// identity, not just the last entry). The read happens after networkidle
// + document.fonts.ready + a fixed settle, before the hero's first ~5s
// auto-advance.
//
// TDD trail: the RED step ran the zero-tolerance form of every budget
// (LCP <= 0ms, CLS = 0, identity floor impossible) and each route test
// failed for the RIGHT reason — the measured LCP at the expected
// magnitude (592/892/616ms on the E2E server, the hero IMG at 576,576
// px^2 in the failure payload) — documenting the baseline as a DELIBERATE
// quality contract before the budgets landed (see
// docs/remediation-plan-session17.md).

type LcpEntry = { startTime: number; size: number; tag: string | null; w: number; h: number };
type Cwv = { entries: LcpEntry[]; cls: number; shiftCount: number; fcp: number };

// The pinned budget profile: per-route LCP ceiling, CLS ceiling, and the
// LCP-element identity floor (the paint size that distinguishes the
// route's primary imagery from text or card-scale images). Calibrated
// under E2E conditions (scripts/cwv-calibrate-session17.mjs): LCP
// 248-396ms, CLS 0.0006-0.0011, e.size 576,576 / 82,944 / 317,112.
const PROFILE: Record<string, { path: string; lcpMax: number; clsMax: number; imgFloor: number }> = {
  home: { path: "/", lcpMax: 2500, clsMax: 0.03, imgFloor: 400_000 },
  shop: { path: "/shop", lcpMax: 2500, clsMax: 0.03, imgFloor: 50_000 },
  pdp: { path: "/product/wireless-headphones", lcpMax: 2500, clsMax: 0.03, imgFloor: 200_000 },
};

const measure = async (page: Page, path: string): Promise<Cwv> => {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __cwv: { entries: { startTime: number; size: number; tag: string | null; w: number; h: number }[]; cls: number; shiftCount: number; fcp: number };
    };
    w.__cwv = { entries: [], cls: 0, shiftCount: 0, fcp: 0 };
    try {
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
        for (const e of list.getEntries()) {
          w.__cwv.cls += (e as PerformanceEntry & { value: number }).value;
          w.__cwv.shiftCount += 1;
        }
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.name === "first-contentful-paint") w.__cwv.fcp = Math.round(e.startTime);
        }
      }).observe({ type: "paint", buffered: true });
    } catch {
      /* engines without the observer types */
    }
  });
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(1200);
  const cwv = await page.evaluate<Cwv>(() => (window as unknown as { __cwv: Cwv }).__cwv);
  return { ...cwv, entries: [...cwv.entries].sort((a, b) => b.size - a.size) };
};

test.describe("CWV standing gate (session-17, PERF-GATE-1)", () => {
  for (const [desc, r] of Object.entries(PROFILE)) {
    test(`${desc}: LCP, CLS, and LCP-element identity within the calibrated budget`, async ({ page }) => {
      const cwv = await measure(page, r.path);
      const top = cwv.entries[0] ?? null;
      // (a) the LCP budget: the final largest-paint startTime (ms since
      // navigation) under the calibrated ceiling. A paint-blocking
      // regression (bundle/CSS growth) blows this by 5-15x the measured
      // value before a human notices.
      expect(top ? top.startTime : Infinity, JSON.stringify(cwv)).toBeLessThanOrEqual(r.lcpMax);
      // (b) the CLS budget: cumulative layout-shift score (no user input
      // occurs in this window — every shift counts against the page).
      expect(cwv.cls, JSON.stringify(cwv)).toBeLessThanOrEqual(r.clsMax);
      // (c) the LCP-element identity: the LARGEST paint is the route's
      // primary product imagery (an IMG at at least the calibrated paint
      // size — the hero 576,576 px^2 on home, the product image 317,112
      // on the PDP, the first card image 82,944 on shop). A lazy or
      // broken hero/product image moves the LCP to text, which these
      // floors exclude by scale.
      expect(top?.tag, JSON.stringify(cwv)).toBe("IMG");
      expect(top ? top.size : 0, JSON.stringify(cwv)).toBeGreaterThanOrEqual(r.imgFloor);
    });
  }
});
