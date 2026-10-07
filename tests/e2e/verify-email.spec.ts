import { expect, test } from "@playwright/test";

// Email-verification flow (session-4, AUTH-VERIFY-1). The reference gates
// registration behind a "Verify your email" screen (6-digit OTP input) and
// blocks unverified logins. The clone ships the full machinery env-gated
// (AUTH_REQUIRE_EMAIL_VERIFICATION, default off — no email provider is
// wired), so these specs drive the SCREEN and the verify action through a
// seeded unverified fixture (unverified@example.com, code 123456 — restored
// by prisma/e2e-reset.ts every run). The flag-on registration path and the
// unverified-login block are unit-covered (src/lib/verification.test.ts).

test.describe("verify-email", () => {
  test("the screen renders the reference anatomy, standalone", async ({ page }) => {
    await page.goto("/verify-email?email=unverified@example.com");
    await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
    await expect(page.getByText("We sent a code to unverified@example.com")).toBeVisible();
    await expect(page.getByLabel("Verification code")).toBeAttached();
    // 6 visual OTP boxes.
    await expect(page.locator("div.flex.justify-center > div.relative > div.flex > div")).toHaveCount(6);
    // Verify disabled until 6 digits.
    await expect(page.getByRole("button", { name: "Verify" })).toBeDisabled();
    // Resend affordance.
    await expect(page.getByRole("button", { name: "Resend" })).toBeVisible();
    await expect(page.getByText("Didn't receive the code?")).toBeVisible();
    // Reference parity: standalone screen — no header/footer chrome.
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
    // Document title: "Verify Email | Lumina" (the reference keeps the SPA's
    // stale "Register | Lumina" — a registered deliberate divergence).
    await expect(page).toHaveTitle("Verify Email | Lumina");
  });

  test("a wrong code decrements the attempt budget in the alert box", async ({ page }) => {
    await page.goto("/verify-email?email=unverified@example.com");
    await page.getByLabel("Verification code").fill("000000");
    await page.getByRole("button", { name: "Verify" }).click();
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(box).toContainText("Invalid verification code. 4 attempts remaining.");
    await expect(page).toHaveURL(/\/verify-email/);
  });

  test("the correct code verifies the account and lands on /account", async ({ page }) => {
    await page.goto("/verify-email?email=unverified@example.com");
    await page.getByLabel("Verification code").fill("123456");
    await page.getByRole("button", { name: "Verify" }).click();
    await page.waitForURL("**/account");
    // The profile tab anchors on the user's name heading + tab list.
    await expect(page.getByRole("heading", { name: "Unverified Fixture" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Orders" })).toBeVisible();
    // The session is real: the header shows the logged-in account icon.
    await expect(page.getByRole("banner").getByRole("link", { name: /account/i }).first()).toBeVisible();
  });
});
