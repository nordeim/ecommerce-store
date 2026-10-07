import { expect, test } from "@playwright/test";
import { openCartDrawer } from "./helpers";

// Guest carts (session-4 bug fix, found live during A/B verification): the
// cart mutations used to pass `undefined` as the guest token, so every guest
// add minted a NEW cart (orphaning previous items) and guest steppers read
// as empty. All other cart specs run authenticated (storageState), which is
// exactly why this survived three sessions. These specs opt OUT of the
// storageState to exercise the cookie-token path.

test.describe("guest cart", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a guest accumulates items across adds in ONE cart", async ({ page }) => {
    await page.goto("/product/vitamin-c-serum");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await page.goto("/product/leather-watch");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Cart \(2\)/ })).toBeVisible();
    await expect(dialog.getByText("Vitamin C Serum")).toBeVisible();
    await expect(dialog.getByText("Minimalist Leather Watch")).toBeVisible();
    // $34.99 + $189.00 = $223.99 (above the free-shipping line).
    await expect(dialog.getByText("Subtotal").locator("..")).toContainText("$223.99");
    await expect(dialog.getByText("Shipping").locator("..")).toContainText("Free");
  });

  test("guest steppers adjust quantity instead of emptying the cart", async ({ page }) => {
    await page.goto("/product/vitamin-c-serum");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Increase quantity/).click();
    await expect(dialog.getByText("$69.98").first()).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Cart \(2\)/ })).toBeVisible();
    // The guest cart survives a reload (cookie token, DB-backed).
    await page.reload();
    await openCartDrawer(page);
    await expect(page.getByRole("dialog").getByText("$69.98").first()).toBeVisible();
  });
});
