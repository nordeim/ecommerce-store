// VLM verification of the 5 new session-51 screenshots (266-270) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round51.mjs's probes — the blur
// fix at 4px, the zoom 1.05, the orange title, the addbar revealed, the
// hero 12px, the header 24px) BEFORE this run — the standing lesson:
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
    file: "266-hovered-card-full-contract.png",
    expect:
      "A single product card from the LUXE storefront (desktop), captured in its HOVERED state: a rounded-corner white card with a soft but clearly ELEVATED drop shadow around it (the hover lift), the product photo (headphones) filling the top square and slightly zoomed, an ORANGE 'Add to Cart' bar fully visible at the photo's bottom edge (a full-width rounded orange button with a shopping-bag icon and white 'Add to Cart' text), a circular frosted-glass heart button at the photo's top-right, two small pill badges ('Best Seller', '-25%') at the photo's top-left, and the product title text below the photo rendered in ORANGE (not black) — 'Wireless Noise-Cancelling Headphones' in orange with the muted category line 'electronics' above it and the price row below.",
  },
  {
    file: "267-resting-card-shadow-sm.png",
    expect:
      "A single product card from the LUXE storefront (desktop), captured in its RESTING (NOT hovered) state: a rounded-corner white card with only a very subtle shadow (no elevation lift), the product photo (headphones) NOT zoomed, NO 'Add to Cart' bar visible at the photo's bottom (it is hidden below the photo edge), the circular frosted-glass heart button at the photo's top-right, the pill badges ('Best Seller', '-25%') at the photo's top-left, and the product title below the photo in DARK/BLACK text (not orange) with the muted 'electronics' category line above it and the price row ($299.99 with the struck-through $399.99) below.",
  },
  {
    file: "268-heart-blur4px-resting.png",
    expect:
      "A close-up crop of a product card's top-right corner (desktop): a single circular button (about 36px wide) floating over the product photo — a light cream-colored frosted-glass disc (semi-transparent, the photo softly blurred behind it), containing a small heart OUTLINE icon in a muted gray color (NOT red, NOT filled — the inactive wishlist state), and a thin subtle shadow under the disc.",
  },
  {
    file: "269-hero-blur-md-sites.png",
    expect:
      "The LUXE storefront's HERO carousel (desktop, top of the home page): a lifestyle photo filling the width, with a small pill badge reading 'Up to 40% Off' (semi-transparent white glass with soft blur, white text, rounded-full), a large bold headline below it, and TWO circular arrow buttons — one at the photo's far left and one at the far right (each about 40px, semi-transparent white glass with blur, containing a chevron icon). The header bar with the LUXE logo and navigation sits above.",
  },
  {
    file: "270-sticky-header-blur-xl.png",
    expect:
      "The LUXE storefront's sticky HEADER pinned at the top of the viewport (desktop) while the page is SCROLLED: the header bar shows the LUXE logo on the left, the navigation links (Home, Shop, About, Contact) in the center-left area, and the search, heart, and cart icon buttons on the right. The header has a semi-transparent light cream background with a frosted-glass blur — the page content (product imagery) is visibly blurred as it passes beneath the bar. A thin border line runs along the header's bottom edge.",
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
