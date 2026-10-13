// VLM verification of the 5 new session-54 screenshots (281-285) — the
// createVision call per the session-17 lesson. Descriptions verified against
// the live DOM (scripts/capture-footer-r54.mjs probes — the 4x278px grid at
// gap 40, the /60 link color lab(... /0.6), the FIXED policy class with the
// /60 hover target (probe 283: lab(... /0.6) hovered), the announcement
// bar's 28px static strip, the mobile 358px single column + column bottom
// row) BEFORE this run — the standing lesson: describe reality, not
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
    file: "281-footer-at-rest.png",
    expect:
      "A website FOOTER at rest on a desktop page (1280px wide): a dark near-BLACK block (very dark charcoal, rgb(23,23,28)) with FOUR content columns laid out in one row with generous spacing: column 1 has a small 'LUXE' wordmark logo with a tiny orange rounded icon, then a short two-line paragraph of dim grayish-white text, then three small contact rows each led by a tiny 16px icon (envelope, phone, pin) in dim grayish-white; column 2 has a small bold UPPERCASE 'SHOP' heading in bright white followed by a vertical list of 7 dim grayish-white links (All Products, Electronics, Clothing, Accessories, Home & Living, Sports, Beauty); column 3 has a small bold UPPERCASE 'COMPANY' heading followed by 5 dim grayish-white link-like text rows (About Us, Careers, Press, Sustainability, Affiliate Program); column 4 has a small bold UPPERCASE 'STAY UPDATED' heading, a dim one-line paragraph, and a subscribe input field with an orange 'Join' button.",
  },
  {
    file: "282-shop-link-hovered.png",
    expect:
      "A close-up crop of a dark near-black website footer's SHOP link column in which the FIRST link ('All Products') is in its HOVERED state: that one link renders in BRIGHT FULL white (fully opaque warm white), clearly brighter and crisper than the OTHER links around it, which remain DIM grayish-white (a 60%-alpha translucent white over the dark background). The hovered link is text only (no background pill, no underline) — the brightness difference is the hover indication.",
  },
  {
    file: "283-policy-hover-target-60.png",
    expect:
      "A close-up crop of a dark near-black website footer's BOTTOM BAR area: a dim grayish-white '© 2026 LUXE Store. All rights reserved.' text on the left and a horizontal row of three small dim policy texts on the right ('Privacy Policy', 'Terms of Service', 'Cookie Policy'). The FIRST policy text ('Privacy Policy') is in its HOVERED state: it is BRIGHTER than its two neighbors (which stay DIM, 40%-alpha grayish-white) but NOT fully bright white — it lifts to a MEDIUM-bright grayish-white (60%-alpha), softer/slightly dimmer than a pure-white text would be. No underline, no background — the subtle brightness lift is the hover indication.",
  },
  {
    file: "284-announcement-bar-static.png",
    expect:
      "The TOP of a desktop e-commerce page: a FLAT SOLID ORANGE strip (a warm medium orange, rgb(230,107,26)) spanning the full width at the very top, with ONE line of small centered white text reading 'Free shipping on orders over $100 • 30-day returns' (the bullet separator between the two phrases). Below the orange strip sits the site's warm-white header bar with a small 'LUXE' logo, a row of navigation links, and small icon buttons. The orange strip is completely flat and static — no gradient, no scroll/marquee artifacts, no second line.",
  },
  {
    file: "285-mobile-footer-collapse.png",
    expect:
      "A MOBILE (390px narrow) view of a website footer on a dark near-black background: the footer's four content blocks are STACKED VERTICALLY in a single full-width column (the LUXE logo + blurb + contact block first, then the SHOP heading with its 7 links, then the COMPANY heading with its 5 links, then the STAY UPDATED subscribe block) — NOT side by side. Near the bottom, after a thin dim horizontal hairline divider, the copyright line ('© 2026 LUXE Store. All rights reserved.') and the three small policy texts (Privacy Policy, Terms of Service, Cookie Policy) are STACKED VERTICALLY and CENTERED in the narrow column, not in a left-right row.",
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
