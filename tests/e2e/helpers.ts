import type { Browser, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const DEMO_EMAIL = "john@example.com";
export const DEMO_PASSWORD = "Demo1234!";
export const ADMIN_EMAIL = "admin@luxestore.com";
export const ADMIN_PASSWORD = "Admin1234!";

/**
 * Logs in as the seeded ADMIN through a second browser context and opens
 * the console. The admin email draws from its own rate-limit bucket
 * (login limit is per IP+email), so it coexists with the demo-user setup
 * login. The login form lands everyone on /account — the admin then opens
 * the role-gated console explicitly.
 */
export async function adminLogin(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  const admin = await ctx.newPage();
  await admin.goto("/login");
  await admin.getByLabel("Email").fill(ADMIN_EMAIL);
  await admin.getByLabel("Password").fill(ADMIN_PASSWORD);
  await admin.getByRole("button", { name: "Log in", exact: true }).click();
  await admin.waitForURL("**/account");
  await admin.goto("/admin");
  await expect(admin.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  return admin;
}

/**
 * Opens the cart drawer through the header cart button — the ONLY way the
 * reference opens it. Adding to cart bumps the badge but never opens the
 * drawer (verified live on the reference, 2026-10-07), so specs that inspect
 * drawer contents must open it explicitly, exactly like a reference user.
 */
export async function openCartDrawer(page: Page): Promise<void> {
  await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
}

/**
 * Empties the cart through the real drawer UI. Cart/wishlist specs assert
 * absolute counts, so each depends on starting from zero — both for
 * leftovers from earlier specs in this run and (belt-and-braces with the
 * global reset) anything a previous run left behind.
 */
export async function clearCartViaDrawer(page: Page): Promise<void> {
  await page.goto("/");
  await openCartDrawer(page);
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  for (let guard = 0; guard < 30; guard++) {
    const remove = dialog.getByLabel(/^Remove /).first();
    if (!(await remove.isVisible().catch(() => false))) break;
    await remove.click();
    await page.waitForTimeout(400);
  }
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
}
