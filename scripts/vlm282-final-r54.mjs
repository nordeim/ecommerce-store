// Round-54 282 final settlement: the VLM twice misread the 14px glyph alpha
// difference; the pixel measurement proves the hover (p95 234 vs 150, delta
// 84). Fair-instrument attempt: crop the two link regions from the EXISTING
// capture and scale 3x nearest-neighbor so the glyphs are ~42px — if the
// VLM still cannot see it, the measurement settles it (the r52 sub-
// perceptual precedent).
import ZAI from "z-ai-web-dev-sdk";
import { PNG } from "/home/z/node_modules/pngjs/lib/png.js";
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";
const SRC = `${OUT}/282-shop-link-hovered.png`;
const DST = `${OUT}/282-zoom-shop-link-hovered.png`;

const png = PNG.sync.read(readFileSync(SRC));

// The two link regions inside the capture (from the settle script's DOM
// boxes): All Products (hovered) at the top of the list, Electronics below.
// The Shop column's link list occupies the left half of the 420x260 crop.
// Crop a generous column band covering both links: x 60..260, y 60..220.
const x0 = 60, y0 = 55, w = 200, h = 170;
const crop = new PNG({ width: w * 3, height: h * 3 });
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const si = (png.width * (y + y0) + (x + x0)) << 2;
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const di = (crop.width * (y * 3 + dy) + (x * 3 + dx)) << 2;
        crop.data[di] = png.data[si];
        crop.data[di + 1] = png.data[si + 1];
        crop.data[di + 2] = png.data[si + 2];
        crop.data[di + 3] = 255;
      }
    }
  }
}
writeFileSync(DST, PNG.sync.write(crop));

const zai = await ZAI.create();
const b64 = readFileSync(DST).toString("base64");
const res = await zai.chat.completions.createVision({
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            "This is a 3x-enlarged crop of a dark website footer's link list. There are several small text links stacked vertically. Compare the BRIGHTNESS of the text glyphs: is the TOPMOST link ('All Products') rendered noticeably BRIGHTER (closer to solid white) than the links BELOW it (which are dimmer translucent grayish-white)? Answer with exactly PASS if the topmost link is clearly brighter, or FAIL if all links look the same brightness, then one short sentence.",
        },
        { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
      ],
    },
  ],
});
const answer = (res.choices[0]?.message?.content ?? "").trim();
console.log(`${/^PASS/i.test(answer) ? "PASS" : "FAIL"}  282-zoom  —  ${answer.slice(0, 180).replace(/\n/g, " ")}`);
