// VLM verification of the 5 new session-30 screenshots (161-165) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..29 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "161-refund-reason-live.png",
    expect: "A live desktop screenshot of an admin payments page in a warm-orange e-commerce console: a 'Payments' heading with a back-to-admin link, a demo-mode Stripe status banner, a filter bar with family/search/date inputs where the family Select shows 'Refund needed', a count line reading '1 payment event', and ONE payment-event row showing the type 'payment_intent.succeeded', the event id and 'pi_demo_fixture_006' in monospace, a Feb 23 2026 timestamp, the amount $149.00 bold on the right, a red destructive outcome line reading 'No order — refund via Stripe dashboard', and directly beneath it a small muted gray line reading 'Reason: amount mismatch vs cart total', with a dark newsletter footer below.",
  },
  {
    file: "162-reason-calm-state.png",
    expect: "A live desktop screenshot of an admin payments page in a warm-orange e-commerce console: 'Payments' heading, demo-mode Stripe status banner, a filter bar, a count line reading '4 payment events', and FOUR payment-event rows ordered newest first: a 'payment_intent.succeeded' row for pi_demo_fixture_006 (Feb 23 2026) with $149.00, the red 'No order — refund via Stripe dashboard' line and the ONLY muted 'Reason: amount mismatch vs cart total' line beneath it; a 'charge.refunded' row for pi_demo_fixture_005 (Feb 22) showing 'Ignored' with $79.99 and NO reason line; a 'payment_intent.payment_failed' row for pi_demo_fixture_004 (Feb 21) showing 'Payment failed' with $89.99 and NO reason line; a 'payment_intent.succeeded' row for pi_demo_fixture_003 (Feb 20) linking 'ORD-2026-003 placed' with $524.97 and NO reason line, with a dark newsletter footer below.",
  },
  {
    file: "163-sweep-postchange.png",
    expect: "A dark terminal-style panel showing a Round-30 post-change live A/B pixel sweep with 8 routes all at the baseline band (home 0% 6px with a bracketed hero-phase record showing identical painted hash tails 1237b9a1afec for ref and clone, shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28%), followed by a pre-formatted note stating ALL ROUTES AT BASELINE BAND and describing the admin-only change touching no parity surface, the 30th mobile-nav token-exact verification, and the clean watches plus 24-route + 11-admin console census.",
  },
  {
    file: "164-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 15 test files passing and 242 tests passed (+7 this round: 6 unit + 1 integration), a table listing the NEW contracts (paymentFailureReasonView invisible for null the honest calm state, mapping amount-mismatch, stock-short, metadata-unusable, cart-unavailable to operator copy, passing an unknown code through raw, and the webhook integration test persisting reason codes at all four sites plus the success-path null), ending with a mutation efficacy note describing M1 label mapping dropped causing 4 unit failures, M2 visible gate inverted causing 1 unit failure, M3 the webhook's amount-mismatch write dropping the reason causing 1 integration failure.",
  },
  {
    file: "165-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate with 233 passed twice (two consecutive runs 7.6m and 7.7m, +1 this round), the NEW session-30 test (the refund-needed row rendering the deterministic-failure reason scoped to the fixture row plus the calm state with exactly ONE reason line on the unfiltered list), a full gate summary reading lint 0/0, tsc clean, 242/242 unit+integration, build exit 0, 233/233 E2E equal to 475 total, and an a11y note that the payments census pin is UNCHANGED at 9 with no recalibration.",
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
