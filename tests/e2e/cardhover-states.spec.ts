import { expect, test } from "@playwright/test";

// Product-card hover states (session-51, CARD-HOVER-1) — the
// customer-surfaces pin-density sweep's ninth installment. The resting
// pixel sweep captures /shop with NO hover — the shadow lift, the image
// zoom, the orange title, and the revealed Add bar are interaction-gated
// (invisible to the sweep for 50 rounds). Every pin here is calibrated
// against the LIVE reference (probes cardhover-probe-r51/r51b/r51d on the
// reference + cardhover-clone-r51c/r51e on the clone, the DOM dumps and
// computed styles as the ground truth, plus the browser-canvas pixel
// cross-diff pix-diff-r51.mjs):
//
//   - THE FIX: the heart's backdrop blur — the reference renders
//     blur(4px) (v3's backdrop-blur-sm); v4 renamed the scale (sm 4→8,
//     xs=4 added) and the clone rendered blur(8px) for 50 rounds. Fixed
//     by the globals.css v3 blur pin (--blur-sm: 4px, trap log #8 — the
//     shadow-sm pin's exact pattern), so the class string stays
//     byte-exact on BOTH sides while the computed value returns to 4px.
//   - the container's shadow lift: the visible shadow-xl pair
//     (rgba(0,0,0,0.1) 0px 20px 25px -5px + 0px 8px 10px -6px) — v4
//     prefixes two zero-layers (the ring/inset vars serialized as zeros);
//     the pins assert the VISIBLE PAIR as substrings (register).
//   - the engine-spelling registers (computed-identical, no code change):
//     v4's lab()/oklab() color serialization vs v3's rgba/rgb; the
//     transform-vs-translate/scale property split (the zoom reads `scale`
//     here, the addbar reads `translate`); rounded-full 33554432px vs
//     9999px. The regex forms below accept both spellings.

// The card = the first product link's parent div (div.group) — NOT any
// higher ancestor (the r51a lesson: ancestor::div[3] is the GRID; its
// center falls between cards and no group-hover fires).
async function firstCard(page: import("@playwright/test").Page) {
  return page.locator("main a[href^='/product/']").first().locator("xpath=ancestor::div[1]");
}

