// Round-59 pixel settlements (the r54/r55/r58 discipline; the r51 canvas
// decode form — pixels over adjectives): the VLM disputes on 308 (the
// toast's fixed bottom-right placement — it visually overlaps the footer
// region at this scroll position) and 310 (the "visible Add button" claim —
// the engine-revealed addbar paints a wide orange band across the card's
// photo bottom). The DOM probes are the ground truth; this measures the
// PNGs to reconcile the VLM's phrasing.
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = "docs/screenshots";

const decode = async (path) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<canvas></canvas>");
  const data = readFileSync(path).toString("base64");
  const img = await page.evaluate(async (src) => {
    const c = document.querySelector("canvas");
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = s; });
    const im = await load(src);
    c.width = im.width; c.height = im.height;
    c.getContext("2d").drawImage(im, 0, 0);
    return { w: im.width, h: im.height, data: c.getContext("2d").getImageData(0, 0, im.width, im.height).data };
  }, "data:image/png;base64," + data);
  await browser.close();
  return img;
};

// [308] the toast: a dark box (rgb(23,23,28)) at the viewport's bottom-right
const img308 = await decode(`${OUT}/308-quickadd-click-toast-badge.png`);
const count = (img, x0, y0, x1, y1, fn) => {
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (img.w * y + x) * 4;
      if (fn(img.data[i], img.data[i + 1], img.data[i + 2])) n++;
    }
  }
  return n;
};
const isDark = (r, g, b) => r > 15 && r < 45 && g > 15 && g < 45 && b > 20 && b < 50;
const isOrange = (r, g, b) => r > 200 && g > 80 && g < 130 && b < 60;
const toastRegion = count(img308, 680, 620, 1024, 768, isDark);
const toastControl = count(img308, 680, 400, 1024, 480, isDark);
console.log("[308] toast-region dark pixels:", toastRegion, " control:", toastControl);
console.log("[308] verdict:", toastRegion > 3000 && toastControl < 100 ? "TOAST PRESENT (dark box bottom-right)" : "CHECK");

// [310] the addbar: if revealed, a WIDE orange band sits across the LEFT
// card's photo bottom; at rest (306 control) near-zero orange rows there.
const img310 = await decode(`${OUT}/310-add-focus-ring.png`);
const img306 = await decode(`${OUT}/306-related-section-resting.png`);
const orangeRows = (img, x0, x1) => {
  const rows = [];
  for (let y = 0; y < img.h; y++) {
    const n = count(img, x0, y, x1, y + 1, isOrange);
    if (n > 60) rows.push(y + ":" + n);
  }
  return rows;
};
const r310 = orangeRows(img310, 16, 240);
const r306 = orangeRows(img306, 16, 240);
console.log("[310] orange-band rows (left-card column):", r310.length, JSON.stringify(r310.slice(28)));
console.log("[306] orange-band rows (the resting control):", r306.length);
console.log("[310] verdict:", r310.length > r306.length + 20 ? "ADDBAR REVEALED (the engine's focus adjustment — the capture's truth)" : "addbar hidden");
console.log("PIXEL SETTLEMENTS COMPLETE");
