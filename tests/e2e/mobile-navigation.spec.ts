import { expect, test } from "@playwright/test";

// Mobile navigation — the highest-regression-risk chrome (the trap-log's
// pinned surface). The reference renders a Radix Sheet sliding in from the
// LEFT at w-72 (288px) with five text-lg nav links.
//
// Tailwind v4 trap-log context (trap 4): the panel stacks its links with
// flex gap-4 — NEVER combine space-y-* with mt-* children here, or v4's
// zero-specificity :where() selector resurrects the mt-* and changes the
// panel height (the reference's v3 engine overrides it).

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("hamburger opens the left sheet with the five nav links", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (const label of ["Home", "Shop", "Electronics", "Clothing", "Accessories"]) {
      await expect(dialog.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("the sheet slides from the LEFT at the reference width (w-72)", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveClass(/slide-in-from-left/);
    await expect(dialog).toHaveCSS("width", "288px");
    // Wait out the 500ms slide-in before measuring position.
    await page.waitForTimeout(650);
    // Pinned flush to the left edge.
    const box = await dialog.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(-0.5);
    expect(box?.x ?? -1).toBeLessThan(1);
  });

  test("nav links are the reference's text-lg medium rows", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const link = page.getByRole("dialog").getByRole("link", { name: "Shop", exact: true });
    await expect(link).toHaveCSS("font-size", "18px"); // text-lg
    await expect(link).toHaveCSS("font-weight", "500");
    await expect(link).toHaveCSS("padding-top", "8px"); // py-2
  });

  test("the panel's flex gap layout leaves no stray margins (trap 4)", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const nav = page.getByRole("dialog").getByRole("navigation", { name: "Mobile" });
    // The FIRST link carries NO margin-top (space-y + mt-* would leak it).
    const first = nav.getByRole("link").first();
    await expect(first).toHaveCSS("margin-top", "0px");
    // The nav container itself owns the 32px top offset (mt-8).
    await expect(nav).toHaveCSS("margin-top", "32px");
  });

  test("tapping a link navigates and closes the sheet", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Electronics", exact: true }).tap();
    await expect(page).toHaveURL(/\/shop\?category=electronics$/);
    await expect(page.getByRole("heading", { name: "Electronics", exact: true })).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("the close button dismisses the sheet without navigating", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });

  test("desktop nav is hidden on mobile; hamburger is hidden on desktop", async ({ page }) => {
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeHidden();
  });
});
