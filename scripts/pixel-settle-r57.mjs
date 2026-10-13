// Round-57 pixel settlement for capture 300 (the back link's focus ring):
// the VLM disputes the 1px orange ring (its perceptual floor — the r55
// zoom-instrument precedent). Measure the ring band directly: the probe
// read the live box-shadow as rgb(230,107,26) 0px 0px 0px 1px; the ring
// draws 1px OUTSIDE the button's 1px gray border. Sample the bands
// straddling each bbox edge and count ORANGE-hue pixels vs the control
// (296: the same button unfocused).
// Run: node scripts/pixel-settle-r57.mjs
import { readFileSync } from "node:fs";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";

const img = PNG.sync.read(readFileSync("docs/screenshots/300-orderdetail-backlink-focus-ring.png"));
const W = img.width, H = img.height;
const at = (img2, W2, x, y) => {
  const i = (y * W2 + x) * 4;
  return [img2.data[i], img2.data[i + 1], img2.data[i + 2]];
};
const isOrange = (p) => p[0] > 180 && p[0] < 250 && p[1] > 60 && p[1] < 150 && p[2] < 80;

// The probe's bbox of the focused back button: x24 y127 w78 h32 (1x dSF).
const bx = 24, by = 127, bw = 78, bh = 32;
console.log(`image ${W}x${H}; button bbox ${bx},${by} ${bw}x${bh}`);

function bandCount(img2, W2, H2, edge, baseX, baseY) {
  let orange = 0, total = 0;
  const samples = [];
  for (let k = -3; k <= 3; k++) {
    for (let t = 0; t < bw; t++) {
      let x, y;
      if (edge === "top") { x = baseX + t; y = baseY + k; }
      else if (edge === "bottom") { x = baseX + t; y = baseY + bh - 1 + k; }
      else if (edge === "left") { x = baseX + k; y = baseY + t; }
      else { x = baseX + bw - 1 + k; y = baseY + t; }
      if (x < 0 || y < 0 || x >= W2 || y >= H2) continue;
      const p = at(img2, W2, x, y);
      total++;
      if (isOrange(p)) { orange++; if (samples.length < 4) samples.push([x, y, p]); }
    }
  }
  return { edge, orange, total, samples };
}

for (const edge of ["top", "bottom", "left", "right"]) {
  const r = bandCount(img, W, H, edge, bx, by);
  console.log(`${r.edge}: ${r.orange}/${r.total} orange-band pixels ${r.samples.map((s) => `(${s[0]},${s[1]})=rgb(${s[2]})`).join(" ")}`);
}

// The control: 296's top band (the same button, unfocused — no ring).
const ctl = PNG.sync.read(readFileSync("docs/screenshots/296-orderdetail-001-desktop-full-read-surface.png"));
const c = bandCount(ctl, ctl.width, ctl.height, "top", bx, by);
console.log(`control 296 top band: ${c.orange}/${c.total} orange pixels (the same button, no focus ring)`);
console.log("== settle complete ==");
