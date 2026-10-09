import { expect, test, devices, type Page } from "@playwright/test";
import { adminLogin } from "./helpers";

// A11y standing gate (session-15, A11Y-GATE-1, ADR-023): converts the
// session-12 MANUAL axe-core differential into a permanent E2E check. The
// session-12 audit exposed the longest-lived defect in the project's
// history — four shopper pages shipped a nested <main> from session-1
// through session-11, invisible to eleven computed-style rounds — and the
// only thing preventing its return was a human re-running the manual
// injection. This spec pins the axe profile of the measured routes so any
// regression (landmarks, aria-prohibited-attr, unlabeled controls, …)
// fails the gate.
//
// The parity contract being pinned (re-measured live on BOTH sites in
// session-15, same axe build injected each side — see
// scripts/axe-diff-session15.mjs + docs/remediation-plan-session15.md):
//   - the clone's violation census is EXACTLY {color-contrast} on every
//     measured route — the shared parity trait (the reference carries the
//     IDENTICAL counts: white-on-orange badges etc., dismissed as parity
//     in session-12; "fixing" only the clone would break parity)
//   - the color-contrast node counts are byte-identical to the
//     reference's per route (28/23/14/8/8/3, calibrated under exact E2E
//     conditions — Desktop Chrome 1280x720 on the e2e DB:
//     scripts/axe-calibrate-session15.mjs)
//   - the reference ADDITIONALLY carries 4-20 button-name + 2 link-name +
//     4 label violations per route that the clone does not (the aria
//     superset) — any of those rules firing on the clone is a regression
//
// Injection is SELF-HOSTED (axe-core pinned as an explicit devDependency;
// page.addScriptTag injects via the DevTools protocol, which is exempt
// from the page's CSP — no CDN, no network dependency). The scrolled-reveal
// pass before axe.run is the session-12 methodology trap: content kept at
// opacity:0 until scrolled (framer-motion whileInView wrappers on the
// reference; defensive here) is SKIPPED by axe.
//
// TDD trail: the RED step ran the zero-violation form of these assertions
// and failed on every route for the RIGHT reason — the color-contrast
// shared-parity trait (28 nodes on home, etc.) — documenting that the
// baseline profile is a DELIBERATE parity contract, not an oversight,
// before the profile was pinned (see docs/remediation-plan-session15.md).

const AXE_PATH = "node_modules/axe-core/axe.min.js";

type Violation = { id: string; nodes: number };

const runAxe = async (page: import("@playwright/test").Page): Promise<Violation[]> => {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async () => {
    // Scroll-reveal: walk the page bottom-ward so any lazily-revealed
    // content enters the visibility state axe checks.
    await new Promise<void>((resolve) => {
      let y = 0;
      const iv = setInterval(() => {
        window.scrollBy(0, 400);
        y += 400;
        if (y > document.body.scrollHeight) {
          clearInterval(iv);
          resolve();
        }
      }, 60);
    });
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
    const axeResult = await (
      window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }
    ).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return axeResult.violations.map((v) => ({ id: v.id, nodes: v.nodes.length }));
  });
};

// The pinned parity profile: per-route color-contrast node counts,
// byte-identical to the reference's live-measured counts.
const PROFILE: Record<string, { path: string; contrast: number }> = {
  home: { path: "/", contrast: 28 },
  shop: { path: "/shop", contrast: 23 },
  pdp: { path: "/product/wireless-headphones", contrast: 14 },
  cart: { path: "/cart", contrast: 8 },
  account: { path: "/account", contrast: 8 },
};

