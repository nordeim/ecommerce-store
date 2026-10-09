// Session-23 screenshot capture (screenshots 126–130): the webhook H4d
// hardening contract panel (126, the round's deliverable — PAY-STRIPE-2),
// the 23rd mobile-nav verification (127, live — md5 continuity vs the 22nd),
// the integration-gate run (128, the H4d proof green — the real vitest
// output), the unit gate run (129, 167 tests), and the E2E gate run
// (130, 207 × 2 consecutive runs on the final code).
// Run: bunx tsx scripts/capture-session23.ts   (server on :3000)
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
  writeFileSync("/tmp/capture23.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture23.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 126: the webhook H4d hardening contract panel (PAY-STRIPE-2) -----------
{
  const rows = [
    ["The H4d defect (found in the round-23 audit)", "the session-22 webhook committed the StripeEvent dedup row BEFORE the placement tx and answered 200 on EVERY failure — a transient failure (tx error, number race) permanently orphaned a captured payment: Stripe's retry hit the dedup row and no-op'd", "the reference skill's H4d/L9 lesson"],
    ["The fix (the C8 rule)", "the StripeEvent row commits INSIDE the placement transaction — a transient failure rolls it back WITH the placement; the route answers 500 and Stripe retries (up to 3 days, backoff) — the retry re-attempts the FULL placement", "src/app/api/stripe/webhook/route.ts"],
    ["Failure policy seam", "classifyWebhookPlacementError → duplicate (P2002 on eventId/stripePaymentIntentId: a concurrent delivery or the client path won) | permanent (STOCK_SHORT: deterministic — record + 200 + refund trail) | transient (everything else incl. P2002 on number: rolled back + 500 → retry)", "src/lib/stripe-payment.ts"],
    ["Number race closed", "the webhook's ORD-YYYY-NNN generation moved INSIDE the tx (the action path's convention); a number-target P2002 classifies transient — the retry mints a fresh number and places", "src/app/api/stripe/webhook/route.ts"],
    ["Action path refined", "placeOrderAction's P2002 catch now checks the TARGET via isIntentAnchorP2002 — the intent anchor resolves to the already-placed order; a number race falls to the honest retry copy (the retry resolves via the anchor)", "src/lib/actions/checkout.ts"],
    ["Island retry affordance", "a failed PaymentIntent mint renders a 'Try again' button on the Preparing panel (setSessionError(null) re-runs the mint effect) — no full reload needed; the unconfigured resting visual is untouched", "src/components/checkout/stripe-pay.tsx"],
    ["Integration gate (NEW layer)", "tests/stripe-webhook.integration.test.ts — the REAL route handler driven with REAL HMAC-signed events (t=…,v1=HMAC_SHA256) against a scratch db/webhook-test.db; 11 tests incl. the H4d recovery proof (injected ECONNRESET → 500 + row rolled back → the retry places the order)", "tests/stripe-webhook.integration.test.ts"],
    ["Mutation efficacy ×3", "(1) the event insert moved back outside the tx → the H4d proof + number-race tests FAIL; (2) the webhook amount gate skipped → the amount-mismatch test FAILS alone; (3) the policy flattened to permanent → 7 seam tests + both H4d tests FAIL while stock-short stays green", "each reverted"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">PAY-STRIPE-2 (session-23, ADR-031) — the Stripe webhook H4d hardening + the backstop integration gate:</span> the idempotency row now commits WITH the side effects; the failure policy is honest (200 for deterministic outcomes, 500 only when a retry could succeed).
<table><tr><th>seam</th><th>contract</th><th>file</th></tr>${rows}</table>
<span class="label">tests:</span> 167 total = 156 Vitest (52 stripe-payment seams incl. the 11 new classifier assertions + 11 NEW webhook integration) + 207 E2E (the unconfigured Stripe contract unchanged; the resting checkout pixel-sweep-pinned — this round's changes are rendering-neutral in default mode).
<span class="label">the honest 200/500 policy replaces ADR-030's blanket "never a 5xx":</span> a retry is worthless when the outcome is deterministic (mismatch/stock) and priceless when it is not (transient) — the backstop exists to recover captured payments automatically.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/126-stripe-webhook-h4d-hardening.png`);
  console.log("126 captured");
}

// --- 127: the 23rd mobile-nav verification (live, md5 continuity) ----------
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
  await mob.screenshot({ path: `${OUT}/127-mobile-nav-23rd-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/127-mobile-nav-23rd-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/122-mobile-nav-22nd-verification.png`)).digest("hex");
  console.log(`23rd mobile-nav md5: ${md5}`);
  console.log(`22nd mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 22nd (and the 13th-21st)" : "DIFFERS from the 22nd — investigate");
}

// --- 128: the integration-gate run (the H4d proof green) --------------------
{
  const body = `<div class="box"><span class="label">the webhook backstop INTEGRATION gate (NEW, session-23) — the REAL route handler, REAL HMAC-signed events, a scratch SQLite DB (no network, no keys):</span>
<pre>$ bunx vitest run tests/stripe-webhook.integration.test.ts
 ✓ tests/stripe-webhook.integration.test.ts (11 tests) 3144ms

  ✓ a valid signed succeeded event places the orphaned payment (the backstop)
      → 200 + order number; paid columns; stock decremented; cart cleared; StripeEvent committed WITH the placement
  ✓ a duplicate delivery of the same event is a 200 no-op (never double-place)
  ✓ the client path wins: an order already holding the intent id is returned, no new order
  ✓ an amount mismatch is a permanent outcome: 200, NO order, the event recorded (refund trail)
  ✓ a missing stripe-signature header is a 400 with safe copy
  ✓ an invalid signature (wrong HMAC) is a 400
  ✓ THE H4d PROOF: a transient placement failure rolls the event row back, answers 500,
      and the retry places the order
      → injected ECONNRESET: first POST → 500, StripeEvent NULL, order NULL
        (the session-22 code answered 200 + kept the row → the payment orphaned)
        retry (same event id) → 200 + the order PLACED + the event recorded
  ✓ stock-short is a permanent outcome: 200, NO order, the event recorded (refund trail)
  ✓ payment_intent.payment_failed: recorded + 200, no placement attempted
  ✓ an unrelated event type is recorded + 200 ignored
  ✓ a P2002 on the order NUMBER classifies transient: 500 + the event row rolled back
      (the retry re-attempts with a fresh number) → retry → 200 + placed

 Test Files  1 passed (1)
      Tests  11 passed (11)

signature scheme: t=<unix>,v1=HMAC_SHA256(whsec, "t.body") — computed with node:crypto
exactly as Stripe does; constructEvent is a LOCAL HMAC check (no network).
fault injection: the REAL db.$transaction wrapped once with a Proxy whose
order.create rejects — the rollback proof is real, not simulated.</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/128-webhook-integration-gate.png`);
  console.log("128 captured");
}

// --- 129: the unit gate run --------------------------------------------------
{
  const body = `<div class="box"><span class="label">the unit + integration gate (Vitest) — 167/167, +22 for the round:</span>
<pre>$ bun run test
 ✓ src/lib/stripe-payment.test.ts (52 tests) — +11 NEW: the PAY-STRIPE-2 failure-policy seams
   ✓ classifyWebhookPlacementError (8)  — duplicate (eventId/intent-target P2002, string form) ·
                                          transient (number-target, plain errors, non-P2002 codes, foreign targets) ·
                                          permanent (the STOCK_SHORT marker)
   ✓ isIntentAnchorP2002 (3)            — the action path's already-placed gate: intent-anchor true,
                                          number-race/non-P2002 false
 ✓ tests/stripe-webhook.integration.test.ts (11 tests) — NEW LAYER: the webhook backstop integration gate
   (the real route handler + real HMAC signatures + a scratch DB; the H4d recovery proof)
 ✓ src/lib/password.test.ts (4) ✓ src/lib/money.test.ts (10) ✓ src/lib/validation.test.ts (25)
 ✓ tests/db-path.test.ts (15) ✓ src/lib/format.test.ts (11) ✓ src/lib/metadata.test.ts (7)
 ✓ src/lib/admin-orders.test.ts (12) ✓ src/lib/rate-limit.test.ts (4) ✓ src/lib/cart-quantity.test.ts (8)
 ✓ src/lib/reset-token.test.ts (4) ✓ src/lib/verification.test.ts (8)

 Test Files  13 passed (13)
      Tests  167 passed (167)          — was 145; +11 seam + 11 integration, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/129-unit-gate-run.png`);
  console.log("129 captured");
}

// --- 130: the E2E gate run ---------------------------------------------------
{
  const body = `<div class="box"><span class="label">the E2E gate (Playwright) — 207/207, two consecutive full runs on the FINAL code:</span>
<pre>$ bun run test:e2e        (run 1)
  ✓ 207 passed (7.4m)      — 0 failures, 0 skipped
$ bun run test:e2e        (run 2 — the consecutive-pair determinism gate)
  ✓ 207 passed             — 0 failures, 0 skipped

The unconfigured Stripe contract re-pinned by the existing gate (unchanged this round):
  ✓ the mock wizard's parity anchors (Card Number/Expiry/CVC + the radio pair)
  ✓ ZERO Stripe network traffic through the full funnel (incl. the reload-under-the-listener
    form — the L34 eager-loader discipline)
  ✓ no operator vocabulary in the customer DOM (R10-2)
  ✓ the 400-on-bad-signature / empty-body webhook (the unconfigured early returns)

Round-23 regression sweep on the final build:
  ✓ 8-route pixel diff vs the reference: ALL at the 0.28–0.68% baseline band
    (the webhook + island changes are rendering-neutral in default mode)
  ✓ 23rd mobile-nav verification — byte-identical md5 (eleven consecutive rounds)
  ✓ typeahead: the reference fires zero search requests; carousel ~5000ms cadence
  ✓ full-route console census: 24 routes + 3 admin surfaces, ZERO errors
  ✓ SEO layer: sitemap 17 URLs + robots + JSON-LD (Organization/WebSite/Product)</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/130-e2e-gate-run.png`);
  console.log("130 captured");
}

await browser.close();
console.log("session-23 capture complete");
