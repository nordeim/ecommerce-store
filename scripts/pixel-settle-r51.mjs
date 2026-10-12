// Pixel-settlement diagnostic for the two VLM disputes (the r49 pattern —
// pixels over adjectives):
//   266: is the orange Add-to-Cart bar's row-range INSIDE the photo's
//        row-range (overlaid on the photo, per the DOM probe: wrap =
//        absolute bottom-0 within the image link, translate 0px revealed)?
//   270: does the sticky-header band show row-wise color VARIATION (the
//        80%-opacity cream over varied hero content = a frosted wash) vs a
//        flat solid (zero variation)?
// The DOM probes (capture-round51.mjs + recapture-270-r51.mjs) are the
// ground truth; this measures the PNGs to reconcile the VLM's phrasing.
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

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

// ---- 266: the orange bar's rows vs the photo's rows ----
{
  const img = await decode(`${OUT}/266-hovered-card-full-contract.png`);
  const { w, h, data } = img;
  const rowInfo = [];
  for (let y = 0; y < h; y++) {
    let orange = 0, white = 0, photo = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (r > 200 && g > 80 && g < 150 && b < 60) orange++; // primary rgb(230,107,26)
      else if (r > 245 && g > 245 && b > 245) white++;
      else photo++;
    }
    rowInfo.push({ y, orange, white, photo });
  }
  const orangeRows = rowInfo.filter((r) => r.orange > w * 0.5).map((r) => r.y);
  // the photo zone: rows with substantial non-white, non-orange content
  const photoRows = rowInfo.filter((r) => r.photo > w * 0.5).map((r) => r.y);
  const barTop = Math.min(...orangeRows), barBottom = Math.max(...orangeRows);
  const photoTop = Math.min(...photoRows), photoBottom = Math.max(...photoRows);
  console.log("[266] image " + w + "x" + h);
  console.log(`  orange-bar rows: ${barTop}..${barBottom} (${orangeRows.length} rows)`);
  console.log(`  photo rows (majority non-white): ${photoTop}..${photoBottom} (${photoRows.length} rows)`);
  console.log(`  white-info rows below: ${photoBottom + 1}..${h - 1}`);
  const overlaid = barTop >= photoTop && barBottom <= photoBottom;
  console.log(`  VERDICT: the bar ${overlaid ? "IS overlaid INSIDE the photo's row-range (bottom-0 of the image container)" : "is OUTSIDE the photo range"} — barTop ${barTop} vs photoTop ${photoTop}, barBottom ${barBottom} vs photoBottom ${photoBottom}`);
}

// ---- 270: the header band's row-wise variation ----
{
  const img = await decode(`${OUT}/270-sticky-header-blur-xl.png`);
  const { w, h, data } = img;
  // the header band: find the last row carrying the border line — assume
  // the top ~90px (announcement bar ~32px + header ~64px at this crop the
  // announcement may be above the clip; measure the first 200 rows' variance)
  const bandStats = [];
  for (let y = 0; y < Math.min(h, 160); y++) {
    let sum = [0, 0, 0], n = 0;
    const samples = [];
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
      sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2]; n++;
    }
    const mean = sum.map((s) => s / n);
    let varSum = 0;
    for (const s of samples) varSum += (s[0] - mean[0]) ** 2 + (s[1] - mean[1]) ** 2 + (s[2] - mean[2]) ** 2;
    const stddev = Math.sqrt(varSum / (samples.length * 3));
    bandStats.push({ y, mean: mean.map((m) => Math.round(m)), stddev: Math.round(stddev * 10) / 10 });
  }
  // report the per-row stddev profile: a FLAT solid band = stddev ~0 on
  // rows away from text/logo; a frosted wash over varied content = stddev > 2
  const zeroRows = bandStats.filter((r) => r.stddev < 1.0).length;
  const variedRows = bandStats.filter((r) => r.stddev >= 2.0).length;
  console.log("[270] image " + w + "x" + h);
  console.log(`  rows 0..159: ${zeroRows} near-flat (stddev<1), ${variedRows} varied (stddev>=2)`);
  // sample a few rows across the band
  for (const y of [10, 40, 70, 100, 130]) {
    if (bandStats[y]) console.log(`  row ${y}: mean rgb(${bandStats[y].mean.join(",")}) stddev ${bandStats[y].stddev}`);
  }
  console.log(`  VERDICT: the band is ${variedRows > zeroRows ? "VARIED (a frosted wash over content — not flat)" : "mostly flat"}`);
}
