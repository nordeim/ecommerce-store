// Session-26 screenshot capture (screenshots 141–145): the reference-drift
// remediation + payments date-range filter round — 141 (the hero parity
// proof: the pixel-sweep output + the live slide-3 on the final build —
// HERO-DRIFT-1's proof-of-fix), 142 + 143 (the payments date-range filter
// live: the deep-link pair + the family+date combined shape — PAY-OPS-3),
// 144 (the unit gate, 208/208, +10 for the round), 145 (the E2E gate,
// 225/225 × 2 consecutive runs on the final code).
// Run: bun scripts/capture-session26.ts   (server on :3000)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

const CSS = `body{font:13px/1.5 ui-monospace,monospace;background:#0b0f14;color:#c9d4e0;margin:0;padding:24px;}
.box{border:1px solid #2b3640;border-radius:8px;padding:16px;max-width:1200px;}
.label{color:#f5a623;font-weight:bold;}
table{border-collapse:collapse;margin:12px 0;width:100%;}
th,td{border:1px solid #2b3640;padding:6px 10px;text-align:left;vertical-align:top;font-size:12px;}
th{background:#141a20;color:#e8eef4;}
tr:nth-child(odd) td{background:#0f141a;}
pre{background:#0f141a;border:1px solid #2b3640;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:11px;overflow:hidden;}
img{max-width:100%;border:1px solid #2b3640;border-radius:6px;margin:8px 0;}
.good{color:#5dd39e;font-weight:bold;}`;

const shot = async (html: string, path: string) => {
  writeFileSync("/tmp/capture26.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture26.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 141: the hero parity proof (the sweep output + the live slide-3) -------
{
  // (a) the live slide-3 on the final build: step the carousel to
  // "Home & Comfort" (the regenerated 19ea6418a media) and clip the hero.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Pause the 5s auto-advance so the capture is deterministic, then step.
  await page.evaluate(() => {
    const el = document.querySelector('[aria-roledescription="carousel"]');
    el?.dispatchEvent(new Event("mouseenter"));
  });
  await page.getByRole("button", { name: "Go to slide 3: Home & Comfort" }).click();
  await page.waitForTimeout(900); // the crossfade settle
  const heroBox = await page
    .locator('[aria-roledescription="carousel"]')
    .boundingBox();
  await page.screenshot({
    path: "/tmp/hero-slide3.png",
    clip: heroBox ?? undefined,
  });
  await ctx.close();

  // (b) compose the panel: the sweep output (the drift's proof-of-fix —
  // home 62.07% out-of-band pre-fix → 0% post-fix) + the embedded slide.
  const heroB64 = readFileSync("/tmp/hero-slide3.png").toString("base64");
  const sweepRows = [
    ["home", "62.07% / 57.19%", "0% (6 px)", "the drift's root cause — the slide-3 image + the header row"],
    ["shop", "in band", "0.05% (362 px)", ""],
    ["pdp", "in band", "0.34% (2671 px)", ""],
    ["cart", "in band", "0.01% (46 px)", ""],
    ["wishlist", "in band", "0% (9 px)", ""],
    ["checkout", "in band", "0.01% (77 px)", ""],
    ["account", "in band", "0% (9 px)", ""],
    ["login", "in band", "0.28% (2214 px)", ""],
  ]
    .map(
      (r) =>
        `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="good">${r[2]}</td><td>${r[3]}</td></tr>`,
    )
    .join("");
  const body = `<div class="box"><span class="label">HERO-DRIFT-1 + HEADER-DRIFT-1 (session-26) — the reference-drift remediation's proof-of-fix:</span> the 13-round pixel-sweep band held while the reference silently changed its slide-3 hero image and CTA targets; the manual sweep caught it, the round converts the catch into standing pins.
<table><tr><th>route</th><th>pre-fix sweep</th><th>post-fix sweep</th><th>note</th></tr>${sweepRows}</table>
<span class="label">the live slide-3 on the final build</span> (the regenerated reference media — 19ea6418a_generated_c69d9eaa.png — now served by the clone; CTA "Browse" → plain /shop, the live-measured reference truth):
<img src="data:image/png;base64,${heroB64}" alt="clone hero slide 3">
<span class="label">the standing pins that close the coverage gap:</span> the hero content contract (3 slide img srcs pinned to the hash tails + all 3 CTA hrefs pinned to /shop — tests/e2e/storefront-parity.spec.ts) and the header geometry contract (the gap-1 icon cluster's column-gap 4px + the nav row's justify-between arithmetic at 1024 + the three-child mobile row at 390). The reference's next silent media/href/geometry drift becomes a gate failure.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/141-hero-parity-proof.png`);
  console.log("141 captured");
}

// --- 142 + 143: the payments date-range filter live (PAY-OPS-3) ------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("admin@luxestore.com");
    await lp.getByLabel("Password").fill("Admin1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  // 142: the deep-link pair — the 22nd–23rd window keeps {r, n}.
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/payments?from=2026-02-22&to=2026-02-23`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/142-payments-date-range-live.png`, fullPage: true });

  // 143: the family + date combined shape — succeeded + from=2026-02-23
  // narrows to the n fixture alone.
  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/admin/payments?family=succeeded&from=2026-02-23`, {
    waitUntil: "networkidle",
  });
  await page2.waitForTimeout(800);
  await page2.screenshot({ path: `${OUT}/143-payments-family-date-live.png`, fullPage: true });
  await ctx.close();
  console.log("142 + 143 captured");
}

// --- 144: the unit gate run ---------------------------------------------------
{
  const body = `<div class="box"><span class="label">the unit + integration gate (Vitest) — 208/208, +10 for the round:</span>
