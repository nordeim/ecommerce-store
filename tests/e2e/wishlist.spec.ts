import { expect, test } from "@playwright/test";

// Wishlist flows: heart toggle on cards, the wishlist page grid, and the
// empty state for a fresh session.

test.describe("wishlist", () => {
  test("toggling the heart adds the product to the wishlist page", async ({ page }) => {
    await page.goto("/product/leather-watch");
    await page.getByRole("button", { name: /Add Minimalist Leather Watch to wishlist/ }).click();
    await expect(page.getByRole("button", { name: /Remove Minimalist Leather Watch from wishlist/ })).toBeVisible();

    await page.goto("/wishlist");
    await expect(page.getByRole("heading", { name: "Your Wishlist" })).toBeVisible();
    await expect(page.getByText("1 item saved")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Minimalist Leather Watch" })).toBeVisible();
  });

  test("the card heart toggles state without navigating", async ({ page }) => {
    await page.goto("/shop");
    const card = page.locator(".bg-card.group").first();
    const heart = card.getByRole("button", { name: /wishlist/ });
    await heart.click();
    await expect(page).toHaveURL(/\/shop$/); // no navigation
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "false");
  });

  test("wishlist persists across reloads (DB-backed)", async ({ page }) => {
    await page.goto("/product/silk-pajama");
    await page.getByRole("button", { name: /Add Silk Pajama Set to wishlist/ }).click();
    await page.reload();
    await page.goto("/wishlist");
    await expect(page.getByText("Silk Pajama Set").first()).toBeVisible();
  });

  test("the empty state matches the reference copy", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/wishlist");
    await expect(page.getByRole("heading", { name: "Your wishlist is empty" })).toBeVisible();
    await expect(page.getByText("Save items you love to find them later.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore Products" })).toBeVisible();
  });
});
