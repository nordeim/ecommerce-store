#!/usr/bin/env node
// Round-34 pre-VLM probe: extract the ACTUAL rendered text of the two
// detail surfaces + the not-found block so the VLM descriptions describe
// reality, not intention (the round-32/33 lesson).
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

const login = async (ctx, email, password) => {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.close();
};

const browser = await chromium.launch();
const john = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await login(john, "john@example.com", "Demo1234!");

// The ORD-2026-001 detail — the full rendered text.
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click(); await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-001" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  console.log("=== 182 ORD-2026-001 detail ===");
  console.log(await page.evaluate(() => document.querySelector("main")?.innerText));
  await page.close();
}

// The ORD-2026-004 refunded detail.
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click(); await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-004" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  console.log("=== 183 ORD-2026-004 detail (payment card + header) ===");
  console.log(await page.evaluate(() => {
    const cards = [...document.querySelectorAll("main .bg-card")];
    return cards.slice(0, 2).map((c) => c.innerText).join("\n---\n");
  }));
  await page.close();
}

// The not-found block (admin context).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click(); await page.waitForTimeout(600);
  const href = await page.getByRole("link", { name: "ORD-2026-001" }).getAttribute("href");
  await page.close();
  const admin = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await login(admin, "admin@luxestore.com", "Admin1234!");
  const ap = await admin.newPage();
  await ap.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
  console.log("=== 184 not-found block ===");
  console.log(await ap.evaluate(() => document.querySelector("main")?.innerText));
  await ap.close();
}

await browser.close();
process.kill(-server.pid, "SIGKILL");
killPort(PORT);
console.log("probe done");
