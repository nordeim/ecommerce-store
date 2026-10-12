import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";
const PROD = "http://localhost:3001";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  } catch {}
};
killPort(3001);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: "3001", NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db" },
  stdio: "ignore",
});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await sleep(1000); try { const r = await fetch(`${PROD}/api/health`); up = (await r.json()).ok === true; } catch {} }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(900);
await page.getByLabel("Search products").fill("serum");
await page.waitForResponse((r) => r.url().includes("/api/search"));
await page.waitForTimeout(600);

const hit = await page.evaluate(() => {
  const row = document.querySelector("header .bg-popover button");
  const r = row.getBoundingClientRect();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const stack = document.elementsFromPoint(cx, cy).slice(0, 5).map((e) => e.tagName + "." + String(e.className).split(" ").slice(0, 3).join("."));
  return { rowCenter: { x: cx, y: cy }, hitStack: stack, rowIsHit: stack.some((s) => s.startsWith("BUTTON")) };
});
console.log("HIT TEST:", JSON.stringify(hit, null, 2));

// Does a REAL playwright click on the suggestion navigate?
const before = page.url();
await page.locator("header button").filter({ hasText: "Vitamin C Serum" }).click({ timeout: 5000 }).catch((e) => console.log("CLICK THREW:", e.message.split("\n")[0]));
await page.waitForTimeout(1500);
console.log("AFTER CLICK URL:", new URL(page.url()).pathname, "(was", new URL(before).pathname + ")");

await browser.close();
killPort(3001);
