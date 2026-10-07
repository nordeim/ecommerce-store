import { expect, test } from "@playwright/test";
import { clearCartViaDrawer } from "./helpers";

// The checkout funnel: the 3-step wizard, server-side validation gates
// (Continue is disabled until the step is valid), the placed order, and the
// account order history. Runs authenticated; the cart is seeded per test.

test.describe("checkout", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("the full 3-step flow places the order and confirms", async ({ page }) => {
    // Step 1: shipping — Continue stays disabled until the form is valid.
    const cont = page.getByRole("button", { name: "Continue to Payment" });
    await expect(cont).toBeDisabled();
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await expect(cont).toBeEnabled();
    await cont.click();

    // Step 2: payment — card fields gate Review Order.
    const review = page.getByRole("button", { name: "Review Order" });
    await expect(review).toBeDisabled();
    await page.getByRole("main").getByLabel("Card Number").fill("4242424242424242");
    await page.getByRole("main").getByLabel("Expiry").fill("12/28");
    await page.getByRole("main").getByLabel("CVC").fill("123");
    await expect(review).toBeEnabled();
    await review.click();

    // Step 3: review + place.
    await expect(page.getByRole("heading", { name: /Review & Place Order/ })).toBeVisible();
    await expect(page.getByText("Card ending in 4242")).toBeVisible();
    const place = page.getByRole("button", { name: /Place Order — \$299\.99/ });
    await expect(place).toBeEnabled();
    await place.click();

    // Confirmation page with the order number.
    await page.waitForURL(/\/checkout\/success\?order=/);
    await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();
    await expect(page.getByText(/ORD-\d{4}-\d+/)).toBeVisible();
  });

  test("the placed order lands in the account order history", async ({ page }) => {
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("main").getByLabel("Card Number").fill("4242424242424242");
    await page.getByRole("main").getByLabel("Expiry").fill("12/28");
    await page.getByRole("main").getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: "Review Order" }).click();
    await page.getByRole("button", { name: /Place Order/ }).click();
    await page.waitForURL(/\/checkout\/success\?order=/);
    const number = (await page.url()).match(/order=([^&]+)/)?.[1] ?? "";

    await page.goto("/account");
    await page.getByRole("tab", { name: "Orders" }).click();
    const history = page.getByRole("tabpanel");
    await expect(history.getByText(number)).toBeVisible();
    // Freshly placed orders start as Processing.
    await expect(history.getByText("Processing").first()).toBeVisible();
  });

  test("PayPal skips the card fields", async ({ page }) => {
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByText("PayPal").click();
    const review = page.getByRole("button", { name: "Review Order" });
    await expect(review).toBeEnabled();
    await review.click();
    await expect(page.getByText("PayPal", { exact: true }).last()).toBeVisible();
  });

  test("the order summary aside shows line items and total", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Order Summary" })).toBeVisible();
    await expect(page.getByText("Wireless Noise-Cancelling Headphones").first()).toBeVisible();
    await expect(page.getByText("$299.99").first()).toBeVisible();
  });
});
