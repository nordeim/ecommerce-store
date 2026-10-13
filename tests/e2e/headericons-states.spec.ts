import { expect, test } from "@playwright/test";
import { clearCartViaDrawer } from "./helpers";

// Header icon-button interaction states (session-55, HEADER-ICONS-1) — the
// customer-surfaces pin-density sweep's thirteenth installment. The header's
// four ghost icon buttons (Search / Heart-wishlist / Bag-cart / User-account)
// carry pinned GEOMETRY (storefront-parity:204's gap-1 cluster, :229's mobile
// 3-child row) but near-ZERO pins on the interaction axis: no hover pin, no
// focus-visible pin, no aria pin, no badge anatomy pin. Every pin here is
// calibrated against the LIVE reference (probes headericons-probe-r55a/b/d
// on the reference + headericons-clone-r55c/e/f on the clone — the DOM
// dumps, computed styles, REAL-mouse hovers, and a keyboard tab-walk as the
// ground truth):
//
//   - THE ROUND'S HEADLINE: the family is the sweep's FOURTH FULLY-PARITY
//     family (after buy-panel r52, heronav r53, announcement-bar r54) —
//     every computed value identical on the interaction axis: the four
//     buttons at 844/884/924/964 each 36×36, the svgs BYTE-IDENTICAL and
//     rendering 16px (the [&_svg]:size-4 descendant utility beats the svg's
//     own h-5 w-5 on BOTH engines), the resting computed, the accent-pair
//     hover rgb(253,243,237)/rgb(138,64,15), and the tab order including
//     the Link-wrapped heart/user DOUBLE-ENTRY.
//   - THE HONEST RED (P11): the clone's superset cart aria reads
//     "Cart, 1 items" at itemCount 1 — wrong English, and the repo's own
//     convention is `=== 1 ? "product" : "products"` (the shop filters,
//     pinned by shopfilter-states:179). The fix pluralizes; the reference
//     carries NO aria at all (P9 documents the superset).
//   - THE SUPERSET CONTRACTS (deliberate, plan §2.2 rows 11-13): the aria
//     layer (Search + aria-haspopup + aria-expanded, Wishlist, Cart, Log
//     in) and the count-aware bag badge (the reference NEVER paints a
//     counter — its demo cart; the clone's badge is the real-cart superset,
//     anatomy measured live at r55f).
//   - THE ENGINE REGISTERS (rendered-identical, plan §2.3): v3 outline-none
//     = 2px transparent vs v4 = true none (nothing paints either way); the
//     ring's 2-vs-4 box-shadow layer count (the orange 1px layer is the
//     visible paint — pinned); lab() vs rgba() alpha serialization (both
//     spellings accepted); the reference's gap-2 Button vintage + `relative`
//     placement on search/heart (no rendered effect — the clone carries
//     `relative` only on the bag, where the positioned badge lives).

// The four icon buttons, located label-independently by their svgs (the
// logo's bag svg lives on an <a>, not a button — only the cluster's bag
// BUTTON matches; the search STRIP's submit button also carries
// svg.lucide-search, so the cluster's DOM-first button takes .first()).
const iconBtn = (page: import("@playwright/test").Page, svg: string) =>
  page.locator("header button").filter({ has: page.locator(`svg.lucide-${svg}`) }).first();

