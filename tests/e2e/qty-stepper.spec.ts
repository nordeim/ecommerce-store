import { expect, test, type Page } from "@playwright/test";
import { adminLogin, clearCartViaDrawer, openCartDrawer } from "./helpers";

// Quantity-stepper boundary states (session-49, CART-STEPPER-1 — the
// customer-surfaces pin-density sweep's seventh installment, session-95's
// standing "suggested next").
//
// THE REFERENCE RELATIONSHIP (measured live 2026-10-12 across four probes,
// scripts/stepper-probe-r49[.mjs,b,d].mjs + stepper-clone-r49c.mjs —
// login-gated, the drawer path, content-scoped): the reference's PDP minus
// at qty 1 is ENABLED (opacity 1, cursor pointer) and its click is a NO-OP
// (the qty stays 1 — the clone disabled it: DIVERGENCE #1, fixed this
// round); the reference's DRAWER minus at qty 1 is ENABLED and its click
// REMOVES the item ("Cart (1)" -> "Cart (0)" -> the empty state — doubly
// measured; the clone disabled it and gated removal behind the trash:
// DIVERGENCE #2, fixed); the reference's stepper plus has NO cap in any
// reachable range (the PDP plus still enabled at qty 9, the drawer plus at
// qty 7, no error copy — the clone's stock/99 ceiling is the registered
// superset, pinned at P8); and the reference's steppers carry NO
// aria-labels (the clone's are the accessibility superset).
//
// THE PLATFORM-CURSOR DISCOVERY (probe r49d): the reference's Base44
// platform CSS gives EVERY <button> cursor:pointer — the complete census
// (17/17 PDP, 33/33 home, the auth submits, AND a synthetic bare <button>
// appended to the DOM: pointer). Tailwind v4.3.3's preflight sets NO button
// cursor, so the clone's buttons computed `default` site-wide — a
// hover-affordance divergence invisible to the pixel sweep. Fixed with the
// platform rule in globals.css (@layer base: button { cursor: pointer });
// pinned at P12.
//
// The reference's /cart is the HARDCODED EMPTY STATE (session-2) — the
// clone's real cart page is pure superset, pinned to the SAME design
// language as the drawer (the minus decrements-to-remove — the consistency
// fix #3).
//
// The server seam already exists: nextQuantity(1, -1) = 0 (the DELETE
// signal, unit-pinned in cart-quantity.test.ts) and changeQuantityBy
// deletes at next <= 0 — fixes #1-#3 are UI-only (the disabled attrs +
// the disabled:opacity-40 tokens).

/** Set a product's stock through the admin products form (the real seam —
 *  the stock.spec pattern; the admin login draws from its own rate-limit
 *  bucket). */
async function setStock(admin: Page, productName: string, value: number): Promise<void> {
  await admin.goto("/admin/products");
  const input = admin.getByLabel(`Stock for ${productName}`);
  await input.fill(String(value));
  await input.locator("xpath=following-sibling::button").click();
  await admin.waitForTimeout(800);
  await admin.reload();
  await expect(admin.getByLabel(`Stock for ${productName}`)).toHaveValue(String(value));
}

