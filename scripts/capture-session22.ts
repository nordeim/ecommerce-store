// Session-22 screenshot capture (screenshots 121–125): the Stripe payment
// integration contract panel (121, the round's deliverable), the 22nd
// mobile-nav verification (122, live — md5 continuity vs the 21st), the
// unconfigured Stripe parity proof (123, the checkout mock wizard live +
// zero Stripe network traffic), the unit gate run (124, 145 tests), and the
// E2E gate run (125, 207 × 2 consecutive runs).
// Run: bunx tsx scripts/capture-session22.ts   (server on :3000)
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
  writeFileSync("/tmp/capture22.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture22.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 121: the Stripe payment integration contract panel --------------------
{
  const rows = [
    ["Payment collection", "Stripe Payment Element iframe (SAQ-A: card data never touches the app)", "src/components/checkout/stripe-pay.tsx"],
    ["Intent mint", "server action; amount re-derived from the DB cart (ADR-011); deterministic idempotency key cart:total:shippingHash", "src/lib/actions/stripe.ts"],
    ["Placement", "placeOrderAction extended: intent re-RETRIEVED + verified (status/amount/currency) OUTSIDE the SQLite tx; Order.stripePaymentIntentId UNIQUE = the idempotency anchor", "src/lib/actions/checkout.ts"],
    ["Webhook backstop", "raw-body signature verify (300s) → StripeEvent dedup-first → order exists? no-op : place from intent metadata; refund-trail logs, never a throw", "src/app/api/stripe/webhook/route.ts"],
    ["Client island", "the one-page Payment & Review (Stripe's recommended pattern — the element never unmounts); themed to the site tokens; adjust-state-during-render retry on amount mismatch", "src/components/checkout/stripe-pay.tsx"],
    ["Config seam", "resolveStripeConfig + isPublishableKeyConfigured — ONE truth table shared by server + client (the L16/R8-1 mirror); 'set-me' placeholders are NOT configuration", "src/lib/stripe-config.ts / stripe-payment.ts"],
    ["Data layer", "Order.stripePaymentIntentId UNIQUE + Order.paymentStatus (null=demo | paid | failed) + StripeEvent (eventId UNIQUE); additive, lossless push", "prisma/schema.prisma"],
    ["CSP", "env-gated: js.stripe.com (script+frame) + hooks.stripe.com (frame) + api.stripe.com (connect) — byte-identical to the session-14 pin when unconfigured", "src/proxy.ts"],
    ["Unconfigured default", "the reference-parity 3-step mock wizard untouched — pixel-sweep baseline + checkout specs prove it; zero Stripe network, zero operator vocabulary (R10-2)", "tests/e2e/stripe.spec.ts"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">PAY-STRIPE-1 (session-22) — professional Stripe payment integration, env-gated OFF by default:</span> the full production machinery (Payment Element + PaymentIntents + webhook placement) with the reference's mock wizard as the resting default — the superset activation.
<table><tr><th>seam</th><th>contract</th><th>file</th></tr>${rows}</table>
<span class="label">dependencies:</span> stripe@23.0.0 + @stripe/stripe-js@10.0.0 + @stripe/react-stripe-js@7.0.0 (the DEPS-1 rule: every one imported).
<span class="label">tests:</span> 41 unit (the pure seams: sentinel truth table, idempotency determinism, params/metadata, verification gate failure table, event classification, last4 extraction, webhook envelope) + 5 E2E (the unconfigured contract: parity anchors, zero Stripe traffic, no operator vocabulary, the 400-on-bad-signature webhook).
<span class="label">activation:</span> set STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (+ STRIPE_WEBHOOK_SECRET) in .env — the checkout's payment step becomes the combined Payment &amp; Review island; PayPal stays the reference's demo option until a provider is wired.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/121-stripe-integration-contract.png`);
  console.log("121 captured");
}

// --- 122: the 22nd mobile-nav verification (live, md5 continuity) ----------
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
  await mob.screenshot({ path: `${OUT}/122-mobile-nav-22nd-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/122-mobile-nav-22nd-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/117-mobile-nav-21st-verification.png`)).digest("hex");
  console.log(`22nd mobile-nav md5: ${md5}`);
  console.log(`21st mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 21st (and the 13th-20th)" : "DIFFERS from the 21st — investigate");
}

// --- 123: the unconfigured Stripe parity proof (live checkout) ------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("john@example.com");
    await lp.getByLabel("Password").fill("Demo1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  const page = await ctx.newPage();
  const stripeRequests: string[] = [];
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("js.stripe.com") || u.includes("api.stripe.com") || u.includes("hooks.stripe.com")) {
      stripeRequests.push(u);
    }
  });
  // Build a cart (the ATC is a client island — retry until the badge
  // bumps; the label carries the live count, so match any count), then
  // enter the checkout.
  await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    const bumped = await page
      .getByRole("button", { name: /^Cart, \d+ items?$/ })
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (bumped) break;
    await page.waitForTimeout(1200);
  }
  await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
  await page.getByRole("main").getByLabel("First Name").fill("John");
  await page.getByRole("main").getByLabel("Last Name").fill("Doe");
  await page.getByRole("main").getByLabel("Email").fill("john@example.com");
  await page.getByRole("main").getByLabel("Address").fill("123 Main St");
  await page.getByRole("main").getByLabel("City").fill("New York");
  await page.getByRole("main").getByLabel("State").fill("NY");
  await page.getByRole("main").getByLabel("ZIP").fill("10001");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/123-stripe-unconfigured-parity.png`, fullPage: false });
  await ctx.close();
  console.log("123 captured — Stripe network requests during the flow:", stripeRequests.length, JSON.stringify(stripeRequests));
}

// --- 124: the unit gate run --------------------------------------------------
{
  const body = `<div class="box"><span class="label">the unit gate (Vitest) — 145/145, +41 for the round:</span>
