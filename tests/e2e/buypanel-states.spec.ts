import { expect, test } from "@playwright/test";

// PDP buy-panel action states (session-52, BUY-PANEL-1) — the
// customer-surfaces pin-density sweep's tenth installment. The buy-panel's
// hover/focus states are INTERACTION-GATED (the resting pixel sweep captures
// the PDP with no hover and no focus) and the accent token's resting sites
// (the home tiles) were never value-pinned. Every pin here is calibrated
// against the LIVE reference (probes buypanel-probe-r52b/c/d/e/g on the
// reference + buypanel-clone-r52a/f on the clone, the DOM dumps and computed
// styles as the ground truth):
//
//   - THE ROUND'S HEADLINE: the family is FULLY PARITY — the sweep's first
//     zero-production-divergence family (after r47 x2, r48 x3, r49 x4,
//     r50 x1, r51 x1). This spec is the pure gate-round form: pins written
//     to the measured truth, NO production fix, and the mutation proofs
//     (the plan's §3.4) are the round's red-green rigor.
//   - THE ACCENT PAIR (P6/P11/P12): the reference's accent is
//     rgb(253, 243, 237) (hsl(24 80% 96%)) with accent-foreground
//     rgb(138, 64, 15) (hsl(24 80% 30%)) — measured at the heart hover,
//     the home feature tiles, the category tiles, and the Radix Select
//     item highlight. Pinned here for the first time.
//   - THE VINTAGE REGISTERS (rendered-identical, documented in the plan
//     §2.3): (1) py-2 — the clone's Button defaultVariats.size ships
//     `h-9 px-4 py-2`, so the h-10 heart/ATC compute padding "8px 32px"
//     vs the reference's "0px 32px" (its heart call ships NO size classes;
//     h-10 fixes the height on both sides — the pins assert the clone's
//     computed truth with this comment); (2) gap-2 — the reference's base
//     carries gap-2, inert on every button here (single-child or explicit
//     gap); (3) v4's 4-vs-2 zero shadow layers (the pins assert the
//     VISIBLE pair as substrings); (4) v4's longer transition-colors
//     property list (the pins assert the duration); (5) v4's lab()
//     serialization of alpha colors (the regex forms accept both
//     spellings); (6) the invisible-outline pair (transparent-solid vs
//     none — never renders on either side).
//   - THE LOCATOR DISCIPLINE (the r52c lesson): the PDP carries THREE
//     heart populations (the buy-panel heart + the related-cards' hearts
//     + the wishlist page's) — every read here is scoped to the action
//     row's own subtree (`main .flex.items-center.gap-4.mb-4`), never a
//     page-wide `.last()` (r52c's first heart-hover read hit a related
//     card heart, whose hover:bg-background is the BACKGROUND token — the
//     read looked like a real accent divergence until the scoped
//     re-measure settled it).

// The action row = the buy panel's own row (session-5's verified locator
// form). The PDP route is the seeded headphones (sortOrder 1, stock 25).
const ROW = "main .flex.items-center.gap-4.mb-4";