test.describe("header icon-button states (session-55, HEADER-ICONS-1)", () => {
  test.beforeEach(async ({ page }) => {
    // The badge/aria pins assert absolute cart states — start from zero
    // (the cart.spec convention; the global reset is belt-and-braces).
    await clearCartViaDrawer(page);
  });

  test("P1: the four buttons' geometry — 36×36 at 844/884/924/964 (the cluster arithmetic 4×36 + 3×4)", async ({ page }) => {
    // Measured live on the reference (r55a/b, 1024×768, home): search 844,
    // heart 884, bag 924, user 964 — each exactly 36×36 at y=42. The clone
    // measured IDENTICAL (r55c). 4×36 + 3×4 = 156 = the cluster width.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    const expected: Array<[string, number]> = [
      ["search", 844],
      ["heart", 884],
      ["shopping-bag", 924],
      ["user", 964],
    ];
    for (const [svg, x] of expected) {
      const btn = iconBtn(page, svg);
      const box = await btn.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      });
      expect(box, `the ${svg} button`).toEqual({ x, y: 42, w: 36, h: 36 });
    }
  });

  test("P2: the cluster + the row — flex gap-1, 156px, four children in the h-16 justify-between row", async ({ page }) => {
    // The cluster div (the heart button's ancestor two levels up) and the
    // h-16 row — r26's geometry pin re-verified IN-FAMILY (byte-identical
    // class strings both sides, r55a/c).
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    const cluster = iconBtn(page, "heart").locator("xpath=../..");
    await expect(cluster).toHaveClass(/(^|\s)flex items-center gap-1(\s|$)/);
    const clusterRead = await cluster.evaluate((el) => {
      const s = getComputedStyle(el);
      return { gap: s.columnGap, w: Math.round(el.getBoundingClientRect().width), kids: el.children.length };
    });
    expect(clusterRead).toEqual({ gap: "4px", w: 156, kids: 4 });
    const row = cluster.locator("..");
    await expect(row).toHaveClass(/(^|\s)flex items-center justify-between h-16(\s|$)/);
    const rowW = await row.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(rowW).toBe(976);
  });

  test("P3: the svg class strings + the COMPUTED 16px — the [&_svg]:size-4 descendant utility wins over h-5 w-5", async ({ page }) => {
    // Measured live on BOTH sides (r55a/c): every icon svg carries
    // `lucide lucide-X h-5 w-5` but COMPUTES 16px/16px — the Button base's
    // `[&_svg]:size-4` descendant selector beats the svg's own h-5 w-5 on
    // v3 AND v4. The class string is pinned because M7 proves it can drift
    // while the computed stays 16px.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    for (const svg of ["search", "heart", "shopping-bag", "user"]) {
      const icon = iconBtn(page, svg).locator("svg");
      await expect(icon, `the ${svg} svg class`).toHaveClass(new RegExp(`(^|\\s)lucide lucide-${svg} h-5 w-5(\\s|$)`));
      const size = await icon.evaluate((el) => {
        const s = getComputedStyle(el);
        return `${s.width}/${s.height}`;
      });
      expect(size, `the ${svg} svg computed size`).toBe("16px/16px");
    }
  });

  test("P4: the resting computed — transparent bg, foreground color, radius 10px, 0.15s, pointer", async ({ page }) => {
    // Measured live on BOTH sides (r55a/c): all four buttons rest at
    // bg rgba(0,0,0,0), color rgb(23,23,28) (the foreground token),
    // border-radius 10px (rounded-md on the pinned radius scale), a 0.15s
    // transition-colors, cursor pointer.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    for (const svg of ["search", "heart", "shopping-bag", "user"]) {
      const read = await iconBtn(page, svg).evaluate((el) => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, radius: s.borderRadius, dur: s.transitionDuration, cursor: s.cursor };
      });
      expect(read, `the ${svg} resting`).toEqual({
        bg: "rgba(0, 0, 0, 0)",
        color: "rgb(23, 23, 28)",
        radius: "10px",
        dur: "0.15s",
        cursor: "pointer",
      });
    }
  });

  test("P5: the REAL-mouse hover — all four buttons paint the accent pair rgb(253,243,237)/rgb(138,64,15)", async ({ page }) => {
    // Measured live on BOTH sides (r55b/c): the ghost hover lifts every
    // button to the accent pair — bg rgb(253,243,237) (bg-accent), color
    // rgb(138,64,15) (text-accent-foreground) — the same pair pinned at
    // the buy-panel/feature tiles (r52), now first-time pinned at the
    // header. REAL mouse only (the r53 synthetic-event wall).
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    for (const svg of ["search", "heart", "shopping-bag", "user"]) {
      const btn = iconBtn(page, svg);
      await btn.hover();
      await page.waitForTimeout(400); // past the 0.15s transition
      const read = await btn.evaluate((el) => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      expect(read, `the ${svg} hover`).toEqual({ bg: "rgb(253, 243, 237)", color: "rgb(138, 64, 15)" });
    }
  });

  test("P6: focus-visible ON a button — outline none + the orange 1px ring layer (not the global outline rule)", async ({ page }) => {
    // Measured live on BOTH sides (r55d/e): the shadcn buttons' own
    // focus-visible utilities WIN over the r53 global `* { outline-ring/50 }`
    // rule — a keyboard-focused icon button paints outline none (v4; the
    // reference's v3 "2px solid transparent" paints nothing either — the
    // invisible-outline register) plus the box-shadow ring whose visible
    // layer is rgb(230,107,26) 0 0 0 1px (the reference's shadow carries 2
    // layers, v4's 4 — the layer-count register; the orange 1px is pinned).
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    await page.mouse.move(10, 760); // park WITHOUT clicking (the r55d tab-start lesson)
    for (let i = 0; i < 7; i++) await page.keyboard.press("Tab"); // logo + 5 nav links first
    await page.waitForTimeout(250);
    const read = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) throw new Error("no active element");
      const s = getComputedStyle(el);
      return {
        svg: el.querySelector("svg")?.getAttribute("class") ?? "none",
        outlineStyle: s.outlineStyle,
        boxShadow: s.boxShadow,
        focusVisible: el.matches(":focus-visible"),
      };
    });
    expect(read.svg).toContain("lucide-search");
    expect(read.focusVisible).toBe(true);
    expect(read.outlineStyle).toBe("none");
    expect(read.boxShadow).toMatch(/rgb\(230, 107, 26\) 0px 0px 0px 1px/);
  });

  test("P7: focus-visible on the A wrappers — the global rule outline auto 1px ring/50 (both spellings)", async ({ page }) => {
    // Measured live on BOTH sides (r55d/e): the logo A and the heart's A
    // wrapper carry NO focus utilities, so the r53 global rule paints them:
    // outline-style auto, width 1px, the ring/50 color — rgba() on the
    // reference, lab() on v4 (the standing serialization register).
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    await page.mouse.move(10, 760);
    await page.keyboard.press("Tab"); // tab 1 = the logo A
    await page.waitForTimeout(250);
    const logo = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) throw new Error("no active element");
      const s = getComputedStyle(el);
      return { tag: el.tagName, svg: el.querySelector("svg")?.getAttribute("class") ?? "none", style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor };
    });
    expect(logo.tag).toBe("A");
    expect(logo.svg).toContain("lucide-shopping-bag");
    expect(logo.style).toBe("auto");
    expect(logo.width).toBe("1px");
    expect(logo.color).toMatch(/^rgba\(230, 107, 26, 0\.5\)$|^lab\(60\.0768 45\.9585 63\.0005 \/ 0\.5\)$/);
    for (let i = 0; i < 7; i++) await page.keyboard.press("Tab"); // tab 8 = the heart's A wrapper
    await page.waitForTimeout(250);
    const heartA = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) throw new Error("no active element");
      const s = getComputedStyle(el);
      return { tag: el.tagName, svg: el.querySelector("svg")?.getAttribute("class") ?? "none", style: s.outlineStyle };
    });
    expect(heartA.tag).toBe("A");
    expect(heartA.svg).toContain("lucide-heart");
    expect(heartA.style).toBe("auto");
  });

  test("P8: the tab order — logo, 5 nav links, then the cluster with the Link-wrapped heart/user DOUBLE-ENTRY", async ({ page }) => {
    // Measured live on BOTH sides (r55d/e): the keyboard order is logo A →
    // 5 nav links → search BTN → heart A → heart BTN → bag BTN → user A →
    // user BTN. The Link-wrapped buttons appear TWICE (the wrapper and the
    // button are both focusable) — the reference's structure identical.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    await page.mouse.move(10, 760);
    const seq: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(120);
      const sig = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return "NONE";
        const svg = el.querySelector("svg")?.getAttribute("class") ?? "no-svg";
        const m = svg.match(/lucide-([a-z-]+)/);
        return `${el.tagName}:${m ? m[1] : (el.textContent || "").trim().slice(0, 6) || "?"}`;
      });
      seq.push(sig);
    }
    expect(seq).toEqual([
      "A:shopping-bag", // the LUXE logo (its icon is a bag svg)
      "A:Home",
      "A:Shop",
      "A:Electr", // Electronics — the 6-char text signature
      "A:Clothi", // Clothing
      "A:Access", // Accessories
      "BUTTON:search",
      "A:heart",
      "BUTTON:heart",
      "BUTTON:shopping-bag",
      "A:user",
      "BUTTON:user",
    ]);
  });

  test("P9: the aria superset — labels on all four buttons; the reference carries NONE", async ({ page }) => {
    // Measured live (r55a/b): the reference's icon buttons carry NO
    // aria-labels (only the menu + search carry aria-haspopup). The clone's
    // labels are the superset a11y layer: Search (+haspopup+expanded, the
    // session-46 toggle), Wishlist, Cart, Log in/My account.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    const search = iconBtn(page, "search");
    await expect(search).toHaveAttribute("aria-label", "Search");
    await expect(search).toHaveAttribute("aria-haspopup", "dialog");
    await expect(search).toHaveAttribute("aria-expanded", "false");
    await expect(iconBtn(page, "heart")).toHaveAttribute("aria-label", "Wishlist");
    await expect(iconBtn(page, "shopping-bag")).toHaveAttribute("aria-label", "Cart");
    // The E2E context arrives AUTHENTICATED (storageState) — the user
    // button reads "My account" (the logged-out variant is "Log in").
    await expect(iconBtn(page, "user")).toHaveAttribute("aria-label", "My account");
  });

  test("P10: the badge superset anatomy — the 16×16 primary pill pinned at the bag's top-right corner", async ({ page }) => {
    // Measured live (r55f): with 1 item the bag paints the count badge —
    // the class string, bg rgb(230,107,26) (bg-primary), white 10px/600,
    // h 16 min-w 16, rounded-full, absolute at top -4px right -8px (the
    // -top-1 -right-2 tokens), pad 0 4px, flex-centered. The reference
    // NEVER paints a counter (r55b's badge sweep: zero spans in its bag).
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await page.waitForTimeout(900);
    const bag = iconBtn(page, "shopping-bag");
    const span = bag.locator("span");
    await expect(span).toHaveText("1");
    await expect(span).toHaveClass(
      /absolute -top-1 -right-2 h-4 min-w-4 px-1 bg-primary text-primary-foreground text-\[10px\] font-semibold rounded-full flex items-center justify-center/,
    );
    const read = await span.evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const bagR = el.closest("button")!.getBoundingClientRect();
      return {
        bg: s.backgroundColor, color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight,
        h: s.height, minW: s.minWidth, pos: s.position, top: s.top, right: s.right, pad: s.padding,
        spanTop: Math.round(r.top), spanRight: Math.round(r.right),
        bagTop: Math.round(bagR.top), bagRight: Math.round(bagR.right),
      };
    });
    expect(read.bg).toBe("rgb(230, 107, 26)");
    expect(read.color).toBe("rgb(255, 255, 255)");
    expect(read.fontSize).toBe("10px");
    expect(read.fontWeight).toBe("600");
    expect(read.h).toBe("16px");
    expect(read.minW).toBe("16px");
    expect(read.pos).toBe("absolute");
    expect(read.top).toBe("-4px");
    expect(read.right).toBe("-8px");
    expect(read.pad).toBe("0px 4px");
    expect(read.spanTop).toBe(read.bagTop - 4);
    expect(read.spanRight).toBe(read.bagRight + 8);
  });

  test("P11: THE FIX — the cart aria pluralizes: 'Cart, 1 item' singular, 'Cart, 2 items' plural", async ({ page }) => {
    // The honest RED (measured live, r55f): the pre-fix aria read
    // "Cart, 1 items" — wrong English, against the repo's own convention
    // (`=== 1 ? "product" : "products"` at the shop filters). The fix
    // pluralizes; 2+ items keeps "items".
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(iconBtn(page, "shopping-bag")).toHaveAttribute("aria-label", "Cart, 1 item");
    await page.goto("/product/vitamin-c-serum");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(iconBtn(page, "shopping-bag")).toHaveAttribute("aria-label", "Cart, 2 items");
  });

  test("P12: the hover with the badge — the accent pair still paints on the bag", async ({ page }) => {
    // Measured live (r55f): the badge's presence does not disturb the
    // ghost hover — the bag still lifts to the accent pair.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await page.waitForTimeout(900);
    const bag = iconBtn(page, "shopping-bag");
    await bag.hover();
    await page.waitForTimeout(400);
    const read = await bag.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color };
    });
    expect(read).toEqual({ bg: "rgb(253, 243, 237)", color: "rgb(138, 64, 15)" });
  });

  test("P13: the empty-cart negative — no badge span, the bare 'Cart' aria", async ({ page }) => {
    // The badge renders ONLY at itemCount > 0 (the conditional span); the
    // reference NEVER renders one at all (its superset absence documented).
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForTimeout(600);
    const bag = iconBtn(page, "shopping-bag");
    await expect(bag).toHaveAttribute("aria-label", "Cart");
    await expect(bag.locator("span")).toHaveCount(0);
  });

  test("P14: the mobile contract — at 390px the cluster keeps its four 36×36 buttons at x=218", async ({ page }) => {
    // Measured live (r55b/c at 1024; the mobile row pinned r26): the
    // cluster's own geometry at 390×664 — x=218, 156px wide (the row's
    // 3-child justify-between arithmetic: menu 36 + logo 88 + cluster 156
    // + gaps = 358 container), each button still 36×36 with gap 4.
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto("/");
    await page.waitForTimeout(600);
    const cluster = iconBtn(page, "heart").locator("xpath=../..");
    const read = await cluster.evaluate((el) => {
      const s = getComputedStyle(el);
      const kids = [...el.children].map((c) => {
        const r = (c as HTMLElement).getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
      return { x: Math.round(el.getBoundingClientRect().x), w: Math.round(el.getBoundingClientRect().width), gap: s.columnGap, kids };
    });
    expect(read.x).toBe(218);
    expect(read.w).toBe(156);
    expect(read.gap).toBe("4px");
    expect(read.kids).toHaveLength(4);
    for (const k of read.kids) expect(k).toEqual({ w: 36, h: 36 });
  });
});
