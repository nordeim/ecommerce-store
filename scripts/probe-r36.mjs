#!/usr/bin/env node
// Round-36 pre-VLM live-DOM probe (the round-32..35 lesson: describe
// reality, not intention — verify the ACTUAL rendered state of every
// surface the VLM will be asked about, against the production standalone
// on :3001, before writing the descriptions).
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

// 191/192 — the ORD-2026-002 customer detail.
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
    const line = document.querySelector('[data-testid="tracking-line"]');
    const anchor = line?.querySelector("a");
    const timeline = [...document.querySelectorAll("ol p.font-medium")].map((p) => p.textContent);
    const pill = document.querySelector("h1 + span, .inline-flex.items-center.border");
    return {
      hasTrackingLine: !!line,
      lineText: line?.textContent?.replace(/\s+/g, " ").trim(),
      anchorText: anchor?.textContent,
      anchorHref: anchor?.getAttribute("href"),
      anchorTarget: anchor?.getAttribute("target"),
      anchorClass: anchor?.className,
      timelineLabels: timeline,
      pillText: document.querySelector("span.rounded-full")?.textContent,
    };
  });
  console.log("191/192 ORD-2026-002 detail:", JSON.stringify(probe, null, 1));
  await page.close();
}

// 193 — the admin detail for ORD-2026-002 (the write surface).
{
  const admin = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await login(admin, "admin@luxestore.com", "Admin1234!");
  const page = await admin.newPage();
  await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "ORD-2026-002" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  const probe = await page.evaluate(() => {
    const row = document.querySelector('[data-testid="admin-tracking-row"]');
    const form = document.querySelector('[data-testid="tracking-form"]');
    const inputs = [...(form?.querySelectorAll("input") ?? [])].map((i) => ({
      aria: i.getAttribute("aria-label"),
      value: i.value,
      placeholder: i.getAttribute("placeholder"),
    }));
    const saveBtn = [...(form?.querySelectorAll("button") ?? [])].map((b) => b.textContent?.trim());
    const timeline = [...document.querySelectorAll("ol p.font-medium")].map((p) => p.textContent);
    const notes = [...document.querySelectorAll("ol p.text-sm.text-muted-foreground")].map((p) => p.textContent);
    return {
      readRowText: row?.textContent?.replace(/\s+/g, " ").trim(),
      formInputs: inputs,
      saveButtons: saveBtn,
      timelineLabels: timeline,
      timelineNotes: notes,
    };
  });
  console.log("193 admin detail:", JSON.stringify(probe, null, 1));
  await page.close();
  await admin.close();
}

// 194 — the ORD-2026-001 calm state.
{
  const page = await john.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("link", { name: "ORD-2026-001" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/account/orders/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await settle(page);
  const probe = await page.evaluate(() => ({
    trackingLine: !!document.querySelector('[data-testid="tracking-line"]'),
    bodyHasTrackingWord: [...document.querySelectorAll("p")].some((p) => p.textContent?.trim() === "Tracking"),
  }));
  console.log("194 ORD-2026-001 calm state:", JSON.stringify(probe));
  await page.close();
}

// 195 — home reality (the standing anchor description).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  const probe = await page.evaluate(() => ({
    announcement: document.querySelector("[class*=bg-primary] span, div.bg-primary")?.textContent?.slice(0, 60),
    navLinks: [...document.querySelectorAll("header nav a")].map((a) => a.textContent).slice(0, 6),
    h1: document.querySelector("h1")?.textContent?.slice(0, 50),
  }));
  console.log("195 home:", JSON.stringify(probe));
  await page.close();
  await ctx.close();
}

await browser.close();
try { process.kill(-server.pid, "SIGKILL"); } catch {}
console.log("probe server killed:", killPort(PORT) || "(already gone)");
