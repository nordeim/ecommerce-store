import { devices, expect, test } from "@playwright/test";

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

  test("hero slide content contract — images + CTA hrefs (session-26, HERO-DRIFT-1)", async ({ page }) => {
    // The reference site drifts its MEDIA and LINK TARGETS silently — the
    // 13-round pixel-sweep band held while the slide-3 image and the
    // slide-2/3 CTA hrefs changed under it (live-measured 2026-10-09: the
    // reference serves 19ea6418a… for "Home & Comfort" and links every CTA
    // to plain /shop). The clone renders all 3 slides in the DOM
    // (crossfade), so the pins read directly — this test converts the
    // manual sweep's catches into standing gate failures.
    await page.goto("/");
    const carousel = page.locator("[aria-roledescription=\"carousel\"]");
    const imgs = carousel.locator("img");
    await expect(imgs).toHaveCount(3);
    // The pinned hash tails of the reference's live slide media (the CDN
    // prefix is the shared media.base44.com path).
    const srcs = await imgs.evaluateAll((els) => els.map((el) => (el as HTMLImageElement).src));
    expect(srcs[0]).toContain("7cfe01108_generated_076a6d07.png");
    expect(srcs[1]).toContain("f0ae76854_generated_31ca432d.png");
    expect(srcs[2]).toContain("19ea6418a_generated_c69d9eaa.png");
    // The CTA hrefs: all three reference CTAs link plain /shop (measured
    // live per-slide — "Shop Now" / "Explore" / "Browse"). Read via DOM
    // traversal — the inactive slides are aria-hidden + inert (A11Y-FOCUS-1),
    // invisible to role queries but present in the crossfade DOM.
    const ctaHrefs = await carousel.locator("a").evaluateAll((els) =>
      els.map((el) => ({ text: el.textContent?.trim(), href: el.getAttribute("href") })),
    );
    expect(ctaHrefs).toEqual([
      { text: "Shop Now", href: "/shop" },
      { text: "Explore", href: "/shop" },
      { text: "Browse", href: "/shop" },
    ]);
  });

  test("header row geometry contract — the gap-1 icon cluster + the justify-between distribution (session-26, HEADER-DRIFT-1)", async ({ page }) => {
    // Live-measured on the reference 2026-10-09 at 1024×768: the icon
    // cluster (search/heart/bag/user) is flex gap-1 (4px — 156px wide),
    // which lands the justify-between nav row at x=270 (row 976 −
    // children 660 = 316; half 158 → 24+88+158 = 270). The clone's old
    // gap-2 (168px cluster) shifted the nav 6px left — invisible to every
    // computed-style pin (the classes were never asserted), caught only by
    // the pixel sweep. This pin makes the drift a gate failure.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    const navX = await nav.evaluate((el) => Math.round(el.getBoundingClientRect().x));
    expect(navX).toBe(270);
    // The icon cluster: the row's last flex child (the 4 icon buttons).
    const cluster = nav.locator("..").locator("div.flex").last();
    await expect(cluster).toHaveCSS("column-gap", "4px");
    const clusterW = await cluster.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(clusterW).toBe(156);
  });

  test("mobile header row distributes three children — the bare logo + the gap-1 cluster (session-26, HEADER-DRIFT-1)", async ({ page }) => {
    // Live-measured on the reference 2026-10-09 at 390×664: the mobile
    // header row carries THREE children (menu button 16–52, the bare logo
    // link 91–179, the icon cluster 218–374) distributed by
    // justify-between — NOT a (menu+logo) group. The clone's wrapped
    // gap-4 group sat the logo 23px left of the reference's on every
    // mobile page. The three-child arithmetic: content 36+88+156 = 280;
    // container 358; half-gap 39 → logo x = 91, cluster x = 218.
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto("/");
    // The Main nav is display:none at 390 — invisible to role queries —
    // so the row is located via the banner's LUXE logo link (a DIRECT row
    // child after the unwrap fix; its parent IS the row).
    const logoLink = page.getByRole("banner").getByRole("link", { name: "LUXE", exact: true });
    const row = logoLink.locator("..");
    const rowKids = await row.evaluate((el) =>
      [...el.children]
        .filter((c) => getComputedStyle(c).display !== "none")
        .map((c) => {
          const r = c.getBoundingClientRect();
          return { tag: c.tagName, x: Math.round(r.x), w: Math.round(r.width) };
        }),
    );
    expect(rowKids).toHaveLength(3); // menu, logo, cluster — no wrapper
    const logo = rowKids[1];
    expect(logo.x).toBe(91);
    expect(logo.w).toBe(88);
    const cluster = rowKids[2];
    expect(cluster.x).toBe(218);
    expect(cluster.w).toBe(156);
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

  test("shop sort trigger is the reference 150px wide (session-9, SORT-W-1)", async ({ page }) => {
    // Measured live 2026-10-08 on both sites: the sort combobox class ends
    // w-[150px] (computed 150px); the clone shipped w-[170px]. Category
    // (w-[160px]) and price (w-[150px]) already match.
    await page.goto("/shop");
    const sort = page.locator('button[aria-label="Sort products"]');
    await expect(sort).toBeVisible();
    await expect(sort).toHaveCSS("width", "150px");
  });

  test("hero h1 line-height follows the reference's v3 cascade (session-10, HERO-LH-1)", async ({ page }) => {
    // Trap 10: the reference's h1 class string is byte-identical to ours
    // (…text-3xl sm:text-4xl lg:text-5xl… leading-tight), but v3 emits
    // responsive text utilities in media layers AFTER base utilities, so
    // sm:text-4xl / lg:text-5xl re-override leading-tight with their own
    // line-heights at ≥640 / ≥1024. v4 lets the base leading-tight (1.25)
    // win at every width. Live-measured reference values:
    //   630px viewport → fs 30 / lh 37.5 (leading-tight wins below sm)
    //   768px viewport → fs 36 / lh 40   (the 4xl companion, 2.5rem)
    //  1024px viewport → fs 48 / lh 48   (the 5xl companion, 1)
    await page.goto("/");
    const h1 = page.locator("main h1").first();
    await expect(h1).toBeVisible();
    await page.setViewportSize({ width: 630, height: 900 });
    await expect(h1).toHaveCSS("font-size", "30px");
    await expect(h1).toHaveCSS("line-height", "37.5px");
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(h1).toHaveCSS("font-size", "36px");
    await expect(h1).toHaveCSS("line-height", "40px");
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(h1).toHaveCSS("font-size", "48px");
    await expect(h1).toHaveCSS("line-height", "48px");
  });

  test("hover effects are not media-gated in touch contexts (session-10, HOVER-GATE-1)", async ({ browser }) => {
    // Trap 11: v4.3 wraps every hover-family utility (hover:*, group-hover:*)
    // in @media (hover: hover); v3 (the reference engine) does not. In a
    // touch-emulated context the reference still renders card hover effects
    // (live-measured: img matrix(1.05), hovered title rgb(230,107,26)); the
    // gated clone renders nothing. Fixed via @custom-variant hover (&:hover).
    // Mobile emulation is the decisive condition — it flips
    // matchMedia('(hover: hover)') to false while :hover still matches.
    const ctx = await browser.newContext({
      ...devices["iPhone 14"],
      storageState: "tests/e2e/.auth/user.json",
    });
    const page = await ctx.newPage();
    try {
      await page.goto("/shop", { waitUntil: "networkidle" });
      const hvq = await page.evaluate(() => matchMedia("(hover: hover)").matches);
      expect(hvq).toBe(false); // the trap's decisive condition
      const card = page.locator("main div.group").first();
      const img = card.locator("img");
      const title = card.locator("h3");
      await card.hover();
      // Live-measured reference values under the same condition. Note: v3
      // renders scale-105 as `transform: matrix(1.05, …)`; v4 uses the CSS
      // `scale` property — the same visual result, different computed
      // property. We pin the v4 spelling (serialized "1.05").
      await expect
        .poll(() => img.evaluate((el) => getComputedStyle(el).scale))
        .toBe("1.05");
      await expect
        .poll(() => title.evaluate((el) => getComputedStyle(el).color))
        .toBe("rgb(230, 107, 26)");
    } finally {
      await ctx.close();
    }
  });

  test("hero inactive slides are inert — no focusable CTAs in the tab order (session-11, A11Y-FOCUS-1)", async ({ page }) => {
    // The clone renders all 3 slides in the DOM (crossfade structure);
    // inactive slides are aria-hidden + opacity-0, but aria-hidden alone
    // does NOT remove their CTA links from the TAB ORDER — Tab from the
    // active CTA landed on the invisible "Explore"/"Browse" anchors
    // (live-measured on the clone; the reference swaps slides in the DOM,
    // so its tab order is CTA → prev → next → dots). Fixed with
    // inert={i !== index} on the inactive slide containers.
    await page.goto("/");
    const carousel = page.locator('[aria-roledescription="carousel"]');
    await expect(carousel).toBeVisible();
    const activeCta = carousel.locator("a[href]").first();
    await activeCta.focus();
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName.toLowerCase() ?? "body",
        label: el?.getAttribute("aria-label") ?? "",
        inHiddenSlide: !!el?.closest('[aria-hidden="true"]'),
      };
    });
    // The next focusable after the active CTA must be the prev-arrow
    // BUTTON — never an anchor inside an aria-hidden slide.
    expect(stop.inHiddenSlide).toBe(false);
    expect(stop.tag).toBe("button");
    expect(stop.label).toBe("Previous slide");
  });

  test("text renders with the reference's subpixel smoothing (session-11, FONT-SMOOTH-1)", async ({ page }) => {
    // Trap 12: the shadcn v4 starter template ships
    // `-webkit-font-smoothing: antialiased` on the body (the port carried
    // it in globals.css @apply + the layout body class); the reference
    // computes `auto` — the browser's default subpixel LCD antialiasing.
    // Live-measured on both sites; the clone's text rendered with lighter
    // grayscale strokes, elevating every route's text-band pixel diff.
    // Live-measured reference value: auto (subpixel).
    await page.goto("/");
    const smoothing = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("-webkit-font-smoothing"),
    );
    expect(smoothing).toBe("auto");
  });

  test("the body font is the reference's exact woff2 — no next/font repackaging (session-11, FONT-FILE-1)", async ({ page }) => {
    // Trap 13: next/font's subsetting pipeline strips the woff2 `prep`
    // table (TrueType hinting pre-program). Outlines, advances and kerning
    // stay byte-identical, but rasterization changes — a halo on every
    // glyph, 1-4.8% text-band pixel diffs vs the reference (live-measured;
    // the VLM saw "a halo around the letters" on every text element). The
    // reference serves Google's plusjakartasans/v12 variable woff2 WITH
    // its prep table. Fix: self-host the reference's exact file under the
    // same declared family name (public/fonts/plus-jakarta-sans.woff2) and
    // drop the next/font wrapper.
    await page.goto("/");
    const state = await page.evaluate(async () => {
      await document.fonts.ready;
      const faces = [...document.fonts].map((f) => `${f.family} ${f.weight}`);
      const stack = getComputedStyle(document.body).fontFamily;
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d")!;
      ctx.font = '100px "Plus Jakarta Sans", sans-serif';
      // Live-measured on the REFERENCE with the same engine: 1009px for
      // this string (the next/font-repackaged build measured 1013).
      const width = Math.round(ctx.measureText("Handgloves 0123 jam").width);
      return { faces, stack, width };
    });
    // exactly ONE face — no next/font metric-adjusted "Fallback" companion
    expect(state.faces).toEqual(["Plus Jakarta Sans 200 800"]);
    // the reference's exact computed stack
    expect(state.stack).toBe('"Plus Jakarta Sans", sans-serif');
    // the reference's measured glyph metrics (±2px engine tolerance)
    expect(Math.abs(state.width - 1009)).toBeLessThanOrEqual(2);
    // the self-hosted file is served byte-identical to the reference's
    const fontRes = await page.request.get("/fonts/plus-jakarta-sans.woff2");
    expect(fontRes.status()).toBe(200);
    expect((await fontRes.body()).byteLength).toBe(27348);
  });

  test("exactly one main landmark per page (session-12, A11Y-MAIN-1)", async ({ page }) => {
    // The (storefront) layout owns the page's single <main> (the session-7
    // contract). Four shopper pages rendered their OWN <main
    // className="flex-1"> INSIDE it (account, checkout ×2 code paths,
    // checkout/success, wishlist ×2 code paths) — invalid HTML (main's
    // content model forbids nesting) and axe flagged
    // landmark-main-is-top-level + landmark-no-duplicate-main +
    // landmark-unique on the account page. The reference renders exactly
    // one main.flex-1 on every route (live-counted). The inner wrapper is
    // now a <div className="flex-1"> (layout-inert either way — the parent
    // main is not a flex container).
    for (const path of ["/account", "/wishlist", "/checkout", "/checkout/success"]) {
      await page.goto(path);
      const mains = await page.locator("main").count();
      expect(mains, `${path} renders exactly one <main>`).toBe(1);
    }
  });

  test("the toast region is a valid nameless live region (session-12, A11Y-ARIA-1)", async ({ page }) => {
    // ARIA 1.2+ prohibits aria-label on role-less (generic) elements — the
    // toast viewport's aria-label="Notifications" tripped axe's
    // aria-prohibited-attr (serious) on every storefront route. The
    // reference's toast container carries no aria attributes at all; the
    // live region needs no name — its content is what gets announced.
    await page.goto("/");
    const viewport = page.locator("div.fixed.bottom-6.right-6");
    await expect(viewport).toHaveCount(1);
    await expect(viewport).toHaveAttribute("aria-live", "polite");
    await expect(viewport).not.toHaveAttribute("aria-label");
  });

  test("the PDP rating row is a labeled image role (session-12, A11Y-ARIA-2)", async ({ page }) => {
    // The star row's aria-label="Rated X out of 5" sat on a role-less div
    // (the same aria-prohibited-attr violation). role="img" +
    // aria-label is the canonical WCAG pattern for a decorative glyph row
    // with a text alternative — the label becomes valid and screen readers
    // announce the rating. (The reference's row is unlabeled; the label
    // stays as the clone's documented aria superset.)
    await page.goto("/product/wireless-headphones");
    const rating = page.locator('main div[aria-label^="Rated"]');
    await expect(rating).toHaveCount(1);
    await expect(rating).toHaveAttribute("role", "img");
    await expect(rating).toHaveAttribute("aria-label", "Rated 4.8 out of 5");
  });
});
