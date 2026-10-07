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

  test("document titles match the reference per route", async ({ page }) => {
    // Measured live on the reference 2026-10-07: every route suffixes
    // " | Lumina"; the PDP title is the HUMANIZED SLUG (wireless-headphones
    // -> "Wireless Headphones"), NOT the product name (which stays the h1).
    await page.goto("/cart");
    await expect(page).toHaveTitle("Cart | Lumina");
    await page.goto("/product/wireless-headphones");
    await expect(page).toHaveTitle("Wireless Headphones | Lumina");
    await expect(page.getByRole("heading", { name: "Wireless Noise-Cancelling Headphones" })).toBeVisible();
    await page.goto("/product/yoga-mat");
    await expect(page).toHaveTitle("Yoga Mat | Lumina");
    await page.goto("/product/vitamin-c-serum");
    await expect(page).toHaveTitle("Vitamin C Serum | Lumina");
  });

  test("PDP Reviews and Shipping panels match the reference anatomy", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    // Reviews: the empty panel is a centered, padded block (the clone must
    // keep the wrapper div, not a bare left-aligned paragraph).
    await page.getByRole("tab", { name: /Reviews/ }).click();
    const reviews = page.locator("[role=tabpanel] >> div.text-center.py-10");
    await expect(reviews).toBeVisible();
    await expect(reviews).toContainText("Customer reviews coming soon.");
    // Shipping: plain paragraphs with a literal check character — NO list,
    // NO lucide icons (measured live; only the Description tab's Key
    // Features list uses icons on the reference).
    await page.getByRole("tab", { name: "Shipping" }).click();
    const panel = page.locator("[role=tabpanel]:visible");
    await expect(panel.locator("p").filter({ hasText: /^✓/ })).toHaveCount(4);
    await expect(panel.locator("ul")).toHaveCount(0);
    await expect(panel).toContainText("✓ Free standard shipping on orders over $100");
    await expect(panel).toContainText("✓ 30-day hassle-free returns");
  });

  test("unknown routes render the reference's standalone 404", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go Home" })).toBeVisible();
    // Reference parity: the 404 is a chrome-less platform screen — the
    // offending path is quoted (sans leading slash) and NO site header renders.
    await expect(page.getByText('"this-page-does-not-exist"')).toBeVisible();
    await expect(page.locator("header")).toHaveCount(0);
  });

  test("unknown product slugs render the in-chrome product-not-found block", async ({ page }) => {
    await page.goto("/product/not-a-real-slug");
    await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Shop" })).toBeVisible();
    // Unlike the route 404, this one keeps the storefront chrome.
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("auth screens render standalone (no storefront chrome)", async ({ page }) => {
    for (const path of ["/login", "/register"]) {
      await page.goto(path);
      await expect(page.locator("header")).toHaveCount(0);
      await expect(page.locator("footer")).toHaveCount(0);
    }
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("footer carries the reference contact block", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByText("hello@luxestore.com")).toBeVisible();
    await expect(footer.getByText("+1 (555) 123-4567")).toBeVisible();
    await expect(footer.getByText("© 2026 LUXE Store. All rights reserved.")).toBeVisible();
  });
});
