// Round-61 VLM verification of captures 316-320 (the r53-r60 discipline:
// describe the surface as it IS — every description names DOM-probed facts
// only; sub-perceptual disputes settle by pixel measurement). The
// descriptions carry the live capture records: the resting popover rows
// (the listbox + the row anatomy), the hovered row (the accent pair), the
// arrow-ACTIVE row (the headline's proof), the Enter navigation (the PDP
// landing), the @375 mobile pass.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "316-srch-popover-resting.png",
    expect:
      "A desktop-viewport screenshot of an e-commerce home page (a fashion/lifestyle store with a hero banner) with the header SEARCH STRIP open below the navigation: a white strip spanning the page width containing a text input with the letters 'an' typed in it, a small dark 'Search' button, and a small ghost X icon button. Below the strip floats a white dropdown panel (a rounded rectangle with a thin light border and a soft shadow) listing FIVE product suggestion rows, each about 60px tall: a small square product thumbnail on the left (about 40px, rounded corners), the product name in dark medium text with a small gray lowercase category line under it, and a dark semibold price on the right. The first row reads 'Wireless Noise-Cancelling Headphones', 'electronics', '$299.99'. No row is highlighted — all five rows have a plain white background.",
  },
  {
    file: "317-srch-row-hover.png",
    expect:
      "The same e-commerce search dropdown: the header strip open with 'an' in the input and the white five-row suggestion panel below. The SECOND row ('Organic Cotton Oversized Tee', 'clothing', '$49.99') is MOUSE-HOVERED: its background is a soft warm CREAM-ORANGE tint (a very light peach, clearly distinct from the white of the other four rows), while its text stays the same dark and gray colors as the other rows (no text color flip). The remaining rows (including the first, 'Wireless Noise-Cancelling Headphones') keep plain white backgrounds.",
  },
  {
    file: "318-srch-row-active.png",
    expect:
      "The same e-commerce search dropdown after pressing the DOWN-ARROW key once while the caret is in the search input: the FIRST row ('Wireless Noise-Cancelling Headphones', 'electronics', '$299.99') is the ACTIVE suggestion — its background carries the same soft warm CREAM-ORANGE tint as a hover, and the input caret remains in the search input above. The other four rows stay plain white. No orange focus outline rings any row (the highlight is a background fill, not an outline).",
  },
  {
    file: "319-srch-enter-active-nav.png",
    expect:
      "A desktop-viewport screenshot of an e-commerce PRODUCT DETAIL page for 'Wireless Noise-Cancelling Headphones': the page shows the product's large image area (over-ear headphones), and the product heading 'Wireless Noise-Cancelling Headphones' with pricing and a rating row. The header's search strip is CLOSED (no search input or suggestion panel visible below the navigation — just the normal header row with logo, nav links, and icon buttons). This is the page reached by pressing ENTER on the active search suggestion.",
  },
  {
    file: "320-srch-mobile-375.png",
    expect:
      "A MOBILE-viewport (portrait, about 375px wide) screenshot of the same e-commerce home page with the header search strip open: a white full-width strip with a text input containing 'an', a small dark 'Search' button and an X icon button, and below it a white suggestion dropdown (nearly full-width with small side margins) listing product rows. The FIRST row ('Wireless Noise-Cancelling Headphones' with its 40px thumbnail, 'electronics', '$299.99') is the ACTIVE row — its background carries a soft warm cream-orange tint while the other rows stay white. The page behind is the mobile home layout (hamburger menu button visible in the header).",
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
console.log(`\n${pass}/${checks.length} PASS`);
