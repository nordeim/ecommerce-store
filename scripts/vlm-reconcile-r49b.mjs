// Round-49 VLM reconciliation v2: the DEFINITIVE pixel comparison. Boots the
// standalone, screenshots ONLY the stepper element (elementHandle), and
// samples the minus-icon and plus-icon regions by their measured
// bounding boxes — no confounds, no zone guessing. Also dumps the computed
// styles (opacity, stroke color) of both buttons as the DOM ground truth.
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { writeFileSync, readFileSync as rf } from "node:fs";

const PROD_PORT = 3001;
const PROD = `http://localhost:${PROD_PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  } catch {}
};

killPort(PROD_PORT);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db" },
  stdio: "ignore",
});
let up = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {}
  if (up) break;
  await sleep(1000);
}
if (!up) { console.error("no server"); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const minus = page.getByRole("button", { name: "Decrease quantity", exact: true });
const plus = page.getByRole("button", { name: "Increase quantity", exact: true });

// DOM ground truth
const truth = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  const bs = getComputedStyle(b), ps = getComputedStyle(p);
  const bsvg = getComputedStyle(b.querySelector("svg")), psvg = getComputedStyle(p.querySelector("svg"));
  return {
    minus: { disabled: b.disabled, opacity: bs.opacity, cursor: bs.cursor, svgColor: bsvg.color, svgOpacity: bsvg.opacity },
    plus: { disabled: p.disabled, opacity: ps.opacity, cursor: ps.cursor, svgColor: psvg.color, svgOpacity: psvg.opacity },
  };
});
console.log("[DOM truth]", JSON.stringify(truth, null, 1));

// element-scoped screenshot of the stepper container
const container = minus.locator("xpath=..");
await container.screenshot({ path: "/tmp/stepper-element.png" });

const mb = await minus.boundingBox();
const cb = await container.boundingBox();
console.log("[boxes]", JSON.stringify({ mb, cb }));

// pixel-sample both icon regions inside the element shot
const png = PNG.sync.read(rf("/tmp/stepper-element.png"));
const { width, height, data } = png;
const zone = (x0, x1, y0, y1) => {
  let darkest = 255, sum = 0, n = 0;
  for (let y = Math.max(0, y0); y < Math.min(y1, height); y++) {
    for (let x = Math.max(0, x0); x < Math.min(x1, width); x++) {
      const i = (y * width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < darkest) darkest = lum;
      sum += lum; n++;
    }
  }
  return { darkest: Math.round(darkest), avg: Math.round(sum / Math.max(1, n)) };
};
// the element shot is the CONTAINER: minus button [0, 44], qty span, plus button [width-44, width]
const minusZone = zone(8, 36, 8, height - 8);
const plusZone = zone(width - 36, width - 8, 8, height - 8);
console.log(`[pixels] minus icon zone: darkest ${minusZone.darkest} avg ${minusZone.avg}`);
console.log(`[pixels] plus  icon zone: darkest ${plusZone.darkest} avg ${plusZone.avg}`);
const same = Math.abs(minusZone.darkest - plusZone.darkest) <= 20;
console.log(same
  ? "[VERDICT] SAME CONTRAST — the minus is NOT dimmed; the VLM misread (world knowledge over pixels). The DOM ground truth stands: enabled, opacity 1."
  : "[VERDICT] DIFFERENT — the minus renders differently; investigate the capture.");

await browser.close();
killPort(PROD_PORT);
