#!/usr/bin/env node
/**
 * Round-44 screenshots (231-235) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The CHECKOUT-VALIDATION-1 round's captures: the deliverable's surfaces —
 * each screenshot is the visual proof the round's contract holds.
 *
 *   231 — checkout step 1, resting (the standing round anchor: the
 *         seven-field Shipping Information form + the gated Continue +
 *         the Order Summary aside)
 *   232 — the step-1 GATED state (everything valid except the email —
 *         Continue stays DISABLED; the superset gate the reference's
 *         ungated mock lacks, measured live)
 *   233 — the step-2 formatted card fields (raw digits typed, rendered
 *         grouped "4242 4242 4242 4242" + the slashed "12/28" — the
 *         formatters the reference does not have)
 *   234 — the step-3 review with the Shipping Address + Payment cards +
 *         the Edit affordances (the superset cards — the reference's step
 *         3 carries neither)
 *   235 — the step-1-after-Edit state (step 3 → Edit (Shipping) → step 1
 *         with every value preserved — the edit-back navigation contract)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * VLM descriptions are written. ONE server: the production standalone on
 * :3001 (a FRESH process). NO order is placed (every capture stops at
 * the review) — only the cart residue needs the dev-cleanup after.
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
for (let i = 0; i < 60 && !prodUp; i++) {
  await sleep(1000);
  try { const r = await fetch(`${PROD}/api/health`); prodUp = (await r.json()).ok === true; } catch {}
}
if (!prodUp) { console.error("production standalone never came up on :3001"); process.exit(1); }
console.log("production standalone up on :3001");

const browser = await chromium.launch();
const probe = {};

// ---- shared: sign in as the demo customer + build the cart ----------------
const custCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cl = await custCtx.newPage();
await cl.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await cl.getByLabel("Email").fill("john@example.com");
await cl.getByLabel("Password").fill("Demo1234!");
await cl.getByRole("button", { name: "Log in", exact: true }).click();
await cl.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await cl.waitForLoadState("networkidle");
await cl.close();

// the checkout entry path (the specs' own beforeEach shape): clear the cart,
// PDP add, the drawer's Checkout link.
const goToCheckout = async () => {
  const page = await custCtx.newPage();
  // clear the cart through the drawer (deterministic starting state)
  await page.goto(`${PROD}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const clear = async () => {
    await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    for (let guard = 0; guard < 30; guard++) {
      const remove = dialog.getByLabel(/^Remove /).first();
      if (!(await remove.isVisible().catch(() => false))) break;
      await remove.click();
      await sleep(350);
    }
    await page.keyboard.press("Escape");
    await sleep(400);
  };
  await clear();
  await page.goto(`${PROD}/product/wireless-headphones`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.waitForTimeout(1200);
  await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  await dialog.getByRole("link", { name: "Checkout" }).click();
  await page.waitForURL(/\/checkout/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  return page;
};

// ---- 231: checkout step 1, resting (the standing anchor) -------------------
const p231 = await goToCheckout();
probe.s231 = await p231.evaluate(() => {
  const main = document.querySelector("main");
  const labels = [...(main?.querySelectorAll("label") ?? [])].map((l) => l.textContent?.trim());
  const cont = [...(main?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.includes("Continue"));
  return {
    h1: main?.querySelector("h1")?.textContent?.trim(),
    h2: main?.querySelector("h2")?.textContent?.trim(),
    labels,
    continueDisabled: cont ? cont.disabled : null,
    summaryAside: !!main?.querySelector("aside"),
  };
});
await p231.screenshot({ path: `${OUT}/231-checkout-step1-resting.png` });
console.log("231 captured:", JSON.stringify(probe.s231));

// ---- 232: the step-1 GATED state (invalid email) ---------------------------
const main232 = p231.getByRole("main");
await main232.getByLabel("Email").fill("ada@example");
await main232.getByLabel("Address").fill("123 Main St");
await main232.getByLabel("City").fill("New York");
await main232.getByLabel("State").fill("NY");
await main232.getByLabel("ZIP").fill("10001");
await p231.waitForTimeout(500);
probe.s232 = await p231.evaluate(() => {
  const main = document.querySelector("main");
  const cont = [...(main?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.includes("Continue"));
  const email = main?.querySelector("#co-email");
  return {
    emailValue: email?.value ?? null,
    continueDisabled: cont ? cont.disabled : null,
  };
});
await p231.screenshot({ path: `${OUT}/232-checkout-step1-gated-invalid-email.png` });
console.log("232 captured:", JSON.stringify(probe.s232));
await p231.close();

// ---- 233: the step-2 formatted card fields ---------------------------------
const p233 = await goToCheckout();
{
  const main = p233.getByRole("main");
  await main.getByLabel("Address").fill("123 Main St");
  await main.getByLabel("City").fill("New York");
  await main.getByLabel("State").fill("NY");
  await main.getByLabel("ZIP").fill("10001");
  await p233.getByRole("button", { name: "Continue to Payment" }).click();
  await p233.waitForTimeout(700);
  await main.getByLabel("Card Number").pressSequentially("4242424242424242", { delay: 15 });
  await main.getByLabel("Expiry").pressSequentially("1228", { delay: 15 });
  await main.getByLabel("CVC").pressSequentially("123", { delay: 15 });
  await p233.waitForTimeout(400);
}
probe.s233 = await p233.evaluate(() => {
  const main = document.querySelector("main");
  const card = main?.querySelector("#co-card");
  const exp = main?.querySelector("#co-exp");
  const cvc = main?.querySelector("#co-cvc");
  const review = [...(main?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.includes("Review"));
  return {
    cardValue: card?.value ?? null,
    expiryValue: exp?.value ?? null,
    cvcValue: cvc?.value ?? null,
    reviewDisabled: review ? review.disabled : null,
  };
});
await p233.screenshot({ path: `${OUT}/233-checkout-step2-formatted-card.png` });
console.log("233 captured:", JSON.stringify(probe.s233));

// ---- 234: the step-3 review cards + Edit affordances -----------------------
await p233.getByRole("button", { name: "Review Order" }).click();
await p233.waitForTimeout(700);
probe.s234 = await p233.evaluate(() => {
  const main = document.querySelector("main");
  const cards = [...(main?.querySelectorAll("div.rounded-xl") ?? [])].map((c) => c.querySelector("h3")?.textContent?.trim()).filter(Boolean);
  const edits = [...(main?.querySelectorAll("button") ?? [])].filter((b) => b.textContent?.trim() === "Edit").length;
  const pay = main?.textContent?.includes("Card ending in 4242");
  const ship = main?.textContent?.includes("123 Main St");
  return { h2: main?.querySelector("h2")?.textContent?.trim(), cards, editButtons: edits, cardEnding: pay, shippingAddress: ship };
});
await p233.screenshot({ path: `${OUT}/234-checkout-step3-review-cards.png` });
console.log("234 captured:", JSON.stringify(probe.s234));

// ---- 235: the step-1-after-Edit state (preservation) -----------------------
await p233.locator("div.rounded-xl", { hasText: "Shipping Address" }).first().getByRole("button", { name: "Edit" }).click();
await p233.waitForTimeout(700);
probe.s235 = await p233.evaluate(() => {
  const main = document.querySelector("main");
  const v = {};
  for (const [k, id] of Object.entries({ email: "#co-email", address: "#co-address", city: "#co-city", state: "#co-state", zip: "#co-zip" })) {
    const el = main?.querySelector(id);
    v[k] = el?.value ?? null;
  }
  return { h2: main?.querySelector("h2")?.textContent?.trim(), values: v };
});
await p233.screenshot({ path: `${OUT}/235-checkout-step1-after-edit-preserved.png` });
console.log("235 captured:", JSON.stringify(probe.s235));
await p233.close();

custCtx.close();
await browser.close();
killPort(PROD_PORT);
console.log("ALL 5 CAPTURED + PROBED:", JSON.stringify(probe));
