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

  test("security headers match the reference baseline (session-12, SEC-HEADERS-1)", async ({ request }) => {
    // Live-measured on the reference: referrer-policy
    // strict-origin-when-cross-origin, strict-transport-security
    // max-age=31536000, x-content-type-options nosniff — a bare Next
    // standalone server ships none of them. The clone now matches those
    // three (parity) plus X-Frame-Options: DENY (superset clickjacking
    // hardening). HSTS over plain HTTP is a spec-defined no-op (RFC 6797
    // §7.2), so the unconditional value is safe for localhost/E2E.
    const res = await request.get("/");
    const headers = res.headers();
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toBe("max-age=31536000");
    expect(headers["x-frame-options"]).toBe("DENY");
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

  test("unknown-route titles follow the reference's humanized-path rule (session-8, TITLE-404-1)", async ({ page }) => {
    // The reference's SPA titles unknown routes from the LAST path segment
    // containing a letter, humanized (dashes/underscores -> spaces, each
    // word's first char uppercased, case otherwise preserved):
    //   /nonexistent-route-xyz -> "Nonexistent Route Xyz | Lumina"
    //   /foo/bar-baz           -> "Bar Baz | Lumina"
    //   /products/42           -> "Products | Lumina"  ("42" has no letters
    //                                                   -> falls back a
    //                                                   segment)
    //   /12345                 -> "Lumina"               (no letter segments)
    // Measured live on the reference 2026-10-08. The clone previously
    // rendered the plain default "Lumina" for every unknown route.
    await page.goto("/nonexistent-route-xyz");
    await expect(page).toHaveTitle("Nonexistent Route Xyz | Lumina");
    await expect(page.getByText('"nonexistent-route-xyz"')).toBeVisible();
    await page.goto("/foo/bar-baz");
    await expect(page).toHaveTitle("Bar Baz | Lumina");
    await page.goto("/products/42");
    await expect(page).toHaveTitle("Products | Lumina");
    await page.goto("/12345");
    await expect(page).toHaveTitle("Lumina");
  });

  test("unknown product slugs render the in-chrome product-not-found block", async ({ page }) => {
    await page.goto("/product/not-a-real-slug");
    await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Shop" })).toBeVisible();
    // Unlike the route 404, this one keeps the storefront chrome.
    await expect(page.getByRole("banner")).toBeVisible();
    // Reference parity (session-7, TITLE-NF-1): the reference's SPA derives
    // the tab title from the URL slug regardless of whether the product
    // resolves — measured live: /product/wireless-noise-cancelling-headphones
    // (unknown there too) titles "Wireless Noise Cancelling Headphones |
    // Lumina". The clone previously said "Product Not Found | Lumina".
    await expect(page).toHaveTitle("Not A Real Slug | Lumina");
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

  test("every page carries the reference's favicon link (session-7)", async ({ page }) => {
    // Measured live on the reference: it injects <link rel="icon"> pointing
    // at its media CDN logo (and /favicon.ico 302s to the same asset). The
    // clone follows the repo's remote-CDN pixel-parity pattern (product art
    // already lives on media.base44.com) instead of shipping a binary.
    await page.goto("/");
    const icon = page.locator('link[rel="icon"]');
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute(
      "href",
      "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png",
    );
  });

  test("home carries the reference's full OpenGraph head set (session-9, METADATA-OG-1)", async ({ page }) => {
    // Pattern decoded live on the reference 2026-10-08: every route renders
    // og:title/og:description/og:image/og:url/og:type/og:site_name +
    // twitter:* + the PWA metas. Home is the PLAIN pattern (no "X on
    // Lumina." prefix) with the bare "Lumina" title. og:image is the site
    // LOGO (1200x630 fill variant), site-wide.
    await page.goto("/");
    const meta = async (sel: string) => (await page.locator(sel).getAttribute("content")) ?? "";
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Lumina");
    expect(await meta('meta[property="og:description"]')).toBe(
      "An elegant, high-end e-commerce destination offering curated essentials for a modern lifestyle.",
    );
    expect(await meta('meta[property="og:image"]')).toBe(
      "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png/v1/fill/w_1200,h_630/76cff797e_logo.png",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "http://localhost:3000",
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Lumina");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    // PWA metas (site-wide).
    await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute("content", "yes");
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
      "content",
      "Lumina",
    );
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
      "content",
      "black",
    );
  });

  test("static pages carry the prefixed description + twitter:url (session-9)", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Shop | Lumina");
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "Shop on Lumina. An elegant, high-end e-commerce destination offering curated essentials for a modern lifestyle.",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Shop on Lumina. An elegant, high-end e-commerce destination offering curated essentials for a modern lifestyle.",
    );
    await expect(page.locator('meta[name="twitter:url"]')).toHaveAttribute(
      "content",
      "http://localhost:3000/shop",
    );
    // Cart carries the same static pattern.
    await page.goto("/cart");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Cart | Lumina");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "http://localhost:3000/cart",
    );
  });

  test("shop og:url preserves the query string (session-9)", async ({ page }) => {
    await page.goto("/shop?category=electronics");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "http://localhost:3000/shop?category=electronics",
    );
  });

  test("PDP og metadata follows the reference's plain pattern (session-9)", async ({ page }) => {
    // Reference PDP: og:title = HUMANIZED SLUG (not the product name),
    // og:description = the plain site description, og:image = the site LOGO
    // (not the product image), and NO twitter:card / twitter:url.
    await page.goto("/product/wireless-headphones");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Wireless Headphones | Lumina",
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "An elegant, high-end e-commerce destination offering curated essentials for a modern lifestyle.",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png/v1/fill/w_1200,h_630/76cff797e_logo.png",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(0);
    await expect(page.locator('meta[name="twitter:url"]')).toHaveCount(0);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "Wireless Headphones | Lumina",
    );
  });
});
