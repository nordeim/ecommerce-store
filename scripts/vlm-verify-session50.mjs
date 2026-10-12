// VLM verification of the 5 new session-50 screenshots (261-265) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round50.mjs's probes — the Clear's
// byte-exact anatomy, the 7 category options + check, the 5 price labels,
// the keyboard highlight's accent pair, the SERUM result's heading +
// count) BEFORE this run — the round-40..49 lesson: describe reality, not
// intention; the DOM probe is the ground truth.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry; package.json + bun.lock
// are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "261-filtered-bar-reference-clear.png",
    expect:
      "A screenshot of the LUXE storefront's SHOP page with the CATEGORY FILTER ACTIVE (desktop): below the bold 'Electronics' heading and the '3 products found' line sits the filter bar card — a search input ('Search products...'), then THREE dropdown triggers reading 'Electronics', 'All Prices', and 'Featured' (each a bordered rounded rectangle with a chevron-down), and at the far right a small COMPACT 'Clear' button: a subtle ghost button with an X icon at its left and the text 'Clear' — about two-thirds the height of the dropdown triggers, small text, rounded corners, dark foreground text, NO visible border and NO background fill.",
  },
  {
    file: "262-category-popopen-seven-options.png",
    expect:
      "A screenshot of the LUXE shop page with the CATEGORY DROPDOWN OPEN: a floating popover panel is anchored below the 'All Categories' trigger (the trigger at the popover's left edge, a small gap between them), showing a vertical list of SEVEN options — 'All Categories' (first, marked SELECTED: it carries a small CHECK icon at its right and is the highlighted/active row) followed by 'Electronics', 'Clothing', 'Home & Living', 'Accessories', 'Sports', 'Beauty'. The popover has rounded corners (~10px), a light stone background, a thin border, and a drop shadow.",
  },
  {
    file: "263-price-popover-five-labels.png",
    expect:
      "A screenshot of the LUXE shop page with the PRICE DROPDOWN OPEN: a floating popover anchored below the 'All Prices' trigger listing exactly FIVE options — 'All Prices' (first, marked SELECTED with a check icon at its right) then 'Under $50', '$50 - $100', '$100 - $200', 'Over $200'. Same popover anatomy: rounded corners, light stone background, thin border, drop shadow, the option rows compact with small text.",
  },
  {
    file: "264-sort-popover-keyboard-highlight.png",
    expect:
      "A screenshot of the LUXE shop page with the SORT DROPDOWN OPEN and the KEYBOARD HIGHLIGHT on the second option: a popover below the 'Featured' trigger listing 'Featured', 'Price: Low to High', 'Price: High to Low', 'Top Rated', 'Newest'. The SECOND row ('Price: Low to High') is VISUALLY HIGHLIGHTED with a warm cream/orange-tinted background and brown text (the keyboard focus state) — visibly different from the other four rows' plain background. 'Featured' (the first row) carries the check icon marking it as the currently selected value.",
  },
  {
    file: "265-bar-search-serum-result.png",
    expect:
      "A screenshot of the LUXE shop page after a customer typed 'SERUM' (uppercase) into the filter bar's search input and pressed Enter: the bold heading reads 'Results for \"SERUM\"' with the uppercase query preserved in quotes, the line below reads '1 product found' (singular), the search input still shows 'SERUM' as its value, a compact 'Clear' button renders at the filter bar's right, and exactly ONE product card is visible in the grid — the Vitamin C Serum.",
  },
];

let pass = 0;
for (const { file, expect } of checks) {
  const b64 = readFileSync(`${OUT}/${file}`).toString("base64");
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: ${expect}`,
          },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  const answer = (res.choices[0]?.message?.content ?? "").trim();
  const ok = /^PASS/i.test(answer);
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}  —  ${answer.slice(0, 150).replace(/\n/g, " ")}`);
  if (ok) pass++;
}
console.log(`\nVLM VERIFICATION: ${pass}/${checks.length}`);
process.exit(pass === checks.length ? 0 : 1);
