// VLM verification of the 5 new session-23 screenshots (126-130) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..22 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "126-stripe-webhook-h4d-hardening.png",
    expect: "A dark dashboard panel titled PAY-STRIPE-2 / session-23 with a 3-column table (seam / contract / file) of about 8 rows covering the H4d defect, the fix (the C8 rule), the failure policy seam (classifyWebhookPlacementError), the number race, the action path refinement, the island retry affordance, the integration gate, and mutation efficacy, plus notes about 167 tests and the honest 200/500 policy.",
  },
  {
    file: "127-mobile-nav-23rd-verification.png",
    expect: "A mobile (390px wide) screenshot of an e-commerce site with a LEFT-SLIDING navigation drawer open over the homepage: the drawer shows a close X icon at top, then a vertical list of 5 links (Home, Shop, Electronics, Clothing, Accessories), each on its own row, with dark text on a warm off-white background, Home in orange.",
  },
  {
    file: "128-webhook-integration-gate.png",
    expect: "A dark terminal-style panel showing a Vitest integration test run for tests/stripe-webhook.integration.test.ts (11 tests) listing passing tests about the backstop placement, duplicate delivery no-op, client path precedence, amount mismatch, missing/invalid signature 400s, THE H4d PROOF (transient failure rolls back, 500, retry places the order), stock-short permanent, payment_failed, ignored type, and the P2002 number-race, ending with 'Test Files 1 passed (1)' and 'Tests 11 passed (11)', plus notes about the HMAC signature scheme and fault injection.",
  },
  {
    file: "129-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 13 test files passing and 167 tests passed, highlighting src/lib/stripe-payment.test.ts (52 tests) with NEW classifier sub-groups classifyWebhookPlacementError (8) and isIntentAnchorP2002 (3), plus the NEW tests/stripe-webhook.integration.test.ts (11 tests), ending with 'Tests 167 passed (167) — was 145; +11 seam + 11 integration, none removed'.",
  },
  {
    file: "130-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate: 207 passed (7.4m) for run 1 and 207 passed for run 2 (the consecutive-pair determinism gate), followed by the round-23 regression sweep list: the unconfigured Stripe contract re-pinned, the 8-route pixel diff at the 0.28-0.68% baseline band, the 23rd mobile-nav verification byte-identical md5, typeahead zero search requests, carousel cadence, the full-route console census, and the SEO layer.",
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
