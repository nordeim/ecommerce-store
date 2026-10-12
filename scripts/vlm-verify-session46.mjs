// VLM verification of the 5 new session-46 screenshots (241-245) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round46.mjs's probes — the resting
// panel, the loading line, the suggestion row, the preserved-query reopen,
// and the plural results copy) BEFORE this run — the round-40..45 lesson:
// describe reality, not intention; the DOM probe is the ground truth.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry; package.json + bun.lock
// are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "241-search-panel-resting.png",
    expect: "A screenshot of the LUXE storefront HOME page, desktop width, with the SEARCH PANEL OPEN: below the sticky header row (the bold 'LUXE' logo, the nav links Home/Shop/Electronics/Clothing/Accessories, and the icon cluster) a light strip has slid open under the header with a bottom border, containing a wide rounded search input on the left showing LIGHT-GRAY PLACEHOLDER text 'Search products...' (placeholder styling, NOT a typed value — the input is empty) and a solid orange 'Search' button on the right. Below the strip, the hero section of the home page (a large product image and headline text) is partially visible.",
  },
  {
    file: "242-typeahead-loading.png",
    expect: "The LUXE storefront home page with the SEARCH PANEL OPEN and the search input carrying the DARK TYPED text 'serum'. Under the input a white rounded dropdown popover has appeared (a results panel with a subtle border and shadow) containing a single muted gray line of small text reading 'Searching…' — the typeahead's in-flight loading state, no product results yet. The orange 'Search' button sits at the input's right.",
  },
  {
    file: "243-typeahead-suggestion.png",
    expect: "The LUXE storefront home page with the SEARCH PANEL OPEN, the input carrying the typed text 'serum', and the typeahead popover showing ONE loaded suggestion row: a small rounded product thumbnail on the left, the product name 'Vitamin C Serum' in dark medium text, the lowercase category 'beauty' in small muted text under the name, and the price '$34.99' in dark semibold text at the row's right. The orange 'Search' button at the input's right; the hero below.",
  },
  {
    file: "244-reopen-preserved-query.png",
    expect: "The LUXE storefront home page with the SEARCH PANEL REOPENED after being closed: the input STILL carries the DARK TYPED text 'serum' (the typed query was preserved across the close/reopen — the round's parity fix), and the typeahead popover shows the CACHED suggestion row again: the 'Vitamin C Serum' thumbnail, name, the lowercase 'beauty' category, and the '$34.99' price at the right. The orange 'Search' button beside the input; the hero section below the strip.",
  },
  {
    file: "245-results-plural-copy.png",
    expect: "The LUXE storefront SHOP page at desktop width showing search results: a large heading reading 'Results for \"wireless\"' with the muted count line '2 products found' under it (the PLURAL form — two products matched), a filter bar with 'All Categories' / 'All Prices' / 'Featured' selects and a 'Clear' link, an active-filter chip reading '\"wireless\"', and a product grid of exactly TWO cards: 'Wireless Noise-Cancelling Headphones' (electronics, $299.99 with a struck-through $399.99, a 'Best Seller' badge and a '-25%' discount badge) and 'Wireless Charging Pad' (electronics, $39.99 with a struck-through $59.99, a 'Sale' badge and a '-33%' discount badge).",
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
          { type: "text", text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: ${expect}` },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  const answer = (res.choices[0]?.message?.content ?? "").trim();
  const ok = /^PASS/i.test(answer);
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}  —  ${answer.slice(0, 140).replace(/\n/g, " ")}`);
  if (ok) pass++;
}
console.log(`\nVLM VERIFICATION: ${pass}/${checks.length}`);
process.exit(pass === checks.length ? 0 : 1);
