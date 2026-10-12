// VLM RECONCILIATION of 266 + 270 (the r49 pattern): 266's first
// description said "at the photo's bottom edge" — the VLM read the same
// pixels as "below the image" (the bar overlays the photo's lower 56px;
// phrasing, not pixels). 270's first description GUESSED the nav links
// ("About, Contact" — wrong; the actual set is Home, Shop, Electronics,
// Clothing, Accessories) and scrolled to a white section where the
// frosted effect was invisible — re-captured over the hero imagery. Both
// re-verifications use corrected descriptions derived from the DOM probe
// (the ground truth) — describe reality, not intention.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "266-hovered-card-full-contract.png",
    expect:
      "A single product card from the LUXE storefront (desktop) in its HOVERED state. The card: rounded corners, white background, a clearly ELEVATED drop shadow around it. The top two-thirds is the product photo (headphones) slightly zoomed. Overlaid ON the photo's lower portion, flush with its bottom edge, is a full-width ORANGE bar (a rounded orange button with a shopping-bag icon and white 'Add to Cart' text) — the bar sits INSIDE the photo area, overlapping its bottom edge (it may read as a strip at or just below the photo's bottom line). A circular frosted-glass heart button floats at the photo's top-right; two small pill badges ('Best Seller' in orange, '-25%' in red) at the photo's top-left. Below the photo: the muted lowercase 'electronics' category line, the product title 'Wireless Noise-Cancelling Headphones' in ORANGE, the star rating, and the price row ($299.99 with $399.99 struck through).",
  },
  {
    file: "270-sticky-header-blur-xl.png",
    expect:
      "The LUXE storefront's sticky HEADER pinned at the top of the viewport (desktop) while the page is scrolled into the HERO region: the header bar carries the LUXE logo at the left, the navigation links (Home, Shop, Electronics, Clothing, Accessories), and the search/heart/cart icon buttons at the right. The header has a semi-transparent light cream frosted-glass background — the colorful hero photo content passing beneath the bar appears BLURRED/SOFTENED through it, with a thin border along the header's bottom edge. Below the header, the blurred hero imagery continues.",
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
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}  —  ${answer.slice(0, 160).replace(/\n/g, " ")}`);
  if (ok) pass++;
}
console.log(`\nVLM RECONCILIATION: ${pass}/${checks.length}`);
process.exit(pass === checks.length ? 0 : 1);
