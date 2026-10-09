// Round-26 diagnostic: locate the differing region between the ref/clone
// home captures (row profile + coarse column profile).
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync } from "node:fs";

const a = PNG.sync.read(readFileSync("/tmp/sweep26/home-ref.png"));
const b = PNG.sync.read(readFileSync("/tmp/sweep26/home-clone.png"));
console.log("ref size", a.width, a.height, "clone size", b.width, b.height);

const rowDiff = new Array(a.height).fill(0);
for (let y = 0; y < a.height; y++) {
  let c = 0;
  for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4;
    if (
      Math.abs(a.data[i] - b.data[i]) > 12 ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > 12 ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > 12
    )
      c++;
  }
  rowDiff[y] = c;
}
let firstDiff = -1,
  lastDiff = -1;
for (let y = 0; y < a.height; y++) {
  if (rowDiff[y] > 20) {
    if (firstDiff < 0) firstDiff = y;
    lastDiff = y;
  }
}
console.log("diff rows: first", firstDiff, "last", lastDiff, "of", a.height);

// Print bands of contiguous diff rows (gaps > 5px split bands)
const bands = [];
let start = -1;
for (let y = 0; y <= a.height; y++) {
  const d = y < a.height && rowDiff[y] > 20;
  if (d && start < 0) start = y;
  if (!d && start >= 0) {
    bands.push([start, y - 1]);
    start = -1;
  }
}
console.log("diff bands (y ranges):", JSON.stringify(bands));

// Sample the average color in the biggest band for both
for (const [y0, y1] of bands) {
  const mid = Math.floor((y0 + y1) / 2);
  const i = (mid * a.width + 512) * 4;
  const j = (mid * b.width + 512) * 4;
  console.log(
    `band ${y0}-${y1}: ref@(${mid},512) rgb(${a.data[i]},${a.data[i + 1]},${a.data[i + 2]})  clone@ rgb(${b.data[j]},${b.data[j + 1]},${b.data[j + 2]})`,
  );
}
