// VLM verification of the 5 new session-22 screenshots (121-125) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17/18/19/20 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "121-stripe-integration-contract.png",
    expect: "A dark dashboard panel titled with PAY-STRIPE-1 / professional Stripe payment integration mentioning env-gated OFF by default, with a 3-column table (seam / contract / file) with about 9 rows covering Payment collection (Payment Element iframe SAQ-A), Intent mint, Placement, Webhook backstop, Client island, Config seam, Data layer, CSP, and Unconfigured default, plus notes about dependencies (stripe 23.0.0), tests (41 unit + 5 E2E), and activation (STRIPE_SECRET_KEY).",
  },
  {
    file: "122-mobile-nav-22nd-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows a close X icon at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row, with dark text on a warm off-white background, Home in orange.",
  },
  {
    file: "123-stripe-unconfigured-parity.png",
    expect: "A desktop e-commerce checkout page at the Payment Method step: a two-column layout with a left column showing a 'Payment Method' heading, a Credit / Debit Card radio option (selected, orange border), a PayPal radio option, and three labeled card input fields (Card Number with 4242 4242 4242 4242 placeholder, Expiry with MM/YY, CVC with 123) in a light gray rounded panel, and a right sidebar showing the Order Summary with a Wireless Headphones item, subtotal, shipping and total prices, plus Back and Review Order buttons.",
  },
  {
    file: "124-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest unit test run: a tree of passing test files including src/lib/stripe-payment.test.ts (41 tests) with sub-groups like resolveStripeConfig (6), stripeIdempotencyKey (5), buildPaymentIntentParams (5), verifyPaymentIntentForPlacement (7), parseStripeWebhookEvent (6), paymentIntentLast4 (6), ending with 'Test Files 12 passed (12)' and 'Tests 145 passed (145) — was 104; +41, none removed'.",
  },
  {
    file: "125-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate run listing test groups and ending with 5 stripe.spec tests about the unconfigured contract (mock card fields, ZERO Stripe network traffic, no operator vocabulary, 400 webhook rejections), '207 passed (7.2m) — run 1', 'run 2 (determinism)', and a total line '145 unit + 207 E2E = 352 tests (was 306; +41 unit +5 E2E, none removed)'.",
  },
];


let pass = 0;
for (const c of checks) {
  const b64 = readFileSync(`${OUT}/${c.file}`).toString("base64");
  try {
    const res = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
            { type: "text", text: `Does this screenshot match this description? Answer PASS or FAIL with one short sentence.\nDescription: ${c.expect}` },
          ],
        },
      ],
    });
    const reply = res.choices[0]?.message?.content?.slice(0, 200) ?? "(no reply)";
    if (/PASS/i.test(reply)) pass++;
    console.log(`${c.file}: ${reply}`);
  } catch (e) {
    console.log(`${c.file}: VLM error — ${String(e).slice(0, 120)}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(`\n${pass}/${checks.length} PASS`);
