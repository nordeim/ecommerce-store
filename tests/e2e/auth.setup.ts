import { expect, test as setup } from "@playwright/test";

export const DEMO_EMAIL = "john@example.com";
export const DEMO_PASSWORD = "Demo1234!";

// One authenticated session for the whole run — saved as a storageState and
// replayed into every main-project context. Logging in through the real UI
// form (the clone has no REST login endpoint — auth is a server action), and
// doing it ONCE because the login action is rate-limited.
setup("sign the demo user in", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("main").getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByRole("main").getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("main").getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL("**/account");
  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  await page.context().storageState({ path: "tests/e2e/.auth/user.json" });
});
