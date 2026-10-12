// Round-52 VLM dispute settlement — the r49/r51 pattern: programmatic PIXEL
// measurement, never adjectives. Two disputes:
//   272 — the VLM saw "solid resting orange" on the HOVERED capture: is the
//         /90 tint present in the pixels? (expected ~rgb(233,122,49) over
//         white vs the resting rgb(230,107,26))
//   275 — the VLM saw "no focus ring": does the 1px orange halo render just
//         outside the ATC's edge? (compare 275 vs 271 — the resting pair)
// The browser canvas decodes its own PNGs (the r51 L55 lesson).
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";
const browser = await chromium.launch();
const page = await browser.newPage();

const decode = (file) =>
  page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/png;base64," + b64; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return { w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
  }, readFileSync(`${OUT}/${file}`).toString("base64"));

const px = (img, x, y) => {
  const i = (y * img.w + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};
const regionAvg = (img, x0, y0, x1, y1) => {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = px(img, x, y); r += p[0]; g += p[1]; b += p[2]; n++;
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
};

// ---- 272: the ATC's hovered fill vs the resting fill -----------------------
{
  const rest = await decode("271-buypanel-action-row-resting.png");
  const hov = await decode("272-buypanel-atc-hovered.png");
  console.log(`271 rest: ${rest.w}x${rest.h} · 272 hov: ${hov.w}x${hov.h}`);
  // The ATC is the row's 3rd child: stepper ~130 + gap 16 + ATC (wide) —
  // sample the ATC's CENTER region (vertically centered, mid-button).
  const cx = Math.round(rest.w * 0.55), cy = Math.round(rest.h / 2);
  const restAvg = regionAvg(rest, cx - 20, cy - 8, cx + 20, cy + 8);
  const hovAvg = regionAvg(hov, cx - 20, cy - 8, cx + 20, cy + 8);
  console.log(`  ATC center — rest: rgb(${restAvg}) · hovered: rgb(${hovAvg})`);
  // The /90 tint over white ≈ rgb(233,122,49) vs the resting rgb(230,107,26):
  // the GREEN/BLUE channels carry the signal (ΔG ≈ +16, ΔB ≈ +23).
  const dG = hovAvg[1] - restAvg[1], dB = hovAvg[2] - restAvg[2];
  console.log(`  delta G=${dG} B=${dB} — the /90 tint is ${dG > 6 && dB > 6 ? "PRESENT (lighter — the hover)" : "ABSENT"}`);
}

// ---- 275: the 1px ring outside the ATC's edge ------------------------------
{
  const rest = await decode("271-buypanel-action-row-resting.png");
  const focus = await decode("275-buypanel-atc-focused-ring.png");
  // The ATC's RIGHT edge: walk from the right side of the image leftward to
  // find the orange field's edge on both captures; the focused capture should
  // carry ONE extra orange-ish column (the 1px halo) before the background.
  const cy = Math.round(rest.h / 2);
  const findOrangeEdge = (img) => {
    for (let x = img.w - 1; x > Math.round(img.w * 0.4); x--) {
      const [r, g, b] = px(img, x, cy);
      if (r > 180 && g > 60 && g < 160 && b < 90) return x; // the orange field
    }
    return -1;
  };
  const restEdge = findOrangeEdge(rest);
  const focusEdge = findOrangeEdge(focus);
  // just OUTSIDE each edge: the background pixel
  const restOut = px(rest, restEdge + 2, cy);
  const focusOut = px(focus, focusEdge + 2, cy);
  const focusRing = px(focus, focusEdge + 1, cy);
  console.log(`  ATC right edge — rest: x=${restEdge}, outside rgb(${restOut}) · focus: x=${focusEdge}, ring px rgb(${focusRing}), outside rgb(${focusOut})`);
  // The ring: a 1px orange line OUTSIDE the button edge — in the focused
  // capture the pixel just beyond the edge should be orange-ish (not the
  // plain background), OR the edge extends 1px further right.
  const ringCol = focusRing[0] > 150 && focusRing[2] < 120;
  const edgeExtends = focusEdge > restEdge;
  console.log(`  ring column orange: ${ringCol} · edge extends: ${edgeExtends} (${focusEdge} vs ${restEdge})`);
  console.log(`  the 1px ring is ${ringCol || edgeExtends ? "PRESENT (rendered in the capture)" : "NOT VISIBLE in the pixels"}`);
}

await browser.close();
console.log("\nSETTLEMENT COMPLETE");
