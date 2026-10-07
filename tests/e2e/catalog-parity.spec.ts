import { expect, test } from "@playwright/test";

// Catalog parity layer (session-2 remediation): pins the reference's
// product array order, sort semantics, ratings, and descriptions — all
// measured live on fuzzy-lumina-style-hub.base44.app (2026-10-07).

const REFERENCE_ARRAY_ORDER = [
  "wireless-headphones",
  "leather-watch",
  "organic-cotton-tee",
  "smart-speaker",
  "ceramic-planter",
  "running-shoes",
  "vitamin-c-serum",
  "linen-blanket",
  "titanium-sunglasses",
  "yoga-mat",
  "charging-pad",
  "silk-pajama",
];

/** Deduped product slugs in DOM order. */
async function productOrder(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href*="/product/"]')) {
      const slug = a.getAttribute("href")!.split("/").pop()!;
      if (!seen.has(slug)) {
        seen.add(slug);
        out.push(slug);
      }
    }
    return out;
  });
}

test.describe("catalog order parity", () => {
  test("shop default (Featured) order matches the reference array order", async ({ page }) => {
    await page.goto("/shop");
    expect(await productOrder(page)).toEqual(REFERENCE_ARRAY_ORDER);
  });

  test("home On Sale section lists the reference's four sale products", async ({ page }) => {
    await page.goto("/");
    const saleSlugs = await page.evaluate(() => {
      const headings = [...document.querySelectorAll("h2")];
      const sale = headings.find((h) => h.textContent?.trim() === "On Sale");
      if (!sale) return [];
      // Scope to the enclosing section (the h2 lives inside a header wrapper).
      const section = sale.closest("section") ?? sale.parentElement?.parentElement;
      if (!section) return [];
      const seen = new Set<string>();
      const out: string[] = [];
      for (const a of section.querySelectorAll<HTMLAnchorElement>('a[href*="/product/"]')) {
        const slug = a.getAttribute("href")!.split("/").pop()!;
        if (!seen.has(slug)) {
          seen.add(slug);
          out.push(slug);
        }
      }
      return out;
    });
    expect(saleSlugs).toEqual([
      "wireless-headphones",
      "organic-cotton-tee",
      "smart-speaker",
      "running-shoes",
    ]);
  });

  test("Newest sort is the reverse of the array order (reference semantics)", async ({ page }) => {
    await page.goto("/shop?sort=newest");
    expect(await productOrder(page)).toEqual([...REFERENCE_ARRAY_ORDER].reverse());
  });

  test("Top Rated sort is a stable rating-desc over the array order", async ({ page }) => {
    await page.goto("/shop?sort=rating");
    expect(await productOrder(page)).toEqual([
      "ceramic-planter", // 4.9
      "silk-pajama", // 4.9
      "wireless-headphones", // 4.8
      "vitamin-c-serum", // 4.8
      "yoga-mat", // 4.8
      "smart-speaker", // 4.7
      "linen-blanket", // 4.7
      "leather-watch", // 4.6
      "running-shoes", // 4.6
      "organic-cotton-tee", // 4.5
      "titanium-sunglasses", // 4.5
      "charging-pad", // 4.4
    ]);
  });

  test("sort dropdown lists Top Rated before Newest (reference order)", async ({ page }) => {
    await page.goto("/shop");
    const trigger = page.getByRole("combobox", { name: "Sort products" });
    await trigger.click();
    const options = page.getByRole("option");
    await expect(options).toHaveCount(5);
    const labels = await options.allTextContents();
    expect(labels.map((l) => l.trim())).toEqual([
      "Featured",
      "Price: Low to High",
      "Price: High to Low",
      "Top Rated",
      "Newest",
    ]);
  });
});

test.describe("product data parity", () => {
  test("ceramic-planter carries the reference rating and reviews", async ({ page }) => {
    await page.goto("/product/ceramic-planter");
    await expect(page.getByText("4.9").first()).toBeVisible();
    await expect(page.getByText("87 reviews")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Reviews \(87\)/ })).toBeVisible();
  });

  test("linen-blanket carries the reference rating and reviews", async ({ page }) => {
    await page.goto("/product/linen-blanket");
    await expect(page.getByText("4.7").first()).toBeVisible();
    await expect(page.getByText("145 reviews")).toBeVisible();
  });

  test("yoga-mat carries the reference rating and reviews", async ({ page }) => {
    await page.goto("/product/yoga-mat");
    await expect(page.getByText("4.8").first()).toBeVisible();
    await expect(page.getByText("267 reviews")).toBeVisible();
  });

  test("descriptions match the reference copy (sampled)", async ({ page }) => {
    const cases: Array<[string, string]> = [
      ["leather-watch", "Elegant minimalist watch with genuine Italian leather strap and sapphire crystal glass."],
      ["ceramic-planter", "Set of 3 handcrafted ceramic planters in varying sizes. Perfect for succulents and herbs."],
      ["vitamin-c-serum", "Brightening vitamin C serum with hyaluronic acid. Reduces dark spots for a radiant glow."],
      ["silk-pajama", "Pure mulberry silk pajama set for ultimate comfort and luxury. Gift box included."],
    ];
    for (const [slug, description] of cases) {
      await page.goto(`/product/${slug}`);
      await expect(page.getByText(description).first()).toBeVisible();
    }
  });

  test("You May Also Like lists ALL same-category products excluding self (session-3)", async ({ page }) => {
    // Reference rule (measured live): related = same category, minus self, in
    // array order — NO cap at 4 and NO cross-category fill.
    const cases: Array<[string, string[]]> = [
      ["wireless-headphones", ["smart-speaker", "charging-pad"]],
      ["ceramic-planter", ["linen-blanket"]],
      ["titanium-sunglasses", ["leather-watch"]],
    ];
    for (const [slug, expected] of cases) {
      await page.goto(`/product/${slug}`);
      const section = page.getByRole("heading", { name: "You May Also Like" }).locator("..");
      const links = section.locator("a[href*=\"/product/\"]");
      const seen = new Set<string>();
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        seen.add((await links.nth(i).getAttribute("href"))!.split("/").pop()!);
      }
      expect([...seen]).toEqual(expected);
    }
  });
});
