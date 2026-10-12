// VLM verification of the 5 new session-52 screenshots (271-275) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round52.mjs's probes — the ATC
// bg rgb(230,107,26) + the shadow pair, the /90 hover, the accent pair
// rgb(253,243,237)/rgb(138,64,15), the secondary tint rgb(242,240,237),
// the focused orange ring) BEFORE this run — the standing lesson: describe
// reality, not intention; the DOM probe is the ground truth.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry; package.json + bun.lock
// are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "271-buypanel-action-row-resting.png",
    expect:
      "A product page's BUY PANEL action row (desktop, cropped strip): four elements side by side — (1) a quantity stepper: a bordered rounded rectangle containing a minus icon button, the number 1 centered, and a plus icon button; (2) a wide ORANGE 'Add to Cart' button (solid orange background, white text, a shopping-bag icon, rounded corners, a subtle drop shadow); (3) a square OUTLINE button (transparent background, thin light border, rounded corners) containing only a dark heart OUTLINE icon (not red, not filled). The three sit on one row with equal heights (the stepper slightly taller by its border), small even gaps between them.",
  },
  {
    file: "272-buypanel-atc-hovered.png",
    expect:
      "The same buy-panel action row with the ORANGE 'Add to Cart' button in its HOVERED state: the button's orange background appears very slightly LIGHTER/softer than the solid resting orange (a 90%-opacity tint of the same orange — subtle), with white text and the shopping-bag icon unchanged; the stepper (minus, 1, plus) on the left and the outlined heart button on the right are in their resting states.",
  },
  {
    file: "273-buypanel-heart-hovered-accent.png",
    expect:
      "The same buy-panel action row with the OUTLINE HEART button (right side) in its HOVERED state: the heart button's background is now a very light WARM CREAM/PEACH tint (a soft orange-tinged near-white), and the heart icon inside has turned a DARK BROWN/BRONZE color (not black, not red — a warm dark orange-brown outline heart). The orange 'Add to Cart' button and the stepper on the left remain in their resting states.",
  },
  {
    file: "274-buypanel-stepper-minus-hovered.png",
    expect:
      "A close-up crop of the quantity stepper only (desktop): a bordered rounded rectangle with three zones — the MINUS icon button on the LEFT carrying a light warm-gray tint background (the hover state — a soft light gray-beige fill behind the minus glyph, only on the left button), the number 1 centered in medium-weight dark text, and the plus button on the right with NO tint (transparent, resting). A thin light border with rounded left corner on the minus side and rounded right corner on the plus side.",
  },
  {
    file: "275-buypanel-atc-focused-ring.png",
    expect:
      "The buy-panel action row with the ORANGE 'Add to Cart' button in its KEYBOARD-FOCUSED state: the button carries a thin ORANGE outline/ring hugging its rounded-rectangle edge (a 1px orange focus ring around the orange button, slightly visible against the white page background), with the white 'Add to Cart' text and shopping-bag icon unchanged; the stepper and heart button unfocused.",
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
