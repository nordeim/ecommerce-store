import { expect, test } from "@playwright/test";

// Quick-add states (session-59, QUICKADD-STATES-1) — the customer-surfaces
// pin-density sweep's SEVENTEENTH installment: the PDP related-products
// quick-add family. r51 (CARD-HOVER-1) pinned the card family's HOVER
// geometry on the shop grid; the quick-add's INTERACTION states were never
// measured in the related context: the click's full observable set (badge,
// toast, drawer, navigation), the keyboard focus walk (does the addbar
// reveal on focus? the focus rings), the double-click transactional
// landing, and the @375 confirmation. Every pin here is calibrated against
// the LIVE surfaces (six probes: quickadd-probe-r59a/a2/a3 on the reference
// + quickadd-clone-r59b/b2/b3 on the clone + quickadd-mobile-r59 both
// sides):
//
//   - THE ROUND'S HEADLINE: the family closes as the sweep's SIXTH
//     fully-parity family — a ZERO-DIVERGENCE closure (the r54/r57
//     closure precedent). Every computed axis identical: the card
//     container byte-identical; the addbar's resting/hovered states (the
//     v4 `translate` spelling register); the Add button's anatomy incl.
//     its /90 hover (the lab/rgba engine register); NO active state both
//     sides; the click observables IDENTICAL (badge bump, the toast's
//     copy/position/lifetime, NO drawer, NO navigation — the reference's
//     adds are zero-network client-state, the clone's server actions are
//     the registered DB-backed superset); the double-click lands both
//     adds; the keyboard paths identical (THE FOCUS-ADJUSTED RENDERING —
//     see the P11 note: Chrome renders the focused-and-clipped Add
//     button's addbar at its NATURAL position on BOTH sites (the v3
//     reference included — quickadd-refgeo-r59) while the computed style
//     reads hidden — the rect/hit-test instruments carry the visual truth;
//     the heart's global-rule outline auto 1px ring/50; the Add's orange
//     1px ring in box-shadow); @375 byte-identical geometry.
//   - THE PIN CONTEXT: this spec runs in a GUEST context
//     (storageState opt-out — the performance.spec/guest-cart precedent):
//     the quick-add's cart/wishlist writes live in the context's cookie
//     token and die with the test — zero e2e.db pollution for the later
//     count-asserting specs.
//   - THE ENGINE REGISTERS (accepted): v4's `translate` property vs v3's
//     transform matrix; lab() vs rgba() serialization; the three
//     transparent shadow reset layers vs v3's single white layer; the
//     four-property transition list.
//
// Instrument notes (the round's probe-honesty lessons): the addbar's state
// lives in the CSS `translate` property (v4) — a `transform` read returns
// "none" at every state; the box-shadow read must be FULL (the ring layer
// hides behind the reset layers); the :focus-visible judgment REQUIRES a
// real keyboard.press("Tab") (script .focus() never trips the heuristic);
// the Add button's hidden rect lands INSIDE the card (the addbar's
// containing block is the image Link — `block relative`), so locator
// hover/click fire the group-hover, the reveal runs, and Playwright's
// retry re-lands on the revealed button (the r59 experiment).

