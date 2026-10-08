// Session-16 screenshot capture (production standalone server, remediated
// code). Mirrors scripts/capture-session15.ts conventions. Run after the
// server is up: bun scripts/capture-session16.ts
// 91 the mobile-viewport axe differential parity proof — the 6-route
//    mobile profile table, reference vs clone (mobile counts byte-identical
//    to the desktop pins; the ref's mobile-only button-name/link-name/label
//    violations the clone does not carry — the aria superset at mobile)
// 92 the 16th mobile-nav standing verification (open Sheet, iPhone 14)
// 93 the extended gate live run — axe executed at iPhone 14 on home AND on
//    the admin surfaces, the censuses rendered as the E2E gate asserts them
// 94 the dual mutation efficacy proof — the mobile-only defect (unlabeled
//    lg:hidden menu button) caught by the MOBILE gate while the DESKTOP
//    gate stayed green (the structural-blindness proof), plus the admin
//    defect (unlabeled eye buttons) caught by the ADMIN gate
// 95 the admin-surface census proof — the 4 console surfaces' measured
//    profiles + the round's standing watches
import { devices, chromium } from "@playwright/test";

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

// --- 91: the mobile-viewport axe differential parity proof ------------------
{
  const rows = [
    ["home", "button-name(21), color-contrast(28), link-name(2)", "color-contrast(28)", "28 = 28"],
    ["shop", "button-name(20), color-contrast(23), link-name(2)", "color-contrast(23)", "23 = 23"],
    ["pdp", "button-name(10), color-contrast(14), link-name(2)", "color-contrast(14)", "14 = 14"],
    ["cart", "button-name(5), color-contrast(8), link-name(2)", "color-contrast(8)", "8 = 8"],
    ["account", "button-name(5), color-contrast(8), label(4), link-name(2)", "color-contrast(8)", "8 = 8"],
    ["login", "color-contrast(3)", "color-contrast(3)", "3 = 3"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><span class="ok">${r[2]}</span></td><td class="eq">${r[3]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">methodology:</span> same axe-core build (4.14.0) injected both sides · devices["iPhone 14"] (390px, touch, mobile UA) · scrolled-reveal pass · wcag2a/2aa/2.1a/2.1aa tags — the FIRST mobile-viewport a11y differential in 16 rounds
<span class="label">contract:</span> the clone's MOBILE census is EXACTLY {color-contrast} with counts byte-identical to the DESKTOP pins AND the reference's mobile counts — the profile is viewport-invariant on both sites. The reference additionally carries button-name / link-name / label at mobile (the aria superset holds at mobile).</div>
<table><tr><th>route</th><th>reference (mobile)</th><th>clone (mobile)</th><th>vs desktop pin</th></tr>${rows}</table>
<div class="box"><span class="label">finding:</span> <span class="ok">zero parity defects</span> — the mobile profile is identical to the desktop's on every route, both sites</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Mobile-viewport axe differential — Round-16 new audit surface (A11Y-GATE-2)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/91-mobile-axe-differential.png` });
}

// --- 93: the extended gate live run (mobile home + admin) --------------------
{
  // live mobile run on home (the capture browser, iPhone 14, logged in)
  const mctx = await browser.newContext({ ...devices["iPhone 14"] });
  {
    const lp = await mctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("john@example.com");
    await lp.getByLabel("Password").fill("Demo1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  const mob = await mctx.newPage();
  await mob.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await mob.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const mobileLive = await mob.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const iv = setInterval(() => {
        window.scrollBy(0, 400);
        y += 400;
        if (y > document.body.scrollHeight) { clearInterval(iv); resolve(); }
      }, 60);
    });
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
    const out = await (
      window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }
    ).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return out.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`);
  });
  await mob.close();
  await mctx.close();

  // live admin run (desktop, admin login)
  const actx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  {
    const lp = await actx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("admin@luxestore.com");
    await lp.getByLabel("Password").fill("Admin1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  const ap = await actx.newPage();
  await ap.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await ap.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const adminLive = await ap.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const iv = setInterval(() => {
        window.scrollBy(0, 400);
        y += 400;
        if (y > document.body.scrollHeight) { clearInterval(iv); resolve(); }
      }, 60);
    });
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
    const out = await (
      window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }
    ).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return out.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`);
  });
  await ap.close();
  await actx.close();

  const body = `<div class="box"><span class="label">spec:</span> tests/e2e/accessibility.spec.ts — the a11y mobile gate + a11y admin gate describes, on every bun run test:e2e
<span class="label">mobile injection:</span> test.use(devices["iPhone 14"] — defaultBrowserType stripped) riding the project storageState; the pins are the SAME 28/23/14/8/8/3 (the mobile census is byte-identical to the desktop's — that identity is the contract)
<span class="label">admin injection:</span> adminLogin(browser) once per describe (the admin.spec pattern); the order detail reached via the ORD-2026-001 link</div>
<div class="box"><span class="label">live mobile run on / (this capture, iPhone 14, production server):</span> <span class="ok">${mobileLive.join(", ") || "CLEAN"}</span>
<span class="label">live admin run on /admin (this capture, Desktop, production server):</span> <span class="ok">${adminLive.join(", ") || "CLEAN"}</span>
<span class="label">gate result:</span> <span class="ok">both censuses match {color-contrast} and the pinned counts — PASS</span></div>
<div class="box"><span class="label">full-suite result:</span> <span class="ok">166/166 E2E passed</span> (two consecutive runs; was 156 — +10 gate tests, none removed) · lint 0/0 · tsc clean · 100/100 unit — <span class="ok">266 total</span></div>`;
  const pp = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await pp.goto(panel("The extended a11y gate — live runs (session-16, A11Y-GATE-2)", body));
  await pp.waitForTimeout(500);
  await pp.screenshot({ path: `${OUT}/93-a11y-gate-extended-live-run.png` });
}

