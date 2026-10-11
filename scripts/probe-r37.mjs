#!/usr/bin/env node
// Round-37 pre-VLM live-DOM probe (the round-32..36 lesson: describe
// reality, not intention — verify the ACTUAL rendered state of every
// surface the VLM will be asked about, against the production standalone
// on :3001, before writing the descriptions).
//
// Probes:
//   A. the ORD-2026-002 customer detail — the estimate line's exact text,
//      class list, and position (the header block, under the order row);
//      the tracking line unchanged
//   B. the ORD-2026-001 (delivered) + ORD-2026-004 (cancelled) details —
//      the estimate line ABSENT (the calm states)
//   C. a FRESH order's confirmation — the estimate line present, its text
//      (the moving window), the money line calm (the demo/mock path),
//      the mb rhythm (the estimate is the last muted line)
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
if (!(await waitHealthy())) { console.error("probe server failed to boot"); process.exit(1); }

const settle = async (page) => {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);
};
const login = async (ctx, email, password) => {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await page.close();
};

const browser = await chromium.launch();
const john = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await login(john, "john@example.com", "Demo1234!");

// A — the ORD-2026-002 customer detail (the promise surface).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-002" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  const probe = await page.evaluate(() => {
    const line = document.querySelector('[data-testid="delivery-window"]');
    if (!line) return { present: false };
    const cs = getComputedStyle(line);
    const header = line.parentElement;
    const row = header?.querySelector(".flex");
    return {
      present: true,
      text: line.textContent,
      className: line.className,
      color: cs.color,
      fontSize: cs.fontSize,
      inHeaderBlock: header?.className ?? null,
      headerFirstElementIsRow: row?.className ?? null,
      siblingTracking: !!document.querySelector('[data-testid="tracking-line"]'),
      trackingText: document.querySelector('[data-testid="tracking-line"]')?.textContent ?? null,
    };
  });
  console.log("A. ORD-2026-002 detail estimate line:", JSON.stringify(probe, null, 1));
  await page.close();
}

// B — the calm states (001 delivered, 004 cancelled).
{
  const page = await john.newPage();
  for (const ord of ["ORD-2026-001", "ORD-2026-004"]) {
    await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Orders" }).click();
    await page.waitForTimeout(600);
    await page.getByRole("link", { name: ord }).click();
    await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await settle(page);
    const present = await page.evaluate(
      () => !!document.querySelector('[data-testid="delivery-window"]'),
    );
    console.log(`B. ${ord} (calm state): estimate line present = ${present}`);
  }
  await page.close();
}

// C — a FRESH order's confirmation (place a real order through the UI).
{
  const page = await john.newPage();
  await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await settle(page);
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Cart, 1 items/ }).click();
  await page.waitForTimeout(600);
  await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
  await page.waitForURL(/\/checkout/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  await page.getByRole("main").getByLabel("First Name").fill("John");
  await page.getByRole("main").getByLabel("Last Name").fill("Doe");
  await page.getByRole("main").getByLabel("Email").fill("john@example.com");
  await page.getByRole("main").getByLabel("Address").fill("123 Main St");
  await page.getByRole("main").getByLabel("City").fill("New York");
  await page.getByRole("main").getByLabel("State").fill("NY");
  await page.getByRole("main").getByLabel("ZIP").fill("10001");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("main").getByLabel("Card Number").fill("4242424242424242");
  await page.getByRole("main").getByLabel("Expiry").fill("12/28");
  await page.getByRole("main").getByLabel("CVC").fill("123");
  await page.getByRole("button", { name: "Review Order" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Place Order — \$299\.99/ }).click();
  await page.waitForURL(/\/checkout\/success\?order=/, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  const probe = await page.evaluate(() => {
    const line = document.querySelector('[data-testid="delivery-window"]');
    const money = [...document.querySelectorAll("p")].find((p) =>
      /Payment received|Payment refunded/.test(p.textContent ?? ""),
    );
    const emailLine = [...document.querySelectorAll("p")].find((p) =>
      /A confirmation was sent to/.test(p.textContent ?? ""),
    );
    return {
      estimatePresent: !!line,
      estimateText: line?.textContent ?? null,
      estimateMarginBottom: line ? getComputedStyle(line).marginBottom : null,
      moneyLinePresent: !!money,
      emailLineMarginBottom: emailLine ? getComputedStyle(emailLine).marginBottom : null,
      url: location.search,
    };
  });
  console.log("C. fresh-order confirmation estimate:", JSON.stringify(probe, null, 1));
  await page.close();
}

await browser.close();
try { process.kill(-server.pid, "SIGKILL"); } catch {}
const killed = killPort(PORT);
console.log("probe server killed:", killed || "(already gone)");
