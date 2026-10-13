// Round-55 VLM re-verify of 289 via the 3x zoom instrument (the r54
// fair-instrument lesson: the badge is a 16px element — below the VLM's
// perceptual floor at the original 180x100 crop; the zoom is built from the
// EXISTING capture, no re-run) + the pixel settlement as the standing record:
// the orange pill bbox (88,29)-(102,42) overlaps the bag button's box
// (60,32)-(96,68) by 9x11px — ON the top-right corner.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const b64 = readFileSync("docs/screenshots/289b-headericons-bag-badge-zoom3x.png").toString("base64");
const res = await zai.chat.completions.createVision({
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: A 3x-enlarged close-up of a shopping-bag icon on a warm-white website header. A dark charcoal shopping-bag glyph (a bag shape with handles) sits centered, and at its UPPER-RIGHT — clearly offset up and to the right of the bag glyph, not covering the glyph itself — a small solid ORANGE rounded pill (a cart-count badge) carries a single small white digit '1' centered inside it. The pill floats at the upper-right of the bag glyph, partially above the glyph's top edge and partially to the right of it.`,
        },
        { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
      ],
    },
  ],
});
const answer = (res.choices[0]?.message?.content ?? "").trim();
console.log(`${/^PASS/i.test(answer) ? "PASS" : "FAIL"}  289b (zoom instrument)  —  ${answer.slice(0, 160).replace(/\n/g, " ")}`);
