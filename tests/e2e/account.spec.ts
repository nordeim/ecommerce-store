import { expect, test } from "@playwright/test";

// Account dashboard (the "dashboard" surface): tabs, profile form, order
// history (seeded reference orders), addresses, settings. Authenticated via
// the setup project's storageState (john@example.com / Demo1234!).

test.describe("account", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  });

  test("renders the four reference tabs", async ({ page }) => {
    for (const tab of ["Profile", "Orders", "Addresses", "Settings"]) {
      await expect(page.getByRole("tab", { name: tab, exact: true })).toBeVisible();
    }
  });

  test("profile shows the identity block and prefilled form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "John Doe" })).toBeVisible();
    await expect(page.getByRole("main").getByText("john@example.com").first()).toBeVisible();
    await expect(page.getByRole("main").getByLabel("First Name")).toHaveValue("John");
    await expect(page.getByRole("main").getByLabel("Last Name")).toHaveValue("Doe");
    await expect(page.getByRole("main").getByLabel("Email")).toHaveValue("john@example.com");
  });

  test("profile edits persist", async ({ page }) => {
    await page.getByRole("main").getByLabel("Phone").fill("+1 (555) 999-0000");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByLabel("Profile saved")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("main").getByLabel("Phone")).toHaveValue("+1 (555) 999-0000");
  });

  test("orders tab lists the seeded reference order history", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    const history = page.getByRole("tabpanel");
    await expect(history.getByText("ORD-2026-001")).toBeVisible();
    await expect(history.getByText("Mar 28, 2026 · 2 items")).toBeVisible();
    await expect(history.getByText("ORD-2026-002")).toBeVisible();
    await expect(history.getByText("ORD-2026-003")).toBeVisible();
    await expect(history.getByText("$349.98")).toBeVisible();
    await expect(history.getByText("Delivered").first()).toBeVisible();
    await expect(history.getByText("In Transit").first()).toBeVisible();
  });

  test("addresses tab shows the seeded default address", async ({ page }) => {
    await page.getByRole("tab", { name: "Addresses" }).click();
    await expect(page.getByRole("button", { name: "Add New" })).toBeVisible();
    await expect(page.getByRole("main").getByText("Default").first()).toBeVisible();
    await expect(page.getByRole("main").getByText("123 Main Street")).toBeVisible();
    await expect(page.getByRole("main").getByText("New York, NY 10001")).toBeVisible();
    await expect(page.getByRole("main").getByText("United States").first()).toBeVisible();
  });

  test("a new address can be added and becomes selectable", async ({ page }) => {
    await page.getByRole("tab", { name: "Addresses" }).click();
    await page.getByRole("button", { name: "Add New" }).click();
    await page.getByRole("main").getByLabel("Full Name").fill("John Doe");
    await page.getByRole("main").getByLabel("Street Address").fill("456 Broadway");
    await page.getByRole("main").getByLabel("City").fill("Brooklyn");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP Code").fill("11211");
    await page.getByRole("button", { name: "Save Address" }).click();
    await expect(page.getByRole("main").getByText("456 Broadway")).toBeVisible();
  });

  test("settings renders the password form and notifications placeholder", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    await expect(page.getByRole("main").getByLabel("Current Password")).toBeVisible();
    await expect(page.getByRole("main").getByLabel("New Password")).toBeVisible();
    await expect(page.getByRole("main").getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByText("Email notification preferences coming soon.")).toBeVisible();
  });

  test("wrong current password is rejected with an inline error", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByRole("main").getByLabel("Current Password").fill("not-the-password");
    await page.getByRole("main").getByLabel("New Password").fill("NewPass1234!");
    await page.getByRole("main").getByLabel("Confirm Password").fill("NewPass1234!");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(page.getByRole("main").getByText("Incorrect password")).toBeVisible();
  });
});