test.describe("quantity stepper boundary states (session-49, CART-STEPPER-1)", () => {
  // ---- P1/P2/P3/P11: the PDP stepper (client state — no cart needed) ----

  test("P1: the PDP minus at resting qty 1 is ENABLED at full opacity (reference parity)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.waitForLoadState("networkidle");
    const minus = page.getByRole("button", { name: "Decrease quantity", exact: true });
    await expect(minus).toBeVisible();
    // The reference's minus carries NO disabled attr, its computed opacity
    // is 1 and its cursor is pointer (probe r49 A1/A2 — the fixed state).
    await expect(minus).toBeEnabled();
    const state = await minus.evaluate((el) => ({
      opacity: getComputedStyle(el).opacity,
      cursor: getComputedStyle(el).cursor,
    }));
    expect(state.opacity).toBe("1");
    expect(state.cursor).toBe("pointer");
  });

  test("P2: the PDP minus click at qty 1 is a NO-OP (reference parity — the qty stays 1)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.waitForLoadState("networkidle");
    const minus = page.getByRole("button", { name: "Decrease quantity", exact: true });
    await minus.click();
    // The reference's Math.max-style floor: the click never drops the
    // display below 1 (probe r49 A2 — qty "1" after the click).
    const qty = await minus.evaluate((el) => {
      const container = el.parentElement;
      const span = container ? [...container.children].find((c) => c !== el && c.tagName === "SPAN") : null;
      return span?.textContent?.trim();
    });
    expect(qty).toBe("1");
    // And the no-op never writes the cart: the badge stays at its pre-click
    // count (the PDP stepper is pure client state until Add to Cart).
    await expect(page.getByRole("button", { name: /^Cart/ })).not.toHaveText(/Cart, \d+/);
  });

  test("P3: the PDP stepper anatomy matches the reference byte-for-byte", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.waitForLoadState("networkidle");
    const minus = page.getByRole("button", { name: "Decrease quantity", exact: true });
    const anatomy = await minus.evaluate((el) => {
      const container = el.parentElement!;
      const span = [...container.children].find((c) => c !== el && c.tagName === "SPAN") as HTMLElement;
      const s = getComputedStyle(span);
      return {
        minusClass: el.getAttribute("class"),
        containerClass: container.getAttribute("class"),
        containerRadius: getComputedStyle(container).borderRadius,
        spanClass: span.getAttribute("class"),
        spanMinWidth: s.minWidth,
        spanPadding: s.padding,
        spanWeight: s.fontWeight,
      };
    });
    // The reference's measured strings (probe r49 A1): the minus class is
    // EXACTLY p-3 hover:bg-secondary transition-colors rounded-l-xl (the
    // disabled:opacity-40 token dropped this round), the container
    // flex items-center border border-border rounded-xl at 12px, the span
    // px-5 font-medium min-w-[3rem] text-center (48px / 0 20px / 500).
    expect(anatomy.minusClass).toBe("p-3 hover:bg-secondary transition-colors rounded-l-xl");
    expect(anatomy.containerClass).toBe("flex items-center border border-border rounded-xl");
    expect(anatomy.containerRadius).toBe("12px");
    expect(anatomy.spanClass).toBe("px-5 font-medium min-w-[3rem] text-center");
    expect(anatomy.spanMinWidth).toBe("48px");
    expect(anatomy.spanWeight).toBe("500");
  });

  test("P11: the PDP boundary walk — up to 3, back to 1, the floor no-op (superset round trip)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.waitForLoadState("networkidle");
    const minus = page.getByRole("button", { name: "Decrease quantity", exact: true });
    const plus = page.getByRole("button", { name: "Increase quantity", exact: true });
    const readQty = () =>
      minus.evaluate((el) => {
        const container = el.parentElement!;
        const span = [...container.children].find((c) => c !== el && c.tagName === "SPAN");
        return span?.textContent?.trim();
      });
    await plus.click();
    await plus.click();
    expect(await readQty()).toBe("3");
    await minus.click();
    await minus.click();
    expect(await readQty()).toBe("1");
    // The floor: the third minus is the reference's no-op (A2) — the walk
    // ends at 1, never 0.
    await minus.click();
    expect(await readQty()).toBe("1");
  });

  // ---- P4-P7: the drawer stepper ----

  test("P4: the drawer minus at qty 1 is ENABLED at full opacity (reference parity)", async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 item" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    const minus = dialog.getByLabel(/Decrease quantity/);
    await expect(minus).toBeVisible();
    // The reference's drawer minus carries NO disabled at qty 1 (probe
    // r49b B1/B2 — enabled, opacity 1, cursor pointer).
    await expect(minus).toBeEnabled();
    const state = await minus.evaluate((el) => ({
      opacity: getComputedStyle(el).opacity,
      cursor: getComputedStyle(el).cursor,
    }));
    expect(state.opacity).toBe("1");
    expect(state.cursor).toBe("pointer");
  });

  test("P5: the drawer minus click at qty 1 REMOVES the item (reference parity — decrement-to-remove)", async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 item" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    // The reference's minus-at-1 click empties the cart ("Cart (1)" ->
    // "Cart (0)" -> "Your cart is empty" + Start Shopping — the
    // doubly-measured r49/r49b behavior; the server seam
    // nextQuantity(1,-1)=0 -> delete already exists).
    await dialog.getByLabel(/Decrease quantity/).click();
    await expect(dialog.getByRole("heading", { name: "Cart (0)" })).toBeVisible();
    await expect(dialog.getByText("Your cart is empty")).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Start Shopping" })).toBeVisible();
    await expect(dialog.locator("img")).toHaveCount(0);
  });

  test("P6: the drawer minus at qty 2 decrements to 1 (the normal-path regression guard)", async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Decrease quantity/).click();
    // 2 x $299.99 = $599.98 subtotal, free shipping over $100 -> $599.98.
    await expect(dialog.getByRole("heading", { name: "Cart (1)" })).toBeVisible();
    await expect(dialog.getByText("$299.99").first()).toBeVisible();
  });

  test("P7: the drawer stepper anatomy matches the reference byte-for-byte", async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 item" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    const minus = dialog.getByLabel(/Decrease quantity/);
    const anatomy = await minus.evaluate((el) => {
      const container = el.parentElement!;
      const span = [...container.children].find((c) => c !== el && c.tagName === "SPAN") as HTMLElement;
      return {
        minusClass: el.getAttribute("class"),
        containerClass: container.getAttribute("class"),
        containerRadius: getComputedStyle(container).borderRadius,
        spanClass: span.getAttribute("class"),
      };
    });
    // The reference's measured strings (probe r49b B1): the minus class is
    // EXACTLY p-1.5 hover:bg-secondary transition-colors rounded-l-lg (the
    // disabled token dropped), the container flex items-center border
    // border-border rounded-lg at 12px (the reference's rounded-lg is the
    // shadcn --radius 12px — trap #6's pinned scale), the span px-3
    // text-sm font-medium min-w-[2rem] text-center.
    expect(anatomy.minusClass).toBe("p-1.5 hover:bg-secondary transition-colors rounded-l-lg");
    expect(anatomy.containerClass).toBe("flex items-center border border-border rounded-lg");
    expect(anatomy.containerRadius).toBe("12px");
    expect(anatomy.spanClass).toBe("px-3 text-sm font-medium min-w-[2rem] text-center");
  });

  // ---- P8: the PDP plus's stock ceiling (the registered superset) ----

  test("P8: the PDP plus DISABLES at the stock ceiling (the registered stock-enforcement superset)", async ({ page, browser }) => {
    const admin = await adminLogin(browser);
    try {
      await setStock(admin, "Wireless Charging Pad", 2);
      await page.goto("/product/charging-pad");
      await page.waitForLoadState("networkidle");
      const plus = page.getByRole("button", { name: "Increase quantity", exact: true });
      // At qty 1 of stock 2: enabled (the reference has no cap — but the
      // clone's ceiling is the registered production-correct superset).
      await expect(plus).toBeEnabled();
      await plus.click();
      // At qty 2 of stock 2: DISABLED at opacity 0.4 (the ceiling).
      await expect(plus).toBeDisabled();
      const opacity = await plus.evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe("0.4");
    } finally {
      await setStock(admin, "Wireless Charging Pad", 25).catch(() => {});
      await admin.close();
    }
  });

  // ---- P9/P10: the full-page cart (pure superset surface — the clone's
  //      own design language, pinned to match the drawer) ----

  test("P9: the /cart minus at qty 1 is ENABLED and removes the item (the drawer's design language)", async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 item" })).toBeVisible();
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");
    const main = page.getByRole("main");
    const minus = main.getByLabel(/Decrease quantity/);
    await expect(minus).toBeVisible();
    // One design language — the drawer decrements-to-remove, so does /cart
    // (fix #3's consistency).
    await expect(minus).toBeEnabled();
    await minus.click();
    await expect(main.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Continue Shopping" })).toBeVisible();
  });

  test("P10: the /cart minus at qty 2 decrements to 1 (the normal path)", async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");
    const main = page.getByRole("main");
    await main.getByLabel(/Decrease quantity/).click();
    await expect(main.getByText("$299.99").first()).toBeVisible();
    // The header badge (OUTSIDE main) tracks the decrement to 1.
    await expect(page.getByRole("button", { name: "Cart, 1 item" })).toBeVisible();
  });

  // ---- P12: the platform-cursor discovery (the site-wide fix) ----

  test("P12: every button computes cursor:pointer (the reference's platform rule)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.waitForLoadState("networkidle");
    // The reference's complete census: 17/17 buttons on its PDP, 33/33 on
    // its home, a synthetic bare <button>: pointer (probe r49d — the
    // Base44 platform rule). The clone's v4.3.3 preflight sets no button
    // cursor; the @layer base rule restores the platform behavior.
    const census = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const counts: Record<string, number> = {};
      for (const b of btns) {
        const c = getComputedStyle(b).cursor;
        counts[c] = (counts[c] ?? 0) + 1;
      }
      return { total: btns.length, counts };
    });
    expect(census.total).toBeGreaterThan(10);
    expect(census.counts).toEqual({ pointer: census.total });
  });
});