test.describe("PDP buy-panel action states (session-52, BUY-PANEL-1)", () => {
  test("P1: the action-row geometry — stepper 130x42, heart 82x40, ATC flex-1 (structural)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const geom = await page.locator(ROW).first().evaluate((row) => {
      const atc = [...row.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent ?? ""));
      const heart = [...row.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? "").includes("wishlist"));
      const stepper = row.querySelector("div.flex.items-center.border");
      if (!atc || !heart || !stepper) return null;
      const r = (el: Element) => el.getBoundingClientRect();
      return {
        rowW: Math.round(r(row).width),
        stepperW: Math.round(r(stepper).width), stepperH: Math.round(r(stepper).height),
        heartW: Math.round(r(heart).width), heartH: Math.round(r(heart).height),
        atcW: Math.round(r(atc).width), atcH: Math.round(r(atc).height),
      };
    });
    expect(geom).not.toBeNull();
    // Measured live on BOTH sides at 1024 (probe r52c §D / r52f §B):
    // stepper 130 (40 + 48 + 40 + 2px borders), heart 82 (px-8 + svg),
    // ATC 212 = row 456 - 130 - 82 - 32 (two 16px gaps). The structural
    // relation is viewport-independent (the r51 lesson): the ATC is the
    // flex-1 absorber, so its width is asserted as the row remainder.
    expect(geom!.stepperW).toBe(130);
    expect(geom!.stepperH).toBe(42);
    expect(geom!.heartW).toBe(82);
    expect(geom!.heartH).toBe(40);
    expect(geom!.atcH).toBe(40);
    expect(geom!.atcW).toBe(geom!.rowW - 130 - 82 - 32);
  });

  test("P2: the ATC anatomy — bg, radius, font, gap, the bare-shadow pair", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const atc = page.locator(ROW).getByRole("button", { name: "Add to Cart" });
    const a = await atc.evaluate((el) => {
      const cs = getComputedStyle(el);
      const svg = el.querySelector("svg");
      return {
        bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius,
        font: cs.fontSize + "/" + cs.fontWeight, gap: cs.columnGap,
        padding: cs.padding, cursor: cs.cursor, shadow: cs.boxShadow,
        svgW: svg ? getComputedStyle(svg).width : "none",
      };
    });
    expect(a.bg).toBe("rgb(230, 107, 26)"); // bg-primary
    expect(a.color).toBe("rgb(255, 255, 255)");
    expect(a.radius).toBe("12px"); // rounded-xl
    expect(a.font).toBe("14px/500");
    expect(a.gap).toBe("8px");
    // The py-2 register: the reference computes 0px 32px (its call ships no
    // size classes); the clone's defaultVariants.size ships py-2 — inert
    // under h-10. The pin asserts the clone's computed truth.
    expect(a.padding).toBe("8px 32px");
    expect(a.cursor).toBe("pointer"); // the platform cursor rule (session-49)
    expect(a.svgW).toBe("16px"); // h-5 w-5 class, [&_svg]:size-4 base
    // The bare `shadow` (v3 == v4 here — the scale shift only touched the
    // named steps below it): the visible pair as substrings (v4 prefixes
    // zero-layers — register #3).
    expect(a.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px");
    expect(a.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 1px 2px -1px");
  });

  test("P3: the ATC hover — the /90 alpha (both engine spellings)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const atc = page.locator(ROW).getByRole("button", { name: "Add to Cart" });
    await atc.hover();
    await page.waitForTimeout(700); // settle beyond the 150ms transition
    const bg = await atc.evaluate((el) => getComputedStyle(el).backgroundColor);
    // The reference (v3) serializes rgba(230, 107, 26, 0.9); v4 serializes
    // lab(60.0768 45.9585 63.0005 / 0.9) — the same paint (register #5).
    expect(bg).toMatch(/^(rgba\(230, 107, 26, 0\.9\)|lab\(60\.0768 45\.9585 63\.0005 \/ 0\.9\))$/);
  });

  test("P4: the ATC focus ring — the orange 1px (ring-1 ring-ring)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    // Script focus on a pointer-clean page matches :focus-visible in
    // Chromium (the r52e method — no Tab-walk needed; the tab order reaches
    // the related-cards before the buy panel at some viewports). NOTE: read
    // the computed value BEFORE blur() — getComputedStyle returns a LIVE
    // object (the first run's post-blur read returned the resting shadow).
    const shadow = await page.locator(ROW).getByRole("button", { name: "Add to Cart" }).evaluate((el) => {
      el.focus();
      const shadow = getComputedStyle(el).boxShadow;
      el.blur();
      return shadow;
    });
    // The --ring token = the primary orange, measured live on the
    // reference (probe r52e §A): rgb(230, 107, 26) 0px 0px 0px 1px.
    expect(shadow).toContain("rgb(230, 107, 26) 0px 0px 0px 1px");
  });

  test("P5: the heart anatomy — 82x40 outline button, the shadow-sm layer", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const heart = page.locator(ROW).getByRole("button", { name: /to wishlist/ });
    const h = await heart.evaluate((el) => {
      const cs = getComputedStyle(el);
      const svg = el.querySelector("svg");
      const r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width), h: Math.round(r.height),
        bg: cs.backgroundColor, border: cs.border, radius: cs.borderRadius,
        shadow: cs.boxShadow, padding: cs.padding,
        svgColor: svg ? getComputedStyle(svg).color : "none",
        svgW: svg ? getComputedStyle(svg).width : "none",
      };
    });
    expect(h.w).toBe(82);
    expect(h.h).toBe(40);
    expect(h.bg).toBe("rgba(0, 0, 0, 0)"); // bg-transparent (outline)
    expect(h.border).toBe("1px solid rgb(233, 230, 226)"); // border-input (== border's value)
    expect(h.radius).toBe("12px");
    // The outline variant's shadow-sm = the v3 pinned value (globals trap #2).
    expect(h.shadow).toContain("rgba(0, 0, 0, 0.05) 0px 1px 2px 0px");
    // The py-2 register (see P2's comment).
    expect(h.padding).toBe("8px 32px");
    expect(h.svgColor).toBe("rgb(23, 23, 28)"); // foreground inactive (session-5)
    expect(h.svgW).toBe("16px");
  });

  test("P6: the heart hover — THE ACCENT PAIR (pinned for the first time)", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const heart = page.locator(ROW).getByRole("button", { name: /to wishlist/ });
    await heart.hover();
    await page.waitForTimeout(700);
    const hov = await heart.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    // Measured live on the reference's OWN buy-panel heart (probe r52d §B —
    // scoped: r52c's first read hit a related-card heart whose
    // hover:bg-background is the BACKGROUND token, a false divergence):
    // the accent pair is hsl(24 80% 96%) / hsl(24 80% 30%).
    expect(hov.bg).toBe("rgb(253, 243, 237)"); // --color-accent
    expect(hov.color).toBe("rgb(138, 64, 15)"); // --color-accent-foreground
  });

  test("P7: the stepper container — border, radius, 130x42", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const box = page.locator(ROW).locator("div.flex.items-center.border");
    const b = await box.evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { border: cs.border, radius: cs.borderRadius, w: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(b.border).toBe("1px solid rgb(233, 230, 226)"); // border-border
    expect(b.radius).toBe("12px"); // rounded-xl
    expect(b.w).toBe(130);
    expect(b.h).toBe(42); // the p-3 buttons 40 + 2px borders
  });

  test("P8: the stepper hovers — minus AND plus tint to secondary", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const minus = page.getByRole("button", { name: "Decrease quantity" });
    await minus.hover();
    await page.waitForTimeout(500); // settle beyond the 150ms transition
    const minusBg = await minus.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(minusBg).toBe("rgb(242, 240, 237)"); // hover:bg-secondary

    const plus = page.getByRole("button", { name: "Increase quantity" });
    await plus.hover();
    await page.waitForTimeout(500);
    const plusBg = await plus.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(plusBg).toBe("rgb(242, 240, 237)");
  });

  test("P9: the qty span — 16px/500, px-5, min-w 3rem, centered", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const span = page.locator(ROW).locator("div.flex.items-center.border > span");
    const s = await span.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        text: (el.textContent ?? "").trim(), font: cs.fontSize + "/" + cs.fontWeight,
        padding: cs.padding, minW: cs.minWidth, color: cs.color, align: cs.textAlign,
      };
    });
    expect(s.text).toBe("1"); // the resting quantity
    expect(s.font).toBe("16px/500");
    expect(s.padding).toBe("0px 20px"); // px-5
    expect(s.minW).toBe("48px"); // min-w-[3rem]
    expect(s.color).toBe("rgb(23, 23, 28)");
    expect(s.align).toBe("center");
  });

  test("P10: the transition durations — 0.15s on the ATC, heart, and stepper", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const row = page.locator(ROW).first();
    const durations = await row.evaluate((el) => {
      const atc = [...el.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent ?? ""));
      const heart = [...el.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? "").includes("wishlist"));
      const minus = el.querySelector('button[aria-label="Decrease quantity"]');
      if (!atc || !heart || !minus) return null;
      return {
        atc: getComputedStyle(atc).transitionDuration,
        heart: getComputedStyle(heart).transitionDuration,
        minus: getComputedStyle(minus).transitionDuration,
      };
    });
    expect(durations).not.toBeNull();
    // transition-colors at the shadcn default 150ms on all three — measured
    // live both sides. (The property LIST differs: v4's list adds
    // outline-color + the --tw-gradient vars — register #4, same rendered
    // behavior for these color-only elements.)
    expect(durations!.atc).toBe("0.15s");
    expect(durations!.heart).toBe("0.15s");
    expect(durations!.minus).toBe("0.15s");
  });

  test("P11: the accent at rest — the home feature tile (bg-accent + primary icon)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000); // hero entrance
    // The feature bar's icon tile (session-4's card pin covers the item;
    // this pins the tile's OWN bg — the resting accent site).
    const heading = page.locator("h3").filter({ hasText: "Free Shipping" }).first();
    const tile = heading.locator("xpath=../..").locator("div.h-12");
    const t = await tile.evaluate((el) => {
      const svg = el.querySelector("svg");
      return {
        bg: getComputedStyle(el).backgroundColor,
        radius: getComputedStyle(el).borderRadius,
        icon: svg ? getComputedStyle(svg).color : "none",
      };
    });
    expect(t.bg).toBe("rgb(253, 243, 237)"); // bg-accent — the resting accent
    expect(t.radius).toBe("16px"); // rounded-2xl
    expect(t.icon).toBe("rgb(230, 107, 26)"); // text-primary (session-4's pin)
  });

  test("P12: the accent-foreground at rest — the home category tile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    // The "Shop by Category" tiles: h-14 w-14 rounded-2xl bg-accent with a
    // text-accent-foreground icon — the ONLY resting accent-foreground site.
    const tile = page.locator("main div.h-14.w-14").first();
    const t = await tile.evaluate((el) => {
      const svg = el.querySelector("svg");
      return {
        bg: getComputedStyle(el).backgroundColor,
        radius: getComputedStyle(el).borderRadius,
        icon: svg ? getComputedStyle(svg).color : "none",
      };
    });
    expect(t.bg).toBe("rgb(253, 243, 237)"); // bg-accent
    expect(t.radius).toBe("16px");
    expect(t.icon).toBe("rgb(138, 64, 15)"); // text-accent-foreground — measured live
  });

  test("P13: the heart's focus ring — the same orange 1px", async ({ page }) => {
    await page.goto("/product/wireless-headphones", { waitUntil: "networkidle" });
    const shadow = await page.locator(ROW).getByRole("button", { name: /to wishlist/ }).evaluate((el) => {
      el.focus();
      const shadow = getComputedStyle(el).boxShadow;
      el.blur();
      return shadow;
    });
    // ring-1 ring-ring over the outline variant's shadow-sm — the same
    // --ring token as the ATC (measured live, probe r52e §A).
    expect(shadow).toContain("rgb(230, 107, 26) 0px 0px 0px 1px");
    expect(shadow).toContain("rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"); // shadow-sm kept under the ring
  });
});
