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

  test("heart color states match the reference (session-5)", async ({ page }) => {
    // Measured live 2026-10-07: the reference's ACTIVE wishlist heart is
    // fill-destructive text-destructive — RED rgb(239, 67, 67) — on BOTH the
    // PDP buy-panel heart and the shop card hearts (the clone rendered
    // fill-primary orange). The reference's CARD heart is MUTED inactive
    // (text-muted-foreground, rgb(111, 111, 123), with transition-colors);
    // the PDP buy-panel heart is FOREGROUND inactive (rgb(23, 23, 28), no
    // color class). Uses linen-blanket (no other spec touches it) and
    // self-cleans both toggles.
    await page.goto("/product/linen-blanket");
    // State-stable locator: the aria-label flips Add↔Remove on toggle, so a
    // name anchored to "Add ..." would stop matching the moment the toggle
    // lands (the element "disappearing" is the success signal, not a failure).
    const pdpHeart = page.getByRole("button", { name: /Linen Throw Blanket (from|to) wishlist/ });
    const pdpSvg = pdpHeart.locator("svg");
    await expect(pdpSvg).toHaveCSS("color", "rgb(23, 23, 28)"); // foreground
    await pdpHeart.click();
    await expect(pdpSvg).toHaveClass(/fill-destructive text-destructive/);
    await expect(pdpSvg).toHaveCSS("color", "rgb(239, 67, 67)");
    // Clean up so later specs see an untouched wishlist.
    await pdpHeart.click();
    await expect(pdpHeart).toHaveAttribute("aria-pressed", "false");

    await page.goto("/shop");
    const card = page.locator(".bg-card.group").filter({ hasText: "Linen Throw Blanket" });
    const cardHeart = card.getByRole("button", { name: /wishlist/ });
    const cardSvg = cardHeart.locator("svg");
    await expect(cardSvg).toHaveClass(/text-muted-foreground/);
    await expect(cardSvg).toHaveClass(/transition-colors/);
    await expect(cardSvg).toHaveCSS("color", "rgb(111, 111, 123)"); // muted
    await cardHeart.click();
    await expect(cardSvg).toHaveClass(/fill-destructive text-destructive/);
    await expect(cardSvg).toHaveCSS("color", "rgb(239, 67, 67)");
    // Clean up.
    await cardHeart.click();
    await expect(cardHeart).toHaveAttribute("aria-pressed", "false");
  });

  test("wishlist ADD toasts; REMOVE does not (reference parity, session-4)", async ({ page }) => {
    // Measured live: adding to wishlist toasts "«name» added to wishlist!"
    // in the same dark box as the cart toast; un-toggling (removing) shows
    // NO toast at all. Uses a product no earlier spec in this file touches
    // (leather-watch/silk-pajama are added by the tests above and persist in
    // the demo user's DB wishlist for the rest of the run).
    await page.goto("/product/titanium-sunglasses");
    await page.getByRole("button", { name: /Add Titanium Sunglasses to wishlist/ }).click();
    const toast = page.getByText("Titanium Sunglasses added to wishlist!");
    await expect(toast).toBeVisible();
    // Wait out the toast's full lifecycle (auto-dismiss + exit) so the
    // remove-phase count below can't see it.
    await expect(toast).toBeHidden({ timeout: 8000 });
    await page.getByRole("button", { name: /Remove Titanium Sunglasses from wishlist/ }).click();
    await page.getByRole("button", { name: /Add Titanium Sunglasses to wishlist/ }).waitFor();
    await page.waitForTimeout(800);
    await expect(page.getByText(/added to wishlist/)).toHaveCount(0);
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
