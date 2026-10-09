// VLM verification of the 5 new session-29 screenshots (156-160) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..28 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "156-order-detail-payment-trail-live.png",
    expect: "A live desktop screenshot of an admin order-detail page in a warm-orange e-commerce console: heading 'ORD-2026-003' with a status badge and a total price, Customer and Shipping Address cards, an Items card listing products with a subtotal/shipping/total breakdown, then a 'Payment events' card with a credit-card icon and ONE row reading 'Payment captured' with the amount $524.97 and a Feb 20, 2026 timestamp, then a 'Timeline' card with an 'Order placed' event, with a dark newsletter footer below.",
  },
  {
    file: "157-order-detail-calm-state.png",
    expect: "A live desktop screenshot of an admin order-detail page in a warm-orange e-commerce console: heading 'ORD-2026-001' with a status badge and total, Customer and Shipping Address cards (John Doe, 123 Main Street), an Items card, and a 'Timeline' card with 'Order placed' — but NO 'Payment events' card anywhere between Items and Timeline (the calm state for a non-Stripe order), with a dark newsletter footer below.",
  },
  {
    file: "158-sweep-l38-hardened.png",
    expect: "A dark terminal-style panel showing a Round-29 live A/B pixel sweep with 8 routes all at the baseline band (home 0% 6px with a bracketed hero-phase record showing identical painted hash tails for ref and clone, shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28%), followed by a pre-formatted note describing the L38 fix: the battery's reference login helper now waits for the URL to LEAVE /login with waitForURL because the reference's redirect chain became slow, and the re-run being fully green with ref login landing on /.",
  },
  {
    file: "159-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 15 test files passing and 235 tests passed (+5 this round), a table listing five NEW seam contracts in admin-payments.test.ts (paymentEventLabel mapping canonical types, paymentEventLabel passing unknown types through raw, orderPaymentTrail invisible for an empty event set, orderPaymentTrail mapping rows preserving order and amount, orderPaymentTrail keeping a null amount row), ending with a mutation efficacy note describing M1 label mapping dropped, M2 visible gate inverted, M3 page queries the wrong column.",
  },
  {
    file: "160-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate with 232 passed twice (two consecutive full runs, 7.5m and 7.6m, +1 this round), the NEW session-29 test (the Stripe-paid order's detail rendering the payment-event trail with the capture row Payment captured · $524.97 plus the calm state on ORD-2026-001), a full gate summary reading lint 0/0, tsc clean, 235/235 unit, build exit 0, 232/232 E2E equal to 467 total, and an a11y note that the order-detail census pin is UNCHANGED at 7 with no recalibration.",
  },
];

let pass = 0;
for (const c of checks) {
  const b64 = readFileSync(`${OUT}/${c.file}`).toString("base64");
  let ans = "";
  for (let attempt = 1; attempt <= 4 && !ans; attempt++) {
    try {
      const r = await zai.chat.completions.createVision({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Does this screenshot match this description? Answer PASS or FAIL plus one sentence.\n\n${c.expect}` },
              { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
            ],
          },
        ],
        thinking: { type: "disabled" },
      });
      ans = r?.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      const is429 = String(e).includes("429");
      console.log(`retry ${attempt} (${is429 ? "rate-limited" : "error"}) ${c.file}: ${String(e).slice(0, 90)}`);
      await new Promise((r) => setTimeout(r, is429 ? 20000 * attempt : 3000));
    }
  }
  if (!ans) {
    console.log(`ERROR ${c.file}: giving up after retries`);
    continue;
  }
  const ok = /PASS/i.test(ans) && !/FAIL/i.test(ans);
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.file}  — ${ans.slice(0, 140).replace(/\n/g, " ")}`);
  if (ok) pass++;
  await new Promise((r) => setTimeout(r, 4000));
}
console.log(`\n${pass}/${checks.length} checks passed`);
process.exit(pass === checks.length ? 0 : 1);
