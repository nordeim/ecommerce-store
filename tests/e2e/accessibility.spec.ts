import { expect, test } from "@playwright/test";

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
