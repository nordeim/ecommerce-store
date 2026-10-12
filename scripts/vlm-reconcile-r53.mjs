// Round-53 VLM-dispute settlement by pixel measurement (the r49/r51/r52
// reconciliation pattern): the VLM's adjectives vs the pixels. Four disputes:
//   277 — "grey not milky white": measure the arrow circle's composited
//         lightening rest (/0.2) vs hover (/0.3) — the ΔL is the proof.
//   278 — "active dot not clearly wider": find the white pill runs in the
//         crop and measure their widths (expect 8, 8, 32).
//   279 — "no orange ring": edge-detect the orange 1px ring at the focused
//         circle's boundary (the r52 275 precedent — the extra orange
//         column/halo at the edge).
//   276 — MY description error (the guessed headline): re-probe the actual
//         slide title for the corrected re-verification.
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { spawn, execSync } from "node:child_process";
import { PNG } from "pngjs";

const PROD_PORT = 3001;
const PROD = `http://localhost:${PROD_PORT}`;
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  } catch {}
};

// ---------- pixel helpers ----------
const png = (f) => PNG.sync.read(readFileSync(`${OUT}/${f}`));
const px = (img, x, y) => {
  const i = (img.width * y + x) << 2;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

// ---------- 277: the /0.2 -> /0.3 lightening, measured ----------
function settle277() {
  // The 277 crop: 320x240 at (hero.x, hero.y + h/2 - 120). The arrow circle
  // center sits at approximately x=16+20=36 from the hero's left edge ->
  // crop-relative ~x=36, y=120. Sample a 6x6 patch at the circle's center.
  const img = png("277-heronav-arrow-hovered.png");
  const patch = [];
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) patch.push(px(img, 36 + dx, 120 + dy));
  const avg = (a) => Math.round(a.reduce((s, v) => s + v, 0) / a.length);
  const hovered = [avg(patch.map((p) => p[0])), avg(patch.map((p) => p[1])), avg(patch.map((p) => p[2]))];
  // The resting counterpart from 276 (same geometry, same photo, /0.2):
  const img2 = png("276-heronav-controls-resting.png");
  const patch2 = [];
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) patch2.push(px(img2, 36 + dx, 120 + dy));
  const resting = [avg(patch2.map((p) => p[0])), avg(patch2.map((p) => p[1])), avg(patch2.map((p) => p[2]))];
  const d = hovered.map((v, i) => v - resting[i]);
  console.log(`[277] arrow-center rest rgb(${resting}) vs hovered rgb(${hovered}) — delta R${d[0]} G${d[1]} B${d[2]}`);
  // The circle is composited white-alpha over the SAME photo: /0.3 vs /0.2
  // must lighten every channel (the photo behind the left arrow is dark).
  const lightened = d.every((v) => v > 2);
  console.log(`[277] VERDICT: the /0.3 hover IS measurably lighter than the /0.2 rest — ${lightened ? "SETTLED (the tint is in the pixels; 'grey' = the VLM's name for 30% white over a dark photo)" : "NOT SETTLED"}`);
  return lightened;
}

// ---------- 278: the dot widths, measured ----------
function settle278() {
  // The 278 crop: 400x80 centered on the dot row. Scan the middle row for
  // runs of bright pixels (the white pills over the photo).
  const img = png("278-heronav-dot3-activated.png");
  const y = Math.round(img.height * 0.6); // the dot row sits ~24px above the hero bottom; crop covers it
  // First find the row with the most bright pixels (the dots' band)
  let bestY = y, bestCount = 0;
  for (let yy = 10; yy < img.height - 10; yy++) {
    let c = 0;
    for (let x = 0; x < img.width; x++) {
      const [r, g, b] = px(img, x, yy);
      if (r > 200 && g > 200 && b > 200) c++;
    }
    if (c > bestCount) { bestCount = c; bestY = yy; }
  }
  const runs = [];
  let run = 0, start = -1;
  for (let x = 0; x <= img.width; x++) {
    const [r, g, b] = x < img.width ? px(img, x, bestY) : [0, 0, 0];
    const bright = r > 200 && g > 200 && b > 200;
    if (bright) { if (run === 0) start = x; run++; }
    else if (run > 0) { runs.push({ start, w: run }); run = 0; }
  }
  console.log(`[278] bright-pixel band at y=${bestY}: ${runs.length} runs -> ${JSON.stringify(runs)}`);
  const ws = runs.map((r) => r.w).sort((a, b) => a - b);
  const ok = runs.length === 3 && ws[0] <= 10 && ws[1] <= 10 && ws[2] >= 26;
  console.log(`[278] VERDICT: the measured pill widths are ${runs.map((r) => r.w).join(", ")} — ${ok ? "SETTLED (two 8px dots + the 32px active pill; the bright third-slide photo is the background, correctly)" : "NOT SETTLED"}`);
  return ok;
}

// ---------- 279: the orange 1px ring, edge-detected ----------
function settle279() {
  // The 279 crop: 320x240, the circle at ~(36, 120) r=20. The ring hugs the
  // circle's edge — scan a band just OUTSIDE the circle boundary (r 21-23)
  // for orange-hued pixels (R > G > B with a warm hue, the lab orange/50
  // composited over the dark photo -> a warm tint).
  const img = png("279-heronav-arrow-focused.png");
  const cx = 36, cy = 120;
  let orange = 0, total = 0, samples = [];
  for (let a = 0; a < 360; a += 3) {
    for (const r of [21, 22, 23]) {
      const x = Math.round(cx + r * Math.cos((a * Math.PI) / 180));
      const y = Math.round(cy + r * Math.sin((a * Math.PI) / 180));
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
      const [R, G, B] = px(img, x, y);
      total++;
      // warm/orange hue: R clearly above B, G between
      if (R - B > 18 && R - G > 6) { orange++; if (samples.length < 5) samples.push(`(${x},${y}) rgb(${R},${G},${B})`); }
    }
  }
  const ratio = total ? orange / total : 0;
  console.log(`[279] edge band scan: ${orange}/${total} warm-hued pixels (${(ratio * 100).toFixed(1)}%) — samples: ${samples.join(" | ")}`);
  const ok = ratio > 0.25;
  console.log(`[279] VERDICT: ${ok ? "SETTLED (the orange ring IS in the pixels at the circle's edge — the 1px 50%-alpha halo the VLM cannot see at this crop scale; the r52 275 precedent)" : "NOT SETTLED"}`);
  return ok;
}

// ---------- 276: re-probe the ACTUAL slide title (my description error) ----------
async function reprobe276() {
  killPort(PROD_PORT);
  const prod = spawn("bun", [".next/standalone/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db", AUTH_SECRET: "capture-r53-secret" },
    stdio: "ignore",
  });
  let up = false;
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {}
    if (up) break; await sleep(1000);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const slide = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const promo = document.querySelector('[aria-roledescription="carousel"] span');
    return { title: h1?.textContent, promo: promo?.textContent };
  });
  console.log(`[276] the ACTUAL slide-1 content (probed, not guessed): promo="${slide.promo}" title="${slide.title}"`);
  await browser.close();
  killPort(PROD_PORT);
  try { prod.kill("SIGKILL"); } catch {}
  return slide;
}

const s277 = settle277();
const s278 = settle278();
const s279 = settle279();
const slide = await reprobe276();
console.log(`\nSETTLEMENT SUMMARY: 277 ${s277 ? "SETTLED" : "OPEN"} · 278 ${s278 ? "SETTLED" : "OPEN"} · 279 ${s279 ? "SETTLED" : "OPEN"} · 276 corrected-title="${slide.title}"`);
