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

  test("Escape closes the dropdown", async ({ page }) => {
    await page.goto("/");
    await page.locator("header button[aria-label=\"Search\"]").click();
    await expect(page.getByLabel("Search products")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Search products")).toBeHidden();
  });
});
