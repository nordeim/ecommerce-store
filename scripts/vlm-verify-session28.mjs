// VLM verification of the 5 new session-28 screenshots (151-155) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..27 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "151-dashboard-alert-live.png",
    expect: "A live desktop screenshot of an Admin Dashboard in a warm-orange e-commerce console: heading 'Admin Dashboard' with subtitle 'Store overview and management', a row of outline/solid buttons (Products, Orders, Payments), FOUR stat cards (Revenue, Orders, Products, Customers), and BELOW the stat grid a distinct ALERT ROW: a red-tinted bordered card with a round red warning-triangle icon chip, bold 'Payment review needed', the line '1 payment needs refund attention', and an outline 'Review payments' button, then a 'Recent Orders' list card with order rows (ORD-2026-00x) and a dark newsletter footer below.",
  },
  {
    file: "152-alert-deeplink-live.png",
    expect: "A live desktop screenshot of an admin Payments page in a warm-orange console: a back link '← Admin' then heading 'Payments', a demo-mode status strip mentioning Stripe in demo mode, a filter bar with an 'All events' family dropdown, a search input and two date inputs, a count line reading '1 payment event', and exactly ONE payment event row (payment_intent.succeeded, an evt_demo_fixture_n id, a date, an amount $149.00, and red text 'No order — refund via Stripe dashboard'), with a dark newsletter footer below.",
  },
  {
    file: "153-sweep-phase-record.png",
    expect: "A dark terminal-style panel showing a Round-28 live A/B pixel sweep with 8 routes all at the baseline band (home 0% 6px with a bracketed hero-phase record showing identical painted hash tails ref and clone, shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28%), followed by an audit story about a transient cold-boot paint/phase artifact measured 59.95% investigated to no-drift, the L37 fix description, and closing lines about the 28th mobile-nav token-exact parity, watches clean, and census clean.",
  },
  {
    file: "154-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 15 test files passing and 230 tests passed, highlighting +4 NEW refundNeededAlert seam tests in admin-payments.test.ts (invisible at count 0, the singular label at count 1, the plural label at count N, the href being the family Select's own value), ending with 'Tests 230 passed (230) — was 226; +4, none removed'.",
  },
  {
    file: "155-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate with 231 passed twice (two consecutive full runs, 7.5m each), the NEW session-28 coverage (dashboard refund-needed alert deep-linking to the family filter, the count deterministically 1 from the fixture set), the a11y admin gate 7/7 with the dashboard census pin unchanged at 8, Mutation efficacy x3 (M1 visibility gate inverted, M2 pluralization dropped, M3 empty placed-intent set), and '461 total (230 Vitest + 231 E2E) — was 456; +5, none removed'.",
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
