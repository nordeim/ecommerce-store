import { expect, test } from "@playwright/test";

// Smoke layer: every public route renders its landmark chrome, the health
// probe is green, and unknown routes hit the branded 404.

test.describe("smoke", () => {
  test("health probe is green", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok: boolean; db: boolean };
    expect(body.ok).toBe(true);
    expect(body.db).toBe(true);
  });

  test("home renders the storefront chrome", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Lumina");
    // Announcement bar copy (reference parity)
    await expect(page.getByText("Free shipping on orders over $100")).toBeVisible();
    // Header + footer
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    // The four home sections
    for (const heading of ["Trending Now", "Shop by Category", "New Arrivals", "On Sale"]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
  });

  test("shop lists the seeded catalog", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "All Products", exact: true })).toBeVisible();
    await expect(page.getByText("12 products found")).toBeVisible();
    await expect(page.locator(".group").first()).toBeVisible();
  });

  test("product detail renders the buy box", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await expect(page.getByRole("heading", { name: "Wireless Noise-Cancelling Headphones" })).toBeVisible();
    await expect(page.getByText("$299.99").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to Cart" }).first()).toBeVisible();
    for (const tab of ["Description", "Shipping"]) {
      await expect(page.getByRole("tab", { name: new RegExp(tab) })).toBeVisible();
    }
  });

  test("wishlist renders the empty state for a fresh session", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/wishlist");
    await expect(page.getByRole("heading", { name: "Your wishlist is empty" })).toBeVisible();
  });

  test("unknown routes render the branded 404", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go Home" })).toBeVisible();
  });

  test("footer carries the reference contact block", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByText("hello@luxestore.com")).toBeVisible();
    await expect(footer.getByText("+1 (555) 123-4567")).toBeVisible();
    await expect(footer.getByText("© 2026 LUXE Store. All rights reserved.")).toBeVisible();
  });
});
