import { expect, test, type Page } from "@playwright/test";
import { adminLogin, clearCartViaDrawer, openCartDrawer } from "./helpers";

// Stock enforcement (session-6, STOCK-1): the reference has no inventory
// concept, so the clone's stock handling is pure superset — but it must be
// PRODUCTION-correct: the server (not just the PDP UI) enforces stock.
// Pins three seams:
//   1. Cart steppers CLAMP at available stock (API-level callers cannot
//      assemble an over-stock cart; decreases always pass through).
//   2. Order placement REJECTS overselling when stock dropped after the
//      cart was assembled (customer-safe message; the order does not land).
//   3. A successful order DECREMENTS stock (atomic with placement).
//
// Stock is controlled through the REAL admin seam (login as the seeded
// admin, edit the products-page stock form). The shared adminLogin helper
// lives in helpers.ts (session-7: also used by admin.spec.ts); the login
// rate limiter is per IP+email, so the admin logins draw from their own
// bucket (the setup's demo-user login is a different email).

/** Set a product's stock through the admin products form (the real seam). */
async function setStock(admin: Page, productName: string, value: number): Promise<void> {
  await admin.goto("/admin/products");
  const input = admin.getByLabel(`Stock for ${productName}`);
  await input.fill(String(value));
  // The Save button sits in the input's flex-row wrapper inside the row card.
  await input.locator("xpath=following-sibling::button").click();
  // The server action + router.refresh() land asynchronously — give the
  // write a beat, then verify against a fresh render (server truth).
  await admin.waitForTimeout(800);
  await admin.reload();
  await expect(admin.getByLabel(`Stock for ${productName}`)).toHaveValue(String(value));
}

test.describe("stock enforcement (session-6)", () => {
  test("cart steppers clamp at the available stock", async ({ page, browser }) => {
    const admin = await adminLogin(browser);
    try {
      await clearCartViaDrawer(page);
      await setStock(admin, "Wireless Charging Pad", 2);

      // Assemble a 1-unit cart through the real PDP.
      await page.goto("/product/charging-pad");
      await page.getByRole("button", { name: "Add to Cart" }).first().click();
      await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();

      // Drive the DRAWER stepper — its +1 goes through the server action,
      // which must clamp the second increase at stock 2 (never 3).
      await openCartDrawer(page);
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel(/Increase quantity/).click();
      await page.waitForTimeout(400);
      await dialog.getByLabel(/Increase quantity/).click();
      await page.waitForTimeout(600);
      // Clamped: the drawer's TOTAL still reflects 2 units + $9.99 shipping
      // ($89.97), not the 3-unit $119.97 (which would ship free).
      await expect(dialog.getByText("$89.97")).toBeVisible();
      await expect(dialog.getByText("$119.97")).toHaveCount(0);

      // Decreases still pass through even at the cap.
      await dialog.getByLabel(/Decrease quantity/).click();
      await page.waitForTimeout(400);
      await expect(dialog.getByText("$49.98")).toBeVisible();
    } finally {
      // Restore canonical stock; the admin context closes with the test.
      await setStock(admin, "Wireless Charging Pad", 25).catch(() => {});
      await admin.close();
    }
  });

  test("placement rejects overselling after a stock drop, then decrements on success", async ({ page, browser }) => {
    const admin = await adminLogin(browser);
    try {
      await clearCartViaDrawer(page);
      await setStock(admin, "Ceramic Planter Set", 2);

      // Assemble a 2-unit cart while stock is 2 (PDP stepper allows it).
      await page.goto("/product/ceramic-planter");
      await page.getByRole("button", { name: "Increase quantity" }).click(); // PDP stepper: 2
      await page.getByRole("button", { name: "Add to Cart" }).first().click();
      await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();

      // The admin drops stock to 1 AFTER the cart was assembled.
      await setStock(admin, "Ceramic Planter Set", 1);

      // Checkout must reject the 2-unit order with a customer-safe message.
      // (waitForLoadState: the wizard is a client island — filling before
      // hydration completes gets the values wiped by React's adoption of
      // the server DOM.)
      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");
      await page.getByRole("main").getByLabel("First Name").fill("John");
      await page.getByRole("main").getByLabel("Last Name").fill("Doe");
      await page.getByRole("main").getByLabel("Email").fill("john@example.com");
      await page.getByRole("main").getByLabel("Address").fill("123 Main St");
      await page.getByRole("main").getByLabel("City").fill("New York");
      await page.getByRole("main").getByLabel("State").fill("NY");
      await page.getByRole("main").getByLabel("ZIP").fill("10001");
      await page.getByRole("button", { name: "Continue to Payment" }).click();
      await page.getByRole("radio", { name: "PayPal" }).check();
      await page.getByRole("button", { name: "Review Order" }).click();
      await page.getByRole("button", { name: /Place Order/ }).click();
      await expect(page.getByText(/only has 1 left in stock/i)).toBeVisible();
      // The order did NOT go through — still on the checkout route.
      await expect(page).toHaveURL(/\/checkout$/);

      // Reduce to the available unit on /cart and place — now it succeeds.
      // (The wizard remounts fresh on this navigation — refill the form.)
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");
      await page.getByRole("main").getByLabel(/Decrease quantity/).click();
      await expect(page.getByRole("main").getByText("$89.98")).toBeVisible(); // 79.99 + 9.99
      await page.getByRole("main").getByRole("link", { name: "Checkout" }).click();
      await page.waitForLoadState("networkidle");
      await page.getByRole("main").getByLabel("Address").fill("123 Main St");
      await page.getByRole("main").getByLabel("City").fill("New York");
      await page.getByRole("main").getByLabel("State").fill("NY");
      await page.getByRole("main").getByLabel("ZIP").fill("10001");
      await page.getByRole("button", { name: "Continue to Payment" }).click();
      await page.getByRole("radio", { name: "PayPal" }).check();
      await page.getByRole("button", { name: "Review Order" }).click();
      await page.getByRole("button", { name: /Place Order/ }).click();
      await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();

      // The placement decremented stock: 1 - 1 = 0 — the PDP is now sold out.
      await page.goto("/product/ceramic-planter");
      await expect(page.getByRole("button", { name: "Out of Stock" })).toBeDisabled();
    } finally {
      await setStock(admin, "Ceramic Planter Set", 25).catch(() => {});
      await admin.close();
    }
  });
});
