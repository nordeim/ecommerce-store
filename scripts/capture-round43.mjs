#!/usr/bin/env node
/**
 * Round-43 screenshots (226-230) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The NEWSLETTER-E2E-1 round's captures: the deliverable's surfaces — each
 * screenshot is the visual proof the round's contract holds.
 *
 *   226 — home, the production standalone (the standing anchor — the round
 *         must be pixel-invisible here; the sweep already proved 0% / 6 px)
 *   227 — the footer's Stay Updated column, resting anatomy (the round's
 *         parity anchor: the h3 + copy + input + Join + privacy line —
 *         the reference's measured form)
 *   228 — the subscribe success state (the superset's visible delta: the
 *         inline role="status" line "Thanks for subscribing!" + the
 *         cleared input; probe: the POST 200 + the line text)
 *   229 — the rate-limited state (11 UI submits through the fresh
 *         server's 10/10min limiter: the 11th POST returns 429 and the
 *         island renders the error line in red; probe: the 429 + the
 *         Retry-After header + the line text)
 *   230 — the mobile nav open (the standing 43-round watch surface — the
 *         trap-log-pinned left Sheet)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * VLM descriptions are written. ONE server: the production standalone on
 * :3001 (a FRESH process — its in-memory rate limiter starts at zero,
 * which the 229 burst budget depends on).
 *
 * Boot → probe → capture → kill by port.
 */
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PROD_PORT = 3001;
const PROD = `http://localhost:${PROD_PORT}`;
const OUT = "docs/screenshots";
const CAPTURE_EMAIL = "capture.r43@example.com";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
    return pids.join(",");
  } catch { return ""; }
};

killPort(PROD_PORT);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db" },
  stdio: "ignore",
});
let prodUp = false;
for (let i = 0; i < 60 && !prodUp; i++) {
  await sleep(1000);
  try { const r = await fetch(`${PROD}/api/health`); prodUp = (await r.json()).ok === true; } catch {}
}
if (!prodUp) { console.error("production standalone never came up on :3001"); process.exit(1); }
console.log("production standalone up on :3001 (fresh rate limiter)");

const browser = await chromium.launch();
const probe = {};

// ---- shared: sign in as the demo customer ----------------------------------
const custCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cl = await custCtx.newPage();
await cl.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await cl.getByLabel("Email").fill("john@example.com");
await cl.getByLabel("Password").fill("Demo1234!");
await cl.getByRole("button", { name: "Log in", exact: true }).click();
await cl.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await cl.waitForLoadState("networkidle");
await cl.close();

// ---- 226: home, the production standalone (the standing anchor) ------------
const p226 = await custCtx.newPage();
await p226.goto(`${PROD}/`, { waitUntil: "networkidle" });
await p226.evaluate(async () => { await document.fonts.ready; });
await p226.waitForTimeout(1200);
probe.s226 = await p226.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")].filter((i) => {
    const b = i.getBoundingClientRect();
    return b.width > 500 && b.y < 300;
  });
  const vis = imgs.find((i) => i.closest('[aria-hidden="true"]') === null) ?? imgs[0];
  return {
    heroSrc: (vis?.getAttribute("src") || "").slice(48, 60),
    heroPainted: (vis?.naturalWidth ?? 0) > 0,
    h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60),
  };
});
await p226.screenshot({ path: `${OUT}/226-home-anchor.png` });
await p226.close();
console.log("226 captured:", JSON.stringify(probe.s226));

// ---- 227: the Stay Updated column, resting anatomy (parity anchor) --------
const p227 = await custCtx.newPage();
await p227.goto(`${PROD}/`, { waitUntil: "networkidle" });
await p227.evaluate(async () => { await document.fonts.ready; });
await p227.waitForTimeout(800);
const col227 = p227.getByRole("heading", { name: "Stay Updated" }).locator("..");
await col227.scrollIntoViewIfNeeded();
await p227.waitForTimeout(400);
probe.s227 = await p227.evaluate(() => {
  const h3 = [...document.querySelectorAll("footer h3")].find((h) => h.textContent?.trim() === "Stay Updated");
  const col = h3?.parentElement;
  const input = col?.querySelector("input");
  const btn = col?.querySelector("form button");
  return {
    h3: h3?.textContent?.trim(),
    copy: col?.querySelector("p")?.textContent?.trim(),
    inputPlaceholder: input?.getAttribute("placeholder"),
    inputAriaLabel: input?.getAttribute("aria-label"),
    inputType: input?.getAttribute("type"),
    inputRequired: input?.hasAttribute("required"),
    btnText: btn?.textContent?.trim(),
    btnH: btn ? Math.round(btn.getBoundingClientRect().height) : -1,
    privacy: [...(col?.querySelectorAll("p") ?? [])].map((p) => p.textContent?.trim()).find((t) => t?.includes("Privacy")),
    statusLine: col?.querySelector('p[role="status"]')?.textContent?.trim() ?? null,
  };
});
await col227.screenshot({ path: `${OUT}/227-newsletter-resting-anatomy.png` });
await p227.close();
console.log("227 captured:", JSON.stringify(probe.s227));

