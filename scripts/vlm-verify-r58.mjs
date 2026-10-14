// Round-58 VLM verification of captures 301-305 (the r53-r57 discipline:
// describe the surface as it IS — every description names DOM-probed facts
// only; sub-perceptual disputes settle by pixel measurement). The
// descriptions carry the live probe records: the three-child form (input
// 876 + Search 64x32 sm + X 36x36), the X hover accent pair, the mid-exit
// collapse (h 26, op 0.42), the settled focus state, the unclipped popover.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();

const shots = [
  {
    id: "301 (the search panel OPEN — the three-child form)",
    file: "docs/screenshots/301-searchpanel-open-three-child-form.png",
    desc: `A desktop-viewport screenshot of an e-commerce home page on a warm-white background. Below the dark sticky site header (logo "LUXE", nav links, small icon buttons) sits a NEWLY OPENED search strip: a thin horizontal divider line directly under the header, then a white search row containing a wide rounded-rectangle TEXT INPUT with a faint border and gray placeholder text "Search products...", followed on the right by a SMALL solid ORANGE rounded button reading "Search" in small white text (the button is compact, about twice as tall as the input is wide is FALSE — it is SMALLER than the input, roughly 64x32 pixels), and then a small SQUARE TRANSPARENT icon button with a thin X (close) icon in dark gray (about 36x36, no background fill). The hero banner with a large product image and headline sits below the search strip. The input shows a subtle orange focus ring (it is the auto-focused element).`,
  },
  {
    id: "302 (the X's hover — the accent pair)",
    file: "docs/screenshots/302-searchpanel-x-hover-accent.png",
    desc: `A desktop-viewport screenshot of the same e-commerce home page with the search strip open under the header: the wide bordered text input with placeholder "Search products...", the small solid ORANGE "Search" button, and the small square X close icon button on the far right — the X button is in its HOVER state: its background is a PALE PEACH/TINTED FILL (a very light warm orange, not pure white or transparent) and its X icon is rendered in a DARK BROWN-ORANGE color (not the neutral dark gray of the resting state). The rest of the page (hero image, headline) reads normally below.`,
  },
  {
    id: "303 (the mid-EXIT collapse)",
    file: "docs/screenshots/303-searchpanel-exit-collapse-mid.png",
    desc: `A desktop-viewport screenshot of the e-commerce home page captured ~120ms AFTER the search strip began closing: the search strip under the header is MID-COLLAPSE — the strip's white row is only a FRACTION of its full height (roughly a third to a half of the original strip height visible, vertically clipped from the bottom), the whole strip appears SEMI-TRANSPARENT / FADING (partially see-through, the content below ghosting through), and the input + buttons inside are partially cut off at the strip's bottom edge (the clipped mid-animation state, NOT a fully open panel). The hero content sits below. This is a transient animation frame, not a settled state.`,
  },
  {
    id: "304 (the settled enter — the focused input)",
    file: "docs/screenshots/304-searchpanel-settled-focus-ring.png",
    desc: `A desktop-viewport screenshot of the e-commerce home page with the search strip FULLY OPEN and SETTLED under the dark header: the thin divider line, the wide rounded text input with placeholder "Search products...", the small solid ORANGE "Search" button (about 64x32), and the square transparent X icon button — the input is the FOCUSED element and carries a thin ORANGE focus ring tightly around its rounded border (the keyboard-focus indicator). The strip is at its FULL height (no clipping, no transparency). The hero banner sits below the strip.`,
  },
  {
    id: "305 (the superset typeahead POPOVER)",
    file: "docs/screenshots/305-searchpanel-typeahead-popover.png",
    desc: `A desktop-viewport screenshot of the e-commerce home page with the search strip open and a TYPEAHEAD SUGGESTION POPOVER visible: the text input contains the typed word "serum", and directly below the search row floats a white ROUNDED-CORNER dropdown panel with a thin border and a soft shadow spanning the width of the search row, containing ONE suggestion row: a small square product thumbnail on the left (a dark cosmetic bottle image, about 40x40, rounded corners), the bold product name "Vitamin C Serum", a small gray category label "beauty" beneath the name, and the bold price "$34.99" aligned to the row's right edge. The popover renders FULLY below the strip (not clipped). The small ORANGE "Search" button and the X icon button sit in the search row above the popover.`,
  },
];

let pass = 0;
let fail = 0;
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
  const answer = res.choices[0]?.message?.content ?? "";
  const verdict = answer.trim().toUpperCase().startsWith("PASS") ? "PASS" : "FAIL";
  console.log(`${verdict} ${s.id}`);
  console.log(`     ${answer.trim().slice(0, 220).replace(/\n/g, " ")}`);
  if (verdict === "PASS") pass++;
  else fail++;
}
console.log(`\n== r58 VLM: ${pass} PASS / ${fail} FAIL of ${shots.length} ==`);
