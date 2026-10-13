// Round-56 pixel settlement for the disputed captures: measure what the
// PNGs actually contain. (1) 291: where does the dark toast box sit inside
// the crop (the VLM claimed "lower-left")? (2) 292/294: is the toast
// translucent (the mid-animation claim) or fully opaque (the VLM's read)?
// The r54 discipline: settle by pixels.
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync } from "node:fs";

const analyze = (file) => {
  const png = PNG.sync.read(readFileSync(file));
  const { width: W, height: H, data } = png;
  // the dark toast: rgb(23,23,28) at full opacity; translucent at o<1
  // blends toward the page bg rgb(251,250,249). Find pixels that are
  // "darkish" (all channels < 200) and compute their bbox + the mean color
  // of the box's core.
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, darkCount = 0;
  let sumR = 0, sumG = 0, sumB = 0, coreCount = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (r < 120 && g < 120 && b < 130) {
        darkCount++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      // the core: inside the bbox, away from the icon/text
      if (r < 235 && g < 235 && b < 240 && r > 20) {
        // blend of dark box + bg — only count the box interior rows
      }
    }
  }
  // sample the mean color in the box's middle band (the padding area above
  // the text baseline — the pure blended box color)
  const cy = Math.round((minY + maxY) / 2);
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let x = minX + 8; x <= maxX - 8; x++) {
    const i = (cy * W + x) * 4;
    sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; n++;
  }
  const mean = n ? [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)] : null;
  // the alpha: the blend ratio vs the pure box (23,23,28) and bg (251,250,249)
  let alpha = null;
  if (mean) {
    alpha = +(((251 - mean[0]) / (251 - 23)) * 100).toFixed(1);
  }
  console.log(`${file.split("/").pop()}: ${W}x${H}, dark bbox (${minX},${minY})-(${maxX},${maxY}) [${maxX - minX + 1}x${maxY - minY + 1}], dark px ${darkCount}, mid-band mean rgb(${mean}), ~opacity ${alpha}%`);
};

for (const f of [
  "docs/screenshots/291-toast-rest-anatomy.png",
  "docs/screenshots/292-toast-mid-enter-from-pose.png",
  "docs/screenshots/293-toast-rest-corner-geometry.png",
  "docs/screenshots/294-toast-mid-exit-fade.png",
  "docs/screenshots/295-toast-stack-pair.png",
]) {
  analyze(f);
}
