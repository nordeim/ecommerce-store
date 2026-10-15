// Round-62 VLM verification of captures 321-325 (the r53-r61 discipline:
// describe the surface as it IS — every description names DOM-probed facts
// only; sub-perceptual disputes settle by pixel measurement). The
// descriptions carry the live probe records: the resting features block
// (the h3 + the 4 muted icon rows), the anatomy crop, the icon row's
// orange check, the @375 mobile pass, the Reviews tab swap.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "321-pdpfeatures-resting.png",
    expect:
      "A desktop-viewport screenshot of an e-commerce product page (wireless over-ear headphones) scrolled to the description area below the tab bar: a paragraph of muted gray body text, then a bold dark heading 'Key Features' (about 18px), then a list of FOUR feature rows, each row consisting of a small ORANGE check-mark icon (a thin-stroke lucide-style check, about 16px, warm orange color) followed by muted gray 16px text: 'Active Noise Cancellation', '30hr Battery', 'Bluetooth 5.3', 'Hi-Res Audio'. The rows are evenly spaced with modest vertical gaps. No buttons, links, or hover states — pure content. The page's white background with the product page's left-aligned content column.",
  },
  {
    file: "322-pdpfeatures-anatomy.png",
    expect:
      "A close-up CROP of a product page's description block (about 560px wide): at the top, the tail of a muted gray paragraph line; then the bold dark heading 'Key Features'; then four list rows, each an orange check icon followed by muted gray text ('Active Noise Cancellation', '30hr Battery', 'Bluetooth 5.3', 'Hi-Res Audio'). The rows are left-aligned with a consistent icon-to-text gap (about 8px). The crop contains only this block, no other page chrome.",
  },
  {
    file: "323-pdpfeatures-icon.png",
    expect:
      "A very tight horizontal CROP of ONE list row (about 24px tall, 300px wide) on a white background: at the left edge, a small warm-ORANGE thin-stroke check-mark icon (about 16px square, stroke about 2px, drawn as a simple angled check with no fill), followed by a small gap, then muted medium-gray text reading 'Active Noise Cancellation' in a regular-weight sans-serif (about 16px). No background tint on the row — pure white; no border, no shadow, no button styling.",
  },
  {
    file: "324-pdpfeatures-mobile-375.png",
    expect:
      "A MOBILE-viewport screenshot (375px wide) of the same product page's description area: the bold dark heading 'Key Features', then the four feature rows (each an orange check icon + muted gray text: 'Active Noise Cancellation', '30hr Battery', 'Bluetooth 5.3', 'Hi-Res Audio'), filling the narrow content column with the page's standard side gutters (about 16px each side). The rows stack vertically with consistent spacing; the text wraps nowhere. Above the heading, muted paragraph text is partially visible; below the list, more page content may be cut off.",
  },
  {
    file: "325-pdpfeatures-tab-swap.png",
    expect:
      "A desktop-viewport screenshot of the product page's tab area after CLICKING the 'Reviews (234)' tab: the tab bar shows 'Description' unselected (transparent, gray text), 'Reviews (234)' as the SELECTED tab (a white raised pill with dark text and a subtle shadow), and 'Shipping' unselected. Below the tab bar, the description content (the 'Key Features' heading and the feature list) is GONE — instead a centered muted gray placeholder message reads 'Customer reviews coming soon.' with generous vertical padding. No orange focus ring on the clicked tab.",
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
