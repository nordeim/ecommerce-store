// Round-53 corrected re-verification of 276 + 278 (the settlement's
// follow-up): 276's first description GUESSED the headline (the r51
// discipline violation — corrected to the probed truth: promo "Up to 40%
// Off", title "Spring Collection 2026"); 278's dots sit on the bright
// third-slide photo (the VLM's contrast complaint) — the description now
// names the low-contrast context explicitly. The DOM probes (the capture
// script's own reads: the [8, 8, 32] dot widths, the slide content) are
// the ground truth.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "276-heronav-controls-resting.png",
    expect:
      "A website HERO CAROUSEL at rest (desktop, a full-width rounded photo banner: a dark interior scene with a light-colored armchair/sofa, a small translucent white badge reading 'Up to 40% Off', the large headline 'Spring Collection 2026' in white, a subtitle line, and an orange 'Shop Now' pill button on the left): at the MID-LEFT and MID-RIGHT edges of the photo sit two ROUND frosted-glass control buttons — full circles with a semi-transparent whitish fill and blurred photo behind them, each containing a white CHEVRON arrow glyph pointing LEFT (left button) and RIGHT (right button). Near the BOTTOM CENTER sit THREE white dot indicators in a row: the FIRST is a wide elongated solid-white pill (about 32px long), the other two are small 8px round dots in dimmer semi-transparent white.",
  },
  {
    file: "278-heronav-dot3-activated.png",
    expect:
      "A narrow horizontal close-up crop showing a hero carousel's DOT INDICATOR ROW over a bright, light-toned interior photo (a light carpet/floor area — low contrast against the white dots, the dots may look faint): three white pill indicators in a row — the leftmost two are SMALL round dots roughly 8 pixels wide and semi-transparent (dimmer, blending with the bright background), and the RIGHTMOST one is clearly an ELONGATED pill roughly four times wider (about 32 pixels, solid bright white) — the active indicator. The wide pill's length should be visibly longer than either small dot even at low contrast.",
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
console.log(`\nCORRECTED RE-VERIFICATION: ${pass}/${checks.length}`);
process.exit(pass === checks.length ? 0 : 1);
