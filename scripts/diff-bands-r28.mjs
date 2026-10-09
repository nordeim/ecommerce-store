// Diff-band localization: compares the sweep's home-ref.png vs
// home-clone.png and reports the horizontal row bands where pixels differ
// (row-granularity with the per-channel tolerance from the sweep).
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync } from "node:fs";

const A = PNG.sync.read(readFileSync("/tmp/sweep28/home-ref.png"));
const B = PNG.sync.read(readFileSync("/tmp/sweep28/home-clone.png"));

const w = Math.min(A.width, B.width);
const h = Math.min(A.height, B.height);
const tol = 10; // per-channel, the sweep convention

const rowDiff = new Array(h).fill(0);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * A.width + x) * 4;
    const j = (y * B.width + x) * 4;
    if (
      Math.abs(A.data[i] - B.data[j]) > tol ||
      Math.abs(A.data[i + 1] - B.data[j + 1]) > tol ||
      Math.abs(A.data[i + 2] - B.data[j + 2]) > tol
    ) {
      rowDiff[y]++;
    }
  }
}

// Report contiguous bands where >20 differing px per row.
const bands = [];
let start = -1;
for (let y = 0; y < h; y++) {
  const diff = rowDiff[y] > 20;
  if (diff && start === -1) start = y;
  if ((!diff || y === h - 1) && start !== -1) {
    const end = diff ? y : y - 1;
    let max = 0;
    for (let k = start; k <= end; k++) max = Math.max(max, rowDiff[k]);
    bands.push({ from: start, to: end, heightPx: end - start + 1, maxRowDiff: max });
    start = -1;
  }
}
console.log(`image ${A.width}x${A.height} vs ${B.width}x${B.height}`);
console.log("diff bands (y-ranges):");
bands.forEach((b) => console.log(`  rows ${b.from}-${b.to} (${b.heightPx}px tall, max ${b.maxRowDiff} px/row)`));
