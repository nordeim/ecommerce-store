import { expect, test } from "@playwright/test";
import { clearCartViaDrawer } from "./helpers";

// Cart flows: add from card and PDP, drawer totals, quantity stepper,
// remove, and the badge count. Contexts arrive authenticated (storageState)
// but cart state starts empty (the seed creates no carts).

test.describe("cart", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
  });

  test("adding from a product card opens the drawer with correct totals", async ({ page }) => {
    await page.goto("/shop");
    await page.locator(".bg-card.group").first().hover();
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Cart \(1\)/ })).toBeVisible();
    await expect(dialog.getByText("Subtotal").locator("..")).toContainText("$299.99");
    await expect(dialog.getByText("Total").locator("..").last()).toContainText("$299.99");
    // Free shipping over $100 (the announcement's threshold).
    await expect(dialog.getByText("Shipping").locator("..")).toContainText("Free");
  });

  test("PDP add respects the quantity stepper", async ({ page }) => {
    await page.goto("/product/leather-watch");
    await page.getByLabel("Increase quantity", { exact: true }).click();
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // The stepper was increased once: 2 × $189.00.
    await expect(dialog.getByRole("heading", { name: /Cart \(2\)/ })).toBeVisible();
    await expect(dialog.getByText("$189.00").first()).toBeVisible();
    await expect(dialog.getByText("$378.00").first()).toBeVisible();
  });

  test("quantity stepper in the drawer updates totals; remove clears the cart", async ({ page }) => {
    await page.goto("/product/vitamin-c-serum");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Increase twice: 3 × $34.99 = $104.97 (crosses the free-shipping line).
    await dialog.getByLabel(/Increase quantity/).click();
    await dialog.getByLabel(/Increase quantity/).click();
    await expect(dialog.getByText("$104.97").first()).toBeVisible();
    await expect(dialog.getByText("Shipping").locator("..")).toContainText("Free");
    // Remove empties the drawer.
    await dialog.getByLabel(/Remove/).click();
    await expect(dialog.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  });

  test("header badge tracks the item count", async ({ page }) => {
    await page.goto("/product/silk-pajama");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    // The add is a server action — wait for the drawer to actually OPEN
    // before dismissing it, or the Escape races the drawer mount.
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    await page.waitForTimeout(600);
    // Radix marks the page chrome aria-hidden while the dialog is open —
    // close the drawer before asserting on the header button.
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
  });

  test("the full-page cart mirrors the drawer", async ({ page }) => {
    await page.goto("/product/yoga-mat");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await page.getByRole("dialog").getByRole("link", { name: "View Cart" }).click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();
    await expect(page.getByText("$69.99").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Checkout" })).toBeVisible();
  });
});
