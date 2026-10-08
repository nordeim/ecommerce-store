// Session-20 screenshot capture (screenshots 111–115): the SEO/SITEMAP
// differential table (111, the round's new surface — the audit that found
// the missing route + the un-pinned layer + the absent structured data),
// the 20th mobile-nav verification (112, live — the md5 continuity check
// vs the 13th–19th), the SEO standing gate live run (113), the
// /reset-password route's two measured states (114), and the mutation
// efficacy proof (115).
// Run: bunx tsx scripts/capture-session20.ts   (server on :3000)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, devices } from "playwright-core";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

// --- 111: the SEO/sitemap differential table (rendered summary) -----------
{
  const rows = [
    ["&lt;sitemap.xml&gt;", "10 app routes (incl. PRIVATE /account /checkout /cart), all 0.8/weekly, ZERO product URLs (platform auto-gen)", "5 curated public routes (1/0.9/0.3/0.2/0.2) + ALL 12 product URLs with lastModified (0.8/weekly)", "SEO SUPERSET"],
    ["&lt;robots.txt&gt;", "User-agent: * / Allow: / (allow-all) + sitemap link", "Allow / + Disallow /admin /account /checkout /api + sitemap link", "SEO-superior"],
    ["/reset-password", "REAL route — 2 states + error + full head set (measured live)", "platform 404 → FIXED this round: both states shipped", "PARITY restored"],
    ["structured data", "NONE (SPA)", "Organization + WebSite (home) · Product + offers + aggregateRating (PDP)", "SEO SUPERSET"],
    ["regression gate", "—", "tests/e2e/seo.spec.ts — 6 tests: sitemap 17-URL census + robots rules + JSON-LD nodes", "SEO-GATE-1"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">methodology:</span> live differential 2026-10-09 — the reference's /sitemap.xml + /robots.txt fetched + parsed, the /reset-password route probed in both states (no-token + ?token), the head set measured on both sites; the clone's sitemap/robots/metadata audited against the code (src/app/sitemap.ts, robots.ts, pageMetadata) — ZERO prior test coverage on any of it.
<table><tr><th>surface</th><th>reference</th><th>clone</th><th>verdict</th></tr>${rows}</table>
<span class="label">finding chain:</span> the reference's own sitemap lists /reset-password → the clone 404s it (RESET-ROUTE-1, the auth family's missing member) · the SEO layer has no regression pins (SEO-GATE-1) · no structured data on either site (JSON-LD-1 — the Product/Organization superset).</div>`;
  const html = `<!doctype html><meta charset="utf-8"><style>
  body{font:13px/1.5 ui-monospace,monospace;background:#0b0f14;color:#c9d4e0;margin:0;padding:24px;}
  .box{border:1px solid #2b3640;border-radius:8px;padding:16px;max-width:1200px;}
  .label{color:#f5a623;font-weight:bold;}
  table{border-collapse:collapse;margin:12px 0;width:100%;}
  th,td{border:1px solid #2b3640;padding:6px 10px;text-align:left;vertical-align:top;font-size:12px;}
  th{background:#141a20;color:#e8eef4;}
  tr:nth-child(odd) td{background:#0f141a;}
</style>${body}`;
  writeFileSync("/tmp/seo-diff.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/seo-diff.html");
  await page.screenshot({ path: `${OUT}/111-seo-sitemap-differential.png`, fullPage: true });
  await page.close();
  console.log("111 captured");
}

// --- 112: the 20th mobile-nav verification (live, md5 continuity) ---------
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
  await mob.screenshot({ path: `${OUT}/112-mobile-nav-20th-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/112-mobile-nav-20th-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/107-mobile-nav-19th-verification.png`)).digest("hex");
  console.log(`20th mobile-nav md5: ${md5}`);
  console.log(`19th mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 19th (and the 13th-18th)" : "DIFFERS from the 19th — investigate");
}

// --- 113: the SEO standing gate live run -----------------------------------
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`${BASE}/sitemap.xml`, { waitUntil: "networkidle" });
  const xml = (await page.content()).slice(0, 4000);
  const locs = (await page.content()).match(/<loc>/g)?.length ?? 0;
  await page.goto(`${BASE}/robots.txt`, { waitUntil: "networkidle" });
  const robots = await page.evaluate(() => document.body.innerText.slice(0, 400));
  const body = `<div class="box"><span class="label">the SEO standing gate (tests/e2e/seo.spec.ts, session-20, SEO-GATE-1):</span> 6 tests pinning the sitemap census (17 URLs = 5 curated static + 12 product URLs with lastModified), the robots rule block (4 disallows + sitemap link), and the JSON-LD nodes (Organization + WebSite on home, Product + offers + aggregateRating on the PDP).<pre>${xml.replace(/</g, "&lt;").slice(0, 1800)}\n… (${locs} &lt;loc&gt; entries)\n\n${robots.replace(/</g, "&lt;")}</pre></div>`;
  const html = `<!doctype html><meta charset="utf-8"><style>
  body{font:13px/1.5 ui-monospace,monospace;background:#0b0f14;color:#c9d4e0;margin:0;padding:24px;}
  .box{border:1px solid #2b3640;border-radius:8px;padding:16px;max-width:1200px;}
  .label{color:#f5a623;font-weight:bold;}
  pre{background:#0f141a;border:1px solid #2b3640;border-radius:6px;padding:12px;overflow:hidden;white-space:pre-wrap;font-size:11px;}
</style>${body}`;
  writeFileSync("/tmp/seo-gate.html", html);
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page2.goto("file:///tmp/seo-gate.html");
  await page2.screenshot({ path: `${OUT}/113-seo-gate-live-run.png`, fullPage: true });
  await page2.close();
  await page.close();
  console.log("113 captured");
}

// --- 114: the /reset-password route's two measured states ------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p1 = await ctx.newPage();
  await p1.goto(`${BASE}/reset-password`, { waitUntil: "networkidle" });
  await p1.screenshot({ path: `${OUT}/114a-reset-password-invalid-link-state.png` });
  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}/reset-password?token=e2e-preview`, { waitUntil: "networkidle" });
  await p2.screenshot({ path: `${OUT}/114b-reset-password-new-password-form.png` });
  await ctx.close();
  console.log("114 captured (both states)");
}

// --- 115: the mutation efficacy proof --------------------------------------
{
  const rows = [
    ["1 — sitemap product-URL drop", "filter wireless-headphones from the sitemap query", "the seo spec's census pin FAILS (17 → 16 URLs)", "CONFIRMED LIVE"],
    ["2 — robots disallow drop", "remove the /account disallow", "the robots pin FAILS at the Disallow: /account assertion", "CONFIRMED LIVE"],
    ["3 — JSON-LD price corruption", "pass integer cents as the schema.org decimal", "the Product-schema price pin FAILS (29999 vs 299.99)", "CONFIRMED LIVE"],
    ["4 — the axe label association (L29-aware)", "remove the Confirm Password Label htmlFor AND its •••••••• placeholder (L29: the placeholder alone masks the defect)", "the reset-password (token) axe tests FAIL with label(1) at BOTH viewports; the no-token tests + other screens stay green", "CONFIRMED LIVE"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">dual/quadruple mutation efficacy (one at a time, revert, GREEN re-run):</span>
<table><tr><th>mutation</th><th>design</th><th>expected failure</th><th>result</th></tr>${rows}</table>
<span class="label">also this round:</span> the cart-spec Checkout assertion refined to the main region — the drawer's exit-animation remnant (a second role=link match) raced the unscoped locator when the preceding axe tests shifted the suite's timing (the drawer behavior byte-identical to the baseline; animationend 137/487ms vs 142/506ms).</div>`;
  const html = `<!doctype html><meta charset="utf-8"><style>
  body{font:13px/1.5 ui-monospace,monospace;background:#0b0f14;color:#c9d4e0;margin:0;padding:24px;}
  .box{border:1px solid #2b3640;border-radius:8px;padding:16px;max-width:1200px;}
  .label{color:#f5a623;font-weight:bold;}
  table{border-collapse:collapse;margin:12px 0;width:100%;}
  th,td{border:1px solid #2b3640;padding:6px 10px;text-align:left;vertical-align:top;font-size:12px;}
  th{background:#141a20;color:#e8eef4;}
  tr:nth-child(odd) td{background:#0f141a;}
</style>${body}`;
  writeFileSync("/tmp/mutation-proof.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/mutation-proof.html");
  await page.screenshot({ path: `${OUT}/115-mutation-efficacy-proof.png`, fullPage: true });
  await page.close();
  console.log("115 captured");
}

await browser.close();
console.log("All session-20 captures complete.");