test.describe("related-products quick-add states (session-59, QUICKADD-STATES-1)", () => {
  // The guest context — zero e2e.db pollution (the cookie-token cart dies
  // with this test; cart.spec's absolute counts run in the a–c group BEFORE
  // this spec; wishlist.spec's counts hold their own context).
  test.use({ storageState: { cookies: [], origins: [] } });

  test("P1: the related section renders — h2, grid, 2 cards, the names (the reference rule)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const section = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like", exact: true }) });
    await expect(section).toBeVisible();
    const grid = section.locator("div.grid");
    await expect(grid).toBeVisible();
    // The reference rule (measured live): ALL same-category products
    // excluding self, array order — headphones → [speaker, pad].
    expect(await grid.getAttribute("class")).toBe("grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6");
    expect(await grid.locator("div.group").count()).toBe(2);
    expect(await grid.locator("h3").allTextContents()).toEqual(["Smart Home Speaker Pro", "Wireless Charging Pad"]);
  });

  test("P2: the card container's class string (the group contract)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    await card.scrollIntoViewIfNeeded();
    expect(await card.getAttribute("class")).toBe(
      "group relative bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300",
    );
  });

  test("P3: the addbar at rest — translate 0px 100% + the 0.3s transition family", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const wrap = card.locator("div.absolute.inset-x-0");
    await card.scrollIntoViewIfNeeded();
    // v4 spells translate-y-full in the CSS `translate` property (the
    // reference's v3 reads matrix(1,0,0,1,0,56) — the register).
    expect(await wrap.evaluate((el) => getComputedStyle(el).translate)).toBe("0px 100%");
    const t = await wrap.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { dur: cs.transitionDuration, props: cs.transitionProperty };
    });
    expect(t.dur).toBe("0.3s");
    expect(t.props).toContain("translate");
    expect(await wrap.getAttribute("class")).toBe(
      "absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300",
    );
  });

  test("P4 + P5: the addbar's reveal/hide round-trip (group-hover)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const wrap = card.locator("div.absolute.inset-x-0");
    // locator.hover fires the group-hover (the button's hidden rect lands
    // inside the card — the image Link is the containing block; the reveal
    // runs and the retry re-lands on the revealed element).
    await card.hover();
    await page.waitForTimeout(600);
    expect(await wrap.evaluate((el) => getComputedStyle(el).translate)).toBe("0px");
    // The hide round-trip: mouse away → the collapse back to 0px 100%.
    await page.mouse.move(8, 8);
    await page.waitForTimeout(600);
    expect(await wrap.evaluate((el) => getComputedStyle(el).translate)).toBe("0px 100%");
  });

  test("P6: the Add button's anatomy (32px, wrap−24, 12px/500, 12px radius, 8px gap, 16px svg)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const btn = card.getByRole("button", { name: "Add to Cart" });
    await card.scrollIntoViewIfNeeded();
    const a = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const wrap = el.closest("div.absolute")!;
      const wr = wrap.getBoundingClientRect();
      return {
        h: Math.round(r.height), w: Math.round(r.width), wrapW: Math.round(wr.width),
        font: `${cs.fontSize}/${cs.fontWeight}`, radius: cs.borderRadius,
        bg: cs.backgroundColor, color: cs.color, gap: cs.gap,
        svg: getComputedStyle(el.querySelector("svg")!).width,
        text: (el.textContent || "").trim(),
      };
    });
    // The measured reference set (r59a [2]): 200×32 @1024 / 138×32 @375 —
    // the structural width pin (w === wrapW − 24) is viewport-independent.
    expect(a.h).toBe(32); // h-8
    expect(a.w).toBe(a.wrapW - 24); // w-full inside the p-3 wrap
    expect(a.font).toBe("12px/500"); // text-xs font-medium
    expect(a.radius).toBe("12px"); // rounded-xl
    expect(a.bg).toBe("rgb(230, 107, 26)"); // bg-primary
    expect(a.color).toBe("rgb(255, 255, 255)");
    expect(a.gap).toBe("8px"); // gap-2 (the reference's class carries it too)
    expect(a.svg).toBe("16px"); // [&_svg]:size-4 overrides h-3.5 w-3.5
    expect(a.text).toBe("Add to Cart");
  });

  test("P7: the Add button's hover bg — the /90 form (the engine register)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const btn = card.getByRole("button", { name: "Add to Cart" });
    await card.scrollIntoViewIfNeeded();
    await btn.hover();
    await page.waitForTimeout(500);
    const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    // hover:bg-primary/90 — the reference reads rgba(230,107,26,0.9), v4
    // lab(... / 0.9); both end in "0.9)" (the engine-spelling register).
    expect(bg).toMatch(/0\.9\)$/);
  });

  test("P8: the click observables — badge bump, the toast, NO drawer, NO navigation", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const btn = card.getByRole("button", { name: "Add to Cart" });
    await card.scrollIntoViewIfNeeded();
    // The guest badge starts at "Cart" (0 items).
    const badge = page.locator("header button[aria-label^='Cart']");
    expect(await badge.getAttribute("aria-label")).toBe("Cart");
    await btn.click();
    // The badge bumps to 1 with the pluralization (the reference's span
    // text reads "1" — the aria is the clone's a11y superset, the r55 pin).
    await expect
      .poll(async () => badge.getAttribute("aria-label"))
      .toBe("Cart, 1 item");
    // The reference's exact toast copy, the dark bottom-right box.
    const toast = page.getByText("Smart Home Speaker Pro added to cart!");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCSS("background-color", "rgb(23, 23, 28)"); // bg-foreground
    await expect(toast).toHaveCSS("border-radius", "12px"); // rounded-xl
    // NO drawer auto-open; NO navigation (both measured live on the
    // reference — adds bump the badge only).
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
    expect(page.url()).toContain("/product/wireless-headphones");
  });

  test("P9: the toast's lifetime (~3s) + the badge persists", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    await card.scrollIntoViewIfNeeded();
    await card.getByRole("button", { name: "Add to Cart" }).click();
    const toast = page.getByText("Smart Home Speaker Pro added to cart!");
    await expect(toast).toBeVisible();
    // The reference's 3000ms lifetime (measured gone by 3.2s live).
    await expect(toast).toBeHidden({ timeout: 6000 });
    // The badge persists after the toast dies.
    const badge = page.locator("header button[aria-label^='Cart']");
    expect(await badge.getAttribute("aria-label")).toBe("Cart, 1 item");
  });

  test("P10: the double-click — both adds land (the transactional seam)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const btn = card.getByRole("button", { name: "Add to Cart" });
    await card.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page.locator("header button[aria-label^='Cart']")).toHaveAttribute("aria-label", "Cart, 1 item", { timeout: 8000 });
    // Two rapid clicks — the reference's client state lands both (badge
    // 2→4); the clone's transactional delta seam lands both too (measured
    // live r59b [8]: 1→3).
    await btn.click();
    await page.waitForTimeout(120);
    await btn.click();
    await expect
      .poll(async () => page.locator("header button[aria-label^='Cart']").getAttribute("aria-label"))
      .toBe("Cart, 3 items");
  });

  test("P11: the addbar under keyboard focus — the CSS stays hidden, the ENGINE reveals (both sites identically)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const wrap = card.locator("div.absolute.inset-x-0");
    const addBtn = card.getByRole("button", { name: "Add to Cart" });
    await card.scrollIntoViewIfNeeded();
    // Mouse away (no hover state); the walk: script-focus the card's image
    // link (not under judgment), then REAL keyboard Tabs into the heart
    // and the Add (the L77 instrument — :focus-visible only trips under
    // the real input pipeline).
    await page.mouse.move(8, 8);
    await page.waitForTimeout(500);
    await card.locator("a").first().evaluate((el) => el.focus());
    await page.keyboard.press("Tab"); // → heart
    await page.keyboard.press("Tab"); // → Add
    await page.waitForTimeout(400);
    const state = await addBtn.evaluate((el) => {
      const card = el.closest("div.group")!;
      const wrap = card.querySelector("div.absolute.inset-x-0") as HTMLElement | null;
      const link = card.querySelector("a")!;
      return {
        matchesFocusVisible: el.matches(":focus-visible"),
        addbarTranslate: wrap ? getComputedStyle(wrap).translate : null,
        addbarRect: wrap ? [Math.round(wrap.getBoundingClientRect().y), Math.round(wrap.getBoundingClientRect().bottom)] : null,
        linkBottom: Math.round(link.getBoundingClientRect().bottom),
      };
    });
    // THE TWO-SIDED TRUTH (the round's central instrument finding): Chrome
    // renders a focused-and-clipped descendant at its NATURAL (un-clipped)
    // position — the addbar's RECT moves to the Link's bottom-0 zone —
    // while getComputedStyle still reports the DECLARED translate. The
    // behavior is ENGINE-WIDE, measured IDENTICAL on the reference
    // (quickadd-refgeo-r59: ref-b script-focus + ref-d Tab-walk both read
    // addbarRect [376,432] + hit test "Add to Cart" while its computed
    // transform reads matrix(...,56)) and on the clone (the same numbers).
    // So: (1) the CSS contract — the group-hover-only reveal (NO focus
    // variant in the class string — the computed stays 100%); (2) the
    // engine's focus adjustment — the rect reveals; both sides identical.
    expect(state.matchesFocusVisible).toBe(true);
    expect(state.addbarTranslate).toBe("0px 100%"); // the class-level truth
    // the engine-level truth: the addbar's rect sits AT the Link's bottom
    // (the natural bottom-0 zone — [linkBottom-56, linkBottom]), not the
    // translated +56 zone.
    expect(state.addbarRect![1]).toBe(state.linkBottom);
    expect(state.addbarRect![0]).toBe(state.linkBottom - 56);
  });

  test("P12: the Add button's focus ring — the orange 1px + the shadow-lg pair, outline none", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const addBtn = card.getByRole("button", { name: "Add to Cart" });
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(8, 8);
    await page.waitForTimeout(400);
    await card.locator("a").first().evaluate((el) => el.focus());
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(400);
    // FULL box-shadow read (the L77 discipline — the ring layer hides
    // behind the reset layers in a truncated read).
    const ring = await addBtn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { boxShadow: cs.boxShadow, outlineStyle: cs.outlineStyle };
    });
    // The measured set (r59a [7] vs r59b2 [3]): the visible layers
    // identical — the orange 1px ring + the shadow-lg pair; v4 prefixes
    // three transparent reset layers (the r52 zero-layers register).
    expect(ring.boxShadow).toContain("rgb(230, 107, 26) 0px 0px 0px 1px");
    expect(ring.boxShadow).toContain("rgba(0, 0, 0, 0.1) 0px 10px 15px -3px");
    expect(ring.boxShadow).toContain("rgba(0, 0, 0, 0.1) 0px 4px 6px -4px");
    // focus-visible:outline-none — its own class (the ring lives in
    // box-shadow).
    expect(ring.outlineStyle).toBe("none");
  });

  test("P13: the heart's focus outline — auto 1px ring/50 (the global rule), NO box ring", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const heart = card.locator("button[aria-label*='wishlist']"); // state-stable (the aria flips Add↔Remove)
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(8, 8);
    await page.waitForTimeout(400);
    await card.locator("a").first().evaluate((el) => el.focus());
    await page.keyboard.press("Tab"); // → heart (keyboard: :focus-visible trips)
    await page.waitForTimeout(400);
    const f = await heart.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        matches: el.matches(":focus-visible"),
        style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor,
        boxShadow: cs.boxShadow,
      };
    });
    // The global `* { outline-ring/50 }` base rule + the UA's
    // :focus-visible auto style — IDENTICAL on the reference (measured
    // 1px auto rgba(230,107,26,0.5); the heronav P4 family, now confirmed
    // on the card heart). The heart carries no focus classes: no box ring.
    expect(f.matches).toBe(true);
    expect(f.style).toBe("auto");
    expect(f.width).toBe("1px");
    expect(f.color).toMatch(/^rgba\(230, 107, 26, 0\.5\)$|^lab\(60\.0768 45\.9585 63\.0005 \/ 0\.5\)$/);
    expect(f.boxShadow).not.toContain("rgb(230, 107, 26)"); // shadow-sm only
  });

  test("P14: the heart's Enter toggle — aria-pressed, the toast, the red fill (the keyboard path)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const card = page.locator("section", { has: page.getByRole("heading", { name: "You May Also Like" }) }).locator("div.grid div.group").first();
    const heart = card.locator("button[aria-label*='wishlist']");
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(8, 8);
    await page.waitForTimeout(400);
    expect(await heart.getAttribute("aria-pressed")).toBe("false");
    await card.locator("a").first().evaluate((el) => el.focus());
    await page.keyboard.press("Tab"); // → heart
    await page.waitForTimeout(300);
    // The keyboard Enter — the reference's identical path (measured live
    // r59a3 [2]: the toggle + the wishlist toast + the svg flip).
    await page.keyboard.press("Enter");
    await expect(page.getByText("Smart Home Speaker Pro added to wishlist!")).toBeVisible();
    await expect(heart).toHaveAttribute("aria-pressed", "true", { timeout: 8000 });
    // The session-5 color contract, keyboard path: the svg flips to the
    // red pair (the reference's post-toggle class string measured
    // byte-identical).
    const svgCls = await heart.locator("svg").getAttribute("class");
    expect(svgCls).toContain("fill-destructive");
    expect(svgCls).toContain("text-destructive");
  });
});
