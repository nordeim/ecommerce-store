// VLM verification of the 5 new session-24 screenshots (131-135) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..23 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "131-payment-ops-surface.png",
    expect: "A dark dashboard panel titled PAY-OPS-1 / session-24 with a 3-column table (seam / contract / file) of about 7 rows covering the observability gap, the /admin/payments page, the outcome derivation seam, the filter seam, the demo fixtures, the entry point + a11y gate, and mutation efficacy, plus notes about 19 seam tests, 186 Vitest + 214 E2E totals, and a heading-order family observation.",
  },
  {
    file: "132-mobile-nav-24th-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows a close X icon at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row, with dark text on a warm off-white background, Home in orange.",
  },
  {
    file: "133-payments-surface-live.png",
    expect: "A live desktop screenshot of an admin Payments page in a warm-orange e-commerce console: a back link and Payments heading at top, an info banner about Stripe demo mode, a search input and event-family dropdown filter, a count line reading 3 payment events, and three event rows (charge.refunded with an Ignored outcome, payment_intent.payment_failed with Payment failed, payment_intent.succeeded with an orange ORD-2026-003 placed link), with a dark newsletter footer below.",
  },
  {
    file: "134-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 14 test files passing and 186 tests passed, highlighting the NEW src/lib/admin-payments.test.ts (19 tests) with sub-groups parseAdminPaymentFilters (7), buildAdminPaymentWhere (6), resolvePaymentEventOutcome (5) and the family options (1), ending with 'Tests 186 passed (186) — was 167; +19 seam, none removed'.",
  },
  {
    file: "135-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate: 214 passed for run 1 and 214 passed for run 2 (the consecutive-pair determinism gate), followed by the NEW payment-ops coverage list (guest gating, role contract, fixture outcomes, deep-linkable family filter, q search, empty state, order deep-link, a11y census) and the round-24 regression sweep (8-route pixel baseline, 24th mobile-nav md5, typeahead/carousel watches, console census, SEO layer).",
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
