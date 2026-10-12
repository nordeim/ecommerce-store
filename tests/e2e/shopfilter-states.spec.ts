import { expect, test } from "@playwright/test";

// Shop filter bar interaction states (session-50, SHOP-FILTERS-1) — the
// customer-surfaces pin-density sweep's eighth installment. The resting
// sweep cannot reach these states (the popovers never open, the Clear
// button never renders unfiltered, the buckets never activate) — every
// pin here is calibrated against the LIVE reference (probes
// shopfilter-probe-r50/r50b/r50c + the clone-side r50d):
//
//   - the Clear button = the reference's shadcn ghost/sm anatomy
//     (byte-exact class string, 32px/12px/10px, foreground, bg-accent
//     hover, the 16px X via [&_svg]:size-4)
//   - the four price buckets' semantics (byte-identical sets both sides)
//   - the popover geometry/hover (radius 10px, start-aligned, 4px gap)
//   - the Radix keyboard contract (ArrowDown/Enter/Escape)
//   - the trigger-label coherence (the clone's URL-driven superset)
//   - the bar search's case-insensitive match + URL push (the superset)
//   - the count line's singular/plural
//
// Registered divergences (docs/remediation-plan-session50.md §2.2):
// the reference renders NO aria-labels (the clone's are the a11y superset
// — locators below use nth() to stay robust either way); the reference's
// deep-linked ?sort=/?price= params are DEAD and its chip row is GONE
// (session-3 measured it — a reference drift); the clone's working deep
// links + chips + bar-search URL push are the registered superset.

// The reference's Clear button, measured live (probe r50b §I) — the
// shadcn ghost/sm vintage + gap-1, byte-exact.
const REF_CLEAR_CLASSES =
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs gap-1";

// The four price buckets' sets, measured live on the reference's UI path
// (probe r50b §E/§F) — the clone's deep-linked path renders the identical
// sets in the featured (sortOrder) order.
const BUCKETS: Record<string, string[]> = {
  "under-50": ["organic-cotton-tee", "vitamin-c-serum", "charging-pad"],
  "50-100": ["ceramic-planter", "linen-blanket", "yoga-mat"],
  "100-200": ["leather-watch", "smart-speaker", "running-shoes", "silk-pajama"],
  "over-200": ["wireless-headphones", "titanium-sunglasses"],
};

async function cardSlugs(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const links = [...document.querySelectorAll("main a[href^='/product/']")];
    const seen: string[] = [];
    for (const a of links) {
      const s = (a.getAttribute("href") ?? "").split("/").pop() ?? "";
      if (s && !seen.includes(s)) seen.push(s);
    }
    return seen;
  });
}

