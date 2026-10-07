import { expect, test } from "@playwright/test";

// Visual-parity gate (computed styles are the ground truth — the
// clone-app-pat-pro contract). Every value below was measured live on the
// reference (fuzzy-lumina-style-hub.base44.app) on 2026-10-07 and pins the
// Tailwind v4 trap-log guarantees:
//   - full hsl() theme values (trap 1: bare triplets render transparent)
//   - --shadow-sm pinned to the v3 geometry (trap 5)
//   - the radius scale pinned to v3 + shadcn values (trap 6, found in QA)


test.describe("storefront computed-style parity", () => {
  test("body theme matches the reference exactly", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", "rgb(251, 250, 249)"); // hsl(30 25% 98%)
    await expect(body).toHaveCSS("color", "rgb(23, 23, 28)"); // hsl(240 10% 10%)
    const font = await body.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toContain("Plus Jakarta Sans");
  });

  test("announcement bar is the primary orange strip", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator("header > div").first();
    await expect(bar).toContainText("Free shipping on orders over $100");
    await expect(bar).toHaveCSS("background-color", "rgb(230, 107, 26)"); // hsl(24 80% 50%)
    await expect(bar).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(bar).toHaveCSS("font-size", "12px");
  });

  test("header is sticky with the blurred warm background", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header).toHaveCSS("position", "sticky");
    // Alpha utilities: v3 serializes rgba(...); v4's color-mix serializes
    // lab(...). Both notations anchor the same paint — the lab lightness
    // (98.3 / 91.4) is the deterministic encoding of #fbfaf9 / #e9e6e2.
    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgba\(251, 250, 249, 0\.8\)|lab\(98\.3\d+ [\d.-]+ [\d.-]+ \/ 0\.8\)/);
    const border = await header.evaluate((el) => getComputedStyle(el).borderBottomColor);
    expect(border).toMatch(/rgba\(233, 230, 226, 0\.5\)|lab\(91\.4\d+ [\d.-]+ [\d.-]+ \/ 0\.5\)/);
  });

  test("nav links are the muted 14px medium of the reference", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Home" });
    await expect(link).toHaveCSS("color", "rgb(111, 111, 123)"); // hsl(240 5% 46%)
    await expect(link).toHaveCSS("font-size", "14px");
    await expect(link).toHaveCSS("font-weight", "500");
  });

  test("hero CTA is the primary pill (h-10 rounded-full)", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("main").getByRole("link", { name: "Shop Now" }).first();
    await expect(cta).toHaveCSS("background-color", "rgb(230, 107, 26)");
    await expect(cta).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(cta).toHaveCSS("height", "40px");
    await expect(cta).toHaveCSS("border-radius", "3.35544e+07px"); // 9999px, both engines
  });

  test("product card geometry matches the v3 radius scale (trap 6)", async ({ page }) => {
    await page.goto("/shop");
    const card = page.locator(".bg-card.group").first();
    await expect(card).toHaveCSS("border-radius", "16px"); // v3 rounded-2xl, NOT v4's 20px
    const borderColor = await card.evaluate((el) => getComputedStyle(el).borderColor);
    expect(borderColor).toMatch(/rgba\(233, 230, 226, 0\.5\)|lab\(91\.4\d+ [\d.-]+ [\d.-]+ \/ 0\.5\)/);
    // The resting shadow token must be the PINNED v3 geometry (trap 5).
    const shadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("rgba(0, 0, 0, 0.05)");
    expect(shadow).not.toContain("rgba(0, 0, 0, 0.1)");
  });

  test("card rating is the single-star + number form", async ({ page }) => {
    await page.goto("/shop");
    const card = page.locator(".bg-card.group").first();
    const stars = card.locator("svg.lucide-star");
    await expect(stars).toHaveCount(1);
    await expect(stars.first()).toHaveClass(/fill-amber-400/);
    await expect(card.getByText("4.8").first()).toBeVisible();
  });

  test("PDP price is 30px bold with the struck compare-at price", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    const price = page.getByText("$299.99").first();
    await expect(price).toHaveCSS("font-size", "30px");
    await expect(price).toHaveCSS("font-weight", "700");
    const compare = page.getByText("$399.99").first();
    await expect(compare).toHaveCSS("text-decoration-line", "line-through");
    await expect(compare).toHaveCSS("color", "rgb(111, 111, 123)");
  });

  test("footer is the inverted dark block", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveCSS("background-color", "rgb(23, 23, 28)");
    await expect(footer).toHaveCSS("color", "rgb(251, 250, 249)");
  });

  test("feature bar items are the reference's bordered cards (session-4)", async ({ page }) => {
    // Measured live 2026-10-07: item = p-6 rounded-2xl bg-card border
    // border-border/50 (bg white, 1px border, 16px radius, 24px padding);
    // grid gap-4 (16px); icon tile rounded-2xl with a text-primary icon.
    await page.goto("/");
    const heading = page.locator("h3").filter({ hasText: "Free Shipping" }).first();
    // The item is the heading's grandparent (item > div > h3).
    const item = heading.locator("xpath=../..");
    await expect(item).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(item).toHaveCSS("border-top-width", "1px");
    await expect(item).toHaveCSS("border-radius", "16px");
    await expect(item).toHaveCSS("padding", "24px");
    const grid = item.locator("xpath=..");
    await expect(grid).toHaveCSS("gap", "16px");
    // Icon tile: rounded-2xl (16px), icon painted in the primary orange.
    const tile = item.locator("div.h-12");
    await expect(tile).toHaveCSS("border-radius", "16px");
    const icon = tile.locator("svg");
    await expect(icon).toHaveCSS("color", "rgb(230, 107, 26)");
  });

  test("footer Join button is the small 32px variant (session-4)", async ({ page }) => {
    // Measured live: h-8 (32px) · text-xs (12px) · px-3 (12px).
    await page.goto("/");
    const join = page.getByRole("contentinfo").getByRole("button", { name: "Join" });
    await expect(join).toHaveCSS("height", "32px");
    await expect(join).toHaveCSS("font-size", "12px");
    await expect(join).toHaveCSS("padding", "0px 12px");
  });

  test("footer bottom bar separator is the 40px hairline rhythm (session-4)", async ({ page }) => {
    // Measured live: a standalone 1px separator with my-10 (40px above and
    // below) between the link grid and the bottom row — not a border-t on
    // the row itself (which produced 48px/32px).
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const grid = footer.locator("div.grid").first();
    const separator = footer.locator("div.h-\\[1px\\]");
    await expect(separator).toHaveCount(1);
    const gridBottom = await grid.evaluate((el) => el.getBoundingClientRect().bottom);
    const gapAbove = await separator.evaluate((el) => el.getBoundingClientRect().top) - gridBottom;
    expect(Math.round(gapAbove)).toBe(40);
    // Alpha utility (trap 6): v3 serializes rgba(), v4's color-mix lab().
    const sepColor = await separator.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(sepColor).toMatch(/rgba\(251, 250, 249, 0\.1\)|lab\(98\.3\d+ [\d.-]+ [\d.-]+ \/ 0\.1\)/);
    const sepBottom = await separator.evaluate((el) => el.getBoundingClientRect().bottom);
    // Scope to the © line (the LAST text-xs paragraph — the newsletter
    // column's Privacy note also matches p.text-xs).
    const bottomRow = footer.locator("p.text-xs").last().locator("..");
    const gapBelow = await bottomRow.evaluate((el) => el.getBoundingClientRect().top) - sepBottom;
    expect(Math.round(gapBelow)).toBe(40);
  });

  test("inputs carry the shadcn 10px radius (rounded-md pin)", async ({ page }) => {
    await page.goto("/shop");
    const input = page.getByLabel("Search products");
    await expect(input).toHaveCSS("border-radius", "10px");
    await expect(input).toHaveCSS("height", "36px");
  });

  test("hero dot pagination matches the reference geometry (session-3)", async ({ page }) => {
    await page.goto("/");
    const dots = page.locator("[aria-roledescription=\"carousel\"] button[aria-label^=\"Go to slide\"]");
    await expect(dots).toHaveCount(3);
    // Reference: active dot w-8 (32px) with the 300ms transition; inactive
    // w-2 (8px). (The v3 measured values.)
    await expect(dots.first()).toHaveCSS("width", "32px");
    await expect(dots.nth(1)).toHaveCSS("width", "8px");
    await expect(dots.nth(2)).toHaveCSS("width", "8px");
    const duration = await dots.first().evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0.3s");
  });

  test("home section dividers frame the product sections (session-5)", async ({ page }) => {
    // Measured live 2026-10-07 + present in the session-0 recon HTML: the
    // reference home renders exactly TWO hairline dividers —
    // `shrink-0 bg-border h-[1px] w-full max-w-7xl mx-auto` — after the
    // feature bar (before Trending Now) and between New Arrivals and On
    // Sale. Spacing comes from the py-12/py-16 section paddings; the
    // hairline itself has no vertical margin.
    await page.goto("/");
    const wrapper = page.locator("main > div").first();
    const classes = await wrapper.evaluate((el) =>
      Array.from(el.children).map((c) => c.className.toString()),
    );
    expect(classes).toHaveLength(8); // hero, features, |, trending, categories, new, |, on-sale
    const dividerClass = "shrink-0 bg-border h-[1px] w-full max-w-7xl mx-auto";
    expect(classes.filter((c) => c === dividerClass)).toHaveLength(2);
    expect(classes[2]).toBe(dividerClass); // after hero + features
    expect(classes[6]).toBe(dividerClass); // before On Sale
    // Geometry: 1px tall hairline (child #3 = the first divider; the class
    // string can't be turned into a CSS selector — h-[1px] needs escaping).
    const divider = wrapper.locator(":scope > *").nth(2);
    await expect(divider).toHaveCSS("height", "1px");
  });

  test("PDP action-row heart is the wide px-8 variant (session-5)", async ({ page }) => {
    // Measured live: the buy-panel wishlist heart is h-10 px-8 rounded-xl
    // (82×40; the clone's px-4 rendered 50px and let the flex-1 ATC absorb
    // the 32px — reference ATC 340px vs clone 372px at desktop). The ATC +
    // heart svgs carry h-5 w-5 in the reference DOM (both sites render them
    // at 16px via the Button base [&_svg]:size-4 — class-level parity).
    // Mobile note: px-8 exactly reproduces the reference's iPhone-14 action
    // row, whose 82px heart is clipped ~35px past the viewport (its
    // scrollWidth is 425 on a 390px screen).
    await page.goto("/product/wireless-headphones");
    // Scope to the buy panel's action row — the related-products cards below
    // carry their own wishlist hearts and Add-to-Cart buttons.
    const actionRow = page.locator("main .flex.items-center.gap-4.mb-4").first();
    const heart = actionRow.getByRole("button", { name: /to wishlist/ });
    await expect(heart).toHaveClass(/(^|\s)px-8(\s|$)/);
    await expect(heart).not.toHaveClass(/(^|\s)px-4(\s|$)/);
    const width = await heart.evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.round(width)).toBe(82);
    await expect(heart.locator("svg")).toHaveClass(/h-5 w-5/);
    const atc = actionRow.getByRole("button", { name: "Add to Cart" });
    await expect(atc.locator("svg")).toHaveClass(/h-5 w-5/);
  });

  test("PDP star rating is the reference's flat floor() row (session-8)", async ({ page }) => {
    // STAR-RATE-1: the reference renders a FLAT row of exactly 5 direct
    // Star svgs in `flex items-center gap-1` — floor(rating) carry
    // fill-amber-400, the rest text-border (measured live on 4.8/4.5/4.6
    // products: ALWAYS 4 amber + 1 gray; no half-stars, no rounding). The
    // clone had a track+overlay structure with gap-0.5 that rounded 4.8 up
    // to 5 amber stars.
    await page.goto("/product/wireless-headphones");
    const row = page.locator("main [aria-label^=\"Rated\"]");
    await expect(row).toHaveCSS("column-gap", "4px"); // gap-1
    // Flat structure: the row's DIRECT children are the 5 stars (no
    // relative/overlay spans), and only 5 svgs exist under it.
    await expect(row.locator("svg.lucide-star")).toHaveCount(5);
    await expect(row.locator("span.relative")).toHaveCount(0);
    // 4.8 -> 4 amber (floor), 1 muted — the reference's exact paint.
    await expect(row.locator("svg.fill-amber-400")).toHaveCount(4);
    await expect(row.locator("svg.text-border")).toHaveCount(1);
  });

  test("PDP breadcrumb geometry matches the reference (session-8)", async ({ page }) => {
    // BREADCRUMB-1: reference nav = `flex items-center gap-2 text-sm
    // text-muted-foreground mb-8` (8px column-gap, 32px bottom margin —
    // the clone's gap-1.5/mb-6 offset the entire PDP 8px lower). Measured
    // live 2026-10-08.
    await page.goto("/product/wireless-headphones");
    const nav = page.locator("main nav").first();
    await expect(nav).toHaveCSS("column-gap", "8px"); // gap-2
    await expect(nav).toHaveCSS("margin-bottom", "32px"); // mb-8
    await expect(nav).not.toHaveClass(/flex-wrap/);
    // The cascade proof: h1 top = breadcrumb top + 20 (nav h) + 32 (mb)
    // + 24 (py-8 remnant) — pin the measured reference delta instead of
    // absolute page coordinates.
    const delta = await page.evaluate(() => {
      const nav = document.querySelector("main nav");
      const h1 = document.querySelector("main h1");
      if (!nav || !h1) throw new Error("PDP structure not found");
      return h1.getBoundingClientRect().y - nav.getBoundingClientRect().y;
    });
    expect(Math.abs(delta - 76)).toBeLessThanOrEqual(1); // 20 + 32 + 24
  });

  test("feature-bar icons are the reference glyphs (session-8, ICON-DRIFT-1)", async ({ page }) => {
    // Measured live 2026-10-08: the reference feature bar (and PDP feature
    // row) uses lucide shield (Secure Payment) and lucide rotate-ccw
    // (30-Day Returns) — the clone shipped shield-check/refresh-cw.
    // Scope: the feature grid (the 4 cards' shared parent).
    await page.goto("/");
    const heading = page.locator("h3").filter({ hasText: "30-Day Returns" }).first();
    const grid = heading.locator("xpath=../../..");
    await expect(grid.locator("svg.lucide-truck")).toHaveCount(1);
    await expect(grid.locator("svg.lucide-shield")).toHaveCount(1);
    await expect(grid.locator("svg.lucide-shield-check")).toHaveCount(0);
    await expect(grid.locator("svg.lucide-rotate-ccw")).toHaveCount(1);
    await expect(grid.locator("svg.lucide-refresh-cw")).toHaveCount(0);
    await expect(grid.locator("svg.lucide-headphones")).toHaveCount(1);
  });

  test("PDP feature-row icons are the reference glyphs (session-8, ICON-DRIFT-1)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    const iconRow = page.locator("main .grid.grid-cols-3").first();
    await expect(iconRow).toContainText("Secure Payment");
    await expect(iconRow).toContainText("30-Day Returns");
    await expect(iconRow.locator("svg.lucide-truck")).toHaveCount(1);
    await expect(iconRow.locator("svg.lucide-shield")).toHaveCount(1);
    await expect(iconRow.locator("svg.lucide-shield-check")).toHaveCount(0);
    await expect(iconRow.locator("svg.lucide-rotate-ccw")).toHaveCount(1);
    await expect(iconRow.locator("svg.lucide-refresh-cw")).toHaveCount(0);
  });
});
