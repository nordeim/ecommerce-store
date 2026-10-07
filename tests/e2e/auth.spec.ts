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

  test("the login card matches the reference form contract (session-3)", async ({ page }) => {
    await page.goto("/login");
    // Reference: password input carries the dot placeholder.
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "placeholder",
      "••••••••",
    );
    // Reference: "Forgot password?" is an ENABLED text-xs link to the
    // standalone reset screen (not aria-disabled, not a self-link).
    const forgot = page.getByRole("link", { name: "Forgot password?" });
    await expect(forgot).toBeEnabled();
    await expect(forgot).toHaveAttribute("href", "/forgot-password");
    await expect(forgot).toHaveCSS("font-size", "12px");
  });

  test("the register form matches the reference fields (session-3)", async ({ page }) => {
    await page.goto("/register");
    // Reference: exactly Email / Password / Confirm Password — NO Name field.
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveCount(0);
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "placeholder",
      "••••••••",
    );
    await expect(page.getByLabel("Confirm Password")).toHaveAttribute(
      "placeholder",
      "••••••••",
    );
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
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Sup3rSecret!");
    await page.getByLabel("Confirm Password").fill("Sup3rSecret!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/account");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
    // The display name is DERIVED from the email local part (reference has
    // no Name field): "e2e-<ts>" -> "E2e <ts>".
    await expect(page.getByRole("heading", { name: /^E2e \d+/ })).toBeVisible();
    await expect(page.getByText(email).first()).toBeVisible();
  });

  test("mismatched passwords are rejected client-side", async ({ page }) => {
    await page.goto("/register");
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

test.describe("forgot password (session-3 parity)", () => {
  test("the reset screen renders standalone with the reference anatomy", async ({ page }) => {
    await page.goto("/forgot-password");
    // Standalone auth screen: NO storefront chrome.
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.getByText("We'll send you a link to reset it")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to log in" })).toHaveAttribute(
      "href",
      "/login",
    );
    await expect(page).toHaveTitle(/Forgot Password/);
  });

  test("submitting an email shows the neutral confirmation (anti-enumeration)", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill(`reset-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(
      page.getByText("If an account exists with that email, you'll receive a password reset link shortly."),
    ).toBeVisible();
    // The form is replaced entirely (reference behavior).
    await expect(page.getByRole("button", { name: "Send reset link" })).toHaveCount(0);
    // Same copy for a KNOWN account — no user-enumeration signal.
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill("john@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(
      page.getByText("If an account exists with that email, you'll receive a password reset link shortly."),
    ).toBeVisible();
  });

  test("an invalid email is rejected with a field error", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.locator("p[role=alert]")).toContainText(/valid email/i);
    await expect(
      page.getByText("If an account exists with that email"),
    ).toHaveCount(0);
  });

  test("Back to log in returns to the login screen", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("link", { name: "Back to log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