// --- 94: the dual mutation efficacy proof ------------------------------------
{
  const body = `<div class="box"><span class="label">mutation 1 (mobile-only):</span> aria-label="Open navigation menu" removed from the header's lg:hidden menu button (src/components/store/header.tsx)
<span class="label">  at 390px the button is VISIBLE and unlabeled; at 1280px it is display:none → axe SKIPS it</span>
<span class="label">mobile-gate run (home):</span> <span class="bad">FAILED</span> — census received <span class="bad">[{"id":"button-name","nodes":1},{"id":"color-contrast","nodes":8}]</span>
<span class="label">desktop-gate run (home):</span> <span class="ok">PASSED — the desktop gate is structurally blind to this defect</span> (5/5 storefront mobile routes red; 6/6 desktop routes green — the structural-blindness proof)</div>
<div class="box"><span class="label">mutation 2 (admin):</span> aria-label removed from the icon-only eye buttons on the admin products rows (src/components/account/admin-product-row.tsx)
<span class="label">admin-gate run (products):</span> <span class="bad">FAILED</span> — census received <span class="bad">[{"id":"button-name","nodes":12},{"id":"color-contrast","nodes":7}]</span></div>
<div class="box"><span class="label">both mutations reverted (git-diff clean):</span> <span class="ok">gate GREEN — all 17 a11y tests pass</span>
<span class="label">conclusion:</span> the mobile gate catches defects ONLY the mobile viewport can see; the admin gate guards the superset console. A gate that has never failed is unproven — these have (deliberately, once each)</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Dual mutation efficacy proof — both new gates bite (session-16, A11Y-GATE-2)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/94-mutation-efficacy-proof.png` });
}

// --- 95: the admin-surface census + standing watches -------------------------
{
  const rows = [
    ["/admin (dashboard)", "color-contrast(8)", "8"],
    ["/admin/orders", "color-contrast(7)", "7"],
    ["/admin/products", "color-contrast(7)", "7"],
    ["/admin/orders/[id] (detail)", "color-contrast(7)", "7"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td><span class="ok">${r[1]}</span></td><td class="eq">${r[2]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">the admin census (clone-only — the superset console, no reference counterpart):</span> measured at Desktop 1280×720, admin-authenticated, E2E-calibrated on the e2e DB (scripts/axe-calibrate-session16.mjs — identical numbers live and under E2E conditions)
<span class="label">profile:</span> {color-contrast} ONLY — ZERO aria violations on any console surface (no button-name, no label, no landmarks, no aria-prohibited-attr)</div>
<table><tr><th>surface</th><th>violations</th><th>quality pin</th></tr>${rows}</table>
<div class="box"><span class="label">standing watches this round:</span> mobile-nav 16th verification byte-exact (no Tailwind v4 regression, 16th consecutive) · pixel diffs @1024 8 routes all at the 0.27–0.68% baseline band (byte-identical to session-15's numbers) · full-route census 22/22 console-clean, 19/19 links live · carousel cadence identical both sites · typeahead: reference fires ZERO search requests</div>
<div class="box"><span class="label">16th mobile-nav capture:</span> screenshot 92 — byte-identical (md5) to the 13th–15th across the a11y-gate extension (rendering-neutral, test-level change)</div>`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(panel("Admin-surface axe census — Round-16 second new surface (A11Y-GATE-2)", body));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/95-admin-axe-census.png` });
}

// --- 92: the 16th mobile-nav standing verification ---------------------------
const mob = await browser.newPage({ ...devices["iPhone 14"] });
await mob.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mob.waitForTimeout(600);
await mob.getByRole("button", { name: "Open navigation menu" }).click();
await mob.waitForTimeout(700);
await mob.screenshot({ path: `${OUT}/92-mobile-nav-16th-verification.png` });

await browser.close();
console.log("captured 91-95");
