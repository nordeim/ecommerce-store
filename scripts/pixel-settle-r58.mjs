// Round-58 pixel settlement for capture 302 (the X's hover tint): the VLM
// disputes the pale-peach hover fill (rgb(253,243,237) — a ~3.5% tint, at
// the VLM's perceptual floor at 1x; the r54/r55 precedent). Measure the
// X button's 36x36 region directly in 302 (hover, live per the computed
// probe: bg rgb(253,243,237), color rgb(138,64,15)) vs 301 (the control —
// the same button at rest, transparent fill over the strip's background).
// Run: node scripts/pixel-settle-r58.mjs
import { readFileSync } from "node:fs";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";

const load = (f) => PNG.sync.read(readFileSync(f));
const at = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

// The X button's bbox at 1024x768 1x: the form arithmetic (input 876 + 8 +
// Search 64 + 8) lands the X at x972, y105, 36x36 (the r58b/r58a2 probes).
const bx = 972, by = 105, bw = 36, bh = 36;
// The hover tint target: rgb(253,243,237) — classify with a tight box.
const isPeach = (p) => p[0] >= 248 && p[0] <= 255 && p[1] >= 238 && p[1] <= 248 && p[2] >= 231 && p[2] <= 242 && p[1] < p[0] - 4 && p[2] < p[1] - 3;

for (const [label, file] of [
  ["302 (hover)", "docs/screenshots/302-searchpanel-x-hover-accent.png"],
  ["301 (control)", "docs/screenshots/301-searchpanel-open-three-child-form.png"],
]) {
  const img = load(file);
  let peach = 0, total = 0, sumR = 0, sumG = 0, sumB = 0;
  for (let y = by; y < by + bh; y++) {
    for (let x = bx; x < bx + bw; x++) {
      if (x >= img.width || y >= img.height) continue;
      const p = at(img, x, y);
      total++; sumR += p[0]; sumG += p[1]; sumB += p[2];
      if (isPeach(p)) peach++;
    }
  }
  console.log(`${label}: ${peach}/${total} peach-classified pixels in the X region; mean rgb(${Math.round(sumR / total)}, ${Math.round(sumG / total)}, ${Math.round(sumB / total)})`);
}

// Also the icon color witness: the hover's accent-foreground rgb(138,64,15)
// vs the resting rgb(23,23,28) — sample the icon's central band (the X's
// strokes cross the region's center).
const isAccentInk = (p) => p[0] > 100 && p[0] < 190 && p[1] > 30 && p[1] < 100 && p[2] < 70;
const isDarkInk = (p) => p[0] < 70 && p[1] < 70 && p[2] < 70;
for (const [label, file] of [
  ["302 (hover)", "docs/screenshots/302-searchpanel-x-hover-accent.png"],
  ["301 (control)", "docs/screenshots/301-searchpanel-open-three-child-form.png"],
]) {
  const img = load(file);
  let accent = 0, dark = 0, total = 0;
  for (let y = by + 8; y < by + bh - 8; y++) {
    for (let x = bx + 8; x < bx + bw - 8; x++) {
      const p = at(img, x, y);
      total++;
      if (isAccentInk(p)) accent++;
      if (isDarkInk(p)) dark++;
    }
  }
  console.log(`${label} icon band: ${accent} accent-ink px, ${dark} dark-ink px (of ${total})`);
}
