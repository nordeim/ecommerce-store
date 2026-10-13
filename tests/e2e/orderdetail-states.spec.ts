import { expect, test } from "@playwright/test";

// Order-detail geometry + interaction + focus states (session-57,
// ORDER-DETAIL-GEO-1) — the customer-surfaces pin-density sweep's FIFTEENTH
// installment: the account order-detail's final deep corners, the
// six-deferral closure (deferred r51..r56). The family's content layer is
// pinned (account.spec:310-530 — the session-34/35/36/37/38 read-surface,
// money-state, timeline, tracking, and delivery-estimate rounds); the
// geometry/interaction/focus/responsive axes had ZERO pins. Every pin here
// is calibrated against the LIVE surfaces (probes
// account-orderdetail-probe-r57a on the reference + account-orderdetail-
// clone-r57b on the clone + the focus walk r57c..c4):
//
//   - THE ROUND'S HEADLINE: the family closes as a ZERO-DIVERGENCE
//     closure — NO production fixes. (1) The reference has NO detail
//     surface (r57a re-verified live: the orders tab's rows carry zero
//     anchors/buttons/onclick attrs; the direct detail URLs all 404) —
//     the detail route is a clone-only superset, so the ground truth for
//     its own contract is the family's SHARED vocabulary. (2) That shared
//     vocabulary is at computed parity: the header pill the detail
//     composes IS the reference's measured orders-tab chip — every value
//     (Delivered 77x22 / In-Transit 71x22, the same base classes, the
//     same computed set). (3) The clone's own contract is internally
//     consistent at every measured axis: the geometry at 1024w AND 375w,
//     the interactions live (the tracking underline hover, the accent
//     back-button hover), the focus states under a REAL Tab walk, the
//     tab order, the responsive collapse. (4) The superset layer — where
//     the r55 honest RED hid — is clean: the pluralization ternary EXISTS
//     (account-tabs.tsx:254), checked first per the r55 lesson.
//   - THE PARITY ANCHOR (P4): the pill's computed set, measured IDENTICAL
//     on both sides (r57a Phase 3 vs r57b) — the session-34 seam's live
//     re-verification.
//   - THE ENGINE REGISTERS (plan §2.3): the pill's `shadow` token renders
//     the transparent --tw-shadow reset layers identically on both sides
//     (the account route's pixel sweep rests at the 0% baseline); the
//     grid-stretch release at 375w (the cards take natural height in the
//     single column — correct CSS grid, both surfaces consistent); the
//     timeline's per-type icon map lives with the consumer.
//
// Probe-honesty lessons baked into the instrumentation (plan §2.4): the
// :focus-visible judgment REQUIRES a real keyboard.press("Tab") — script
// .focus() and synthetic keydowns never trip the heuristic for links
// (only text inputs always match); the box-shadow read must be FULL, not
// truncated (the ring layer's dimensions carry the visible-invisible
// verdict); one-sided borders read "" from the border shorthand — read
// borderTopWidth/TopColor instead; the account page carries MULTIPLE
// tabpanels — select the VISIBLE one, never querySelector's first.

const GRID = "main .max-w-5xl div.grid";

