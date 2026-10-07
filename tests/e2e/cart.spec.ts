import { expect, test } from "@playwright/test";
import { clearCartViaDrawer, openCartDrawer } from "./helpers";

// Cart flows: add from card and PDP, drawer totals, quantity stepper,
// remove, and the badge count. Contexts arrive authenticated (storageState)
// but cart state starts empty (the seed creates no carts).
//
// Reference parity (verified live 2026-10-07): adding to cart NEVER opens
// the drawer — only the header badge changes. The drawer opens exclusively
// via the header cart button, which is how these specs reach it.

test.describe("cart", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
  });

  test("adding to cart does not auto-open the drawer (reference parity)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    // The add is a server action — give the mutation a beat to land, then
    // assert the resting state: badge bumped, drawer closed.
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await page.waitForTimeout(700);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("adding from a card bumps the badge; the drawer (via header) shows correct totals", async ({ page }) => {
    await page.goto("/shop");
    await page.locator(".bg-card.group").first().hover();
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
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
    await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    // The stepper was increased once: 2 × $189.00.
    await expect(dialog.getByRole("heading", { name: /Cart \(2\)/ })).toBeVisible();
    await expect(dialog.getByText("$189.00").first()).toBeVisible();
    await expect(dialog.getByText("$378.00").first()).toBeVisible();
  });

  test("quantity stepper in the drawer updates totals; remove clears the cart", async ({ page }) => {
    await page.goto("/product/vitamin-c-serum");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
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
    // Reference parity: the drawer never auto-opens, so the badge is
    // assertable directly — no dialog to dismiss first.
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
  });

  test("the full-page cart mirrors the drawer", async ({ page }) => {
    await page.goto("/product/yoga-mat");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    await page.getByRole("dialog").getByRole("link", { name: "View Cart" }).click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();
    await expect(page.getByText("$69.99").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Checkout" })).toBeVisible();
  });
});
