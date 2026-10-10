#!/usr/bin/env node
// Debug: why does the history link click not navigate in the :3001 probe?
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
  } catch {}
};

const server = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT), NODE_ENV: "production", HOSTNAME: "localhost", DATABASE_URL: "file:../db/custom.db" },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
for (let i = 0; i < 40; i++) {
  try { const r = await fetch(`${BASE}/api/health`); if (r.ok) break; } catch {}
  await sleep(500);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("[console.error]", m.text().slice(0, 200)); });
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("john@example.com");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Log in", exact: true }).click();
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);

await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: "Orders" }).click();
await page.waitForTimeout(600);
const link = page.getByRole("link", { name: "ORD-2026-001" });
console.log("link count:", await link.count());
console.log("href:", await link.getAttribute("href"));
await link.click();
await page.waitForTimeout(2500);
console.log("URL after click:", page.url());
console.log("h1:", await page.evaluate(() => document.querySelector("h1")?.textContent));

await browser.close();
process.kill(-server.pid, "SIGKILL");
killPort(PORT);
console.log("debug done");
