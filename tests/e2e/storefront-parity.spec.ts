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
});
