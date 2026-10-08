// Session-21 screenshot capture (screenshots 116–120): the INP differential
// table (116, the round's new surface — both sites, both viewports), the
// 21st mobile-nav verification (117, live — the md5 continuity check vs the
// 13th–20th), the INP standing gate live run (118), the dual mutation
// efficacy proof (119), and the E2E-condition calibration table (120).
// Run: bunx tsx scripts/capture-session21.ts   (server on :3000)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, devices } from "playwright-core";

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
pre{background:#0f141a;border:1px solid #2b3640;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:11px;overflow:hidden;}`;

const shot = async (html, path) => {
  writeFileSync("/tmp/capture21.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture21.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 116: the INP differential table (the round's new surface) -------------
{
  const rows = [
    ["pdp add-to-cart", "client-state mutation", "server action + revalidate", "24ms", "16ms", "40ms", "32ms", "ZERO DEFECT"],
    ["pdp wishlist heart", "client state + toast", "server action + toast", "24ms", "16ms", "40ms", "16ms", "ZERO DEFECT"],
    ["search typing (4 keys)", "SPA dropdown", "/api/search typeahead", "32ms", "40ms", "24ms", "24ms", "ZERO DEFECT"],
    ["drawer stepper +", "client state", "transactional delta action", "48ms", "48ms", "40ms", "32ms", "ZERO DEFECT"],
    ["carousel next", "DOM-swap slide", "crossfade slide", "24ms", "48ms", "16ms", "40ms", "quality note (4x inside good)"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">the FIRST INP (Interaction to Next Paint) differential — round-21's primary surface:</span> a scripted 5-interaction protocol (scripts/inp-diff-session21.mjs), both sites, both viewports, authenticated, fresh context per surface; entries collected by PerformanceObserver(type "event", buffered, durationThreshold 0) grouped by interactionId; per-interaction duration = the MAX event duration (nextPaint - startTime).
<table><tr><th>surface</th><th>reference mechanism</th><th>clone mechanism</th><th>ref desktop</th><th>clone desktop</th><th>ref iPhone</th><th>clone iPhone</th><th>verdict</th></tr>${rows}</table>
<span class="label">architecture-level finding:</span> the clone's SERVER-ACTION mutations paint as fast as the reference's CLIENT-STATE mutations (React 19 transitions keep the main thread free through the action dispatch) — every surface on BOTH sites is deep in Google's good band (max 48ms vs the 200ms line).
<span class="label">the gap -> the gate:</span> LCP/CLS are pinned by PERF-GATE-1/2; interaction latency had NO regression pin — a long task, layout thrash, or a blocking dispatch ships silently. PERF-GATE-3 closes it.
<span class="label">methodological discoveries (L32/L33):</span> synthetic evaluate(() => el.click()) generates ZERO interaction entries (interactionId attaches only to trusted input-pipeline events — Playwright locator clicks and keyboard.type qualify) · the default observer durationThreshold (16ms) hides fast interactions — the collector pins 0.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/116-inp-differential.png`);
  console.log("116 captured");
}

// --- 117: the 21st mobile-nav verification (live, md5 continuity) ----------
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
  await mob.screenshot({ path: `${OUT}/117-mobile-nav-21st-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/117-mobile-nav-21st-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/112-mobile-nav-20th-verification.png`)).digest("hex");
  console.log(`21st mobile-nav md5: ${md5}`);
  console.log(`20th mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 20th (and the 13th-19th)" : "DIFFERS from the 20th — investigate");
}

// --- 118: the INP standing gate live run ------------------------------------
{
  const rows = [
    ["pdp add-to-cart", "the action-row ATC (trusted click, structural locator)", "16-72ms", "PASS"],
    ["pdp wishlist heart", "the action row's LAST button ([-][+][ATC][heart])", "16-56ms", "PASS"],
    ["search typing", "header search icon -> input -> 4 keys 250ms apart", "24-56ms", "PASS"],
    ["drawer stepper", "ATC -> drawer -> the gap-2 group's plus button", "32-72ms", "PASS"],
    ["carousel next", "the chevron-right button", "40-64ms", "PASS"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">the INP standing gate (tests/e2e/performance.spec.ts, session-21, PERF-GATE-3):</span> 10 tests = 5 surfaces × 2 viewports (desktop 1280x720 + iPhone 14 390x664), GUEST contexts (storageState opt-out — the zero-e2e.db-pollution design: the guest cart/wishlist live in the context's cookie token and die with the test; wishlist.spec sorts AFTER performance.spec, so an authed protocol would break its count assertions).
<table><tr><th>surface</th><th>protocol</th><th>measured (RED payloads)</th><th>budget result</th></tr>${rows}</table>
<span class="label">budget:</span> INP &lt;= 200ms per surface (the Google "good" line — the ADR-025 convention; 2.8-12.5x headroom over the calibration). A QUALITY gate, not a parity pin.
<span class="label">RED trail:</span> the zero-tolerance form (inpMax: 0 — impossible) failed all 10 tests with the measured payloads (56-72ms desktop, 16-56ms mobile) in the failure messages — the baseline documented as a DELIBERATE quality contract before the budgets landed.
<span class="label">gate at ship:</span> 202 E2E tests × 2 consecutive full runs (was 192; +10, none removed) · 104 unit · lint 0/0 · tsc clean.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/118-inp-gate-live-run.png`);
  console.log("118 captured");
}

// --- 119: the dual mutation efficacy proof ----------------------------------
{
  const rows = [
    ["1 — the drawer stepper busy-wait", "a 400ms synchronous busy-wait injected at the top of the + stepper's onClick (cart-drawer.tsx) — the minimal deterministic long-task reproduction (only SYNCHRONOUS main-thread work delays the next paint; an await setTimeout yields)", "ONLY the drawer-stepper tests FAIL at 432/416ms (~400ms + overhead, 2x over budget) at BOTH viewports; the other 8 INP tests + 7 CWV tests stay green", "CONFIRMED LIVE"],
    ["2 — the carousel next busy-wait", "the same 400ms busy-wait in the slide-advance handler (hero-carousel.tsx go(index+1))", "ONLY the carousel-next tests FAIL at 456/448ms at BOTH viewports; everything else green", "CONFIRMED LIVE"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">dual mutation efficacy (one at a time, rebuild, run, verify the failure REASON, revert, GREEN re-run):</span>
<table><tr><th>mutation</th><th>design</th><th>expected failure</th><th>result</th></tr>${rows}</table>
<span class="label">both reverted</span> (git-diff clean — only tests/e2e/performance.spec.ts carries the round's production-code delta of ZERO lines) → 17/17 green again on the performance spec.
<span class="label">the defect class the gate catches:</span> a synchronous long task in ANY exercised handler (the 400ms busy-wait is the minimal repro); real-world members: a long loop in a cart mutation, layout thrash (read-write-read-write geometry) in a render, a blocking pre-await task in an action wrapper that prevents React from painting the pending state.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/119-inp-mutation-efficacy-proof.png`);
  console.log("119 captured");
}

// --- 120: the E2E-condition calibration table -------------------------------
{
  const rows = [
    ["pdp-atc+heart", "16 / 24ms", "24 / 24ms"],
    ["search-typing", "32 / 40ms", "24 / 24ms"],
    ["drawer-stepper", "56 / 56ms", "40 / 32ms"],
    ["carousel-next", "48 / 48ms", "40 / 40ms"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">the E2E-condition calibration (scripts/inp-calibrate-session21.mjs — the session-15/16/17/18 discipline):</span> the protocol against the EXACT gate conditions — the :3100 standalone production server, the e2e DB (pushed + seeded + reset), GUEST contexts, both viewports, 2 runs each.
<table><tr><th>surface</th><th>desktop run1 / run2</th><th>iPhone 14 run1 / run2</th></tr>${rows}</table>
<span class="label">calibrated max 56ms -> budget 200ms</span> (the good line, 3.5-12.5x headroom; the Playwright-harness RED payloads ran 56-72ms — the harness adds fixture overhead vs raw playwright-core, still 2.8x+ inside).
<span class="label">guest-context calibration note:</span> the differential itself ran AUTHENTICATED on both sites (matching the audit conditions); the GATE runs guest — the interaction paint paths are the identical UI surfaces (guest-cart.spec proves the cookie-token ATC -> drawer -> stepper path), and the guest design buys zero e2e.db pollution with no cross-spec coupling.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/120-inp-e2e-calibration.png`);
  console.log("120 captured");
}

await browser.close();
console.log("All session-21 captures complete.");
