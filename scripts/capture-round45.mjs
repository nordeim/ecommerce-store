#!/usr/bin/env node
/**
 * Round-45 screenshots (236-240) + the live DOM probe, ONE invocation
 * (L26 — the sandbox reaps background processes between tool calls).
 *
 * The ACCOUNT-VALIDATION-1 round's captures: the deliverable's surfaces —
 * each screenshot is the visual proof the round's contract holds.
 *
 *   236 — the account Addresses tab resting (the standing round anchor:
 *         the seeded Default-badged card + the Add New outline + the Edit
 *         ghost button — the reference's cosmetic rendering's clone twin)
 *   237 — the address form's INVALID state (everything valid except the
 *         ZIP "abcde" — the Zod field error under the ZIP input + the
 *         form-level alert; the superset gate the reference's inert form
 *         lacks, measured live)
 *   238 — the default-address exclusivity state (a new card added with
 *         "Set as default" checked — the NEW card carries the Default
 *         badge, the seeded card's badge is GONE; the updateMany flip)
 *   239 — the edit form PREFILLED (the new card's Edit clicked — every
 *         field carries the card's values via the key={id} + defaultValue
 *         contract)
 *   240 — the password form's field error (Current correct + a short New
 *         password — "New password must be at least 8 characters" under
 *         the input; the noValidate form's server-side gate)
 *
 * Probe-first discipline: every state read from the live DOM BEFORE the
 * VLM descriptions are written. ONE server: the production standalone on
 * :3001 (a FRESH process). NO mutation completes except the 238 add + the
 * 239 edit (the address residue cleaned by prisma/dev-cleanup.ts after —
 * the session-45 address guard).
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

// ---- sign in as the demo customer ----------------------------------------
const custCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cl = await custCtx.newPage();
await cl.goto(`${PROD}/login`, { waitUntil: "networkidle" });
await cl.getByLabel("Email").fill("john@example.com");
await cl.getByLabel("Password").fill("Demo1234!");
await cl.getByRole("button", { name: "Log in", exact: true }).click();
await cl.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
await cl.waitForLoadState("networkidle");
await cl.close();

const page = await custCtx.newPage();
await page.goto(`${PROD}/account`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: "Addresses" }).click();
await page.waitForTimeout(1200);

// ---- 236: the addresses tab resting (the standing anchor) -----------------
probe.s236 = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("main div.rounded-xl")].map((c) => ({
    text: c.textContent?.replace(/\s+/g, " ").trim().slice(0, 120),
    hasDefault: !!c.querySelector("button, span") && /Default/.test(c.querySelector("span")?.textContent ?? ""),
  }));
  return { cards: cards.slice(0, 4), addNew: !!document.querySelector("main button.outline, main button") };
});
await page.screenshot({ path: `${OUT}/236-addresses-resting.png`, fullPage: false });
console.log("236 probe:", JSON.stringify(probe.s236.cards[0]));

// ---- 237: the invalid ZIP state -------------------------------------------
await page.getByRole("button", { name: "Add New" }).click();
await page.waitForTimeout(800);
const main = page.getByRole("main");
await main.getByLabel("Full Name").fill("Ada Lovelace");
await main.getByLabel("Street Address").fill("742 Evergreen Terrace");
await main.getByLabel("City").fill("Springfield");
await main.getByLabel("State").fill("IL");
await main.getByLabel("ZIP Code").fill("abcde");
await main.getByLabel("Country").fill("United States");
await page.getByRole("button", { name: "Save Address" }).click();
await page.waitForTimeout(1500);
probe.s237 = await page.evaluate(() => {
  const zipInput = document.getElementById("addr-zip");
  const zipError = zipInput?.nextElementSibling?.textContent?.trim();
  const alert = document.querySelector("main [role=alert]")?.textContent?.trim();
  const cardCount = document.querySelectorAll("main div.rounded-xl").length;
  return { zipValue: zipInput?.value, zipError, alert, cardCount };
});
await page.screenshot({ path: `${OUT}/237-address-form-invalid-zip.png` });
console.log("237 probe:", JSON.stringify(probe.s237));

// ---- 238: the default exclusivity (re-fill ALL — the React-19 action reset) -
await main.getByLabel("Full Name").fill("Ada Lovelace");
await main.getByLabel("Street Address").fill("742 Evergreen Terrace");
await main.getByLabel("City").fill("Springfield");
await main.getByLabel("State").fill("IL");
await main.getByLabel("ZIP Code").fill("62704");
await main.getByLabel("Country").fill("United States");
await main.getByLabel("Set as default address").check();
await page.getByRole("button", { name: "Save Address" }).click();
await page.waitForTimeout(1800);
probe.s238 = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("main div.rounded-xl")].map((c) => ({
    head: c.textContent?.replace(/\s+/g, " ").trim().slice(0, 60),
    badge: /Default/.test(c.querySelector("span")?.textContent ?? ""),
    border2: c.className.includes("border-2"),
  }));
  return { cards };
});
await page.screenshot({ path: `${OUT}/238-default-exclusivity.png` });
console.log("238 probe:", JSON.stringify(probe.s238));

// ---- 239: the edit form prefilled ------------------------------------------
const newCard = page.locator("main div.rounded-xl").filter({ hasText: "742 Evergreen Terrace" }).first();
await newCard.getByRole("button", { name: "Edit" }).click();
await page.waitForTimeout(1000);
probe.s239 = await page.evaluate(() => ({
  name: document.getElementById("addr-name")?.value,
  street: document.getElementById("addr-street")?.value,
  city: document.getElementById("addr-city")?.value,
  zip: document.getElementById("addr-zip")?.value,
  defaultChecked: document.querySelector("input[name=isDefault]")?.checked,
}));
await page.screenshot({ path: `${OUT}/239-edit-form-prefilled.png` });
console.log("239 probe:", JSON.stringify(probe.s239));
// collapse the form without writing (leave the dev DB minimal)
await page.getByRole("button", { name: "Cancel" }).click();
await page.waitForTimeout(600);

// ---- 240: the password form's field error ----------------------------------
await page.getByRole("tab", { name: "Settings" }).click();
await page.waitForTimeout(1000);
await main.getByLabel("Current Password").fill("Demo1234!");
await main.getByLabel("New Password").fill("short");
await main.getByLabel("Confirm Password").fill("short");
await page.getByRole("button", { name: "Update Password" }).click();
await page.waitForTimeout(1500);
probe.s240 = await page.evaluate(() => {
  const np = document.getElementById("acc-np");
  const npError = np?.nextElementSibling?.textContent?.trim();
  return { newValue: np?.value, npError };
});
await page.screenshot({ path: `${OUT}/240-password-field-error.png` });
console.log("240 probe:", JSON.stringify(probe.s240));

await browser.close();
killPort(PROD_PORT);
console.log("CAPTURES DONE: 236-240");
console.log("PROBE SUMMARY:", JSON.stringify(probe, null, 1));
