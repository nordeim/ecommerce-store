// Round-59 VLM verification of captures 306-310 (the r53-r58 discipline:
// describe the surface as it IS — every description names DOM-probed facts
// only; sub-perceptual disputes settle by pixel measurement). The
// descriptions carry the live probe records: the two-card grid, the
// revealed addbar, the click's toast + badge, the heart's global-rule
// outline, the Add's orange ring.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "306-related-section-resting.png",
    expect:
      "A desktop-viewport screenshot of an e-commerce product page scrolled to the 'You May Also Like' section: a bold dark heading 'You May Also Like', then a 2-column grid of product cards (the viewport shows the first row: two cards side by side). Each card is a white rounded-corner rectangle with a thin light border containing a square product photo (a dark speaker on the left card), small badge pills overlaid on the photo's top-left, a small circular white heart icon button overlaid on the photo's top-right, and below the photo a small gray category label, a bold dark product name, a star rating row, and a bold dark price. NO orange 'Add to Cart' button is visible on the cards (the add bar is hidden below the photo at rest).",
  },
  {
    file: "307-addbar-revealed.png",
    expect:
      "The same e-commerce product page view as before (heading 'You May Also Like', a 2-column grid of two product cards), but the LEFT card is in its HOVER state: a solid ORANGE rounded button reading 'Add to Cart' with a small white shopping-bag icon has SLID UP and is now visible overlaid on the BOTTOM EDGE of the left card's product photo (a wide flat orange bar covering the photo's bottom strip). The left card also shows a slightly larger/soft shadow (the hover lift) compared to the right card. The right card shows no orange button.",
  },
  {
    file: "308-quickadd-click-toast-badge.png",
    expect:
      "The same e-commerce product page view with the 'You May Also Like' grid of two product cards, captured shortly after clicking the left card's orange 'Add to Cart' button: in the BOTTOM-RIGHT corner of the viewport floats a dark charcoal ROUNDED toast box with a small orange circular check icon and white text reading 'Smart Home Speaker Pro added to cart!'. Higher up in the page's dark header, the small shopping-bag icon button near the top-right now carries a tiny orange square badge with the white digit '1' (the cart count). The orange Add to Cart button remains visible on the hovered left card.",
  },
  {
    file: "309-heart-focus-outline.png",
    expect:
      "The same e-commerce product page view (the 'You May Also Like' heading, two product cards in a 2-column grid), with the LEFT card's small circular heart icon button (top-right corner of its product photo) in the KEYBOARD-FOCUSED state: a thin semi-transparent ORANGE outline ring (about 1px, a soft warm orange at reduced opacity) traces the heart button's circular border. No toast is visible (it has expired). No orange Add to Cart bar is visible (no hover — the mouse is away).",
  },
  {
    file: "310-add-focus-ring.png",
    expect:
      "The same e-commerce product page view (the 'You May Also Like' heading, two product cards), with an invisible keyboard-focused 'Add to Cart' button: the LEFT card shows a thin bright ORANGE ring (about 1px, solid warm orange) tracing a rectangle shape on the LOWER part of the card (in the area below the product photo where the hidden add-bar button sits — the button itself is NOT visible since the add bar is translated away, but its focus ring renders). No toast, no hover state on the cards.",
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
