// VLM verification of the 5 new session-53 screenshots (276-280) — the
// createVision call per the session-17 lesson. Descriptions verified against
// the live DOM (scripts/capture-heronav-r53.mjs + recapture-279-r53.mjs
// probes — the arrows' oklab white/20 + blur(12px), the /0.3 hover, the dot
// 32/8 width pair + the white/50 inactive, the outline auto 1px ring/50,
// the mid-fade 0.62/0.38 opacities) BEFORE this run — the standing lesson:
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
    file: "276-heronav-controls-resting.png",
    expect:
      "A website HERO CAROUSEL at rest (desktop, a full-width rounded photo banner with a dark image of interior scenes, headline text 'Elevate Your Everyday Style' and an orange 'Shop Now' pill button on the left): at the MID-LEFT and MID-RIGHT edges of the photo sit two ROUND translucent control buttons — 40px circles with a frosted-glass look (semi-transparent whitish fill, slightly blurred photo behind them, soft rounded full-circle shape) each containing a white CHEVRON arrow glyph pointing LEFT (left button) and RIGHT (right button). Near the BOTTOM CENTER of the photo sit THREE small white pill/dot indicators in a row with even spacing: the FIRST dot is a wide elongated pill (about 32px long, solid white), the other two are small 8px round dots (semi-transparent white, dimmer).",
  },
  {
    file: "277-heronav-arrow-hovered.png",
    expect:
      "A close-up crop of a hero carousel's LEFT navigation arrow button in its HOVERED state: a full-circle round button with a semi-transparent WHITE fill that looks slightly MILKIER/more opaque than a faint glass tint (a 30%-alpha white over the photo, the photo still partially visible through it), a white LEFT-pointing chevron glyph centered inside, and the blurred/frosted photo backdrop behind the circle. The circle sits at the mid-left edge of a dark interior photo.",
  },
  {
    file: "278-heronav-dot3-activated.png",
    expect:
      "A narrow close-up crop of a hero carousel's DOT INDICATOR ROW after the THIRD dot was clicked: three white pill indicators in a horizontal row with even spacing over a dark photo — dot 1 and dot 2 are SMALL round dots (about 8px, semi-transparent dim white), and dot 3 (the rightmost) is the ACTIVE one: an ELONGATED wide pill about 32px long in SOLID bright white. The active pill is clearly wider/longer than the two small dots.",
  },
  {
    file: "279-heronav-arrow-focused.png",
    expect:
      "A close-up crop of a hero carousel's LEFT navigation arrow button in its KEYBOARD-FOCUSED state: the round frosted-glass circle button (semi-transparent white fill, white left chevron) carries a thin ORANGE outline/ring hugging its circular edge (a 1px orange focus ring slightly visible against the dark photo behind it) — the keyboard-affordance indication.",
  },
  {
    file: "280-heronav-crossfade-midtransition.png",
    expect:
      "A hero carousel captured MID-CROSSFADE between two slides: the photo looks like a DOUBLE EXPOSURE / ghosted blend — TWO different interior scenes visibly overlapping (one fading out, one fading in), each at roughly half strength, creating a soft semi-transparent mixed image rather than a single crisp photo. The headline text block and the round arrow buttons may look slightly doubled/ghosted too. This is the crossfade's signature look, captured mid-transition.",
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