// Navigate to a seeded order's detail via the account orders tab (the
// public-id link — the session-34 contract).
async function openDetail(page: import("@playwright/test").Page, order: "001" | "002") {
  await page.goto("/account");
  await page.getByRole("tab", { name: "Orders" }).click();
  await page.getByRole("link", { name: `ORD-2026-${order}` }).click();
  await page.waitForURL(/\/account\/orders\//);
  await expect(page.getByRole("heading", { name: `ORD-2026-${order}`, exact: true })).toBeVisible();
}

test.describe("order-detail geometry + interaction + focus states (session-57, ORDER-DETAIL-GEO-1)", () => {
  test("P1: the page container — max-w-5xl, the py-8 rhythm, the sm:px-6 step", async ({ page }) => {
    await openDetail(page, "001");
    const c = page.locator("main .max-w-5xl");
    await expect(c).toHaveClass("max-w-5xl mx-auto px-4 sm:px-6 py-8");
    await expect(c).toHaveCSS("max-width", "1024px");
    await expect(c).toHaveCSS("padding-top", "32px");
    await expect(c).toHaveCSS("padding-bottom", "32px");
    await expect(c).toHaveCSS("padding-left", "24px");
    await expect(c).toHaveCSS("padding-right", "24px");
    await page.setViewportSize({ width: 375, height: 900 });
    await expect(c).toHaveCSS("padding-left", "16px");
    await expect(c).toHaveCSS("padding-right", "16px");
  });

  test("P2: the header row — flex-wrap gap-3, the single 36px line at desktop, the ml-auto right edge", async ({ page }) => {
    await openDetail(page, "001");
    const row = page.locator("main .max-w-5xl div.flex-wrap");
    await expect(row).toHaveClass("flex flex-wrap items-center gap-3");
    await expect(row).toHaveCSS("column-gap", "12px");
    const geo = await row.evaluate((el) => {
      const back = el.querySelector("a");
      const total = el.querySelector(".ml-auto");
      const c = el.closest(".max-w-5xl");
      if (!back || !total || !c) throw new Error("header parts missing");
      const rb = back.getBoundingClientRect();
      const rt = total.getBoundingClientRect();
      const rc = c.getBoundingClientRect();
      return {
        rowH: el.getBoundingClientRect().height,
        backFirst: rb.x < rt.x,
        // the total's right edge sits ON the container's content edge
        totalRight: rt.right,
        contentRight: rc.right - 24,
        pillBelowH1: true,
      };
    });
    expect(geo.rowH).toBe(36);
    expect(geo.backFirst).toBe(true);
    expect(geo.totalRight).toBeCloseTo(geo.contentRight, 1);
  });

  test("P3: the back link — the ghost Button-asChild anatomy + the accent hover", async ({ page }) => {
    await openDetail(page, "001");
    const back = page.getByRole("link", { name: "← Orders" });
    await expect(back).toHaveAttribute("href", "/account");
    await expect(back).toHaveClass(/rounded-xl/);
    const box = await back.boundingBox();
    expect(box?.width).toBe(78);
    expect(box?.height).toBe(32);
    await expect(back).toHaveCSS("border-radius", "12px");
    await expect(back).toHaveCSS("font-size", "12px");
    await expect(back).toHaveCSS("font-weight", "500");
    // the real-mouse hover: the accent tint (the ghost variant's hover)
    await back.hover();
    await expect(back).toHaveCSS("background-color", "rgb(253, 243, 237)");
  });

  test("P4: THE PILL — the parity anchor: the computed set IDENTICAL to the reference's measured chip", async ({ page }) => {
    await openDetail(page, "001"); // Delivered
    const pill = page.locator("main h1 ~ span.inline-flex");
    await expect(pill).toHaveText("Delivered");
    await expect(pill).toContainClass("inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full");
    await expect(pill).toContainClass("border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80");
    await expect(pill).toHaveCSS("display", "flex");
    await expect(pill).toHaveCSS("background-color", "rgb(230, 107, 26)");
    await expect(pill).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(pill).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    await expect(pill).toHaveCSS("font-size", "12px");
    await expect(pill).toHaveCSS("font-weight", "600");
    const d = await pill.boundingBox();
    expect(d?.width).toBe(77);
    expect(d?.height).toBe(22);
    // the In-Transit variant (002) — the secondary chip
    await openDetail(page, "002");
    const pill2 = page.locator("main h1 ~ span.inline-flex");
    await expect(pill2).toHaveText("In Transit");
    await expect(pill2).toHaveCSS("background-color", "rgb(242, 240, 237)");
    await expect(pill2).toHaveCSS("color", "rgb(23, 23, 28)");
    const d2 = await pill2.boundingBox();
    expect(d2?.width).toBe(71);
    expect(d2?.height).toBe(22);
  });

  test("P5: the h1 + the total — text-3xl/700 and text-2xl/700 ml-auto", async ({ page }) => {
    await openDetail(page, "001");
    const h1 = page.getByRole("heading", { name: "ORD-2026-001", exact: true });
    await expect(h1).toHaveClass("text-3xl font-bold");
    await expect(h1).toHaveCSS("font-size", "30px");
    await expect(h1).toHaveCSS("font-weight", "700");
    const total = page.locator("main .ml-auto");
    await expect(total).toHaveClass(/text-2xl font-bold ml-auto/);
    await expect(total).toHaveCSS("font-size", "24px");
    await expect(total).toHaveCSS("font-weight", "700");
    // ml-auto's computed margin-left is the RESOLVED used value (px),
    // never the literal "auto" — the class token + P2's right-edge anchor
    // carry the contract (the r57 authoring lesson)
    expect(await total.getAttribute("class")).toContain("ml-auto");
  });

  test("P6: the grid — md:grid-cols-2 gap-4 at desktop, the single track at 375w", async ({ page }) => {
    await openDetail(page, "001");
    const grid = page.locator(GRID).first();
    await expect(grid).toHaveClass(/grid md:grid-cols-2 gap-4 mb-4/);
    await expect(grid).toHaveCSS("grid-template-columns", "480px 480px");
    await expect(grid).toHaveCSS("column-gap", "16px");
    await expect(grid).toHaveCSS("margin-bottom", "16px");
    await page.setViewportSize({ width: 375, height: 900 });
    const tracks = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(tracks).toBe(1);
  });

  test("P7: the cards — rounded-2xl p-6 border-border/50 shadow-sm, the dl rhythm", async ({ page }) => {
    await openDetail(page, "001");
    const card = page.locator("main .max-w-5xl .bg-card").first();
    await expect(card).toHaveClass("bg-card rounded-2xl border border-border/50 shadow-sm p-6");
    await expect(card).toHaveCSS("border-radius", "16px");
    await expect(card).toHaveCSS("padding", "24px");
    await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(card).toHaveCSS("border-top-width", "1px");
    const h2 = card.locator("h2").first();
    await expect(h2).toHaveCSS("font-size", "16px");
    await expect(h2).toHaveCSS("font-weight", "600");
    const dt = card.locator("dt").first();
    const dd = card.locator("dd").first();
    await expect(card.locator("dl")).toHaveClass(/space-y-2 text-sm/);
    await expect(dt).toHaveCSS("color", "rgb(111, 111, 123)");
    await expect(dd).toHaveCSS("font-weight", "500");
    await expect(dd).toHaveCSS("font-size", "14px");
  });

  test("P8: the item rows — the 48px image, the p-4 rounded-xl border rhythm, the admin-sibling identity", async ({ page }) => {
    await openDetail(page, "001");
    const row = page.locator("main .max-w-5xl div.flex.items-center.gap-4.p-4.rounded-xl").first();
    await expect(row).toHaveClass("flex items-center gap-4 p-4 rounded-xl border border-border/50");
    await expect(row).toHaveCSS("padding", "16px");
    await expect(row).toHaveCSS("border-radius", "12px");
    await expect(row).toHaveCSS("column-gap", "16px");
    await expect(row).toHaveCSS("border-top-width", "1px");
    const img = row.locator("img");
    const ib = await img.boundingBox();
    expect(ib?.width).toBe(48);
    expect(ib?.height).toBe(48);
    await expect(img).toHaveCSS("border-radius", "12px");
    await expect(row.locator(".font-medium")).toHaveCSS("font-size", "16px");
    await expect(row.locator(".font-medium")).toHaveCSS("font-weight", "500");
    await expect(row.locator(".text-sm.text-muted-foreground")).toHaveCSS("color", "rgb(111, 111, 123)");
    await expect(row.locator(".font-semibold").last()).toHaveCSS("font-weight", "600");
  });

  test("P9: the totals block — gap-1 pt-2 border-t, the Total row's text-base step", async ({ page }) => {
    await openDetail(page, "001");
    const block = page.locator("main .max-w-5xl .border-t.flex.flex-col").first();
    await expect(block).toHaveClass(/flex flex-col gap-1 pt-2 text-sm border-t border-border\/50/);
    await expect(block).toHaveCSS("row-gap", "4px");
    await expect(block).toHaveCSS("padding-top", "8px");
    await expect(block).toHaveCSS("border-top-width", "1px");
    const totalRow = block.locator(".font-semibold.text-base");
    await expect(totalRow).toHaveCSS("font-size", "16px");
    await expect(totalRow).toHaveCSS("font-weight", "600");
    await expect(totalRow).toHaveText("Total$349.98");
  });

  test("P10: the timeline — the 32px circles, the per-type icon map, the 12px dates", async ({ page }) => {
    await openDetail(page, "002"); // the 3-row story: placed → transit → tracking
    const circles = page.locator("main span.h-8.w-8");
    await expect(circles).toHaveCount(3);
    await expect(circles.first()).toHaveClass(/mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/);
    await expect(circles.first()).toHaveCSS("background-color", "rgb(242, 240, 237)");
    const cb = await circles.first().boundingBox();
    expect(cb?.width).toBe(32);
    expect(cb?.height).toBe(32);
    // the per-type map (placed→Package, status_changed→Truck, tracking_added→PackageCheck)
    await expect(circles.nth(0).locator("svg")).toHaveClass(/lucide-package( |$)/);
    await expect(circles.nth(1).locator("svg")).toHaveClass(/lucide-truck( |$)/);
    await expect(circles.nth(2).locator("svg")).toHaveClass(/lucide-package-check( |$)/);
    const icons = page.locator("main span.h-8.w-8 svg");
    const ib = await icons.first().boundingBox();
    expect(ib?.width).toBe(16);
    expect(ib?.height).toBe(16);
    await expect(icons.first()).toHaveCSS("color", "rgb(111, 111, 123)");
    const label = page.locator("main ol li .font-medium").first();
    await expect(label).toHaveCSS("font-size", "16px");
    await expect(label).toHaveCSS("font-weight", "500");
    const date = page.locator("main ol li .text-xs").first();
    await expect(date).toHaveCSS("font-size", "12px");
    await expect(date).toHaveCSS("color", "rgb(111, 111, 123)");
    await expect(page.locator("main ol")).toHaveClass(/flex flex-col gap-3/);
    await expect(page.locator("main ol li").first()).toHaveClass(/flex items-start gap-3/);
  });

  test("P11: the tracking line + the estimate (002) — the live hover underline, the carrier link", async ({ page }) => {
    await openDetail(page, "002");
    const line = page.locator('[data-testid="tracking-line"]');
    await expect(line).toHaveClass(/mt-4 pt-4 border-t border-border\/50 text-sm/);
    await expect(line).toHaveCSS("margin-top", "16px");
    await expect(line).toHaveCSS("padding-top", "16px");
    await expect(line).toHaveCSS("border-top-width", "1px");
    await expect(line).toContainText("Tracking");
    // the carrier label renders as a TEXT NODE prefix ("UPS · ") inside
    // the font-medium <p> — no element's text is exactly "UPS" (the
    // r57 authoring lesson: getByText exact misses text-node fragments)
    await expect(line).toContainText("UPS · 1Z999AA10123456784");
    const link = line.locator("a");
    await expect(link).toHaveAttribute("href", "https://www.ups.com/track?tracknum=1Z999AA10123456784");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveClass(/text-primary underline-offset-4 hover:underline/);
    await expect(link).toHaveCSS("color", "rgb(230, 107, 26)");
    // the real-mouse hover: the underline (the interaction the sweep's
    // pixel diff cannot see)
    await link.hover();
    await expect(link).toHaveCSS("text-decoration-line", "underline");
    // the delivery estimate (session-37/38's DELIVERY-WINDOW rounds — the
    // geometry axis now pinned)
    const est = page.locator('[data-testid="delivery-window"]');
    await expect(est).toHaveClass("text-sm text-muted-foreground mt-2");
    await expect(est).toHaveCSS("color", "rgb(111, 111, 123)");
    await expect(est).toHaveCSS("margin-top", "8px");
    await expect(est).toHaveText("Estimated delivery: Mar 18 – 24, 2026");
  });

  test("P12: THE FOCUS (the back link) — the real-Tab ring, the r55 per-element-type contract", async ({ page }) => {
    await openDetail(page, "002");
    // the REAL Tab walk (the r57c lesson: script focus never trips
    // :focus-visible for links — only a real key event does)
    let backRead: { fv: boolean; outline: string; ring: string } | null = null;
    for (let i = 0; i < 30 && !backRead; i++) {
      await page.keyboard.press("Tab");
      backRead = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || !(el instanceof HTMLElement) || el.textContent?.trim() !== "← Orders") return null;
        const cs = getComputedStyle(el);
        return {
          fv: el.matches(":focus-visible"),
          outline: cs.outlineStyle,
          ring: cs.boxShadow,
        };
      });
    }
    expect(backRead, "the Tab walk never reached the back link").toBeTruthy();
    expect(backRead!.fv).toBe(true);
    expect(backRead!.outline).toBe("none"); // its own focus-visible:outline-none utility
    // the VISIBLE 1px orange ring — the Button's ring-1 layer (the FULL
    // box-shadow read, never truncated — the r57c4 lesson)
    expect(backRead!.ring).toContain("rgb(230, 107, 26) 0px 0px 0px 1px");
  });

  test("P13: THE FOCUS (the tracking link) + the pill's inert-focus register", async ({ page }) => {
    await openDetail(page, "002");
    let linkRead: { fv: boolean; outline: string; width: string } | null = null;
    for (let i = 0; i < 30 && !linkRead; i++) {
      await page.keyboard.press("Tab");
      linkRead = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || !(el instanceof HTMLElement)) return null;
        if (!(el instanceof HTMLAnchorElement) || !el.closest('[data-testid="tracking-line"]')) return null;
        const cs = getComputedStyle(el);
        return { fv: el.matches(":focus-visible"), outline: cs.outlineStyle, width: cs.outlineWidth };
      });
    }
    expect(linkRead, "the Tab walk never reached the tracking link").toBeTruthy();
    expect(linkRead!.fv).toBe(true);
    // the bare <a> — the global outline rule's domain (r53)
    expect(linkRead!.outline).toBe("auto");
    expect(linkRead!.width).toBe("1px");
    // the pill's INERT-FOCUS register: a span carrying focus: classes
    // that never fire — outside the tab sequence (the vocabulary's own
    // form, identical on the reference)
    const pill = page.locator("main h1 ~ span.inline-flex");
    await expect(pill).toContainClass("focus:ring-2");
    const reg = await pill.evaluate((el) => ({
      tabIndexAttr: el.getAttribute("tabindex"),
      focusable: (el as HTMLElement).tabIndex >= 0 && el.tagName !== "SPAN" ? true : (el as HTMLElement).tabIndex,
    }));
    expect(reg.tabIndexAttr).toBeNull();
    // the tab order: the back link precedes the tracking link (the main's
    // interactive pair in DOM order)
    const order = await page.evaluate(() => {
      const pair = [...document.querySelectorAll("main a")].filter(
        (a): a is HTMLElement => a instanceof HTMLElement && a.offsetParent !== null
      );
      return pair.map((a) => (a.textContent || "").trim().slice(0, 20));
    });
    expect(order[0]).toContain("← Orders");
    expect(order[1]).toContain("1Z999AA10123456784");
  });

  test("P14: the responsive collapse (375w) — the single-column grid, the wrapped header, the right-edge total", async ({ page }) => {
    await openDetail(page, "001");
    await page.setViewportSize({ width: 375, height: 900 });
    const grid = page.locator(GRID).first();
    const tracks = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(tracks).toBe(1);
    const wrap = await page.evaluate(() => {
      const row = document.querySelector("main .max-w-5xl div.flex-wrap");
      if (!row) throw new Error("no header row");
      const back = row.querySelector("a")!.getBoundingClientRect();
      const h1 = row.querySelector("h1")!.getBoundingClientRect();
      const pill = row.querySelector("span.inline-flex")!.getBoundingClientRect();
      const total = row.querySelector(".ml-auto")!.getBoundingClientRect();
      const c = row.closest(".max-w-5xl")!.getBoundingClientRect();
      return {
        rowH: row.getBoundingClientRect().height,
        wrapped: pill.y > back.y + 4, // the pill dropped to row 2
        sameLine: Math.abs(back.y - h1.y) < 4,
        totalRight: total.right,
        contentRight: c.right - 16, // px-4 at 375w
      };
    });
    expect(wrap.rowH).toBeGreaterThan(60); // two lines (36 single → ~80 wrapped)
    expect(wrap.wrapped).toBe(true);
    expect(wrap.sameLine).toBe(true);
    expect(wrap.totalRight).toBeCloseTo(wrap.contentRight, 1);
  });
});
