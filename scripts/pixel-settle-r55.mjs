// Round-55 pixel settlement for 289 (the r52/r53/r54 convention: a VLM
// dispute settles by pixel measurement, and the fair-instrument step is a
// 3x-enlarged crop from the EXISTING capture before the settlement).
// The capture's clip was x=864 y=10 w=180 h=100; the probe measured the bag
// button at 924,42 36x36 and the badge at 952,38 16x16 — in IMAGE space:
// bag (60,32)-(96,68), badge (88,28)-(104,44) — an 8x12px corner overlap.
// This script (1) measures the orange pill's actual bbox in the PNG and
// checks the overlap against the bag's box, (2) writes a 3x nearest-neighbor
// zoom of the bag area for the VLM re-verify.
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/screenshots/289-headericons-bag-badge-superset.png";
const ZOOM = "docs/screenshots/289b-headericons-bag-badge-zoom3x.png";
const png = PNG.sync.read(readFileSync(SRC));
const { width: W, height: H, data } = png;

// 1) the orange pill's bbox: pixels within tolerance of rgb(230,107,26).
// EXCLUDE the announcement bar's orange strip: the capture's clip starts at
// page y=10, inside the 28px bar — the bar's orange fills image rows 0..17.
// Scan only y >= 20 (below the bar, inside the header row).
let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, count = 0;
for (let y = 20; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (Math.abs(r - 230) <= 14 && Math.abs(g - 107) <= 14 && Math.abs(b - 26) <= 14) {
      count++; if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
console.log(`orange pixels: ${count}, bbox: (${minX},${minY})-(${maxX},${maxY}) [${maxX - minX + 1}x${maxY - minY + 1}]`);

// the bag button's box in image space (from the clip + the probe geometry)
const bag = { x0: 60, y0: 32, x1: 96, y1: 68 }; // 924-864, 42-10 .. 960-864, 78-10
const overlapX0 = Math.max(minX, bag.x0), overlapX1 = Math.min(maxX, bag.x1);
const overlapY0 = Math.max(minY, bag.y0), overlapY1 = Math.min(maxY, bag.y1);
const overlapW = overlapX1 - overlapX0 + 1, overlapH = overlapY1 - overlapY0 + 1;
console.log(`bag box: (${bag.x0},${bag.y0})-(${bag.x1},${bag.y1})`);
console.log(`overlap region: ${overlapW}x${overlapH}px ${overlapW > 0 && overlapH > 0 ? "(THE BADGE OVERLAPS THE BUTTON'S TOP-RIGHT CORNER)" : "(NO OVERLAP)"}`);
const beyondR = maxX - bag.x1, beyondT = bag.y0 - minY;
console.log(`badge extends ${Math.max(0, beyondR)}px RIGHT of the button's right edge and ${Math.max(0, beyondT)}px ABOVE its top edge (the -top-1 -right-2 offsets: expect ~8 right, ~4 up)`);

// 2) the 3x nearest-neighbor zoom of the bag area (the r54 fair instrument)
const zx0 = 40, zy0 = 8, zw = 120, zh = 90, S = 3;
const zoom = new PNG({ width: zw * S, height: zh * S });
for (let y = 0; y < zh * S; y++) {
  for (let x = 0; x < zw * S; x++) {
    const si = ((zy0 + Math.floor(y / S)) * W + (zx0 + Math.floor(x / S))) * 4;
    const di = (y * zw * S + x) * 4;
    zoom.data[di] = data[si]; zoom.data[di + 1] = data[si + 1];
    zoom.data[di + 2] = data[si + 2]; zoom.data[di + 3] = data[si + 3];
  }
}
writeFileSync(ZOOM, PNG.sync.write(zoom));
console.log(`3x zoom written: ${ZOOM} (${zw * S}x${zh * S})`);