// ---- 228: the subscribe success state (the superset's visible delta) ------
const p228 = await custCtx.newPage();
await p228.goto(`${PROD}/`, { waitUntil: "networkidle" });
await p228.evaluate(async () => { await document.fonts.ready; });
await p228.waitForTimeout(600);
const input228 = p228.getByLabel("Email address");
await input228.fill(CAPTURE_EMAIL);
let resp228 = null;
await Promise.all([
  p228.waitForResponse((r) => r.url().includes("/api/newsletter") && r.request().method() === "POST").then((r) => { resp228 = r; }),
  p228.getByRole("button", { name: "Join", exact: true }).click(),
]);
await sleep(400);
const col228 = p228.getByRole("heading", { name: "Stay Updated" }).locator("..");
await col228.scrollIntoViewIfNeeded();
probe.s228 = await p228.evaluate(() => {
  const col = [...document.querySelectorAll("footer h3")].find((h) => h.textContent?.trim() === "Stay Updated")?.parentElement;
  const input = col?.querySelector("input");
  return {
    postStatus: null, // filled below (needs the response object)
    statusLine: col?.querySelector('p[role="status"]')?.textContent?.trim() ?? null,
    inputCleared: input ? input.value === "" : null,
  };
});
probe.s228.postStatus = resp228 ? resp228.status() : -1;
await col228.screenshot({ path: `${OUT}/228-newsletter-success-state.png` });
await p228.close();
console.log("228 captured:", JSON.stringify(probe.s228));

// ---- 229: the rate-limited state (the 11th POST trips the limiter) --------
const p229 = await custCtx.newPage();
await p229.goto(`${PROD}/`, { waitUntil: "networkidle" });
await p229.evaluate(async () => { await document.fonts.ready; });
await p229.waitForTimeout(600);
let lastStatus = -1;
let lastRetryAfter = null;
// 10 more UI submits (requests 2..11 of the 10/10min window; 228 made #1)
for (let i = 0; i < 10; i++) {
  const input = p229.getByLabel("Email address");
  await input.fill(CAPTURE_EMAIL);
  await Promise.all([
    p229.waitForResponse((r) => r.url().includes("/api/newsletter") && r.request().method() === "POST").then((r) => {
      lastStatus = r.status();
      lastRetryAfter = r.headers()["retry-after"] ?? null;
    }),
    p229.getByRole("button", { name: "Join", exact: true }).click(),
  ]);
  await sleep(250);
}
await sleep(400);
const col229 = p229.getByRole("heading", { name: "Stay Updated" }).locator("..");
await col229.scrollIntoViewIfNeeded();
probe.s229 = await p229.evaluate(() => {
  const col = [...document.querySelectorAll("footer h3")].find((h) => h.textContent?.trim() === "Stay Updated")?.parentElement;
  const line = col?.querySelector('p[role="status"]');
  return {
    statusLine: line?.textContent?.trim() ?? null,
    lineIsRed: line ? (line.className || "").includes("text-red-300") : null,
  };
});
probe.s229.lastPostStatus = lastStatus;
probe.s229.retryAfter = lastRetryAfter;
await col229.screenshot({ path: `${OUT}/229-newsletter-rate-limited-state.png` });
await p229.close();
console.log("229 captured:", JSON.stringify(probe.s229));

// ---- 230: the mobile nav open (the standing watch surface) ----------------
const mobCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  hasTouch: true,
});
const ml = await mobCtx.newPage();
await ml.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await ml.getByLabel("Email").fill("john@example.com");
await ml.getByLabel("Password").fill("Demo1234!");
await ml.getByRole("button", { name: "Log in", exact: true }).click();
await ml.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await ml.waitForLoadState("networkidle");
const p230 = await mobCtx.newPage();
await p230.goto(`${PROD}/`, { waitUntil: "networkidle" });
await p230.waitForTimeout(900);
// The standing protocol's button-finding form: the FIRST button in the banner.
await p230.getByRole("banner").getByRole("button").first().click();
await p230.waitForTimeout(700);
probe.s230 = await p230.evaluate(() => {
  const sheet = document.querySelector('[data-state="open"][role="dialog"]') ?? document.querySelector('[role="dialog"]');
  const links = [...document.querySelectorAll('[role="dialog"] nav a')].map((a) => ({ text: a.textContent?.trim(), href: a.getAttribute("href") }));
  return { panelOpen: !!sheet, links };
});
await p230.screenshot({ path: `${OUT}/230-mobile-nav-open.png` });
await p230.close();
await ml.close();
mobCtx.close();
console.log("230 captured:", JSON.stringify(probe.s230));

await browser.close();
prod.kill();
killPort(PROD_PORT);
console.log("\nPROBE SUMMARY");
console.log(JSON.stringify(probe, null, 2));
console.log("\ncapture complete — 5 shots (226-230)");
