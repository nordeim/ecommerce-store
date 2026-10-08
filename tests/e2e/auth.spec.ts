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
    // Reference parity (session-4): auth errors render as the tinted alert
    // BOX (div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm)
    // directly inside the card, above the form — copy unchanged.
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(box).toContainText("Invalid email or password");
    // bg-destructive/10 — alpha utility (trap 6): v3 rgba() vs v4 lab().
    const boxBg = await box.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(boxBg).toMatch(/rgba\(219, 63, 63, 0\.1\)|lab\(55\.\d+ [\d.-]+ [\d.-]+ \/ 0\.1\)/);
    await expect(box).toHaveCSS("border-radius", "12px"); // rounded-lg = --radius
    await expect(box).toHaveCSS("font-size", "14px");
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

  test("mismatched passwords keep the user on /register", async ({ page }) => {
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
    // Session-6 (REDIRECT-1): the gate carries the intent — the shopper
    // returns to /account after logging in, not the generic landing.
    // (Next.js does not percent-encode the slash in the query value.)
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)account$/);
  });

  test("login honors a valid redirect target (session-6)", async ({ page }) => {
    await page.goto("/login?redirect=%2Fshop%3Fcategory%3Delectronics");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL("**/shop?category=electronics");
    await expect(page.getByRole("heading", { name: "Electronics" })).toBeVisible();
  });

  test("login ignores open-redirect payloads (session-6)", async ({ page }) => {
    await page.goto("/login?redirect=%2F%2Fevil.com");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    // The payload was ignored — the default account landing, and the
    // browser never leaves the origin.
    await page.waitForURL("**/account");
    await expect(page).toHaveURL(/\/account$/);
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

  test("auth field spacing matches the reference 11px label gaps (session-8, trap 8)", async ({ page }) => {
    // SPACE-Y-INLINE-1: Tailwind v4's space-y-* emits margin-block-end on
    // NON-LAST children — inert when that child is the inline <label>, so
    // the clone collapsed the label→input gap to the 3px strut. The
    // reference (v3) landed margin-top on the block input wrapper: 11px
    // visual gap (3px strut + 8px margin), measured live 2026-10-08 on
    // every auth field. The fix restores it per-seam (mt-2 on the input
    // wrappers); this pins the computed geometry.
    const labelToInputGap = (labelText: string) =>
      page.evaluate((txt) => {
        const label = [...document.querySelectorAll("label")].find(
          (l) => l.textContent?.trim() === txt,
        );
        if (!label) throw new Error(`label "${txt}" not found`);
        const input = label.parentElement?.querySelector("input");
        if (!input) throw new Error(`input for "${txt}" not found`);
        const lr = label.getBoundingClientRect();
        const ir = input.getBoundingClientRect();
        return ir.y - (lr.y + lr.height);
      }, labelText);

    await page.goto("/login");
    expect(Math.abs((await labelToInputGap("Email")) - 11)).toBeLessThanOrEqual(1);

    await page.goto("/register");
    for (const field of ["Email", "Password", "Confirm Password"]) {
      expect(Math.abs((await labelToInputGap(field)) - 11)).toBeLessThanOrEqual(1);
    }

    await page.goto("/forgot-password");
    expect(Math.abs((await labelToInputGap("Email address")) - 11)).toBeLessThanOrEqual(1);
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

  test("an invalid email is blocked by NATIVE browser validation (reference parity, session-4)", async ({ page }) => {
    // The reference has NO noValidate on its auth forms — the type=email
    // input blocks submission with the browser's own bubble and the server
    // never sees the malformed value. The clone must match: no custom
    // error, no confirmation copy.
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Send reset link" }).click();
    const valid = await page
      .getByLabel("Email address")
      .evaluate((el) => (el as HTMLInputElement).checkValidity());
    expect(valid).toBe(false);
    await expect(
      page.getByText("If an account exists with that email"),
    ).toHaveCount(0);
    await expect(page.locator("div.mb-4.p-3.rounded-lg")).toHaveCount(0);
  });

  test("duplicate registration shows the reference's box + copy (session-4)", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
    await page.getByLabel("Confirm Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Create account" }).click();
    // Reference copy (measured live): "A user with this email already
    // exists" — rendered in the shared alert box.
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(box).toContainText("A user with this email already exists");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("mismatched passwords render in the shared alert box (session-4)", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(`mismatch-box-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("Sup3rSecret!");
    await page.getByLabel("Confirm Password").fill("different!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.locator("div.mb-4.p-3.rounded-lg")).toContainText("Passwords do not match");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("Back to log in returns to the login screen", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("link", { name: "Back to log in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  // Session-20 (RESET-ROUTE-1): the reference ships a REAL /reset-password
  // route — the auth family's missing member on the clone (discovered via
  // the reference's own sitemap, which lists it). Two states, both measured
  // live 2026-10-09: no token -> the "Invalid reset link" screen; any
  // token -> the "New password" form. The e2e-reset fixture seeds
  // resetuser@example.com (Reset1234!) with the deterministic token
  // "reset-fixture-token".
  test("reset-password without a token renders the invalid-link screen (session-20)", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).toHaveTitle("Reset Password | Lumina");
    await expect(page.getByRole("heading", { name: "Invalid reset link" })).toBeVisible();
    // The measured card copy.
    await expect(page.locator(".bg-card")).toContainText(
      "The link you used appears to be incomplete. Please request a new password reset email.",
    );
    // The "Request a new link" link routes to forgot-password (measured).
    await expect(page.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    // og:url is the clean canonical (no query) — the reference preserves
    // the query when present; absent means absent.
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "http://localhost:3000/reset-password",
    );
  });

  test("reset-password with a token renders the New password form (session-20)", async ({ page }) => {
    await page.goto("/reset-password?token=reset-fixture-token");
    await expect(page).toHaveTitle("Reset Password | Lumina");
    await expect(page.getByRole("heading", { name: "New password" })).toBeVisible();
    // Both fields carry the Label htmlFor association + the reference's
    // placeholder + new-password autocomplete (measured on the reference).
    const pw = page.getByLabel("New Password", { exact: true });
    await expect(pw).toHaveAttribute("placeholder", "••••••••");
    await expect(pw).toHaveAttribute("autocomplete", "new-password");
    const confirm = page.getByLabel("Confirm Password");
    await expect(confirm).toHaveAttribute("placeholder", "••••••••");
    await expect(confirm).toHaveAttribute("autocomplete", "new-password");
    await expect(page.getByRole("button", { name: "Reset password" })).toBeVisible();
    // og:url preserves the token query (measured on the reference with
    // ?token=test123).
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "http://localhost:3000/reset-password?token=reset-fixture-token",
    );
  });

  test("a bogus token surfaces the reference's error copy (session-20)", async ({ page }) => {
    await page.goto("/reset-password?token=bogus-token");
    await page.getByLabel("New Password", { exact: true }).fill("BrandNewPass1!");
    await page.getByLabel("Confirm Password").fill("BrandNewPass1!");
    await page.getByRole("button", { name: "Reset password" }).click();
    // Measured live with a bogus token: the tinted error box carrying
    // "Invalid or expired reset token".
    await expect(page.locator("div.mb-4.p-3.rounded-lg")).toContainText(
      "Invalid or expired reset token",
    );
  });

  test("the full reset flow: new password works, old fails, sessions die (session-20)", async ({ page, browser }) => {
    // Pre-step: create a session for the fixture user, so the
    // session-invalidation pin has a live session to kill. The context
    // stays OPEN across the reset (its cookie is the probe).
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await pageA.goto("/login");
    await pageA.getByLabel("Email").fill("resetuser@example.com");
    await pageA.getByLabel("Password", { exact: true }).fill("Reset1234!");
    await pageA.getByRole("button", { name: "Log in" }).click();
    await expect(pageA).toHaveURL(/\/account$/);

    // The reset itself (in the main, storageState-less context).
    await page.goto("/reset-password?token=reset-fixture-token");
    await page.getByLabel("New Password", { exact: true }).fill("NewPass4567!");
    await page.getByLabel("Confirm Password").fill("NewPass4567!");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // The pre-reset session was invalidated: pageA's cookie no longer
    // authenticates — /account gates it to /login (the ADR-014 redirect).
    await pageA.goto("/account");
    await expect(pageA).toHaveURL(/\/login\?redirect=/);
    await ctxA.close();

    // The NEW password logs in.
    await page.getByLabel("Email").fill("resetuser@example.com");
    await page.getByLabel("Password", { exact: true }).fill("NewPass4567!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/account$/);

    // The OLD password no longer works (the pinned copy) — probed in a
    // fresh anonymous context (the main page holds the new session).
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await pageB.goto("/login");
    await pageB.getByLabel("Email").fill("resetuser@example.com");
    await pageB.getByLabel("Password", { exact: true }).fill("Reset1234!");
    await pageB.getByRole("button", { name: "Log in" }).click();
    await expect(pageB.locator("div.mb-4.p-3.rounded-lg")).toContainText("Invalid email or password");
    await ctxB.close();
  });
});