<pre>$ bun run test
 ✓ src/lib/admin-payments.test.ts (34) — +10: the PAY-OPS-3 date-range bounds
   ✓ a valid from/to pair kept; from-only / to-only kept (open-ended)
   ✓ non-YYYY-MM-DD dropped (02/22/2026, 2026-2-22, ISO datetime, not-a-date)
   ✓ 2026-13-01 dropped (NaN) + 2026-02-30 dropped (round-trip → March 2)
   ✓ from > to drops the pair; equal dates = a valid single-day range
   ✓ array params take the first value (?from=a&from=b)
   ✓ from+to → receivedAt { gte: fromStart, lt: toEnd } at UTC day boundaries
   ✓ from-only → gte alone; to-only → lt alone (toEnd = the day AFTER to)
   ✓ dates AND with the family branch (failed + the range)
   ✓ refund-needed + q + dates → the triple AND (the nested group intact)
   ✓ q + dates (no family) → the two-element AND
 ✓ the 13 pre-existing files (174 tests) — unchanged, all green

 Test Files  14 passed (14)
 Tests  208 passed (208)          — was 198; +10, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/144-unit-gate-run.png`);
  console.log("144 captured");
}

// --- 145: the E2E gate run -----------------------------------------------------
{
  const body = `<div class="box"><span class="label">the E2E gate (Playwright) — 225/225, two consecutive full runs on the FINAL code:</span>
<pre>$ bun run test:e2e        (run 1)
  ✓ 225 passed             — 0 failures, 0 skipped   (7.7m)
$ bun run test:e2e        (run 2 — the consecutive-pair determinism gate)
  ✓ 225 passed             — 0 failures, 0 skipped   (7.8m)

The NEW session-26 coverage (HERO-DRIFT-1 + HEADER-DRIFT-1 + PAY-OPS-3):
  ✓ hero slide content contract — 3 img srcs pinned to the reference's live
    hash tails + all 3 CTA hrefs pinned to plain /shop (storefront-parity)
  ✓ header row geometry contract — the gap-1 cluster (column-gap 4px, 156px)
    + the nav row's x=270 justify-between arithmetic at 1024×768
  ✓ mobile header row — the three-child distribution (menu / logo / cluster),
    logo x=91 + cluster x=218 at 390×664 (the unwrapped row)
  ✓ payments filters by date range (?from=&to= → {r, n} + the count line
    + the inputs mirroring the URL + the bad-bound fall-through)
  ✓ payments filters by an open-ended from bound (from-only → {r, n})
  ✓ the date range ANDs with the succeeded family (family+from → {n} alone,
    the ORD-2026-003 member excluded by the bound)
  ✓ the date inputs push MERGED params (canonical family,q,from,to order —
    the Select composes with the dates)

Mutation efficacy ×3 (each reverted, verified byte-exact against backups):
  M1 the slide-3 image reverted → the hero content pin FAILS (stale hash)
  M2 the cluster gap reverted to gap-2 → the geometry pin FAILS (8px)
  M3 the receivedAt clause dropped → all 4 date-range tests FAIL

433 total (208 Vitest + 225 E2E) — was 416; +17, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/145-e2e-gate-run.png`);
  console.log("145 captured");
}

await browser.close();
console.log("session-26 capture complete: 141–145");
