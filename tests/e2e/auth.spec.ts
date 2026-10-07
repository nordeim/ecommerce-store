import { expect, test } from "@playwright/test";

// Auth surface — this spec OPTS OUT of the shared storageState because it
// tests the logged-out experience (login/register pages, guards).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("auth", () => {
  test("the login page renders the reference card", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Log in to your account")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create one" })).toBeVisible();
  });

  test("the register page renders the reference card", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByText("Sign up to get started")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    // Reference parity: auth screens are standalone — NO header banner.
    await expect(page.getByRole("banner")).toHaveCount(0);
  });

  test("wrong credentials surface the inline error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    // Target the card's inline error paragraph — Next's route announcer
    // also carries role=alert, so scope to the <p>.
    await expect(page.locator("p[role=alert]")).toContainText("Invalid email or password");
  });

  test("a fresh registration creates the account and lands on /account", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E Runner");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Sup3rSecret!");
    await page.getByLabel("Confirm Password").fill("Sup3rSecret!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/account");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
    await expect(page.getByText("E2E Runner").first()).toBeVisible();
  });

  test("mismatched passwords are rejected client-side", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E Runner");
    await page.getByLabel("Email").fill(`mismatch-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("Sup3rSecret!");
    await page.getByLabel("Confirm Password").fill("different!");
    await page.getByRole("button", { name: "Create account" }).click();
    // The form's browser validation blocks the submit; we stay on /register.
    await expect(page).toHaveURL(/\/register/);
  });

  test("the account page redirects anonymous visitors to login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout returns to the storefront", async ({ page }) => {
    // Register a throwaway account, then log out from the Settings tab.
    const email = `logout-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Name").fill("Logout Test");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Sup3rSecret!");
    await page.getByLabel("Confirm Password").fill("Sup3rSecret!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/account");
    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL(/\/$/);
    // Back on the storefront, the header shows the logged-out icon state
    // (the account link goes to /login).
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Log in" })).toBeVisible();
  });
});
