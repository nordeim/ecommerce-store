import { expect, test } from "@playwright/test";

// Footer + announcement-bar interaction states (session-54, FOOTER-ANN-1) —
// the customer-surfaces pin-density sweep's twelfth installment. The footer's
// interaction layer (the /60 hover token across the Shop links + Company
// spans, the bottom row's /40 layer and its hover, the grid geometry, the
// heading typography) and the announcement bar's resting contract are
// INTERACTION-GATED or resting-unpinned — the sweep's pixel diff cannot see
// the hover states, and the bar's computed contract was never pinned. Every
// pin here is calibrated against the LIVE reference (probes
// announcement-probe-r54a + footer-probe-r54b/r54d on the reference +
// footer-clone-r54c on the clone, the DOM dumps, computed styles, and
// REAL-mouse hovers as the ground truth):
//
//   - THE ROUND'S HEADLINES: (1) the announcement bar is the sweep's THIRD
//     ZERO-DIVERGENCE family — the session-105 "scroll-marquee" suggestion
//     was SPECULATION; the reference's bar is a STATIC single-text-node
//     strip with a BYTE-IDENTICAL class string and every computed value
//     equal (P1 + P2 close the question permanently). (2) The footer is
//     NEAR-parity with ONE real divergence: the bottom-row policy spans —
//     the reference carries `text-xs text-background/40
//     hover:text-background/60` on EACH span (hover target /60), the clone
//     inherited its resting tokens from the parent and hovered to FULL
//     (P10 + P11 are the FIX's pins — the round's honest RED).
//   - THE SUPERSET CONTRACTS (deliberate, documented in the plan §2.3):
//     the clone's 7 Shop links carry `?category=` filters (the reference's
//     all point to plain /shop — pinned here as the clone's own href
//     inventory), and the footer's `mt-auto` sticky-footer (rendered
//     margin-top 0 on full pages, identical resting paint).
//   - THE ENGINE REGISTERS (rendered-identical): (1) v4 serializes alpha
//     colors as lab(...) vs the reference's rgba(...) — the pins accept
//     both spellings; (2) v4's transition-colors list is longer (+ outline-
//     color, --tw-gradient-*) — the pins assert the 0.15s duration; (3) the
//     space-y-3 rhythm emits LI margins, not ul row-gap (display block,
//     rowGap normal) — asserted via the class string, not row-gap.

const FOOTER = "footer";
const ANN_BAR = "header > div";

// Both-spelling alpha color matchers (the lab() register — r48..r53 form).
const C60 = /rgba\(251, 250, 249, 0\.6\)|lab\(98\.3283 0\.212789 0\.603545 \/ 0\.6\)/;
const C40 = /rgba\(251, 250, 249, 0\.4\)|lab\(98\.3283 0\.212789 0\.603545 \/ 0\.4\)/;
const FULL = "rgb(251, 250, 249)";

