// Round-49 VLM reconciliation: the VLM described the minus in captures
// 256/257 as "disabled (dimmed/faded)" while the DOM probes measured
// opacity 1 + enabled. The icon glyphs are muted-gray on white — the VLM
// may be reading its world knowledge (steppers at qty 1 typically dim the
// minus) over the pixels. This script samples the actual rendered pixels
// of the minus and plus icon regions in the capture and compares their
// contrast: if both render at the SAME darkness, the "dimmed" claim is a
// VLM misread (the DOM ground truth stands).
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "docs/screenshots/256-pdp-stepper-qty1-minus-enabled.png";
const png = PNG.sync.read(readFileSync(file));
const { width, height, data } = png;

// scan a horizontal strip: find the stepper's bordered box (the first
// bordered row of dark pixels near the top), then measure the darkest
// pixel in the left third (minus zone) vs the right third (plus zone).
const regionMin = (x0, x1, y0, y1) => {
  let darkest = 255;
  let sum = 0;
  let n = 0;
  for (let y = y0; y < Math.min(y1, height); y++) {
    for (let x = x0; x < Math.min(x1, width); x++) {
      const i = (y * width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < darkest) darkest = lum;
      sum += lum;
      n++;
    }
  }
  return { darkest: Math.round(darkest), avg: Math.round(sum / n) };
};

// the capture is a 720x100 clip of the buy box row: stepper on the left,
// ATC center, heart right. Scan the left half for the stepper box.
// The minus icon sits in the left ~44px of the stepper; the plus in the
// right ~44px. Find the stepper's border column first (vertical dark line).
let borderXs = [];
for (let x = 0; x < width / 2; x++) {
  let darkCount = 0;
  for (let y = 10; y < Math.min(90, height); y++) {
    const i = (y * width + x) * 4;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 200) darkCount++;
  }
  if (darkCount > 30) borderXs.push(x);
}
const stepperX0 = borderXs[0] ?? 0;
const stepperX1 = borderXs[borderXs.length - 1] ?? Math.floor(width / 4);
const mid = Math.floor((stepperX0 + stepperX1) / 2);
console.log(`${file.split("/").pop()}: stepper box x=[${stepperX0}, ${stepperX1}]`);
const minusZone = regionMin(stepperX0 + 6, mid - 8, 10, 90);
const plusZone = regionMin(mid + 8, stepperX1 - 6, 10, 90);
console.log(`  minus icon zone: darkest ${minusZone.darkest}, avg ${minusZone.avg}`);
console.log(`  plus  icon zone: darkest ${plusZone.darkest}, avg ${plusZone.avg}`);
const sameContrast = Math.abs(minusZone.darkest - plusZone.darkest) <= 24;
console.log(`  verdict: ${sameContrast ? "SAME CONTRAST — the minus is NOT dimmed (the VLM misread; the DOM ground truth stands)" : "DIFFERENT CONTRAST — investigate further"}`);
