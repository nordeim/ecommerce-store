// Round-51 pixel cross-diff: two PNG files decoded + diffed in a real
// browser canvas (the r48 lesson — engine-serialized values differ in
// SPELLING; the pixel pipeline is the honest comparison; and playwright's
// bundled PNG.sync.read chokes on some element screenshots, so the browser
// itself does the decoding).
// Usage: node scripts/pix-diff-r51.mjs <a.png> <b.png> [label]
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const [aPath, bPath, label] = process.argv.slice(2);
const a = "data:image/png;base64," + readFileSync(aPath).toString("base64");
const b = "data:image/png;base64," + readFileSync(bPath).toString("base64");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<canvas></canvas><canvas></canvas>");
const result = await page.evaluate(async ([aSrc, bSrc]) => {
  const load = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("decode failed"));
    img.src = src;
  });
  const [ai, bi] = await Promise.all([load(aSrc), load(bSrc)]);
  const w = Math.min(ai.width, bi.width), h = Math.min(ai.height, bi.height);
  const sizeNote = ai.width === bi.width && ai.height === bi.height ? "same-size" : `size-mismatch ${ai.width}x${ai.height} vs ${bi.width}x${bi.height} (cropped to ${w}x${h})`;
  const canvases = document.querySelectorAll("canvas");
  for (const [c, img] of [[canvases[0], ai], [canvases[1], bi]]) {
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0);
  }
  const A = canvases[0].getContext("2d").getImageData(0, 0, w, h).data;
  const B = canvases[1].getContext("2d").getImageData(0, 0, w, h).data;
  let diff = 0;
  let maxDelta = 0;
  for (let i = 0; i < A.length; i += 4) {
    const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]));
    if (d > 12) diff++;
    if (d > maxDelta) maxDelta = d;
  }
  return { sizeNote, w, h, diff, total: w * h, pct: ((100 * diff) / (w * h)).toFixed(3), maxDelta };
}, [a, b]);

await browser.close();
console.log(`[${label || "diff"}] ${result.sizeNote}`);
console.log(`  differing pixels: ${result.diff}/${result.total} (${result.pct}%) · max channel delta ${result.maxDelta}`);
