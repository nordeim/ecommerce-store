// Session-19 screenshot capture (screenshots 106–110): the AUTH-SCREENS axe
// differential table (106, the round's new surface), the 19th mobile-nav
// verification (107, live — the md5 continuity check vs the 13th–18th), the
// auth-screens gate live run (108, the census at 3 screens × 2 viewports on
// :3000), the dual mutation efficacy proof incl. the L29 placeholder-masking
// story (109), and the E2E-condition auth calibration table (110).
// Conventions follow scripts/capture-session18.ts.
// Run: bun scripts/capture-session19.ts   (server on :3000, fresh build)
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

// --- 106: the AUTH-SCREENS axe differential (the round's new surface) ------
{
  const rows = [
    ["/register", "{color-contrast}(2)", "{color-contrast}(2)", "PARITY (identical anatomy, both sites)"],
    ["/forgot-password", "{color-contrast}(2)", "{color-contrast}(2)", "PARITY (identical anatomy, both sites)"],
    ["/verify-email", "{color-contrast}(1)", "platform 404*", "QUALITY pin (superset surface)"],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td><span class="ok">${r[1]}</span></td><td>${r[2]}</td><td class="eq">${r[3]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">methodology:</span> scripts/axe-diff-session19.mjs — the SAME axe-core 4.14.0 build injected on BOTH sites (page.addScriptTag, DevTools-protocol, CSP-exempt) · ANONYMOUS contexts (the auth screens render standalone for anon visitors — the auth.spec pattern) · the scrolled-reveal pass (the session-12 whileInView trap) · desktop 1280x720 AND mobile iPhone 14 (390x844 DPR 3) — the counts measured byte-identical at BOTH viewports on both sites.
<span class="label">* the reference's /verify-email:</span> renders its client-side PLATFORM 404 ("The page 'verify-email' could not be found in this application") — the reference's verify screen is a client-side state INSIDE its register flow, not a standalone route. The clone's standalone route (session-4, ADR-011) is a SUPERSET surface — its census is a QUALITY pin (the admin-gate precedent); the coincidental count match is not a parity signal.</div>
<table><tr><th>route</th><th>clone census (desktop + mobile)</th><th>ref census</th><th>contract</th></tr>${rows}</table>
<div class="box"><span class="label">finding:</span> <span class="ok">zero parity defects</span> — register + forgot-password byte-identical censuses on both sites at both viewports; the aria superset holds. The round's finding is A11Y-GATE-3: the standing axe gate covers login but NOT the auth family's remaining screens — a defect on register/forgot/verify-email passes the gate forever.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("AUTH-SCREENS axe differential — Round-19 new audit surface (A11Y-GATE-3)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/106-auth-screens-axe-differential.png` });
  await page.close();
}

// --- 107: the 19th mobile-nav verification (live, md5 continuity) ----------
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
  await mob.screenshot({ path: `${OUT}/107-mobile-nav-19th-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/107-mobile-nav-19th-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/102-mobile-nav-18th-verification.png`)).digest("hex");
  console.log(`19th mobile-nav md5: ${md5}`);
  console.log(`18th mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 18th (and the 13th-17th)" : "DIFFERS from the 18th — investigate");
}

// --- 108: the auth-screens gate live run (live census, :3000) --------------
{
  const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
  const ROUTES = [
    { path: "/register", desc: "register" },
    { path: "/forgot-password", desc: "forgot-password" },
    { path: "/verify-email", desc: "verify-email" },
  ];
  const run = async (ctxOpts: object) => {
    const ctx = await browser.newContext(ctxOpts);
    const out: string[] = [];
    for (const r of ROUTES) {
      const page = await ctx.newPage();
      await page.goto(BASE + r.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      await page.evaluate(AXE);
      const counts = await page.evaluate(async () => {
        await new Promise((res) => {
          let y = 0;
          const iv = setInterval(() => {
            window.scrollBy(0, 400);
            y += 400;
            if (y > document.body.scrollHeight) {
              clearInterval(iv);
              res(null);
            }
          }, 60);
        });
        window.scrollTo(0, 0);
        await new Promise((r2) => setTimeout(r2, 300));
        const out2 = await (
          window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }
        ).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
        return out2.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ");
      });
      out.push(`${r.desc}: ${counts}`);
      await page.close();
    }
    await ctx.close();
    return out;
  };
  const desktop = await run({ viewport: { width: 1280, height: 720 } });
  const { defaultBrowserType: _dbt, ...iPhone } = devices["iPhone 14"];
  void _dbt;
  const mobile = await run(iPhone);

  const rows = ROUTES.map((r, i) => {
    const pin = r.desc === "verify-email" ? 1 : 2;
    return `<tr><td>${r.desc}</td><td><span class="ok">${desktop[i]}</span></td><td><span class="ok">${mobile[i]}</span></td><td class="eq">{color-contrast} x${pin} both viewports</td></tr>`;
  }).join("");
  const body = `<div class="box"><span class="label">live run:</span> the a11y auth screens gate describe re-measured on the :3000 production server (the same runAxe machinery the spec uses — self-hosted axe-core 4.14.0, scrolled-reveal, anon contexts) at desktop 1280x720 and iPhone 14 390x844.</div>
<table><tr><th>screen</th><th>desktop census</th><th>mobile census</th><th>pinned</th></tr>${rows}</table>
<div class="box"><span class="label">E2E gate:</span> 6 new tests in tests/e2e/accessibility.spec.ts (the a11y auth screens gate describe) — all green in TWO consecutive full-suite runs (178/178 E2E, 278 total). register + forgot-password: PARITY pins; verify-email: QUALITY pin (superset surface).</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Auth-screens axe gate — live census (A11Y-GATE-3, session-19)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/108-auth-screens-gate-live-run.png` });
  await page.close();
}

// --- 109: the dual mutation efficacy proof (incl. L29) ---------------------
{
  const body = `<div class="box"><span class="label">mutation 1 — the verify-email aria-label class:</span> removed aria-label="Verification code" from the hidden 6-digit collector input (its ONLY name source — the visual boxes are divs, the input is opacity-0).
<span class="label">result:</span> <span class="bad">verify-email FAILED</span> at BOTH viewports with [{"id":"color-contrast","nodes":1},{"id":"label","nodes":1}] — the label rule fires on the unlabeled text input; <span class="ok">register + forgot-password stayed GREEN</span> — the per-screen pin proof.</div>
<div class="box"><span class="label">mutation 2 — the register label-association class (REVISED after the live run):</span> the FIRST design removed only Label htmlFor="confirmPassword" — <span class="bad">it did NOT bite</span>: axe's label rule accepts the non-empty PLACEHOLDER as a last-resort name source (the any-check "non-empty-placeholder"), and the reference-parity placeholder masks the defect.
<span class="label">L29 (new lesson):</span> label-association mutations on inputs carrying reference-parity placeholders (the auth passwords' placeholder) must ALSO remove the placeholder, or the label rule never fires.
<span class="label">revised mutation:</span> removed the htmlFor AND the placeholder from Confirm Password — <span class="bad">register FAILED</span> at BOTH viewports with [{"id":"color-contrast","nodes":2},{"id":"label","nodes":1}]; <span class="ok">forgot-password + verify-email stayed GREEN</span>.
<span class="label">result:</span> both mutations reverted (git-diff clean), rebuild, <span class="ok">GREEN restored — 23/23 a11y tests</span>.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Dual mutation efficacy proof — A11Y-GATE-3 (session-19)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/109-mutation-efficacy-proof.png` });
  await page.close();
}

// --- 110: the E2E-condition auth calibration table --------------------------
{
  const rows = [
    ["register", "color-contrast:2", "color-contrast:2", "2"],
    ["forgot-password", "color-contrast:2", "color-contrast:2", "2"],
    ["verify-email", "color-contrast:1", "color-contrast:1", "1"],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td><span class="ok">${r[1]}</span></td><td><span class="ok">${r[2]}</span></td><td class="eq">${r[3]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">methodology:</span> scripts/axe-calibrate-session19.mjs — the standalone server on :3100 against db/e2e.db at the fresh-reset canonical state (prisma/e2e-reset.ts), ANONYMOUS contexts, the exact device descriptors the E2E describe uses (desktop 1280x720 + devices["iPhone 14"]).
<span class="label">invariance confirmed:</span> the auth screens are anonymous + DB-independent surfaces — the E2E-condition counts are byte-identical to the live differential (2/2/1 at both viewports). The pins in the spec are the calibrated numbers.</div>
<table><tr><th>screen</th><th>desktop (e2e conditions)</th><th>mobile (e2e conditions)</th><th>spec pin</th></tr>${rows}</table>
<div class="box"><span class="label">RED trail:</span> the zero-tolerance form failed all 6 tests for the RIGHT reason — the failure payloads carried the measured censuses [{"id":"color-contrast","nodes":2}] / [{"id":"color-contrast","nodes":1}] — before the pins landed.</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("E2E-condition auth calibration — A11Y-GATE-3 (session-19)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/110-auth-e2e-calibration.png` });
  await page.close();
}

await browser.close();
console.log("Screenshots 106-110 captured.");
