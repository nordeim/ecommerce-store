// Round-47 follow-up probe D2: the reference's /reset-password PENDING label
// (the fourth family member). Holds a MATCHING-password submit (bogus token —
// after release the server rejects it; no account impact) and reads the
// button during flight. Also re-verifies the register max-boundary rule on
// the reference with a MISMATCHED confirm (the A4 unmeasured corner: does
// the mismatch-first rule extend past the length check?).
// Run: node scripts/auth-error-probe-r47d2.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const SETTLE = 900;
const browser = await chromium.launch();

const cardState = async (page) =>
  page.evaluate(() => {
    const destructive = [...document.querySelectorAll("div,p")].filter(
      (el) => /destructive/.test(el.className) && el.className.includes("rounded"),
    );
    const form = document.querySelector("form");
    return {
      boxText: destructive[0]?.textContent?.trim() ?? null,
      submitText: form ? (form.querySelector("button[type=submit]")?.textContent ?? "").trim() : null,
      submitDisabled: form ? form.querySelector("button[type=submit]")?.hasAttribute("disabled") : null,
    };
  });

// --- D2: the reset pending label -------------------------------------------
{
  console.log("=== D2. /reset-password — the pending label ===");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const state = { held: [] };
  await page.goto(`${REF}/reset-password?token=bogus-r47-d2`, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE);
  await ctx.route(`${REF}/**`, (route) => {
    if (route.request().method() !== "GET") {
      state.held.push(route);
      return undefined;
    }
    return route.continue();
  });
  await page.getByLabel(/new password/i).first().fill("ValidPass123!");
  await page.getByLabel(/confirm password/i).first().fill("ValidPass123!");
  await page.getByRole("button", { name: /reset password/i }).click();
  await page.waitForTimeout(700);
  const during = await cardState(page);
  console.log(`  D2 during-flight text    ${JSON.stringify(during.submitText)}`);
  console.log(`  D2 during-flight disabled ${during.submitDisabled}`);
  for (const r of state.held) await r.continue().catch(() => {});
  await page.waitForTimeout(SETTLE);
  console.log(`  D2 after-release box      ${JSON.stringify((await cardState(page)).boxText)}`);
  await ctx.close();
}

// --- A4b: the register max-boundary with MISMATCHED confirm -----------------
{
  console.log("\n=== A4b. /register — 129-char + mismatched (the A4 corner) ===");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${REF}/register`, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE);
  const long = "x".repeat(129);
  await page.getByLabel("Email").fill("probe-r47@example.com");
  await page.getByLabel("Password", { exact: true }).fill(long);
  await page.getByLabel("Confirm Password").fill("y".repeat(129));
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(SETTLE);
  console.log(`  A4b 129+mismatch box ${JSON.stringify((await cardState(page)).boxText)}`);
  await ctx.close();
}

await browser.close();
console.log("\nD2 + A4b COMPLETE");