test.describe("shop filter interaction states (session-50, SHOP-FILTERS-1)", () => {
  test("P1: the Clear button carries the reference's byte-exact ghost/sm anatomy (reference parity)", async ({ page }) => {
    await page.goto("/shop?category=electronics");
    const clear = page
      .locator("main button")
      .filter({ hasText: /^Clear$/ })
      .first();
    await expect(clear).toBeVisible();
    // The byte-exact class string (probe r50b §I — the shadcn ghost/sm
    // vintage + gap-1; NOT the Button component, whose older-vintage base
    // carries rounded-md text-sm).
    expect(await clear.getAttribute("class")).toBe(REF_CLEAR_CLASSES);
    // The computed anatomy: 32px tall, 12px font, 10px radius, foreground
    // color, and the X rendered 16px via [&_svg]:size-4 (over its h-3 w-3).
    const geom = await clear.evaluate((el) => {
      const cs = getComputedStyle(el);
      const svg = el.querySelector("svg");
      return {
        height: cs.height,
        fontSize: cs.fontSize,
        radius: cs.borderRadius,
        color: cs.color,
        svgClasses: svg ? svg.getAttribute("class") : null,
        svgSize: svg ? getComputedStyle(svg).width : null,
      };
    });
    expect(geom.height).toBe("32px");
    expect(geom.fontSize).toBe("12px");
    expect(geom.radius).toBe("10px");
    expect(geom.color).toBe("rgb(23, 23, 28)");
    expect(geom.svgClasses).toContain("h-3 w-3");
    expect(geom.svgSize).toBe("16px");
  });

  test("P2: the Clear button's visibility contract — absent unfiltered, present per dimension", async ({ page }) => {
    const clearLocator = () =>
      page
        .locator("main button")
        .filter({ hasText: /^Clear$/ })
        .first();
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    await expect(clearLocator()).toHaveCount(0);
    for (const qs of [
      "category=electronics",
      "price=under-50",
      "sort=newest",
      "search=serum",
    ]) {
      await page.goto(`/shop?${qs}`);
      await expect(clearLocator()).toBeVisible();
    }
  });

  test("P3: the Clear click resets every dimension (reference parity — the total reset)", async ({ page }) => {
    await page.goto("/shop?category=electronics&price=over-200&sort=newest");
    await expect(
      page
        .locator("main button")
        .filter({ hasText: /^Clear$/ })
        .first(),
    ).toBeVisible();
    await page
      .locator("main button")
      .filter({ hasText: /^Clear$/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    // The triggers all reset and the count returns to 12.
    const triggers = await page.evaluate(() =>
      [...document.querySelectorAll("button[role='combobox']")].map((b) => b.textContent.trim()),
    );
    expect(triggers).toEqual(["All Categories", "All Prices", "Featured"]);
    await expect(page.getByText("12 products found")).toBeVisible();
    await expect(
      page
        .locator("main button")
        .filter({ hasText: /^Clear$/ })
        .first(),
    ).toHaveCount(0);
  });

  test("P4: the category popover lists the 7 reference options with the active check", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("combobox").nth(0).click();
    const options = page.getByRole("option");
    await expect(options).toHaveCount(7);
    expect((await options.allTextContents()).map((t) => t.trim())).toEqual([
      "All Categories",
      "Electronics",
      "Clothing",
      "Home & Living",
      "Accessories",
      "Sports",
      "Beauty",
    ]);
    // "All Categories" is the selected item — aria-selected + the check svg.
    const active = options.nth(0);
    await expect(active).toHaveAttribute("aria-selected", "true");
    expect(await active.locator("svg").count()).toBeGreaterThanOrEqual(1);
    await page.keyboard.press("Escape");
  });

  test("P5: the price popover lists the 5 byte-exact reference labels", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("combobox").nth(1).click();
    const options = page.getByRole("option");
    await expect(options).toHaveCount(5);
    expect((await options.allTextContents()).map((t) => t.trim())).toEqual([
      "All Prices",
      "Under $50",
      "$50 - $100",
      "$100 - $200",
      "Over $200",
    ]);
    await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
  });

  test("P6: the four price buckets render the reference's exact sets (the semantic core)", async ({ page }) => {
    for (const [bucket, expected] of Object.entries(BUCKETS)) {
      await page.goto(`/shop?price=${bucket}`);
      expect(await cardSlugs(page), `price=${bucket}`).toEqual(expected);
      await expect(
        page.getByText(`${expected.length} ${expected.length === 1 ? "product" : "products"} found`),
      ).toBeVisible();
    }
  });

  test("P7: the sort popover's geometry — radius 10px, start-aligned, 4px gap, content width", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("combobox").nth(2).click();
    await page.waitForTimeout(400); // the popover's entrance animation must settle
    const geom = await page.evaluate(() => {
      const pop = document.querySelector("[role='listbox']");
      const trig = document.querySelectorAll("button[role='combobox']")[2];
      if (!pop || !trig) return null;
      const pr = pop.getBoundingClientRect();
      const tr = trig.getBoundingClientRect();
      return {
        radius: getComputedStyle(pop).borderRadius,
        popX: pr.x,
        trigX: tr.x,
        trigW: tr.width,
        gapY: pr.y - (tr.y + tr.height),
        popW: pr.width,
      };
    });
    expect(geom).not.toBeNull();
    expect(geom!.radius).toBe("10px");
    expect(Math.abs(geom!.popX - geom!.trigX)).toBeLessThan(1); // start-aligned
    expect(geom!.gapY).toBe(4);
    expect(geom!.popW).toBeGreaterThanOrEqual(geom!.trigW); // content-sized
    expect(geom!.popW).toBeLessThanOrEqual(175);
    await page.keyboard.press("Escape");
  });

  test("P8: the keyboard contract — ArrowDown moves, Enter commits, Escape closes uncommitted", async ({ page }) => {
    await page.goto("/shop");
    // Open: the active item (Featured) carries the highlight.
    await page.getByRole("combobox").nth(2).click();
    await page.waitForTimeout(400); // the entrance animation must settle
    let hl = await page.evaluate(() =>
      [...document.querySelectorAll("[role='listbox'] [role='option']")].map((o) => ({
        t: o.textContent.trim(),
        hl: o.getAttribute("data-highlighted"),
      })),
    );
    expect(hl[0]).toMatchObject({ t: "Featured", hl: "" });
    // ArrowDown moves the highlight to "Price: Low to High".
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250); // the highlight move must settle
    hl = await page.evaluate(() =>
      [...document.querySelectorAll("[role='listbox'] [role='option']")].map((o) => ({
        t: o.textContent.trim(),
        hl: o.getAttribute("data-highlighted"),
      })),
    );
    expect(hl[1]).toMatchObject({ t: "Price: Low to High", hl: "" });
    expect(hl[0]!.hl).not.toBe("");
    // Enter commits: the trigger label updates and the grid re-sorts.
    await page.keyboard.press("Enter");
    await page.waitForURL(/sort=price_asc/);
    const trig = page.getByRole("combobox").nth(2);
    await expect(trig).toHaveText(/Price: Low to High/);
    expect((await cardSlugs(page)).slice(0, 2)).toEqual([
      "vitamin-c-serum", // $34.99
      "charging-pad", // $39.99
    ]);
    // Re-open + Escape closes without committing.
    await trig.click();
    await expect(page.getByRole("option")).toHaveCount(5);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(trig).toHaveText(/Price: Low to High/); // unchanged
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test("P9: the trigger labels follow the URL params (the clone's coherence superset)", async ({ page }) => {
    const triggers = () =>
      page.evaluate(() =>
        [...document.querySelectorAll("button[role='combobox']")].map((b) => b.textContent.trim()),
      );
    // expect.poll: the SSR pass renders SelectValue EMPTY — the label fills
    // in after hydration (the r50 race), so the poll retries until it does.
    await page.goto("/shop?sort=rating");
    await expect.poll(triggers).toEqual(["All Categories", "All Prices", "Top Rated"]);
    await page.goto("/shop?price=over-200");
    await expect.poll(triggers).toEqual(["All Categories", "Over $200", "Featured"]);
    await page.goto("/shop?category=electronics");
    await expect.poll(triggers).toEqual(["Electronics", "All Prices", "Featured"]);
  });

  test("P10: the bar search pushes the URL and matches case-insensitively", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("main input[placeholder='Search products...']").fill("SERUM");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/shop\?search=SERUM$/);
    await expect(page.getByRole("heading", { name: 'Results for "SERUM"' })).toBeVisible();
    expect(await cardSlugs(page)).toEqual(["vitamin-c-serum"]);
    await expect(page.getByText("1 product found")).toBeVisible();
  });

  test("P11: the count line's singular/plural contract", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByText("12 products found")).toBeVisible();
    await page.goto("/shop?category=electronics");
    await expect(page.getByText("3 products found")).toBeVisible();
    await page.goto("/shop?search=headphones");
    await expect(page.getByText("1 product found")).toBeVisible();
  });

  test("P12: the highlighted popover item carries the Radix accent pair", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("combobox").nth(2).click();
    await page.waitForTimeout(400); // the entrance animation must settle
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250); // the highlight move must settle
    const hover = await page.evaluate(() => {
      const it = [...document.querySelectorAll("[role='listbox'] [role='option']")].find((o) =>
        o.getAttribute("data-highlighted") === "",
      );
      if (!it) return null;
      const cs = getComputedStyle(it);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(hover).toEqual({ bg: "rgb(253, 243, 237)", color: "rgb(138, 64, 15)" });
    await page.keyboard.press("Escape");
  });
});
