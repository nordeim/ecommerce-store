#!/usr/bin/env node
/**
 * Round-47 screenshots (246-250) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The AUTH-ERROR-1 round's captures: the auth family's error states —
 * each screenshot is the visual proof the round's contract holds.
 *
 *   246 — the register form's SHORT-PASSWORD box (the standing round
 *         anchor: the tinted error box carrying the reference-measured
 *         copy "Password must be at least 8 characters long")
 *   247 — the short+MISMATCH box reading "Passwords do not match"
 *         (Fix #1's proof state — the reference's mismatch-first priority)
 *   248 — the login PENDING label "Logging in..." + the disabled button
 *         during a held submit (Fix #2's proof state — three ASCII dots)
 *   249 — the forgot-password PENDING label "Sending..." during a held
 *         submit (Fix #2's family member)
 *   250 — the 11th wrong login's "Too many attempts. Try again in Ns."
 *         box (P11's proof state — the login rate-limit exhausted copy)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * screenshots and BEFORE the VLM descriptions are written. ONE server:
 * the production standalone on :3001 (a FRESH process). ZERO mutations
 * on the DB (every state is a validation failure or an in-flight window —
 * no dev-cleanup needed this round).
 *
 * Boot → probe → capture → kill by port.
 */
import { chromium } from "playwright-core";
import { spawn, execSync } from "node:child_process";

const PROD_PORT = 3001;
const PROD = `http://localhost:${PROD_PORT}`;
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
const prod = spawn("bun", [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PROD_PORT), NODE_ENV: "production", HOSTNAME: "127.0.0.1", DATABASE_URL: "file:../db/custom.db" },
  stdio: "ignore",
});
let prodUp = false;
for (let i = 0; i < 30; i++) {
  try { const r = await fetch(`${PROD}/api/health`); prodUp = (await r.json()).ok === true; } catch {}
  if (prodUp) break;
  await sleep(1000);
}
if (!prodUp) { console.error("production standalone never came up on :3001"); process.exit(1); }
console.log("production standalone up on :3001");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const boxText = () =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll("div,p")].find(
      (e) => /destructive/.test(e.className) && e.className.includes("rounded"),
    );
    return el ? el.textContent?.trim() ?? null : null;
  });
const submitState = () =>
  page.evaluate(() => {
    const b = document.querySelector("form button[type=submit]");
    return b ? { text: (b.textContent ?? "").trim(), disabled: b.hasAttribute("disabled") } : null;
  });

// ---- 246: the register short-password box ---------------------------------
{
  await page.goto(`${PROD}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("capture-r47@example.com");
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Confirm Password").fill("abc");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForTimeout(900);
  const probe = await boxText();
  console.log(`[246 probe] short+match box = ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/246-register-short-password-box.png`, fullPage: false });
}

// ---- 247: the short+MISMATCH box (Fix #1's proof state) --------------------
{
  await page.goto(`${PROD}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("capture-r47@example.com");
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Confirm Password").fill("xyz");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForTimeout(900);
  const probe = await boxText();
  console.log(`[247 probe] short+mismatch box = ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/247-register-mismatch-priority-box.png`, fullPage: false });
}

// ---- 248: the login PENDING label during a held submit (Fix #2) ------------
{
  await page.goto(`${PROD}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  let release = () => {};
  await page.route("**/login", (route) => {
    if (route.request().method() === "POST") {
      return new Promise((resolve) => { release = resolve; }).then(() => route.continue());
    }
    return route.continue();
  });
  await page.locator("form button[type=submit]").click();
  await page.waitForTimeout(700);
  const probe = await submitState();
  console.log(`[248 probe] during-flight = ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/248-login-pending-label.png`, fullPage: false });
  release();
  await page.waitForTimeout(900);
  const after = await boxText();
  console.log(`[248 probe] after-release box = ${JSON.stringify(after)}`);
  await page.unroute("**/login");
}

// ---- 249: the forgot-password PENDING label during a held submit -----------
{
  await page.goto(`${PROD}/forgot-password`, { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill("capture-r47@example.com");
  let release = () => {};
  await page.route("**/forgot-password", (route) => {
    if (route.request().method() === "POST") {
      return new Promise((resolve) => { release = resolve; }).then(() => route.continue());
    }
    return route.continue();
  });
  await page.locator("form button[type=submit]").click();
  await page.waitForTimeout(700);
  const probe = await submitState();
  console.log(`[249 probe] during-flight = ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/249-forgot-pending-label.png`, fullPage: false });
  release();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => document.querySelector(".bg-card")?.textContent?.trim() ?? null);
  console.log(`[249 probe] after-release card = ${JSON.stringify(after?.slice(0, 90))}`);
  await page.unroute("**/forgot-password");
}

// ---- 250: the login rate-limit exhausted copy (P11's proof state) ----------
{
  await page.goto(`${PROD}/login`, { waitUntil: "networkidle" });
  const email = "capture-rl-r47@example.com";
  const btn = page.locator("form button[type=submit]");
  for (let i = 1; i <= 10; i++) {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await btn.click();
    // the round's race lesson: settle for the response's own commit
    await page.waitForTimeout(1100);
  }
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await btn.click();
  await page.waitForTimeout(1100);
  const probe = await boxText();
  console.log(`[250 probe] 11th box = ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/250-login-rate-limit-exhausted.png`, fullPage: false });
}

await browser.close();
killPort(PROD_PORT);
try { process.kill(prod.pid, "SIGKILL"); } catch {}
console.log("CAPTURES COMPLETE (246-250)");
