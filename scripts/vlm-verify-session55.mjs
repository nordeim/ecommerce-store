// VLM verification of the 5 new session-55 screenshots (286-290) — the
// createVision call per the session-17 lesson. Descriptions verified against
// the live DOM (scripts/capture-round55.mjs probes — the cluster at 844,42
// 156x36 with four 36x36 transparent buttons, the search hover's accent pair
// rgb(253,243,237)/rgb(138,64,15), the focused search's orange 1px ring
// (rgb(230,107,26) 0 0 0 1px, outline none), the bag badge at 952,38 16x16
// bg rgb(230,107,26) with the FIXED aria "Cart, 1 item", the mobile row's
// [menu 16/36, logo 91/88, cluster 218/156]) BEFORE this run — the standing
// lesson: describe reality, not intention; the DOM probe is the ground truth.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry; package.json + bun.lock
// are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "286-headericons-cluster-resting.png",
    expect:
      "A close-up crop of a desktop e-commerce header's TOP-RIGHT area on a warm-white/cream background: a horizontal row of FOUR square icon buttons, evenly spaced a few pixels apart — in order: a magnifier (search), a heart, a shopping bag, and a person silhouette (user). Every button is a GHOST button at rest: completely TRANSPARENT background (no fill, no border) with a small dark charcoal icon centered inside each. The icons are modest sized (smaller than the button squares). No badge, no ring, no hover tint anywhere — all four render identically plain.",
  },
  {
    file: "287-headericons-search-hovered.png",
    expect:
      "The same close-up crop of four ghost icon buttons (magnifier, heart, shopping bag, person) on a warm-white header, but the FIRST button (the magnifier/search) is in its HOVERED state: it carries a soft warm CREAM/BEIGE filled rounded square background (a very light warm tint, rgb(253,243,237)) and its magnifier icon renders in a dark warm BROWN (rgb(138,64,15)) — visibly browner than the plain dark charcoal icons of the other three buttons, which remain transparent with no fill. Only the first button is tinted; the other three are plain.",
  },
  {
    file: "288-headericons-search-focused-ring.png",
    expect:
      "The same close-up crop of four ghost icon buttons (magnifier, heart, shopping bag, person) on a warm-white header, with the FIRST button (magnifier/search) in its KEYBOARD-FOCUSED state: a thin bright ORANGE ring (about 1px, a warm orange rgb(230,107,26)) traces the button's rounded-square border, with NO background fill inside (the button stays transparent) and its icon stays plain dark charcoal. The other three buttons remain completely plain with no ring or fill.",
  },
  {
    file: "289-headericons-bag-badge-superset.png",
    expect:
      "A close-up crop of a desktop e-commerce header showing one or two icon buttons on a warm-white background: a shopping-bag ghost button (transparent, dark charcoal bag icon), and on the bag button's TOP-RIGHT corner a small solid ORANGE square-ish pill (about 16x16px, slightly rounded corners, warm orange rgb(230,107,26)) that OVERLAPS the button's top-right edge, offset slightly up and to the right, carrying a single small white digit '1' centered inside it.",
  },
  {
    file: "290-headericons-mobile-390-row.png",
    expect:
      "A MOBILE-width (390px narrow) view of an e-commerce page top: a thin orange announcement strip at the very top (may be partially cropped), below it the site header row stretched across the narrow width with THREE groups distributed left-to-right: a small hamburger-menu icon button on the LEFT edge, the 'LUXE' wordmark logo (small orange rounded icon + dark text) left-of-center, and a compact horizontal row of FOUR small icon buttons (magnifier, heart, shopping bag, person) packed together on the RIGHT side of the row. The header sits on a warm-white background with a subtle bottom border.",
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
