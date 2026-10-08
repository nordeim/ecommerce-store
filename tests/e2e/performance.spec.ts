import { devices, expect, test, type Page } from "@playwright/test";

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

// PERF-GATE-2 (session-18, ADR-026): the MOBILE-VIEWPORT CWV gate — the
// ADR-025-nominated follow-up, the A11Y-GATE-2 pattern (session-16)
// transplanted to Core Web Vitals. The round-18 mobile differential
// (scripts/cwv-diff-session18.mjs, iPhone 14 — the Playwright device
// descriptor 390x664 DPR 3, authenticated both sites) measured the mobile
// superset:
//
//   route | clone LCP | ref LCP | LCP element (identical both sites)
//   home  | 396ms  | 1260ms | IMG hero CDN asset (358x332 vs 370x343)
//   shop  | 308ms  | 1368ms | IMG 169x169 product card
//   pdp   | 312ms  |  984ms | IMG 358x358 product image
//   CLS   | <=0.0016 on every route (ref 0.0000-0.0156)
//
// (the first differential pass ran at 390x844 — the physical screen
// height — and measured the same superset at 2.2-5.7x; the recorded
// numbers above are the 390x664 pass, the EXACT viewport the gate's
// devices["iPhone 14"] produces: 664, not 844 — 50vh resolves to 332px
// here, which is why the home hero paints at 118,856 px^2, not 151,076.)
//
// The coverage gap this closes: the desktop gate is structurally blind to
// the mobile-only defect classes (the L27 structural finding — an unsized
// media container at the mobile STACKED 1-col PDP layout shifts the whole
// buy panel 358px while the desktop 2-col grid absorbs the same growth at
// 0.0184, inside the desktop budget; a mobile-only imagery regression
// moves the 390px LCP to text while the desktop identity floor stays
// green). Same engine story as the a11y mobile gate: an element hidden or
// collapsed at mobile is invisible to the desktop measurements.
//
// L28 (measured this round): the unsized-PDP-image defect class is
// CDN-timing-dependent — a WARM CDN context (login-first flow warms
// media.base44.com via the header logo) lets the image size before the
// first rendered frame -> ZERO layout-shift entries (the defect reads as
// CLS 0.0000); a COLD context (fresh, direct goto — the Playwright
// per-test context is network-isolated) reliably produced the 0.30+ shift
// in 3/3 runs, sometimes landing BEFORE FCP (Chrome's raw layout-shift
// API reports pre-FCP entries — the raw-sum observer catches them; the
// official field CLS / web-vitals library filters them). Mutation proofs
// for the CLS pin family therefore prefer the deterministic
// late-injected banner; the PDP container is the registered
// timing-conditional target (deterministic under E2E cold-context
// conditions).
//
// e.size semantics (confirmed): paint size is CSS-pixel area — DPR 3 does
// NOT multiply e.size (the desktop hero 1232x468 CSS = 576,576; the
// mobile hero 358x332 CSS = 118,856).
//
// Calibrated under exact E2E mobile conditions (scripts/
// cwv-calibrate-session18.mjs — :3100 standalone, e2e DB, demo-user
// session, iPhone 14 390x664):
//   home: LCP 228-372ms, LCP element IMG e.size 118,856, CLS 0.0003-0.0016
//   shop: LCP 340-368ms, LCP element IMG e.size  28,561, CLS 0.0008
//   pdp:  LCP 128-364ms, LCP element IMG e.size 128,164, CLS 0.0006
// Mobile budgets: LCP <= 2500ms (7-19x headroom), CLS <= 0.03 (19-100x
// headroom — same ceilings as the desktop gate; a QUALITY budget, not a
// parity pin), identity floors at ~2/3 of the measured mobile paints
// (the ADR-025 headroom convention): home 79,000 / shop 19,000 /
// pdp 85,000 px^2 — each floor sits 3.3-4.5x ABOVE the route's
// next-largest paint class (the H1s at 5,841-19,158 and the card images
// at 28,561) and 1.5x BELOW the measured hero/product paints.
//
// TDD trail: the RED step ran the zero-tolerance form of every mobile
// budget (LCP <= 0ms, CLS = 0, identity floor impossible) and each mobile
// route test failed for the RIGHT reason — the measured mobile LCP at the
// expected magnitude and the measured e.size values in the failure
// payloads — documenting the baseline as a DELIBERATE quality contract
// before the budgets landed (see docs/remediation-plan-session18.md).

// The mobile pin profile: the SAME routes and pin families, at the
// mobile-calibrated identity floors. LCP/CLS ceilings are shared with the
// desktop profile (budgets with headroom, not parity pins); the identity
// floors are viewport-scaled (the mobile paint geometry is ~1/4 of the
// desktop's).
const MOBILE_PROFILE: Record<string, { path: string; lcpMax: number; clsMax: number; imgFloor: number }> = {
  home: { path: "/", lcpMax: 2500, clsMax: 0.03, imgFloor: 79_000 },
  shop: { path: "/shop", lcpMax: 2500, clsMax: 0.03, imgFloor: 19_000 },
  pdp: { path: "/product/wireless-headphones", lcpMax: 2500, clsMax: 0.03, imgFloor: 85_000 },
};

test.describe("CWV mobile gate (session-18, PERF-GATE-2)", () => {
  // iPhone 14 (the same device descriptor the calibration used), with its
  // defaultBrowserType stripped — test.use cannot accept it inside a
  // describe (it forces a new worker; the A11Y-GATE-2 lesson); the
  // project already pins chromium. The project's storageState still
  // applies — the demo user is authed at 390px, matching the audit
  // conditions (the reference auth-gates every route).
  const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 14"];
  void _ignored;
  test.use(iPhone);

  for (const [desc, r] of Object.entries(MOBILE_PROFILE)) {
    test(`mobile ${desc}: LCP, CLS, and LCP-element identity within the mobile-calibrated budget`, async ({ page }) => {
      const cwv = await measure(page, r.path);
      const top = cwv.entries[0] ?? null;
      // (a) the mobile LCP budget (same ceiling as desktop: a QUALITY
      // budget with 7-17x headroom over the mobile calibration).
      expect(top ? top.startTime : Infinity, JSON.stringify(cwv)).toBeLessThanOrEqual(r.lcpMax);
      // (b) the mobile CLS budget — the pin family that is structurally
      // blind at desktop (the L27 stacked-layout class: the same unsized
      // container that the desktop grid absorbs at 0.0184 shifts the
      // mobile buy panel at 0.30+).
      expect(cwv.cls, JSON.stringify(cwv)).toBeLessThanOrEqual(r.clsMax);
      // (c) the mobile LCP-element identity THROUGH SCALE: the largest
      // mobile paint is the route's primary imagery at the
      // mobile-calibrated floor (the hero 358x422 = 151,076 px^2, the
      // product image 358x358 = 128,164, the first card 169x169 =
      // 28,561). A mobile-only imagery regression moves the LCP to
      // text/card-scale paints, which these floors exclude by scale.
      expect(top?.tag, JSON.stringify(cwv)).toBe("IMG");
      expect(top ? top.size : 0, JSON.stringify(cwv)).toBeGreaterThanOrEqual(r.imgFloor);
    });
  }
});
