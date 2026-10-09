// VLM verification of the 5 new session-26 screenshots (141-145) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..25 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "141-hero-parity-proof.png",
    expect: "A dark dashboard panel titled HERO-DRIFT-1 + HEADER-DRIFT-1 with a 4-column table (route / pre-fix sweep / post-fix sweep / note) of 8 routes where home shows a pre-fix 62.07% and a post-fix 0% (6 px), then an embedded live screenshot of a warm e-commerce hero banner for 'Home & Comfort — Transform your living space with curated pieces' with a Browse button (a cozy interior scene), and a closing note about the standing pins (hero content contract + header geometry contract).",
  },
  {
    file: "142-payments-date-range-live.png",
    expect: "A live desktop screenshot of an admin Payments page in a warm-orange e-commerce console: heading Payments, a Stripe demo-mode info banner, a filter bar with a search input, an All Families dropdown, TWO date pickers (From date showing 2026-02-22 and To date showing 2026-02-23) joined by a dash, a count line reading '2 payment events', and exactly TWO event rows (charge.refunded with Ignored, and a payment_intent.succeeded with a red 'No order — refund via Stripe dashboard' and $149.00), with a dark newsletter footer below.",
  },
  {
    file: "143-payments-family-date-live.png",
    expect: "A live desktop screenshot of an admin Payments page in a warm-orange console: a filter bar with search input, a Succeeded-family dropdown (not All Families), a From date picker showing 2026-02-23, a count line reading '1 payment event', and exactly ONE event row (payment_intent.succeeded with event id evt_demo_fixture_n and pi_demo_fixture_006, a red 'No order — refund via Stripe dashboard' line and $149.00), with a dark newsletter footer below.",
  },
  {
    file: "144-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 14 test files passing and 208 tests passed, highlighting +10 NEW PAY-OPS-3 date-range bound tests in admin-payments.test.ts (from/to pair kept, non-YYYY-MM-DD dropped, month-13 and Feb-30 dropped, from>to dropped, array params, gte/lt UTC day boundaries, open-ended ranges, AND composition with family/q), ending with 'Tests 208 passed (208) — was 198; +10, none removed'.",
  },
  {
    file: "145-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate with 225 passed twice (two consecutive full runs, 7.7m and 7.8m), the NEW session-26 coverage list (hero slide content contract, header row geometry contract, mobile header three-child row, payments date-range deep-link, open-ended from bound, family+date combined, merged params push), Mutation efficacy x3 (M1 image revert, M2 gap revert, M3 clause drop), and '433 total (208 Vitest + 225 E2E) — was 416; +17, none removed'.",
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
