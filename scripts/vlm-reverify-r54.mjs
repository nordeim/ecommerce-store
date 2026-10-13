// Round-54 VLM re-verification of the two settled captures (282 + 283) —
// the r53 discipline: describe reality as measured. 282: the pixel
// settlement proved the hovered link renders p95=234 vs the resting 150
// (delta 84 — the VLM's first read was wrong; the description now names the
// position precisely). 283: RECAPTURED with the full bottom row (copyright
// in frame) — the hovered Privacy measures p95=142 (the /60 signature,
// 0.6 x 250) vs the resting 100 (0.4 x 250); full-white would be 234.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "282-shop-link-hovered.png",
    expect:
      "A close-up crop of a dark near-black website footer's link columns. There are two or three small uppercase column headings ('SHOP' and 'COMPANY') with vertical lists of small text links below them. Focus on the SHOP list (the left list in the crop): its FIRST/TOPMOST link ('All Products') is in its HOVERED state — its text glyphs are rendered SUBSTANTIALLY BRIGHTER, nearly solid opaque white, clearly crisper and brighter than every other link in the crop, which all render in a DIM translucent grayish-white (roughly 60% opacity over the dark background). The brightness contrast between the topmost SHOP link and the links below it is noticeable — roughly halfway between the dim gray links and pure white. No underline, no background pill: the brightness alone is the hover indication.",
  },
  {
    file: "283-policy-hover-target-60.png",
    expect:
      "A wide crop of a dark near-black website footer's BOTTOM BAR row: on the LEFT a small dim grayish-white copyright text '© 2026 LUXE Store. All rights reserved.', and on the RIGHT a horizontal row of three small policy texts 'Privacy Policy', 'Terms of Service', 'Cookie Policy'. The LEFTMOST of the three policy texts ('Privacy Policy') is in its HOVERED state: it renders as a MEDIUM-bright grayish-white — clearly brighter than its two neighbors to the right (which stay DIM, about 40% opacity grayish-white over the dark background) but NOT a solid bright white: its glyphs are roughly 60% opacity, a soft/medium brightness, visibly dimmer than pure white text would be. No underline, no background: the medium brightness lift is the hover indication.",
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
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}  —  ${answer.slice(0, 160).replace(/\n/g, " ")}`);
  if (ok) pass++;
}
console.log(`\nRE-VERIFICATION: ${pass}/${checks.length}`);
process.exit(pass === checks.length ? 0 : 1);
