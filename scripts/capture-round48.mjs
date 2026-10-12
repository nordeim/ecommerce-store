#!/usr/bin/env node
/**
 * Round-48 screenshots (251-255) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The CHECKOUT-PAYSTEP-1 round's captures: the checkout family's
 * payment-step states — each screenshot is the visual proof the round's
 * contract holds.
 *
 *   251 — the step-2 RESTING anatomy with Card selected (the standing
 *         anchor: the unboxed card fields + both option boxes resting
 *         at the stone border — no tint anywhere)
 *   252 — the step-2 with PAYPAL selected: the card fields STILL VISIBLE
 *         below the options (Fix #1's proof state) + the selected box's
 *         /30-alpha orange border with no bg tint (Fix #2's proof state)
 *   253 — the CVC formatter mid-type: "12a4b56" typed -> "1245" (the
 *         digits-only 4-cap — the registered superset anchor)
 *   254 — the step-3 review with the "Place Order — $299.99" label +
 *         the lock icon (P11's proof state — the reference's exact label)
 *   255 — the step-2 AFTER the step-3 Back: PayPal still selected + the
 *         card values intact (P10's proof state — the clone's superset)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * screenshots and BEFORE the VLM descriptions are written. ONE server:
 * the production standalone on :3001 (a FRESH process). ZERO DB
 * mutations (every state is step-2/3 visual state; no Place Order click
 * ever fires — the guest cart is cookie-only).
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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// The guest cart walk: PDP add -> drawer -> checkout (cookie-only).
const reachCheckout = async () => {
  await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.waitForTimeout(1500);
  await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
  await page.waitForTimeout(2000);
  const main = page.getByRole("main");
  for (const [l, v] of [["First Name", "Ada"], ["Last Name", "Lovelace"], ["Email", "ada@example.com"], ["Address", "123 Main St"], ["City", "New York"], ["State", "NY"], ["ZIP", "10001"]]) {
    await main.getByLabel(l).fill(v);
  }
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.waitForTimeout(1200);
};

const optionStyle = () =>
  page.evaluate(() => {
    const out = {};
    for (const l of [...document.querySelectorAll("label")]) {
      const t = (l.textContent ?? "").trim();
      const s = getComputedStyle(l);
      if (/credit/i.test(t)) out.card = { border: s.borderColor, bg: s.backgroundColor };
      if (/paypal/i.test(t)) out.paypal = { border: s.borderColor, bg: s.backgroundColor };
    }
    return out;
  });

const cardHit = () =>
  page.evaluate(() => {
    const i = [...document.querySelectorAll("input")].find((x) => x.id === "co-card");
    if (!i) return { present: false };
    const r = i.getBoundingClientRect();
    return { present: true, hit: document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).includes(i) };
  });

// ---- 251: the step-2 resting anatomy (Card selected) -----------------------
{
  await reachCheckout();
  const probe = {
    heading: await page.getByRole("heading", { name: "Payment Method" }).textContent(),
    options: await optionStyle(),
    container: await page.evaluate(() => {
      const i = [...document.querySelectorAll("input")].find((x) => x.id === "co-card");
      let cur = i?.parentElement;
      while (cur && !/sm:grid-cols-2/.test(String(cur.className))) cur = cur.parentElement;
      if (!cur) return null;
      const s = getComputedStyle(cur);
      return { bg: s.backgroundColor, radius: s.borderRadius, pad: s.padding };
    }),
  };
  console.log(`[251 probe] ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/251-paystep-resting-card-selected.png`, fullPage: false });
}

// ---- 252: PayPal selected — the fields stay visible + the /30 border -------
{
  await page.getByText("PayPal", { exact: true }).click();
  await page.waitForTimeout(500);
  const probe = { options: await optionStyle(), card: await cardHit() };
  console.log(`[252 probe] ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/252-paystep-paypal-selected-fields-visible.png`, fullPage: false });
}

// ---- 253: the CVC formatter mid-type (the superset anchor) ------------------
{
  await page.getByText("Credit / Debit Card", { exact: false }).click();
  await page.waitForTimeout(500);
  const cvc = page.getByRole("main").getByLabel("CVC");
  await cvc.pressSequentially("12a4b56", { delay: 40 });
  await page.waitForTimeout(300);
  const probe = { cvcValue: await cvc.inputValue() };
  console.log(`[253 probe] ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/253-paystep-cvc-formatter.png`, fullPage: false });
}

// ---- 254: the step-3 review + the Place Order label + the lock --------------
{
  const main = page.getByRole("main");
  await main.getByLabel("Card Number").fill("4242424242424242");
  await main.getByLabel("Expiry").fill("12/28");
  await main.getByLabel("CVC").fill("123");
  await page.getByRole("button", { name: "Review Order" }).click();
  await page.waitForTimeout(900);
  const probe = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /Place Order/.test(x.textContent ?? ""));
    if (!b) return null;
    return { text: (b.textContent ?? "").trim(), lock: !!b.querySelector("svg.lucide-lock, svg[class*=lock]") };
  });
  console.log(`[254 probe] ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/254-paystep-place-order-label.png`, fullPage: false });
}

// ---- 255: after the step-3 Back — PayPal + the values intact ----------------
{
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(900);
  // re-select PayPal (the walk to 254 was on the card path; select paypal
  // then walk to step 3 and Back for the P10 proof state)
  await page.getByText("PayPal", { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Review Order" }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(600);
  const probe = await page.evaluate(() => {
    const radios = [...document.querySelectorAll("[role=radio]")].map((r) => ({ value: r.getAttribute("value"), checked: r.getAttribute("aria-checked") }));
    const val = (id) => [...document.querySelectorAll("input")].find((x) => x.id === id)?.value ?? null;
    return { radios, card: val("co-card"), exp: val("co-exp"), cvc: val("co-cvc") };
  });
  console.log(`[255 probe] ${JSON.stringify(probe)}`);
  await page.screenshot({ path: `${OUT}/255-paystep-back-preserved.png`, fullPage: false });
}

await browser.close();
killPort(PROD_PORT);
try { prod.kill("SIGKILL"); } catch {}
console.log("CAPTURES COMPLETE");