test.describe("a11y standing gate (session-15, A11Y-GATE-1)", () => {
  for (const [desc, r] of Object.entries(PROFILE)) {
    test(`${desc}: the violation census is exactly {color-contrast} with the parity-pinned count`, async ({ page }) => {
      await page.goto(r.path, { waitUntil: "networkidle" });
      const violations = await runAxe(page);
      // (a) the census: ONLY the shared-parity rule may fire — any other
      // rule (button-name, label, landmarks, aria-prohibited-attr, …) is
      // a regression against the aria superset / the session-12 fixes.
      const ids = violations.map((v) => v.id).sort();
      expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
      // (b) the count: byte-identical to the reference's measured
      // profile — drift in EITHER direction is flagged.
      expect(violations[0].nodes).toBe(r.contrast);
    });
  }

  test("login: the violation census is exactly {color-contrast} with the parity-pinned count", async ({ browser }) => {
    // The auth screen renders standalone (no main landmark, no chrome) —
    // measured anonymously, the auth.spec pattern.
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("/login", { waitUntil: "networkidle" });
    const violations = await runAxe(page);
    const ids = violations.map((v) => v.id).sort();
    expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
    expect(violations[0].nodes).toBe(3);
    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// A11Y-GATE-2 (session-16, ADR-024): the gate extended to the two surface
// families the desktop shopper gate structurally cannot see —
//   (a) MOBILE viewports: an element hidden at desktop (lg:hidden) is
//       display:none -> axe SKIPS it at 1280x720 -> a mobile-only defect
//       passes the desktop gate forever. The mobile census is byte-identical
//       to the desktop's (live-measured on BOTH sites at iPhone 14 + E2E-
//       calibrated: 28/23/14/8/8/3 — scripts/axe-diff-session16.mjs +
//       scripts/axe-calibrate-session16.mjs); the reference additionally
//       carries button-name/link-name/label at mobile (the aria superset
//       holds at mobile).
//   (b) ADMIN surfaces (superset, no reference counterpart): a QUALITY
//       census — the measured profile is {color-contrast} only, 8/7/7/7,
//       zero aria violations on any console surface.
// TDD trail: the RED step ran the zero-violation form of these assertions
// and failed on every route for the RIGHT reason — the color-contrast
// shared-parity trait (the same deliberate contract as the desktop gate) —
// before the profile was pinned (docs/remediation-plan-session16.md).
// ---------------------------------------------------------------------------

// The admin surfaces' measured profile (Desktop 1280x720, E2E-calibrated).
// The order detail is reached via the ORD-2026-001 link (the admin.spec
// convention — the e2e.db cuid is not hardcodable across fresh clones).
const ADMIN_PROFILE: { desc: string; path: string | null; viaOrders?: boolean }[] = [
  { desc: "admin dashboard", path: "/admin" },
  { desc: "admin orders", path: "/admin/orders" },
  { desc: "admin products", path: "/admin/products" },
  { desc: "admin order detail", path: null, viaOrders: true },
];

test.describe("a11y mobile gate (session-16, A11Y-GATE-2)", () => {
  // iPhone 14 (the same device descriptor the calibration used), with its
  // defaultBrowserType stripped — test.use cannot accept it inside a
  // describe (it forces a new worker); the project already pins chromium.
  // The project's storageState still applies — the demo user is authed at
  // 390px.
  const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 14"];
  void _ignored;
  test.use(iPhone);

  for (const [desc, r] of Object.entries(PROFILE)) {
    test(`mobile ${desc}: the violation census is exactly {color-contrast} with the parity-pinned count`, async ({ page }) => {
      await page.goto(r.path, { waitUntil: "networkidle" });
      const violations = await runAxe(page);
      const ids = violations.map((v) => v.id).sort();
      expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
      // the mobile census is byte-identical to the desktop's — the SAME
      // pins; a divergence between viewports is flagged exactly like a
      // drift at either one.
      expect(violations[0].nodes).toBe(r.contrast);
    });
  }

  test("mobile login: the violation census is exactly {color-contrast} with the parity-pinned count", async ({ browser }) => {
    const ctx = await browser.newContext({ ...iPhone, storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("/login", { waitUntil: "networkidle" });
    const violations = await runAxe(page);
    const ids = violations.map((v) => v.id).sort();
    expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
    expect(violations[0].nodes).toBe(3);
    await ctx.close();
  });
});

test.describe("a11y admin gate (session-16, A11Y-GATE-2)", () => {
  let admin: Page;

  test.beforeAll(async ({ browser }) => {
    // One admin login for the whole describe (the admin.spec pattern — the
    // admin email draws from its own rate-limit bucket; with the stock and
    // admin specs' logins that is 3 admin logins per E2E run, inside the
    // 10/15min bucket even across two consecutive runs).
    admin = await adminLogin(browser);
  });

  test.afterAll(async () => {
    await admin.close();
  });

  for (const r of ADMIN_PROFILE) {
    test(`${r.desc}: the violation census is exactly {color-contrast} with the quality-pinned count`, async () => {
      if (r.viaOrders) {
        await admin.goto("/admin/orders", { waitUntil: "networkidle" });
        await admin.getByRole("link", { name: "ORD-2026-001" }).click();
        await admin.waitForLoadState("networkidle");
      } else {
        await admin.goto(r.path!, { waitUntil: "networkidle" });
      }
      const violations = await runAxe(admin);
      const ids = violations.map((v) => v.id).sort();
      expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
      // the admin QUALITY pins (E2E-calibrated: dashboard 8, others 7 —
      // no reference counterpart; drift in EITHER direction is flagged)
      expect(violations[0].nodes).toBe(r.desc === "admin dashboard" ? 8 : 7);
    });
  }

  // Session-24 (PAY-OPS-1): the payments surface joins the admin gate —
  // its own E2E-calibrated QUALITY pin (8 color-contrast nodes, the
  // footer's shared trait). Note: under the full default tag set the
  // console LIST pages (orders/products/payments) also share a
  // best-practice heading-order observation (the lone h1 → the footer's
  // h3 columns) — outside the gate's WCAG runOnly set and identical
  // family-wide; documented in docs/session_46.md, not a per-page defect.
  test("admin payments: the violation census is exactly {color-contrast} with the quality-pinned count", async () => {
    await admin.goto("/admin/payments", { waitUntil: "networkidle" });
    const violations = await runAxe(admin);
    const ids = violations.map((v) => v.id).sort();
    expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
    expect(violations[0].nodes).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// A11Y-GATE-3 (session-19, ADR-027): the gate extended to the auth family's
// REMAINING screens — register / forgot-password / verify-email, the
// session-34-nominated completion round. Login was the only auth screen in
// the standing gate (desktop + mobile); a defect introduced on the other
// three (an unlabeled input, a broken label association, an added landmark)
// passes the gate forever — the A11Y-GATE-2 structural-blindness story, now
// for the auth family's routes.
//   - register + forgot-password: PARITY pins — the round-19 live
//     differential measured the censuses byte-identical on BOTH sites at
//     BOTH viewports ({color-contrast} × 2 — scripts/axe-diff-session19.mjs).
//   - verify-email: a QUALITY pin — the reference has NO standalone route
//     (its /verify-email renders the client-side platform 404; the
//     reference's verify screen is a state INSIDE its register flow), so
//     the clone's standalone screen is a SUPERSET surface (the admin-gate
//     precedent). E2E-calibrated at 1 (scripts/axe-calibrate-session19.mjs).
//   - Both viewports per the A11Y-GATE-2 lesson (a viewport-only gate has a
//     blind side); the counts are viewport-invariant on these screens
//     (live-measured + E2E-calibrated identical). All six tests run in
//     ANONYMOUS contexts (the auth screens render standalone for anon
//     visitors — the auth.spec pattern; zero rate-limit impact).
// TDD trail: the RED step ran the zero-tolerance form of these assertions
// and failed on all six for the RIGHT reason — the measured {color-contrast}
// censuses at 2/2/1 — before the profile was pinned
// (docs/remediation-plan-session19.md).
// ---------------------------------------------------------------------------

const AUTH_PROFILE: Record<string, { path: string; contrast: number }> = {
  register: { path: "/register", contrast: 2 },
  "forgot-password": { path: "/forgot-password", contrast: 2 },
  // verify-email: the QUALITY pin (superset surface — see the comment block)
  "verify-email": { path: "/verify-email", contrast: 1 },
  // Session-20 (RESET-ROUTE-1): the auth family's fifth member, both
  // measured states. The route is a TRUE parity surface (the reference
  // ships it — discovered via its own sitemap). No-token state = the
  // "Invalid reset link" screen; with-token = the "New password" form
  // (the e2e-reset fixture's deterministic token). Live-measured on the
  // reference at {color-contrast} x 1 at both viewports in both states
  // (scripts/axe-diff-session20.mjs); E2E-calibrated at 1.
  "reset-password (no token)": { path: "/reset-password", contrast: 1 },
  "reset-password (token)": { path: "/reset-password?token=reset-fixture-token", contrast: 1 },
};

test.describe("a11y auth screens gate (session-19, A11Y-GATE-3)", () => {
  // Desktop: 1280x720 anon contexts (the login-gate pattern).
  for (const [desc, r] of Object.entries(AUTH_PROFILE)) {
    test(`${desc} (desktop): the violation census is exactly {color-contrast} with the pinned count`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, storageState: { cookies: [], origins: [] } });
      const page = await ctx.newPage();
      await page.goto(r.path, { waitUntil: "networkidle" });
      const violations = await runAxe(page);
      const ids = violations.map((v) => v.id).sort();
      expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
      expect(violations[0].nodes).toBe(r.contrast);
      await ctx.close();
    });
  }

  // Mobile: iPhone 14 anon contexts (the mobile login-gate pattern — the
  // device descriptor spread into the newContext, so the census measures
  // at the exact 390x844 DPR 3 touch context).
  const { defaultBrowserType: _ignoredMobile, ...iPhoneAuth } = devices["iPhone 14"];
  void _ignoredMobile;

  for (const [desc, r] of Object.entries(AUTH_PROFILE)) {
    test(`${desc} (mobile): the violation census is exactly {color-contrast} with the pinned count`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...iPhoneAuth, storageState: { cookies: [], origins: [] } });
      const page = await ctx.newPage();
      await page.goto(r.path, { waitUntil: "networkidle" });
      const violations = await runAxe(page);
      const ids = violations.map((v) => v.id).sort();
      expect(ids, JSON.stringify(violations)).toEqual(["color-contrast"]);
      expect(violations[0].nodes).toBe(r.contrast);
      await ctx.close();
    });
  }
});
