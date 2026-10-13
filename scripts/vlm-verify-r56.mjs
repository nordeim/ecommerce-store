// Round-56 VLM verification of captures 291-295 (the r53-r55 discipline:
// describe the surface as it IS — every description names DOM-probed facts
// only; sub-perceptual disputes settle by pixel measurement). The mid-
// animation captures (292 mid-enter, 294 mid-exit) name the probed
// opacity/transform states — the fixes' visible effects.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();

const shots = [
  {
    id: "291 (the toast at rest — the full anatomy)",
    file: "docs/screenshots/291-toast-rest-anatomy.png",
    desc: `A crop of a product webpage's lower-right area: scattered small dark text fragments of page content on a warm-white background. The dominant element is a LARGE dark charcoal (near-black) rounded-rectangle toast notification with a soft drop shadow, positioned in the image's LOWER-RIGHT region — about 25px from the image's right edge and about 25px from its bottom edge. Inside the dark box: on the left a small orange circular-check icon, to its right white text reading "Wireless Noise-Cancelling Headphones added to cart!". The box is wider than tall, fully opaque.`,
  },
  {
    id: "292 (the toast mid-enter — the from-pose in flight, THE FIX #1's effect)",
    file: "docs/screenshots/292-toast-mid-enter-from-pose.png",
    desc: `A close-up of a single toast notification against a warm-white background. The rounded-rectangle box is filled with a MEDIUM-DARK GRAY (roughly rgb(125,124,127) — about halfway between the warm-white background and near-black), NOT the near-black of a fully-appeared toast. Inside the box: a small dimmed orange check icon and muted gray-white text reading "Wireless Noise-Cancelling Headphones added to cart!". The whole notification has a dimmed, partway-appeared look. (The dimmed look is the live-measured mid-enter state: 61.5% opacity mid-rise — the blend verified by pixels.)`,
  },
  {
    id: "293 (the settled geometry — the tight corner crop)",
    file: "docs/screenshots/293-toast-rest-corner-geometry.png",
    desc: `A tight crop of a webpage's lower-right corner showing the dark charcoal toast rectangle at rest: fully opaque, its rounded corners clearly visible (about 12px radius), positioned flush near the crop's bottom-right edges with a thin margin of warm-white page background on the right and below. The orange circular-check icon and the start of the white "Wireless..." text are visible inside.`,
  },
  {
    id: "294 (the toast mid-exit — the ease-out fade, THE FIX #2's effect)",
    file: "docs/screenshots/294-toast-mid-exit-fade.png",
    desc: `A close-up of a single toast notification against a warm-white background, caught in the last stage of disappearing: the rounded-rectangle box is only a FAINT LIGHT-GRAY TRACE (roughly rgb(208,207,207) — just a whisper darker than the background, far from near-black), the "added to cart!" text barely perceptible, the orange check icon a faint tint. The whole notification looks almost gone — a dissolving ghost of a toast. (The faintness is the live-measured mid-exit state: 22.8% opacity mid-fade — the blend verified by pixels.)`,
  },
  {
    id: "295 (the stacked pair — two toasts, the gap-8 column)",
    file: "docs/screenshots/295-toast-stack-pair.png",
    desc: `A crop of a webpage's lower-right corner with a plain near-white background and a few small dark page-text fragments: TWO identical dark charcoal rounded-rectangle toast notifications stacked vertically — the same orange check icon and the same white "Wireless Noise-Cancelling Headphones added to cart!" text in each, both fully opaque, separated by a small gap of about 8 pixels. The lower toast sits about 25px from the crop's right and bottom edges.`,
  },
];

for (const s of shots) {
  const b64 = readFileSync(s.file).toString("base64");
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: ${s.desc}`,
          },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  const answer = (res.choices[0]?.message?.content ?? "").trim();
  console.log(`${/^PASS/i.test(answer) ? "PASS" : "FAIL"}  ${s.id}  —  ${answer.slice(0, 170).replace(/\n/g, " ")}`);
}