test.describe("product card hover states (session-51, CARD-HOVER-1)", () => {
  test("P1: the heart's backdrop blur is the reference's 4px (v3 blur scale — THE FIX)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    // The heart = the card's only absolutely-positioned button (the Add
    // button lives inside the absolute wrap but is not absolute itself).
    const heart = card.locator("button.absolute").first();
    await expect(heart).toBeVisible();
    const blur = await heart.evaluate((el) => getComputedStyle(el).backdropFilter);
    // The reference (v3 backdrop-blur-sm) = blur(4px), measured live
    // (probe r51d §C). v4 renamed the scale (sm=8px) — the globals.css
    // --blur-sm pin (trap #8) restores the v3 value.
    expect(blur).toBe("blur(4px)");
  });

  test("P2: the container's hovered shadow carries the reference's shadow-xl pair (the lift)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    await card.hover();
    await page.waitForTimeout(750); // settle beyond the 300ms transition (r48/r50 lesson)
    const hov = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { shadow: cs.boxShadow, radius: cs.borderRadius };
    });
    // The visible pair, measured live on the reference (probe r51b §B) —
    // asserted as substrings: v4 prefixes zero-layers (register), v3 does
    // not; the VISIBLE geometry is the parity contract.
    expect(hov.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 20px 25px -5px");
    expect(hov.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 8px 10px -6px");
    expect(hov.radius).toBe("16px"); // rounded-2xl
  });

  test("P3: the container's resting contract — shadow-sm, border, bg, transition", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const rest = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        shadow: cs.boxShadow, border: cs.border, bg: cs.backgroundColor,
        prop: cs.transitionProperty, dur: cs.transitionDuration, timing: cs.transitionTimingFunction,
      };
    });
    expect(rest.shadow).toContain("rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"); // v3 shadow-sm (globals pin, trap #5)
    // border-border/50 — v3 spells rgba(233, 230, 226, 0.5), v4 lab() (the
    // register); pin the structure: 1px + solid + the 50% alpha (r48 lesson).
    expect(rest.border).toMatch(/^1px solid .*0\.5\)$/);
    expect(rest.bg).toBe("rgb(255, 255, 255)"); // bg-card
    expect(rest.prop).toBe("all");
    expect(rest.dur).toBe("0.3s");
    expect(rest.timing).toBe("cubic-bezier(0.4, 0, 0.2, 1)"); // transition-all's engine default
  });

  test("P4: the image zoom — resting none, hovered 1.05, 0.5s (the v4 scale spelling)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const img = card.locator("img").first();
    const resting = await img.evaluate((el) => getComputedStyle(el).transform);
    const dur = await img.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(resting).toBe("none");
    expect(dur).toBe("0.5s");
    await card.hover();
    await page.waitForTimeout(750); // settle beyond the 500ms zoom
    // The reference (v3) reads transform: matrix(1.05, ...) — the register:
    // v4 spells the same zoom as the CSS `scale` property (HOVER-GATE-1).
    const hovered = await img.evaluate((el) => getComputedStyle(el).scale);
    expect(hovered).toBe("1.05");
  });

  test("P5: the title — resting foreground, hovered primary, 0.15s", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const title = card.locator("h3").first();
    const resting = await title.evaluate((el) => getComputedStyle(el).color);
    const dur = await title.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(resting).toBe("rgb(23, 23, 28)"); // foreground
    expect(dur).toBe("0.15s"); // transition-colors' engine default (150ms both engines)
    await card.hover();
    await page.waitForTimeout(750);
    const hovered = await title.evaluate((el) => getComputedStyle(el).color);
    expect(hovered).toBe("rgb(230, 107, 26)"); // primary — measured live (probe r51b §D)
  });

  test("P6: the addbar — hidden 0px 100%, revealed 0px (the v4 translate spelling)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const wrap = card.locator("button", { hasText: /^Add to Cart$/ }).first().locator("xpath=ancestor::div[1]");
    const hidden = await wrap.evaluate((el) => getComputedStyle(el).translate);
    // The reference (v3) reads transform: matrix(1,0,0,1,0,56) —
    // translateY(100%) = 56px (the wrap's own height); v4 spells it as the
    // CSS `translate` property (register, r51e).
    expect(hidden).toBe("0px 100%");
    await card.hover();
    await page.waitForTimeout(750);
    const revealed = await wrap.evaluate((el) => getComputedStyle(el).translate);
    expect(revealed).toBe("0px");
    const cls = await wrap.getAttribute("class");
    expect(cls).toBe("absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300");
  });

  test("P7: the Add button's anatomy + hover bg (32px/12px/12px, gap 8px, 16px svg, /90 hover)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const btn = card.locator("button", { hasText: /^Add to Cart$/ }).first();
    const a = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const wrap = el.closest("div.absolute")!; // the addbar's fixed structure
      const wr = wrap.getBoundingClientRect();
      return {
        h: Math.round(r.height), w: Math.round(r.width),
        wrapW: Math.round(wr.width),
        font: `${cs.fontSize}/${cs.fontWeight}`, radius: cs.borderRadius,
        bg: cs.backgroundColor, color: cs.color, gap: cs.gap,
        shadow: cs.boxShadow, svg: getComputedStyle(el.querySelector("svg")!).width,
      };
    });
    expect(a.h).toBe(32); // h-8
    // w-full within the p-3 wrap — STRUCTURAL (the reference measured 200 at
    // the sweep's 1024 viewport; the E2E's Desktop Chrome is 1280 → 264;
    // the pin is btn.w === wrap.w - 24, viewport-independent).
    expect(a.w).toBe(a.wrapW - 24);
    expect(a.font).toBe("12px/500"); // text-xs font-medium
    expect(a.radius).toBe("12px"); // rounded-xl
    expect(a.bg).toBe("rgb(230, 107, 26)"); // bg-primary
    expect(a.color).toBe("rgb(255, 255, 255)");
    expect(a.gap).toBe("8px"); // gap-2
    expect(a.svg).toBe("16px"); // [&_svg]:size-4 overrides the h-3.5 w-3.5 class
    expect(a.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 10px 15px -3px"); // shadow-lg's visible pair
    expect(a.shadow).toContain("rgba(0, 0, 0, 0.1) 0px 4px 6px -4px");
    await btn.hover();
    await page.waitForTimeout(450);
    const hoveredBg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    // hover:bg-primary/90 — v3 spells rgba(...,0.9), v4 lab(... / 0.9);
    // both end in "0.9)" (the engine-spelling register).
    expect(hoveredBg).toMatch(/0\.9\)$/);
  });

  test("P8: the heart's resting anatomy + hover bg (36px, /80, muted svg, 100% hover)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const heart = card.locator("button.absolute").first();
    const a = await heart.evaluate((el) => {
      const cs = getComputedStyle(el);
      const svg = el.querySelector("svg")!; // the heart's fixed structure
      return {
        w: cs.width, h: cs.height,
        radius: parseFloat(cs.borderRadius), bg: cs.backgroundColor,
        shadow: cs.boxShadow, svgColor: getComputedStyle(svg).color,
        svgW: getComputedStyle(svg).width, svgFill: getComputedStyle(svg).fill,
        cls: el.getAttribute("class"),
      };
    });
    expect(a.w).toBe("36px"); // w-9
    expect(a.h).toBe("36px"); // h-9
    expect(a.radius).toBeGreaterThanOrEqual(9999); // rounded-full — v4: 33554432px, v3: 9999px (register)
    expect(a.bg).toMatch(/0\.8\)$/); // bg-background/80 — rgba(...,0.8) or lab(... / 0.8)
    expect(a.shadow).toContain("rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"); // shadow-sm
    expect(a.svgColor).toBe("rgb(111, 111, 123)"); // text-muted-foreground (session-5)
    expect(a.svgW).toBe("16px"); // h-4 w-4
    expect(a.svgFill).toBe("none"); // inactive — no fill
    expect(a.cls).toBe("absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-background transition-colors");
    await heart.hover();
    await page.waitForTimeout(450);
    const hoveredBg = await heart.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(hoveredBg).toBe("rgb(251, 250, 249)"); // bg-background 100% (from /80)
  });

  test("P9: the badges — the Best Seller + the -25% (the computed anatomy)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const badges = await card.evaluate(() => {
      return [...document.querySelectorAll("div.absolute.top-3.left-3 > div")].slice(0, 2).map((b) => {
        const cs = getComputedStyle(b);
        const r = b.getBoundingClientRect();
        return {
          text: (b.textContent || "").trim(), h: Math.round(r.height),
          radius: parseFloat(cs.borderRadius), bg: cs.backgroundColor, color: cs.color,
          font: `${cs.fontSize}/${cs.fontWeight}`, padding: cs.padding,
        };
      });
    });
    expect(badges).toHaveLength(2);
    expect(badges[0].text).toBe("Best Seller");
    expect(badges[0].bg).toBe("rgb(230, 107, 26)"); // bg-primary
    expect(badges[0].color).toBe("rgb(255, 255, 255)");
    expect(badges[1].text).toBe("-25%");
    expect(badges[1].bg).toBe("rgb(239, 67, 67)"); // bg-destructive
    expect(badges[1].color).toBe("rgb(250, 250, 250)"); // text-destructive-foreground (#FAFAFA — v3 shadcn)
    for (const b of badges) {
      expect(b.h).toBe(21); // text-[10px] + py-0.5 (2px) + line height
      expect(b.radius).toBeGreaterThanOrEqual(9999); // rounded-full (register)
      expect(b.font).toBe("10px/600"); // text-[10px] font-semibold (text-xs dropped by tw-merge)
      expect(b.padding).toBe("2px 10px"); // py-0.5 px-2.5
    }
  });

  test("P10: the info block — category, title, price, compareAt (hover-stable rows)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const info = await card.evaluate(() => {
      const block = document.querySelector("a.block.p-4");
      if (!block) return null;
      // The card's fixed structure (product-card.tsx): the rows always exist.
      const cat = block.querySelector("p")!;
      const h3 = block.querySelector("h3")!;
      const price = block.querySelector("span.text-base")!;
      const cmp = block.querySelector("span.line-through")!;
      return {
        catColor: getComputedStyle(cat).color, catFont: getComputedStyle(cat).fontSize,
        h3Font: `${getComputedStyle(h3).fontSize}/${getComputedStyle(h3).fontWeight}`,
        h3Clamp: getComputedStyle(h3).webkitLineClamp,
        priceColor: getComputedStyle(price).color,
        priceFont: `${getComputedStyle(price).fontSize}/${getComputedStyle(price).fontWeight}`,
        cmpColor: getComputedStyle(cmp).color, cmpDec: getComputedStyle(cmp).textDecorationLine,
      };
    });
    expect(info).not.toBeNull();
    if (!info) throw new Error("P10: the info block was not found");
    expect(info.catColor).toBe("rgb(111, 111, 123)"); // text-muted-foreground
    expect(info.catFont).toBe("12px"); // text-xs
    expect(info.h3Font).toBe("14px/600"); // text-sm font-semibold
    expect(info.h3Clamp).toBe("2"); // line-clamp-2
    expect(info.priceColor).toBe("rgb(23, 23, 28)");
    expect(info.priceFont).toBe("16px/700"); // text-base font-bold
    expect(info.cmpColor).toBe("rgb(111, 111, 123)");
    expect(info.cmpDec).toBe("line-through");
  });

  test("P11: the OTHER v4 blur sites — the header 24px + the hero 12px (the blur-scale register)", async ({ page }) => {
    // The census (probe r51d/r51e): xl (24px) and md (12px) are unchanged
    // by v4's scale rename — only sm shifted (4→8, fixed by the pin). This
    // pin guards the whole register: any future blur-scale drift on the
    // header or the hero fires here.
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000); // the hero entrance settle
    const headerBlur = await page.evaluate(() => {
      const h = document.querySelector("header");
      return h ? getComputedStyle(h).backdropFilter : null;
    });
    expect(headerBlur).toBe("blur(24px)"); // backdrop-blur-xl
    const hero = await page.evaluate(() => {
      const badge = document.querySelector("span.rounded-full.mb-4");
      const arrow = [...document.querySelectorAll("button")].find((b) => {
        const cs = getComputedStyle(b);
        return cs.position === "absolute" && cs.backdropFilter !== "none";
      });
      return {
        badge: badge ? getComputedStyle(badge).backdropFilter : null,
        arrow: arrow ? getComputedStyle(arrow).backdropFilter : null,
      };
    });
    expect(hero.badge).toBe("blur(12px)"); // backdrop-blur-md
    expect(hero.arrow).toBe("blur(12px)");
  });

  test("P12: the reveal/hide round-trip — the state machine (settle both directions)", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const card = await firstCard(page);
    const wrap = card.locator("button", { hasText: /^Add to Cart$/ }).first().locator("xpath=ancestor::div[1]");
    // hidden → revealed
    await card.hover();
    await page.waitForTimeout(750);
    expect(await wrap.evaluate((el) => getComputedStyle(el).translate)).toBe("0px");
    // revealed → re-hidden (mouse away from the card entirely)
    await page.mouse.move(8, 400);
    await page.waitForTimeout(750); // the 300ms re-hide settle (r50's animation lesson)
    expect(await wrap.evaluate((el) => getComputedStyle(el).translate)).toBe("0px 100%");
    // and the zoom relaxes with it
    expect(await card.locator("img").first().evaluate((el) => getComputedStyle(el).scale)).toBe("none");
  });
});
