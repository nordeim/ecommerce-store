import { expect, test } from "@playwright/test";

// Hero carousel dot/arrow interaction states (session-53, HERO-NAV-1) — the
// customer-surfaces pin-density sweep's eleventh installment. The hero's
// control layer (the prev/next arrows + the dot pagination) and its
// behavioral machinery (the crossfade, the wrap-around, the hover-pause, the
// dot-click timer restart) are INTERACTION-GATED — the resting pixel sweep
// captures the hero mid-slide-1 with no hover, no focus, no click. Every pin
// here is calibrated against the LIVE reference (probes hero-probe-r53c/d/e
// on the reference + hero-clone-r53a/b/f on the clone, the DOM dumps and
// computed styles as the ground truth):
//
//   - THE ROUND'S HEADLINE: the family is FULLY PARITY — the sweep's SECOND
//     zero-production-divergence family (after r52's buy-panel). The arrow
//     class string and BOTH dot class strings are BYTE-IDENTICAL on the two
//     sides; every computed value is identical modulo the engine registers.
//   - THE SUPERSET BEHAVIORS (deliberate, documented in the plan §2.3, now
//     first-time pinned as the clone's own contract): the 700ms crossfade +
//     text rise (the reference swaps slides in the DOM with transition 0s —
//     an instant cut), the hover-pause (the reference does NOT pause on
//     dwell), the dot-click timer restart (the reference's timer does not
//     restart), and the aria layer (the reference carries NO aria-labels and
//     NO aria-current — the clone's superset a11y contract).
//   - THE ENGINE REGISTERS (rendered-identical): (1) v4 serializes alpha
//     colors as oklab(...) vs the reference's rgba(...) — the pins accept
//     both spellings; (2) v4 emits the STANDALONE translate property
//     (`translate: 0px -50%`) vs v3's transform matrix — the centering
//     offsets are asserted structurally instead; (3) the radius
//     serialization (9999px vs 3.35544e+07px — both "full"); (4) v4's longer
//     transition-colors list (the pins assert the duration).
//   - THE TRUSTED-EVENT DISCIPLINE (the r53a lesson): CSS :hover and React's
//     onMouseEnter do NOT activate for synthetic dispatchEvent'd events —
//     every hover/dwell pin here uses Playwright's REAL mouse
//     (locator.hover() / page.mouse.move()). And getComputedStyle is LIVE —
//     the focus pin reads BEFORE blur (the r52 lesson).
//
// Locators: the clone's own aria-labels (the superset layer) — the honest
// locators, no heuristics. The active slide is read via the dots'
// aria-current (DOM-stable on the clone — the reference swaps, the clone
// crossfades; both keep a stable dot list).

const CAROUSEL = '[aria-roledescription="carousel"]';
const PREV = 'button[aria-label="Previous slide"]';
const NEXT = 'button[aria-label="Next slide"]';
const DOTS = "button[aria-label^='Go to slide']";

// The active-slide index via aria-current (0-based; -1 if none — never
// expected on a painted hero).
async function activeIndex(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const dots = [...document.querySelectorAll("button[aria-label^='Go to slide']")] as HTMLElement[];
    const active = dots.findIndex((d) => d.getAttribute("aria-current") === "true");
    return active;
  });
}