test.describe("footer + announcement-bar interaction states (session-54, FOOTER-ANN-1)", () => {
  test("P1: the announcement bar — the full resting contract (the closure's anchor)", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator(ANN_BAR).first();
    await expect(bar).toHaveText("Free shipping on orders over $100 • 30-day returns");
    await expect(bar).toHaveClass("bg-primary text-primary-foreground text-center py-1.5 text-xs font-medium tracking-wide");
    await expect(bar).toHaveCSS("background-color", "rgb(230, 107, 26)");
    await expect(bar).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(bar).toHaveCSS("font-size", "12px");
    await expect(bar).toHaveCSS("font-weight", "500");
    await expect(bar).toHaveCSS("letter-spacing", "0.3px");
    await expect(bar).toHaveCSS("padding-top", "6px");
    await expect(bar).toHaveCSS("padding-bottom", "6px");
    await expect(bar).toHaveCSS("text-align", "center");
    const h = await bar.evaluate((el) => (el as HTMLElement).offsetHeight);
    expect(h).toBe(28);
  });

  test("P2: the announcement bar is STATIC — no marquee, no children, no animation (the session-105 speculation closed)", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator(ANN_BAR).first();
    const reads = await bar.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        childCount: el.childElementCount,
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        whiteSpace: cs.whiteSpace,
        overflow: cs.overflow,
        position: cs.position,
      };
    });
    // The reference measures: a single text node (0 element children),
    // animation none, normal white-space — NO marquee exists on either side.
    expect(reads.childCount).toBe(0);
    expect(reads.animationName).toBe("none");
    expect(reads.animationDuration).toBe("0s");
    expect(reads.whiteSpace).toBe("normal");
    expect(reads.overflow).toBe("visible");
  });

  test("P3: the footer anatomy — the inverted block, the container, the 4-col grid (structural)", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveCSS("background-color", "rgb(23, 23, 28)");
    await expect(footer).toHaveCSS("color", "rgb(251, 250, 249)");
    const container = footer.locator(":scope > div").first();
    await expect(container).toHaveClass("max-w-7xl mx-auto px-4 sm:px-6 py-16");
    await expect(container).toHaveCSS("max-width", "1280px");
    await expect(container).toHaveCSS("padding-top", "64px");
    const grid = footer.locator("div.grid").first();
    await expect(grid).toHaveClass("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10");
    const gridReads = await grid.evaluate((el) => {
      const g = el as HTMLElement;
      const cs = getComputedStyle(g);
      return { cols: cs.gridTemplateColumns.split(" ").length, gap: cs.columnGap, children: g.children.length };
    });
    expect(gridReads.cols).toBe(4);
    expect(gridReads.gap).toBe("40px");
    expect(gridReads.children).toBe(4);
  });

  test("P4: the column headings — font-semibold text-sm uppercase tracking-wider mb-4", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const headings = footer.locator("h3");
    await expect(headings).toHaveCount(3);
    await expect(headings.nth(0)).toHaveText("Shop");
    await expect(headings.nth(1)).toHaveText("Company");
    await expect(headings.nth(2)).toHaveText("Stay Updated");
    for (let i = 0; i < 3; i++) {
      const h = headings.nth(i);
      await expect(h).toHaveClass("font-semibold text-sm uppercase tracking-wider mb-4");
      await expect(h).toHaveCSS("font-size", "14px");
      await expect(h).toHaveCSS("font-weight", "600");
      await expect(h).toHaveCSS("text-transform", "uppercase");
      await expect(h).toHaveCSS("letter-spacing", "0.7px");
      await expect(h).toHaveCSS("margin-bottom", "16px");
      await expect(h).toHaveCSS("color", "rgb(251, 250, 249)");
    }
  });

  test("P5: the Shop links — the /60 resting token + the clone's category-filter href inventory (the superset contract)", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const list = footer.locator("ul").first();
    const items = list.locator("li");
    await expect(items).toHaveCount(7);
    await expect(list).toHaveClass("space-y-3");
    const first = items.nth(0).locator("a");
    await expect(first).toHaveText("All Products");
    await expect(first).toHaveClass("text-sm text-background/60 hover:text-background transition-colors");
    await expect(first).toHaveCSS("font-size", "14px");
    const color = await first.evaluate((el) => getComputedStyle(el).color);
    expect(color).toMatch(C60);
    await expect(first).toHaveCSS("text-decoration-line", "none");
    // The clone's own superset contract: the reference's 7 hrefs ALL point
    // to plain /shop; the clone's category links carry working filters.
    const hrefs = await list.locator("a").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toEqual([
      "/shop",
      "/shop?category=electronics",
      "/shop?category=clothing",
      "/shop?category=accessories",
      "/shop?category=home-living",
      "/shop?category=sports",
      "/shop?category=beauty",
    ]);
  });

  test("P6: the Shop-link hover — REAL mouse lifts /60 to full in 0.15s (both engines)", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("contentinfo").getByRole("link", { name: "All Products" });
    await link.scrollIntoViewIfNeeded();
    const resting = await link.evaluate((el) => getComputedStyle(el).color);
    expect(resting).toMatch(C60);
    const duration = await link.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0.15s");
    // REAL mouse (the r53 L60 lesson: synthetic events never activate :hover)
    await link.hover();
    await page.waitForTimeout(400); // past the 0.15s transition
    const hovered = await link.evaluate((el) => getComputedStyle(el).color); // read BEFORE mouse-out (L58)
    expect(hovered).toBe(FULL);
    await page.mouse.move(4, 4);
  });

  test("P7: the Company spans — the same /60 token + the pointer affordance (non-link parity)", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const spans = footer.locator("span", { hasText: /^(About Us|Careers|Press|Sustainability|Affiliate Program)$/ });
    await expect(spans).toHaveCount(5);
    const careers = footer.getByText("Careers", { exact: true });
    await expect(careers).toHaveClass("text-sm text-background/60 hover:text-background transition-colors cursor-pointer");
    await expect(careers).toHaveCSS("font-size", "14px");
    await expect(careers).toHaveCSS("cursor", "pointer");
    const color = await careers.evaluate((el) => getComputedStyle(el).color);
    expect(color).toMatch(C60);
  });

  test("P8: the Company-span hover — REAL mouse lifts /60 to full (the non-link hover family)", async ({ page }) => {
    await page.goto("/");
    const careers = page.getByRole("contentinfo").getByText("Careers", { exact: true });
    await careers.scrollIntoViewIfNeeded();
    await careers.hover();
    await page.waitForTimeout(400);
    const hovered = await careers.evaluate((el) => getComputedStyle(el).color); // read BEFORE mouse-out
    expect(hovered).toBe(FULL);
    await page.mouse.move(4, 4);
  });

  test("P9: the bottom row — the flex rhythm + the copyright /40 layer", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const row = footer.locator("div.flex.justify-between").last();
    await expect(row).toHaveClass("flex flex-col sm:flex-row justify-between items-center gap-4");
    await expect(row).toHaveCSS("justify-content", "space-between");
    await expect(row).toHaveCSS("align-items", "center");
    await expect(row).toHaveCSS("gap", "16px");
    const copyright = row.locator("p");
    await expect(copyright).toHaveText("© 2026 LUXE Store. All rights reserved.");
    await expect(copyright).toHaveClass("text-xs text-background/40");
    await expect(copyright).toHaveCSS("font-size", "12px");
    const c = await copyright.evaluate((el) => getComputedStyle(el).color);
    expect(c).toMatch(C40);
  });

  test("P10: the policy spans — the per-span class placement (THE FIX's structural pin)", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    // The reference carries the tokens on EACH span (r54d): the parent is a
    // bare `flex gap-6`; the spans carry text-xs text-background/40
    // hover:text-background/60 cursor-pointer transition-colors. Pre-fix the
    // clone inherits its resting paint from the parent and carries only the
    // full-target hover — this pin fails until the placement is restored.
    const parent = footer.locator("div.flex.gap-6").last();
    await expect(parent).toHaveClass("flex gap-6");
    const policies = ["Privacy Policy", "Terms of Service", "Cookie Policy"];
    for (const name of policies) {
      const span = footer.getByText(name, { exact: true });
      await expect(span).toHaveClass("text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors");
      await expect(span).toHaveCSS("font-size", "12px");
      await expect(span).toHaveCSS("cursor", "pointer");
      const c = await span.evaluate((el) => getComputedStyle(el).color);
      expect(c).toMatch(C40);
    }
  });

  test("P11: the policy hover — REAL mouse lifts /40 to /60 (NOT full) — the reference's measured target (THE FIX's behavioral pin)", async ({ page }) => {
    await page.goto("/");
    const privacy = page.getByRole("contentinfo").getByText("Privacy Policy", { exact: true });
    await privacy.scrollIntoViewIfNeeded();
    const resting = await privacy.evaluate((el) => getComputedStyle(el).color);
    expect(resting).toMatch(C40);
    // REAL mouse (the r53 L60 lesson); read BEFORE mouse-out (the r52 L58).
    await privacy.hover();
    await page.waitForTimeout(400);
    const hovered = await privacy.evaluate((el) => getComputedStyle(el).color);
    // The reference measures /40 -> /60 (rgba(251,250,249,0.6)); the
    // pre-fix clone lifted to FULL rgb(251,250,249) — the honest RED.
    expect(hovered).toMatch(C60);
    expect(hovered).not.toBe(FULL);
    await page.mouse.move(4, 4);
  });

  test("P12: the contact block — the flex-col icon rows at /60", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const block = footer.locator("div.flex.flex-col.gap-2.text-sm").first();
    await expect(block).toHaveClass("flex flex-col gap-2 text-sm text-background/60");
    await expect(block).toHaveCSS("display", "flex");
    await expect(block).toHaveCSS("row-gap", "8px");
    await expect(block).toHaveCSS("font-size", "14px");
    const c = await block.evaluate((el) => getComputedStyle(el).color);
    expect(c).toMatch(C60);
    await expect(block.getByText("hello@luxestore.com")).toBeVisible();
    await expect(block.getByText("+1 (555) 123-4567")).toBeVisible();
    await expect(block.getByText("New York, NY 10001")).toBeVisible();
    const icons = block.locator("svg");
    await expect(icons).toHaveCount(3);
    const iconReads = await icons.first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), stroke: getComputedStyle(el).color };
    });
    expect(iconReads.w).toBe(16);
    expect(iconReads.h).toBe(16);
    expect(iconReads.stroke).toMatch(C60);
  });

  test("P13: the blurb + the hairline — the /60 copy block and the 40px hairline rhythm", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const blurb = footer.getByText("Curated collection of premium products for modern living. Quality meets style in every piece.");
    await expect(blurb).toHaveClass("text-sm text-background/60 leading-relaxed mb-6");
    await expect(blurb).toHaveCSS("font-size", "14px");
    await expect(blurb).toHaveCSS("line-height", "22.75px");
    await expect(blurb).toHaveCSS("margin-bottom", "24px");
    const bc = await blurb.evaluate((el) => getComputedStyle(el).color);
    expect(bc).toMatch(C60);
    const hair = footer.locator("div.h-\\[1px\\]");
    await expect(hair).toHaveClass("shrink-0 h-[1px] w-full my-10 bg-background/10");
    await expect(hair).toHaveCSS("height", "1px");
    await expect(hair).toHaveCSS("margin-top", "40px");
    await expect(hair).toHaveCSS("margin-bottom", "40px");
    const hc = await hair.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(hc).toMatch(/rgba\(251, 250, 249, 0\.1\)|lab\(98\.3283 0\.212789 0\.603545 \/ 0\.1\)/);
  });

  test("P14: the responsive collapse — 390px stacks the grid to one column and the bottom row to a column", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    const grid = footer.locator("div.grid").first();
    const gridCols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(gridCols).toBe(1);
    const row = footer.locator("div.flex.justify-between").last();
    await expect(row).toHaveCSS("flex-direction", "column");
    await expect(row).toHaveCSS("row-gap", "16px");
    // The announcement bar holds its 28px height at mobile too.
    const bar = page.locator(ANN_BAR).first();
    const h = await bar.evaluate((el) => (el as HTMLElement).offsetHeight);
    expect(h).toBe(28);
  });
});
