#!/usr/bin/env node
// Re-capture screenshot 202 (the estimate-line close-up) at
// deviceScaleFactor 2 — the 1x crop's 14px text was below the VLM's
// reliable OCR threshold (it read "Mar 8" for "Mar 18"); the live DOM is
// authoritative (probe-r38 verified the exact string) but the VLM gate
// must be able to READ the artifact it is asked to verify.
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
    return pids.join(",");
  } catch { return ""; }
};

const server = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT), NODE_ENV: "production", HOSTNAME: "localhost", DATABASE_URL: "file:../db/custom.db" },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
const waitHealthy = async () => {
  for (let i = 0; i < 40; i++) {
    try { const res = await fetch(`${BASE}/api/health`); if (res.ok) return true; } catch {}
    await sleep(500);
  }
  return false;
};
if (!(await waitHealthy())) { console.error("server failed to boot"); process.exit(1); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("john@example.com");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Log in", exact: true }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: "Orders" }).click();
await page.waitForTimeout(600);
await page.getByRole("link", { name: "ORD-2026-002" }).click();
await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
await page.waitForLoadState("networkidle");
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(800);

const line = page.getByTestId("delivery-window");
await line.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await line.screenshot({ path: "docs/screenshots/202-delivery-window-closeup.png" });
console.log("202 re-captured at 2x");

await browser.close();
try { process.kill(-server.pid, "SIGKILL"); } catch {}
killPort(PORT);
