// Round-54 VLM dispute settlement by pixel measurement (the r52/r53
// convention): re-runs the page with the SAME clip math as the capture,
// hovers, and measures the ACTUAL text-pixel brightness of the hovered link
// vs its neighbors inside the saved PNGs — plus recaptures 283 with the
// FULL bottom row (the copyright included — the description-error fix).
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";
import { PNG } from "/home/z/node_modules/pngjs/lib/png.js";
import { readFileSync } from "node:fs";

const PROD_PORT = 3001;
const PROD = `http://localhost:${PROD_PORT}`;
const OUT = "docs/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  } catch {}
};

// Sample the brightest text pixels in a region (glyph cores, ignoring the
// dark background): returns the 95th-percentile luminance + the mean of the
// top decile — the antialiasing-robust "how bright is the text" read.
function textBrightness(png, x0, y0, x1, y1) {
  const lums = [];
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(png.height, Math.ceil(y1)); y++) {
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(png.width, Math.ceil(x1)); x++) {
      const i = (png.width * y + x) << 2;
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
      lums.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
  }
  lums.sort((a, b) => a - b);
  if (!lums.length) return null;
  const p95 = lums[Math.floor(lums.length * 0.95)];
  const top10 = lums.slice(Math.floor(lums.length * 0.9));
  const meanTop = top10.reduce((s, v) => s + v, 0) / top10.length;
  return { p95: Math.round(p95), meanTop: Math.round(meanTop) };
}

killPort(PROD_PORT);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "settle-r54-secret" },
  stdio: "ignore",
});
let up = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {}
  if (up) break; await sleep(1000);
}
if (!up) { console.error("standalone never came up"); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(2600);

// ---- 282 settlement: the Shop link hovered, same clip math as the capture.
const footer = page.getByRole("contentinfo");
await footer.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const shopLink = page.getByRole("contentinfo").getByRole("link", { name: "All Products" });
await shopLink.hover();
await page.waitForTimeout(450);
const live282 = await page.evaluate(() => {
  const f = document.querySelector("footer");
  const all = [...f.querySelectorAll("a")].find((a) => a.textContent.trim() === "All Products");
  const elec = [...f.querySelectorAll("a")].find((a) => a.textContent.trim() === "Electronics");
  return {
    all: { box: all.getBoundingClientRect().toJSON(), color: getComputedStyle(all).color },
    elec: { box: elec.getBoundingClientRect().toJSON(), color: getComputedStyle(elec).color },
  };
});
console.log("[282 live] all=", live282.all.color, "elec=", live282.elec.color);
const sbox = live282.all.box;
const clip282 = { x: Math.max(0, sbox.x - 120), y: Math.max(0, sbox.y - 90), width: 420, height: 260 };
const shot282 = await page.screenshot({ path: `${OUT}/282-shop-link-hovered.png`, clip: clip282 });
const png282 = PNG.sync.read(readFileSync(`${OUT}/282-shop-link-hovered.png`));
// the link's box inside the clip:
const allIn = { x: sbox.x - clip282.x, y: sbox.y - clip282.y, w: sbox.width, h: sbox.height };
const elecIn = { x: live282.elec.box.x - clip282.x, y: live282.elec.box.y - clip282.y, w: live282.elec.box.width, h: live282.elec.box.height };
const bAll = textBrightness(png282, allIn.x, allIn.y, allIn.x + allIn.w, allIn.y + allIn.h);
const bElec = textBrightness(png282, elecIn.x, elecIn.y, elecIn.x + elecIn.w, elecIn.y + elecIn.h);
console.log(`[282 pixels] hovered 'All Products': p95=${bAll.p95} meanTop=${bAll.meanTop} | resting 'Electronics': p95=${bElec.p95} meanTop=${bElec.meanTop}`);
console.log(`[282 verdict] hovered is ${bAll.p95 - bElec.p95 > 30 ? "CLEARLY BRIGHTER (p95 delta " + (bAll.p95 - bElec.p95) + ")" : "not clearly brighter (delta " + (bAll.p95 - bElec.p95) + ")"}`);
await page.mouse.move(4, 4);
await sleep(350);

// ---- 283 recapture + settlement: the FULL bottom row (copyright included)
// so the description matches the crop; measure Privacy (hovered /60) vs
// Terms (resting /40) vs the Shop link hovered full (282's 251 reference).
const privacy = page.getByRole("contentinfo").getByText("Privacy Policy", { exact: true });
await privacy.scrollIntoViewIfNeeded();
await privacy.hover();
await page.waitForTimeout(450);
const live283 = await page.evaluate(() => {
  const f = document.querySelector("footer");
  const row = [...f.querySelectorAll("div")].filter((d) => getComputedStyle(d).display.includes("flex") && d.textContent.includes("©")).pop();
  const privacy = [...f.querySelectorAll("span")].find((s) => s.textContent.trim() === "Privacy Policy");
  const terms = [...f.querySelectorAll("span")].find((s) => s.textContent.trim() === "Terms of Service");
  const copy = [...f.querySelectorAll("p")].find((p) => p.textContent.includes("©"));
  return {
    rowBox: row.getBoundingClientRect().toJSON(),
    privacy: { box: privacy.getBoundingClientRect().toJSON(), color: getComputedStyle(privacy).color },
    terms: { box: terms.getBoundingClientRect().toJSON(), color: getComputedStyle(terms).color },
    copy: { box: copy.getBoundingClientRect().toJSON(), color: getComputedStyle(copy).color },
  };
});
console.log("[283 live] privacy(hovered)=", live283.privacy.color, " terms(resting)=", live283.terms.color);
const rb = live283.rowBox;
const clip283 = { x: 0, y: Math.max(0, rb.y - 50), width: 1280, height: Math.min(160, rb.height + 100) };
await page.screenshot({ path: `${OUT}/283-policy-hover-target-60.png`, clip: clip283 });
const png283 = PNG.sync.read(readFileSync(`${OUT}/283-policy-hover-target-60.png`));
const prIn = { x: live283.privacy.box.x - clip283.x, y: live283.privacy.box.y - clip283.y, w: live283.privacy.box.width, h: live283.privacy.box.height };
const tmIn = { x: live283.terms.box.x - clip283.x, y: live283.terms.box.y - clip283.y, w: live283.terms.box.width, h: live283.terms.box.height };
const bPr = textBrightness(png283, prIn.x, prIn.y, prIn.x + prIn.w, prIn.y + prIn.h);
const bTm = textBrightness(png283, tmIn.x, tmIn.y, tmIn.x + tmIn.w, tmIn.y + tmIn.h);
console.log(`[283 pixels] hovered Privacy(/60): p95=${bPr.p95} meanTop=${bPr.meanTop} | resting Terms(/40): p95=${bTm.p95} meanTop=${bTm.meanTop}`);
console.log(`[283 verdict] hovered is ${bPr.p95 - bTm.p95 > 20 ? "BRIGHTER than resting (delta " + (bPr.p95 - bTm.p95) + ") and ${bPr.p95 < 245 ? 'NOT full-white (p95 ' + bPr.p95 + ' < 245)' : 'AT full-white'}" : "not clearly brighter"}`);
await page.mouse.move(4, 4);

await browser.close();
killPort(PROD_PORT);
try { process.kill(prod.pid, "SIGKILL"); } catch {}
console.log("[r54 settlement + 283 recapture complete]");
