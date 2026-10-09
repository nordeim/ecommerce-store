// VLM verification of the 5 new session-27 screenshots (146-150) — the
// createVision call per the session-17 lesson.
// NOTE: imports z-ai-web-dev-sdk, which is NOT a repo dependency (DEPS-1
// pruning) — installed transiently; revert package.json + bun.lock before
// committing (the session-17..26 convention).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "146-products-search-live.png",
    expect: "A live desktop screenshot of an admin Products page in a warm-orange e-commerce console: heading Products, a filter bar with a search input containing 'headphone', an All Categories dropdown, an All visibility dropdown, a count line reading '1 of 12 products', and exactly ONE product row (Wireless Noise-Cancelling Headphones, Electronics, an Active badge, a stock input and Save button, an eye icon), with a dark newsletter footer below.",
  },
  {
    file: "147-products-category-live.png",
    expect: "A live desktop screenshot of an admin Products page in a warm-orange console: a filter bar with an empty search input, an Electronics-family dropdown (not All Categories), an All visibility dropdown, a count line reading '3 of 12 products', and exactly THREE product rows (Wireless Noise-Cancelling Headphones, Smart Home Speaker Pro, Wireless Charging Pad — all Electronics), each with an Active badge and stock controls, with a dark newsletter footer below.",
  },
  {
    file: "148-products-visibility-live.png",
    expect: "A live desktop screenshot of an admin Products page in a warm-orange console: a filter bar with an empty search input, an All Categories dropdown, a Hidden visibility dropdown (not All), a count line reading '1 of 12 products', and exactly ONE product row (Ceramic Planter Set, Home & Living) whose badge reads 'Hidden' in red, with a dark newsletter footer below.",
  },
  {
    file: "149-unit-gate-run.png",
    expect: "A dark terminal-style panel showing a Vitest run with 15 test files passing and 226 tests passed, highlighting +18 NEW ADMIN-PRODUCTS-1 seam tests in admin-products.test.ts (parse: q trim, category validated against the passed slug set, visibility active/hidden, where: bare OR/relation/isActive shapes, AND-of-2 and AND-of-3, no filters = {}), ending with 'Tests 226 passed (226) — was 208; +18, none removed'.",
  },
  {
    file: "150-e2e-gate-run.png",
    expect: "A dark terminal-style panel showing a Playwright E2E gate with 230 passed twice (two consecutive full runs, 7.5m and 7.6m), the NEW session-27 coverage list (products search by name fragment, category filter with bad-value fall-through, visibility filter via the eye seam, combined category AND search, empty state with Clear), Mutation efficacy x3 (M1 name-only OR, M2 category validation dropped, M3 visibility clause dropped), and '456 total (226 Vitest + 230 E2E) — was 433; +23, none removed'.",
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
