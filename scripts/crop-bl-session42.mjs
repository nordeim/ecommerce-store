// Round-42: crop the bottom-left 256x192 region (grid cell 4,1) from the
// saved sweep screenshots for visual inspection.
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync, writeFileSync } from "node:fs";

const crop = (src, dst, x0, y0, w, h) => {
  const img = PNG.sync.read(readFileSync(src));
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((y0 + y) * img.width + (x0 + x)) * 4;
      const di = (y * w + x) * 4;
      out.data[di] = img.data[si]; out.data[di+1] = img.data[si+1];
      out.data[di+2] = img.data[si+2]; out.data[di+3] = img.data[si+3];
    }
  }
  writeFileSync(dst, PNG.sync.write(out));
  console.log("wrote", dst);
};

// viewport 1024x768 -> cell (row3,col0) = x 0..255, y 576..767 (crop 2x for visibility)
for (const name of ["login", "pdp", "home"]) {
  crop(`/tmp/sweep42/${name}-ref.png`, `/tmp/sweep42/${name}-ref-bl.png`, 0, 576, 256, 192);
  crop(`/tmp/sweep42/${name}-clone.png`, `/tmp/sweep42/${name}-clone-bl.png`, 0, 576, 256, 192);
}
