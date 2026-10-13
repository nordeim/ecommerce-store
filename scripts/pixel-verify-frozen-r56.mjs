// Round-56 pixel verification of the FROZEN captures: sample INSIDE the
// toast boxes (the probed geometry maps page coords to crop coords) and
// verify the blend matches the probed opacity. The r54 discipline: the
// pixels carry the truth the VLM's perceptual floor can't.
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync } from "node:fs";

const shots = [
  // 292: frozen at o=0.615, the toast page (683,688)-(997,751); crop origin (624,600)
  { file: "docs/screenshots/292-toast-mid-enter-from-pose.png", crop: [624, 600], box: [683, 688, 997, 751], expectO: 0.615 },
  // 294: frozen at o=0.181, the toast page (687,673)-(994,734); crop origin (624,580)
  { file: "docs/screenshots/294-toast-mid-exit-fade.png", crop: [624, 580], box: [687, 673, 994, 734], expectO: 0.181 },
];

for (const s of shots) {
  const png = PNG.sync.read(readFileSync(s.file));
  const { width: W, data } = png;
  const [cx, cy] = s.crop;
  const [x0, y0, x1, y1] = s.box;
  // sample a horizontal band inside the box, above the text line
  const bandY = Math.round(y0 - cy + (y1 - y0) * 0.3);
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let px = x0 - cx + 30; px <= x1 - cx - 30; px++) {
    const i = (bandY * W + px) * 4;
    sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; n++;
  }
  const mean = [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];
  const boxC = [23, 23, 28], bgC = [251, 250, 249];
  const alpha = +(((bgC[0] - mean[0]) / (bgC[0] - boxC[0])) * 100).toFixed(1);
  const expected = +(s.expectO * 100).toFixed(1);
  const ok = Math.abs(alpha - expected) <= 12; // the band includes some sub-pixel AA + the shadow's edge
  console.log(`${s.file.split("/").pop()}: band mean rgb(${mean}) -> measured opacity ${alpha}% (probed ${expected}%) -> ${ok ? "MATCH" : "DIVERGENT"}`);
}
