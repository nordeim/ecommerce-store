#!/usr/bin/env node
/**
 * Round-42 screenshots (221-225) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The CSP-DEV-EVAL round's captures: the deliverable's surfaces — each
 * screenshot is the visual proof the round's contract holds.
 *
 *   221 — home, the production standalone (the standing anchor — the
 *         round must be pixel-invisible here; the sweep already proved
 *         0% / 6 px)
 *   222 — the DEV server's /login post-fix (the round's deliverable
 *         surface: the FULL 1024x768 viewport including the bottom-left
 *         corner where the Next dev-tools "01 Issue" badge used to paint
 *         pre-fix — post-fix the badge is collapsed (0x0, zero issues)
 *         and the console carries ZERO errors; probe: the dev CSP header
 *         carries 'unsafe-eval', the badge geometry, the console census)
 *   223 — the dev bottom-left close-up at 2x (deviceScaleFactor 2, the
 *         clip x 0..256 / y 576..768 — the badge's former 101x36 home at
 *         20,712; the round-38 OCR lesson for the 2x form)
 *   224 — the production /login (the nonce-pipeline surface — visually
 *         unchanged; probe: the production CSP header carries NO
 *         'unsafe-eval' — the strictness the E2E negative pin guards)
 *   225 — the mobile nav open (the standing 42-round watch surface — the
 *         trap-log-pinned left Sheet)
 *
 * Probe-first discipline: the badge geometry, the console census, and the
 * CSP headers read from the live servers BEFORE the VLM descriptions are
 * written. Two servers: the production standalone on :3001 (221/224/225)
 * and the dev server on :3000 (222/223 — the deliverable's own mode).
 *
 * Boot → probe → capture → kill by port (both).
 */
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PROD_PORT = 3001;
const DEV_PORT = 3000;
const PROD = `http://localhost:${PROD_PORT}`;
const DEV = `http://localhost:${DEV_PORT}`;
const OUT = "docs/screenshots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const killPort = (port) => {
  try {
    const pids = execSync(`ss -ltnp 2>/dev/null | grep ':${port}' | grep -oP 'pid=\\K[0-9]+' | sort -u`, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch {} }
    return pids.join(",");
  } catch { return ""; }
};

killPort(PROD_PORT);
killPort(DEV_PORT);
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1" },
  stdio: "ignore",
});
const dev = spawn("bun", ["run", "dev"], {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: "ignore",
});
let prodUp = false, devUp = false;
for (let i = 0; i < 60 && !(prodUp && devUp); i++) {
  await sleep(1000);
  if (!prodUp) { try { const r = await fetch(`${PROD}/api/health`); prodUp = (await r.json()).ok === true; } catch {} }
  if (!devUp) { try { const r = await fetch(`${DEV}/api/health`); devUp = (await r.json()).ok === true; } catch {} }
}
if (!prodUp) { console.error("production standalone never came up on :3001"); process.exit(1); }
if (!devUp) { console.error("dev server never came up on :3000"); process.exit(1); }
console.log("production standalone up on :3001 + dev server up on :3000");

const browser = await chromium.launch();
const probe = {};

