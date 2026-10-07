import { expect, test } from "@playwright/test";

// Search: the header dropdown, the typeahead API, and the /shop?search=
// results page.

test.describe("search", () => {
  test("the header dropdown opens and submits to the results page", async ({ page }) => {
    await page.goto("/");
    await page.locator("header button[aria-label=\"Search\"]").click();
    const input = page.getByLabel("Search products");
    await expect(input).toBeFocused();
    await input.fill("headphones");
    await page.locator("header form").getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/shop\?search=headphones$/);
    await expect(page.getByRole("heading", { name: 'Results for "headphones"' })).toBeVisible();
    await expect(page.getByText("1 product found")).toBeVisible();
  });

  test("the typeahead API returns matching products", async ({ request }) => {
    const res = await request.get("/api/search?q=serum&limit=6");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { results: { slug: string; name: string }[] };
    expect(body.results.length).toBeGreaterThanOrEqual(1);
    expect(body.results[0]?.slug).toBe("vitamin-c-serum");
  });

  test("the typeahead API rejects empty queries", async ({ request }) => {
    const res = await request.get("/api/search?q=");
    expect(res.status()).toBe(400);
  });

  test("the dropdown shows live suggestions while typing", async ({ page }) => {
    await page.goto("/");
    await page.locator("header button[aria-label=\"Search\"]").click();
    await page.getByLabel("Search products").fill("serum");
    const suggestion = page.locator("header button").filter({ hasText: "Vitamin C Serum" });
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
    await suggestion.click();
    await expect(page).toHaveURL(/\/product\/vitamin-c-serum$/);
  });

  test("dropdown suggestion categories render lowercase (session-8, SEARCH-CASE-1)", async ({ page }) => {
    // Measured live on the reference's typeahead 2026-10-08: the item's
    // category line reads lowercase ("electronics") even though the
    // category badges elsewhere render capitalized — the clone's
    // `capitalize` utility drifted the casing.
    await page.goto("/");
    await page.locator("header button[aria-label=\"Search\"]").click();
    await page.getByLabel("Search products").fill("headphones");
    const suggestion = page.locator("header button").filter({ hasText: "Wireless Noise-Cancelling Headphones" });
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
    // exact: true — Playwright's getByText is case-insensitive by default,
    // which would defeat the casing assertion entirely.
    await expect(suggestion.getByText("electronics", { exact: true })).toBeVisible();
    await expect(suggestion.getByText("Electronics", { exact: true })).toHaveCount(0);
  });

  test("Escape closes the dropdown", async ({ page }) => {
    await page.goto("/");
    await page.locator("header button[aria-label=\"Search\"]").click();
    await expect(page.getByLabel("Search products")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Search products")).toBeHidden();
  });
});

test.describe("shop active-filter chips (session-3 parity)", () => {
  test("a search term renders a quoted chip that clears the search on click", async ({ page }) => {
    await page.goto("/shop?search=watch");
    const chip = page.getByRole("main").locator("a", { hasText: '"watch"' });
    await expect(chip).toBeVisible();
    // Chip row sits between the filter bar and the grid.
    await expect(chip).toHaveCSS("border-radius", "3.35544e+07px"); // rounded-full, both engines
    await chip.click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
  });

  test("a category filter renders a plain-name chip", async ({ page }) => {
    await page.goto("/shop?category=accessories");
    const chip = page.getByRole("main").locator("a", { hasText: "Accessories" }).first();
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page).toHaveURL(/\/shop$/);
  });

  test("price and sort filters render NO chips (reference rule)", async ({ page }) => {
    await page.goto("/shop?category=accessories&price=over-200&sort=newest");
    // Only the category chip — price/sort never chip on the reference.
    await expect(page.getByRole("main").locator(".flex.flex-wrap.gap-2.mb-6 a")).toHaveCount(1);
  });

  test("no chip row renders for an unfiltered shop", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("main").locator(".flex.flex-wrap.gap-2.mb-6")).toHaveCount(0);
  });

  test("the empty state matches the reference copy and structure", async ({ page }) => {
    await page.goto("/shop?search=zzzqqq");
    const empty = page.getByRole("main").locator(".py-20.text-center");
    await expect(empty).toBeVisible();
    // Reference: h3 text-lg (not h2 text-xl), icon circle mb-4, exact copy,
    // and a "Clear all filters" primary action (the clone renders it as a
    // button-styled link to /shop — navigation semantics).
    await expect(empty.getByRole("heading", { name: "No products found" })).toHaveCSS(
      "font-size",
      "18px",
    );
    await expect(empty.locator(".h-20.w-20.rounded-full")).toHaveCSS("margin-bottom", "16px");
    await expect(empty.getByText("Try adjusting your filters or search terms.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear all filters" })).toBeVisible();
    // The search chip is present on the empty results page too.
    await expect(page.getByRole("main").locator("a", { hasText: '"zzzqqq"' })).toBeVisible();
    await page.getByRole("link", { name: "Clear all filters" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
  });
});