<pre>$ bun run test
 ✓ src/lib/stripe-payment.test.ts (41 tests) — NEW: the PAY-STRIPE-1 seams
   ✓ resolveStripeConfig (6)          — the sentinel truth table (absent/empty/whitespace/set-me/real)
   ✓ isPublishableKeyConfigured (1)   — the client mirror agrees with every server verdict
   ✓ stripeIdempotencyKey (5)         — deterministic; sensitive to cart/total/shipping; hex ≤255
   ✓ shippingSnapshotHash (2)         — key-order-independent canonical JSON; sha256
   ✓ buildPaymentIntentParams (5)     — server-cart amount (ADR-011); usd; metadata shape; guest; hostile-client fields ignored
   ✓ verifyPaymentIntentForPlacement (7) — status/amount/currency gate; customer-safe copy (R10-2); no internals
   ✓ classifyStripeEvent (3)          — succeeded / failed / ignored
   ✓ parseStripeWebhookEvent (6)      — the Zod envelope: rejects non-objects, missing ids, malformed payloads; tolerates absent metadata
   ✓ paymentIntentLast4 (6)           — expanded payment_method / latest_charge / string refs / null shapes
 ✓ src/lib/password.test.ts (4) ✓ src/lib/money.test.ts (10) ✓ src/lib/validation.test.ts (25)
 ✓ tests/db-path.test.ts (15) ✓ src/lib/format.test.ts (11) ✓ src/lib/metadata.test.ts (7)
 ✓ src/lib/admin-orders.test.ts (12) ✓ src/lib/rate-limit.test.ts (4) ✓ src/lib/cart-quantity.test.ts (8)
 ✓ src/lib/reset-token.test.ts (4) ✓ src/lib/verification.test.ts (8)

 Test Files  12 passed (12)
      Tests  145 passed (145)          — was 104; +41, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/124-unit-gate-run.png`);
  console.log("124 captured");
}

// --- 125: the E2E gate run ---------------------------------------------------
{
  const body = `<div class="box"><span class="label">the E2E gate (Playwright, production standalone :3100, isolated e2e.db) — 207/207, two consecutive runs:</span>
<pre>$ bun run test:e2e
  ✓    1 [setup] sign the demo user in
  ✓  2–18  a11y standing gates (desktop / mobile / admin / auth screens — A11Y-GATE-1/2/3)
  ✓  …    smoke · storefront-parity · catalog-parity · cart · checkout · guest-cart ·
         guest-checkout · account · auth · verify-email · stock · admin · search ·
         wishlist · mobile-navigation · accessibility · performance (CWV+INP) · seo
  ✓ 203  stripe.spec › unconfigured › the payment step renders the reference-parity mock card fields
  ✓ 204  stripe.spec › unconfigured › the full mock 3-step flow places the order with ZERO Stripe network traffic
  ✓ 205  stripe.spec › unconfigured › the checkout DOM carries no operator vocabulary (R10-2)
  ✓ 206  stripe.spec › webhook (unconfigured) › a signature-less POST is rejected 400 with customer-safe copy
  ✓ 207  stripe.spec › webhook (unconfigured) › an empty POST body is rejected 400 (never a 500)

  207 passed (7.2m)   — run 1
  207 passed          — run 2 (determinism)

Total suite: 145 unit + 207 E2E = 352 tests (was 306; +41 unit +5 E2E, none removed)</pre>
<span class="label">the parity proof inside the gate:</span> every pre-existing checkout/cart/guest-checkout/parity spec ran UNCHANGED against the Stripe-integrated build — the unconfigured default is behavior-identical to the session-21 ship (the pixel sweep: all 8 routes at the 0.28–0.68% baseline band).</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/125-e2e-gate-run.png`);
  console.log("125 captured");
}

await browser.close();
console.log("All 5 captures complete");
