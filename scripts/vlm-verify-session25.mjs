// VLM verification of the 5 new session-25 screenshots (136-140) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..24 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "136-payment-ops-refinement.png",
    expect: "A dark dashboard panel titled PAY-OPS-2 / session-25 with a 3-column table (seam / contract / file) of about 6 rows covering the refund-needed filter family, the event amount column, the charge-event intent honesty, the console heading-order fix, the fixtures + isolation, and mutation efficacy, plus a tests note (400 → 412 total, 198 Vitest + 214 E2E) and the a11y pin recalibration 8 → 9.",
  },
  {
    file: "137-mobile-nav-25th-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows a close X icon at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row, with dark text on a warm off-white background, Home in orange.",
  },
  {
    file: "138-payments-surface-live.png",
    expect: "A live desktop screenshot of an admin Payments page in a warm-orange e-commerce console: a back link and Payments heading at top, an info banner about Stripe demo mode, a search input and event-family dropdown filter, a count line reading 4 payment events, and four event rows — charge.refunded with Ignored outcome, payment_intent.payment_failed with Payment failed and $89.99, payment_intent.succeeded with an orange ORD-2026-003 placed link and $524.97, and another payment_intent.succeeded with a red 'No order — refund via Stripe dashboard' line and $149.00 — with a dark newsletter footer below.",
  },
  {
    file: "139-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 14 test files passing and 198 tests passed, highlighting the NEW refund-needed family tests (5 added to admin-payments.test.ts), the stripe-payment intent-id helper tests (5 added), and the webhook integration tests (2 added), ending with 'Tests 198 passed (198) — was 186; +12, none removed'.",
  },
  {
    file: "140-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate with 218 passed twice (two consecutive full runs), the NEW session-25 coverage list (the refund-needed family filter, the AND combined-filter shape, the amount rendering beside the outcome, the best-practice census empty on the console list pages, the a11y pin recalibration 8 to 9), and the round-25 regression sweep (pixel diff baseline band, 25th mobile-nav md5, typeahead watch, console census, SEO layer).",
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
