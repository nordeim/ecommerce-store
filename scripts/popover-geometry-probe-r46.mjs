// Round-46 capture follow-up probe: measure the typeahead popover's REAL
// geometry — the strip container carries overflow-hidden (the slide-in
// animation's clip); does the popover render below the strip's boundary and
// get clipped? The DOM probes measured EXISTENCE; this measures VISIBILITY.
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

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
for (let i = 0; i < 60 && !up; i++) { await sleep(1000); try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {} }
if (!up) { console.error("server never came up"); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(900);
await page.getByLabel("Search products").fill("serum");
await page.waitForResponse((r) => r.url().includes("/api/search"));
await page.waitForTimeout(600);

const geo = await page.evaluate(() => {
  const strip = document.querySelector("header div.border-t");
  const inner = document.querySelector("header div.relative.max-w-7xl") ?? document.querySelector("header div.relative");
  const popover = document.querySelector("header .bg-popover");
  const row = popover?.querySelector("button");
  const r = (el) => el?.getBoundingClientRect().toJSON();
  const cs = strip ? getComputedStyle(strip) : null;
  return {
    strip: r(strip),
    stripOverflow: cs?.overflow,
    inner: r(inner),
    popover: r(popover),
    row: r(row),
    clipAnalysis: popover && strip
      ? {
          popoverBottom: popover.getBoundingClientRect().bottom,
          stripBottom: strip.getBoundingClientRect().bottom,
          clippedPixels: Math.max(0, popover.getBoundingClientRect().bottom - strip.getBoundingClientRect().bottom),
          visibleInsideStrip: Math.max(0, Math.min(popover.getBoundingClientRect().bottom, strip.getBoundingClientRect().bottom) - popover.getBoundingClientRect().top),
        }
      : null,
  };
});
console.log(JSON.stringify(geo, null, 2));

await page.screenshot({ path: "/tmp/audit-r46/popover-geometry.png" });
await browser.close();
killPort(PROD_PORT);