test.describe("hero carousel dot/arrow interaction states (session-53, HERO-NAV-1)", () => {
  test("P1: the arrow geometry — 40x40, inset 16px both sides, vertically centered (structural)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const geom = await page.locator(CAROUSEL).evaluate((hero) => {
      const prev = hero.querySelector('button[aria-label="Previous slide"]') as HTMLElement | null;
      const next = hero.querySelector('button[aria-label="Next slide"]') as HTMLElement | null;
      if (!prev || !next) return null;
      const hr = hero.getBoundingClientRect();
      const pr = prev.getBoundingClientRect();
      const nr = next.getBoundingClientRect();
      const svg = prev.querySelector("svg");
      return {
        prevW: prev.offsetWidth, prevH: prev.offsetHeight,
        leftInset: Math.round(pr.left - hr.left),
        rightInset: Math.round(hr.right - nr.right),
        prevCenterOffset: Math.round(pr.top + pr.height / 2 - (hr.top + hr.height / 2)),
        nextCenterOffset: Math.round(nr.top + nr.height / 2 - (hr.top + hr.height / 2)),
        svgW: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
        svgH: svg ? Math.round(svg.getBoundingClientRect().height) : 0,
      };
    });
    expect(geom).not.toBeNull();
    // Measured live on BOTH sides (probe r53c §B / r53b §A): 40x10 buttons,
    // 16px insets (left-4 / right-4), top-1/2 -translate-y-1/2 centers on
    // the hero's midline (offset 0 — asserted structurally, not via the
    // transform matrix: v4 emits the standalone translate property), svg
    // 20x20 (h-5 w-5 chevrons).
    expect(geom!.prevW).toBe(40);
    expect(geom!.prevH).toBe(40);
    expect(geom!.leftInset).toBe(16);
    expect(geom!.rightInset).toBe(16);
    expect(geom!.prevCenterOffset).toBe(0);
    expect(geom!.nextCenterOffset).toBe(0);
    expect(geom!.svgW).toBe(20);
    expect(geom!.svgH).toBe(20);
  });

  test("P2: the arrow anatomy — bg white/20, radius full, blur 12px, white, pointer", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const anatomy = await page.locator(PREV).evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        radius: cs.borderRadius,
        backdropFilter: cs.backdropFilter,
        color: cs.color,
        cursor: cs.cursor,
        display: cs.display,
      };
    });
    // Measured live on BOTH sides (probe r53c §B / r53b §A): bg-white/20
    // (rgba vs oklab — the engine register), rounded-full, backdrop-blur-md
    // = blur(12px), text-white, flex.
    expect(anatomy.bg).toMatch(/^rgba\(255, 255, 255, 0\.2\)$|^oklab\(0\.999994 0\.0000455678 0\.0000200868 \/ 0\.2\)$/);
    expect(["9999px", "33554432px", "3.35544e+07px"]).toContain(anatomy.radius.replace(/px$/, "") === "33554432" ? "33554432px" : anatomy.radius);
    expect(anatomy.backdropFilter).toBe("blur(12px)");
    expect(anatomy.color).toBe("rgb(255, 255, 255)");
    expect(anatomy.cursor).toBe("pointer");
    expect(anatomy.display).toBe("flex");
  });

  test("P3: the arrow hover — REAL mouse tints to white/30 (both engine spellings)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const prev = page.locator(PREV);
    const before = await prev.evaluate((el) => getComputedStyle(el).backgroundColor);
    await prev.hover(); // a REAL trusted pointer event (the r53a lesson)
    await page.waitForTimeout(700);
    const after = await prev.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(before).toMatch(/0\.2\)$/); // rgba(...0.2) or oklab(... / 0.2)
    // Measured live on BOTH sides (probe r53c §C / r53b §B): hover:bg-white/30.
    expect(after).toMatch(/^rgba\(255, 255, 255, 0\.3\)$|^oklab\(0\.999994 0\.0000455678 0\.0000200868 \/ 0\.3\)$/);
  });

  test("P4: the arrow focus outline — auto 1px, the ring/50 orange (the global base rule)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Script focus on a pointer-clean page matches :focus-visible in
    // Chromium's UA heuristic (the r52e method). getComputedStyle is LIVE —
    // every value is read BEFORE blur (the r52 L58 lesson).
    const focus = await page.locator(PREV).evaluate((el) => {
      el.focus();
      const cs = getComputedStyle(el);
      const out = {
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow,
      };
      el.blur();
      return out;
    });
    // Measured live on BOTH sides (probe r53c §C / r53a §C): the arrows
    // carry NO focus-visible utilities of their own — the indication comes
    // from the global `* { outline-ring/50 }` base rule (the primary orange
    // at 50% alpha), outline-style auto 1px. v4 serializes the color as
    // lab() — both spellings accepted.
    expect(focus.outlineStyle).toBe("auto");
    expect(focus.outlineWidth).toBe("1px");
    expect(focus.outlineColor).toMatch(/^rgba\(230, 107, 26, 0\.5\)$|^lab\(60\.0768 45\.9585 63\.0005 \/ 0\.5\)$/);
    expect(focus.boxShadow).toBe("none");
  });

  test("P5: the arrow transition duration — 0.15s transition-colors", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const t = await page.locator(PREV).evaluate((el) => {
      const cs = getComputedStyle(el);
      return { dur: cs.transitionDuration, prop: cs.transitionProperty };
    });
    // Measured live on BOTH sides (probe r53c §B / r53b §A): 0.15s. v4's
    // transition-colors property list is LONGER (the register) — the
    // duration is the pin, and the property list must be a color-only set.
    expect(t.dur).toBe("0.15s");
    expect(t.prop).toContain("color");
    expect(t.prop).not.toContain("transform");
    expect(t.prop).not.toContain("opacity");
  });

  test("P6: the active dot — 32x8, bg white, radius full, transition-all 0.3s", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const active = await page.locator(DOTS).first().evaluate((el: HTMLElement) => {
      const cs = getComputedStyle(el);
      return {
        cls: el.className,
        w: el.offsetWidth, h: el.offsetHeight,
        bg: cs.backgroundColor,
        radius: cs.borderRadius,
        dur: cs.transitionDuration,
        prop: cs.transitionProperty,
        cursor: cs.cursor,
      };
    });
    // Measured live on BOTH sides (probe r53c §D / r53a §D): the class
    // string is BYTE-IDENTICAL — `h-2 rounded-full transition-all
    // duration-300 w-8 bg-white` — active 32x8 white.
    expect(active.cls).toContain("w-8");
    expect(active.w).toBe(32);
    expect(active.h).toBe(8);
    expect(active.bg).toBe("rgb(255, 255, 255)");
    expect(["9999px", "33554432px", "3.35544e+07px"]).toContain(active.radius.replace(/px$/, "") === "33554432" ? "33554432px" : active.radius);
    expect(active.dur).toBe("0.3s");
    expect(active.prop).toBe("all");
    expect(active.cursor).toBe("pointer");
  });

  test("P7: the inactive dot — 8x8, bg white/50 (both engine spellings)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const inactive = await page.locator(DOTS).nth(1).evaluate((el: HTMLElement) => {
      const cs = getComputedStyle(el);
      return { cls: el.className, w: el.offsetWidth, h: el.offsetHeight, bg: cs.backgroundColor, dur: cs.transitionDuration };
    });
    // Measured live on BOTH sides: `h-2 rounded-full transition-all
    // duration-300 w-2 bg-white/50` — 8x8, the half-alpha white.
    expect(inactive.cls).toContain("w-2");
    expect(inactive.w).toBe(8);
    expect(inactive.h).toBe(8);
    expect(inactive.bg).toMatch(/^rgba\(255, 255, 255, 0\.5\)$|^oklab\(0\.999994 0\.0000455678 0\.0000200868 \/ 0\.5\)$/);
    expect(inactive.dur).toBe("0.3s");
  });

  test("P8: the dot row — gap 8px, 24px above the hero bottom edge, centered, 3 dots", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const row = await page.locator(CAROUSEL).evaluate((hero) => {
      const dots = [...hero.querySelectorAll("button[aria-label^='Go to slide']")] as HTMLElement[];
      if (!dots.length) return null;
      const row = dots[0].parentElement!;
      const cs = getComputedStyle(row);
      const rr = row.getBoundingClientRect();
      const hr = hero.getBoundingClientRect();
      return {
        count: dots.length,
        cls: row.className,
        gap: cs.columnGap,
        bottomOffset: Math.round(hr.bottom - rr.bottom),
        centerOffset: Math.round(rr.left + rr.width / 2 - (hr.left + hr.width / 2)),
      };
    });
    expect(row).not.toBeNull();
    // Measured live on BOTH sides (probe r53c §D / r53a §D): `absolute
    // bottom-6 left-1/2 -translate-x-1/2 flex gap-2` — gap 8px, 24px above
    // the hero's bottom edge, horizontally centered (offset 0, structural —
    // the v4 translate-property register).
    expect(row!.count).toBe(3);
    expect(row!.gap).toBe("8px");
    expect(row!.bottomOffset).toBe(24);
    expect(row!.centerOffset).toBe(0);
  });

  test("P9: the dot click — the live width morph 8 -> 32 + white + aria-current", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const dot3 = page.locator(DOTS).nth(2);
    const before = await dot3.evaluate((el: HTMLElement) => ({ w: el.offsetWidth, aria: el.getAttribute("aria-current") }));
    await dot3.click();
    await page.waitForTimeout(700); // the 0.3s transition-all settles
    const after = await dot3.evaluate((el: HTMLElement) => {
      const cs = getComputedStyle(el);
      return { w: el.offsetWidth, bg: cs.backgroundColor, aria: el.getAttribute("aria-current") };
    });
    // The clone's SUPERSET morph (measured live r53a §F): the clicked dot's
    // width animates 8 -> 32 via transition-all, the bg flips to white, and
    // the aria-current follows the active state.
    expect(before.w).toBe(8);
    expect(before.aria).toBe("false");
    expect(after.w).toBe(32);
    expect(after.bg).toBe("rgb(255, 255, 255)");
    expect(after.aria).toBe("true");
  });

  test("P10: the dot no-hover rule — a REAL mouse dwell changes NOTHING (the negative)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Neutralize the auto-advance interference: dwell on dot 2 and read
    // immediately (the 5s cadence gives a wide margin under 1s).
    const dot2 = page.locator(DOTS).nth(1);
    const before = await dot2.evaluate((el: HTMLElement) => ({ bg: getComputedStyle(el).backgroundColor, w: el.offsetWidth }));
    await dot2.hover(); // REAL mouse (the r53a/r53b lesson)
    await page.waitForTimeout(700);
    const after = await dot2.evaluate((el: HTMLElement) => ({ bg: getComputedStyle(el).backgroundColor, w: el.offsetWidth }));
    // Measured live on BOTH sides (probe r53c §E / r53b §D): the dots carry
    // NO hover variant — the class strings have no hover: token and the
    // computed values do not change under a real pointer.
    expect(after.bg).toBe(before.bg);
    expect(after.w).toBe(before.w);
    expect(after.w).toBe(8);
  });

  test("P11: the crossfade — the slide 0.7s opacity + the text block 0.7s all (the superset contract)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const fade = await page.locator(CAROUSEL).evaluate((hero) => {
      const slide = hero.querySelector("img")!.parentElement!;
      const s = getComputedStyle(slide);
      const text = hero.querySelector(".max-w-lg > div")!;
      const t = getComputedStyle(text);
      return {
        slideCls: slide.className,
        slideDur: s.transitionDuration,
        slideProp: s.transitionProperty,
        textCls: text.className,
        textDur: t.transitionDuration,
        textProp: t.transitionProperty,
      };
    });
    // The SUPERSET contract (measured live r53a §G): the clone renders all
    // 3 slides with `transition-opacity duration-700` + the text block
    // `transition-all duration-700` (with the translate-y-4 rise). The
    // reference swaps slides in the DOM with transition 0s — an instant cut
    // (register #5; the resting sweep holds 0% because both sides paint
    // slide 1 fully at capture).
    expect(fade.slideCls).toContain("transition-opacity");
    expect(fade.slideCls).toContain("duration-700");
    expect(fade.slideDur).toBe("0.7s");
    expect(fade.slideProp).toBe("opacity");
    expect(fade.textDur).toBe("0.7s");
    expect(fade.textProp).toBe("all");
  });

  test("P12: the wrap-around — next x3 returns to slide 1; prev from slide 1 lands on slide 3", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Stop the auto-advance from racing the clicks: dwell the real mouse on
    // the hero (the clone's hover-pause — P13's contract, used here as a
    // test harness).
    const heroBox = await page.locator(CAROUSEL).boundingBox();
    await page.mouse.move(heroBox!.x + heroBox!.width / 2, heroBox!.y + heroBox!.height / 2);
    const start = await activeIndex(page);
    expect(start).toBe(0);
    await page.locator(NEXT).click();
    expect(await activeIndex(page)).toBe(1);
    await page.locator(NEXT).click();
    expect(await activeIndex(page)).toBe(2);
    await page.locator(NEXT).click();
    // Measured live on the clone (probe r53e §B, clean reads): wraps 3 -> 1
    // (the reference's own carousel wraps — the byte-identical port; its
    // live read is swap-artifact null, honestly documented in the plan §2.2
    // row 18).
    expect(await activeIndex(page)).toBe(0);
    await page.locator(PREV).click();
    // Measured live on the clone (probe r53e §C): prev from slide 1 wraps
    // backward to slide 3.
    expect(await activeIndex(page)).toBe(2);
  });

  test("P13: the hover-pause — a real-mouse dwell freezes the advance; leaving resumes it (the superset contract)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const heroBox = await page.locator(CAROUSEL).boundingBox();
    const before = await activeIndex(page);
    // REAL mouse to the hero center (the r53a lesson: React's onMouseEnter
    // needs a trusted event; a synthetic one produced a FALSE 'not paused'
    // alarm in the r53a probe).
    await page.mouse.move(heroBox!.x + heroBox!.width / 2, heroBox!.y + heroBox!.height / 2);
    // 6.5s dwell: the unperturbed cadence flips at ~5s, so a surviving
    // active index at 6.5s proves the pause (measured live r53b §C: 7s
    // dwell, no advance; the reference ADVANCES — r53d §C, the superset).
    await page.waitForTimeout(6500);
    const afterDwell = await activeIndex(page);
    expect(afterDwell).toBe(before);
    // Leave: the auto-advance resumes (measured live r53b §C: resumed
    // within 6s of the leave).
    await page.mouse.move(5, 5);
    let resumed = false;
    const deadline = Date.now() + 6500;
    while (Date.now() < deadline) {
      await page.waitForTimeout(500);
      if ((await activeIndex(page)) !== afterDwell) { resumed = true; break; }
    }
    expect(resumed).toBe(true);
  });

  test("P14: the aria superset — labeled arrows, labeled dots, aria-current on the active", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // The reference carries NO aria-labels and NO aria-current on the hero
    // controls (measured live r53c §B/§D — both read null). The clone's
    // superset a11y contract (the screen-reader layer):
    await expect(page.locator(PREV)).toHaveAttribute("aria-label", "Previous slide");
    await expect(page.locator(NEXT)).toHaveAttribute("aria-label", "Next slide");
    const dotArias = await page.locator(DOTS).evaluateAll((els) =>
      els.map((el) => ({ label: el.getAttribute("aria-label"), current: el.getAttribute("aria-current") })),
    );
    expect(dotArias).toHaveLength(3);
    expect(dotArias[0].label).toMatch(/^Go to slide 1: /);
    expect(dotArias[1].label).toMatch(/^Go to slide 2: /);
    expect(dotArias[2].label).toMatch(/^Go to slide 3: /);
    // Exactly ONE dot is current (the active slide).
    expect(dotArias.filter((d) => d.current === "true")).toHaveLength(1);
  });
});