// ---- 221: home, the production standalone (the standing anchor) -----------
const custCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cl = await custCtx.newPage();
await cl.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await cl.getByLabel("Email").fill("john@example.com");
await cl.getByLabel("Password").fill("Demo1234!");
await cl.getByRole("button", { name: "Log in", exact: true }).click();
await cl.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await cl.waitForLoadState("networkidle");
await cl.close();
const p221 = await custCtx.newPage();
await p221.goto(`${PROD}/`, { waitUntil: "networkidle" });
await p221.evaluate(async () => { await document.fonts.ready; });
await p221.waitForTimeout(1200);
probe.s221 = await p221.evaluate(() => {
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
await p221.screenshot({ path: `${OUT}/221-home-anchor.png` });
await p221.close();
console.log("221 captured:", JSON.stringify(probe.s221));

// ---- 222: the DEV server's /login post-fix (the deliverable surface) ------
const devCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const devErrs = [];
const p222 = await devCtx.newPage();
p222.on("console", (m) => { if (m.type() === "error") devErrs.push(m.text().slice(0, 90)); });
const devRes = await p222.goto(`${DEV}/login`, { waitUntil: "load", timeout: 45000 });
await p222.evaluate(async () => { await document.fonts.ready; });
await p222.waitForTimeout(3000);
probe.s222 = await p222.evaluate(() => {
  const portal = document.querySelector("nextjs-portal");
  const root = portal?.shadowRoot?.querySelector("[data-next-badge-root]");
  const r = root?.getBoundingClientRect();
  return {
    badgeMounted: !!root,
    badgeW: r ? Math.round(r.width) : -1,
    badgeH: r ? Math.round(r.height) : -1,
    h1: document.querySelector("h1")?.textContent?.trim(),
  };
});
probe.s222csp = devRes?.headers()["content-security-policy"] ?? "";
probe.s222consoleErrors = devErrs.length;
// retry wrapper: the dev server's first compile can race the capture
const shot = async (page, opts) => {
  for (let a = 1; a <= 4; a++) {
    try { await page.screenshot(opts); return; }
    catch { await sleep(1200); }
  }
  throw new Error("screenshot failed after retries: " + JSON.stringify(opts.path));
};
await shot(p222, { path: `${OUT}/222-dev-login-clean.png` });
await p222.close();
console.log("222 captured:", JSON.stringify(probe.s222), "cspUnsafeEval:", probe.s222csp.includes("unsafe-eval"), "consoleErrors:", devErrs.length);

// ---- 223: the dev bottom-left close-up at 2x (the badge's former home) ---
const dev2x = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 });
const p223 = await dev2x.newPage();
await p223.goto(`${DEV}/login`, { waitUntil: "load", timeout: 45000 });
await p223.evaluate(async () => { await document.fonts.ready; });
await p223.waitForTimeout(2500);
probe.s223 = await p223.evaluate(() => {
  const portal = document.querySelector("nextjs-portal");
  const root = portal?.shadowRoot?.querySelector("[data-next-badge-root]");
  const r = root?.getBoundingClientRect();
  return { badgeW: r ? Math.round(r.width) : -1, badgeH: r ? Math.round(r.height) : -1 };
});
await shot(p223, {
  path: `${OUT}/223-dev-bottomleft-closeup.png`,
  clip: { x: 0, y: 576, width: 256, height: 192 },
});
await p223.close();
dev2x.close();
console.log("223 captured:", JSON.stringify(probe.s223));

// ---- 224: the production /login (the nonce-pipeline surface) --------------
const p224 = await custCtx.newPage();
const prodRes = await p224.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await p224.evaluate(async () => { await document.fonts.ready; });
await p224.waitForTimeout(800);
probe.s224 = await p224.evaluate(() => ({
  h1: document.querySelector("h1")?.textContent?.trim(),
  subtitle: document.querySelector("h1 + p, h1 + *")?.textContent?.trim().slice(0, 40),
  labels: [...document.querySelectorAll("label")].map((l) => l.textContent?.trim()),
}));
probe.s224csp = prodRes?.headers()["content-security-policy"] ?? "";
await p224.screenshot({ path: `${OUT}/224-prod-login-strict-csp.png` });
await p224.close();
console.log("224 captured:", JSON.stringify(probe.s224), "cspUnsafeEval:", probe.s224csp.includes("unsafe-eval"), "noncePresent:", probe.s224csp.includes("nonce-"));

// ---- 225: the mobile nav open (the standing watch surface) ----------------
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
const p225 = await mobCtx.newPage();
await p225.goto(`${PROD}/`, { waitUntil: "networkidle" });
await p225.waitForTimeout(900);
// The standing protocol's button-finding form: the FIRST button in the banner.
await p225.getByRole("banner").getByRole("button").first().click();
await p225.waitForTimeout(700);
probe.s225 = await p225.evaluate(() => {
  const sheet = document.querySelector('[data-state="open"][role="dialog"]') ?? document.querySelector('[role="dialog"]');
  const links = [...document.querySelectorAll('[role="dialog"] nav a')].map((a) => ({ text: a.textContent?.trim(), href: a.getAttribute("href") }));
  return { panelOpen: !!sheet, links };
});
await p225.screenshot({ path: `${OUT}/225-mobile-nav-open.png` });
await p225.close();
await ml.close();
mobCtx.close();
console.log("225 captured:", JSON.stringify(probe.s225));

await browser.close();
prod.kill();
dev.kill();
killPort(PROD_PORT);
killPort(DEV_PORT);
console.log("\nPROBE SUMMARY");
console.log(JSON.stringify(probe, null, 2));
console.log("\ncapture complete — 5 shots (221-225)");
