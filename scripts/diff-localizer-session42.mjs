// Round-42 pixel-diff localizer: divides the saved sweep screenshots into a
// 4x4 grid and reports differing-pixel density per cell — localizes whether
// the pdp/login drift is image-area, text-area, or background.
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync } from "node:fs";

const cells = (aPath, bPath) => {
  const A = PNG.sync.read(readFileSync(aPath));
  const B = PNG.sync.read(readFileSync(bPath));
  if (A.width !== B.width || A.height !== B.height) return "size mismatch";
  const G = 4; // grid
  const cw = Math.floor(A.width / G), ch = Math.floor(A.height / G);
  const grid = Array.from({ length: G }, () => Array(G).fill(0));
  const cellTotals = Array.from({ length: G }, () => Array(G).fill(0));
  for (let y = 0; y < A.height; y++) {
    const gy = Math.min(G - 1, Math.floor(y / ch));
    for (let x = 0; x < A.width; x++) {
      const gx = Math.min(G - 1, Math.floor(x / cw));
      cellTotals[gy][gx]++;
      const i = (y * A.width + x) * 4;
      if (Math.abs(A.data[i] - B.data[i]) > 16 || Math.abs(A.data[i+1] - B.data[i+1]) > 16 ||
          Math.abs(A.data[i+2] - B.data[i+2]) > 16 || Math.abs(A.data[i+3] - B.data[i+3]) > 16) grid[gy][gx]++;
    }
  }
  return grid.map((row, gy) => row.map((n, gx) => (n / cellTotals[gy][gx]) * 100 >= 1 ? String(Math.round((n / cellTotals[gy][gx]) * 100)).padStart(3) + "%" : "  ·").join(" ")).join("\n");
};

for (const name of ["pdp", "login", "home"]) {
  console.log(`=== ${name} (4x4 grid, cell % differing; · = <1%) ===`);
  console.log(cells(`/tmp/sweep42/${name}-ref.png`, `/tmp/sweep42/${name}-clone.png`));
  console.log("");
}
