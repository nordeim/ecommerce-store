import { expect, test } from "@playwright/test";
import { clearCartViaDrawer, openCartDrawer } from "./helpers";

// Cart flows: add from card and PDP, drawer totals, quantity stepper,
// remove, and the badge count. Contexts arrive authenticated (storageState)
// but cart state starts empty (the seed creates no carts).
//
// Reference parity (verified live 2026-10-07): adding to cart NEVER opens
// the drawer — only the header badge changes. The drawer opens exclusively
// via the header cart button, which is how these specs reach it.

test.describe("cart", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
  });

  test("adding to cart does not auto-open the drawer (reference parity)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    // The add is a server action — give the mutation a beat to land, then
    // assert the resting state: badge bumped, drawer closed.
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await page.waitForTimeout(700);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("below-threshold carts pay the reference's flat $9.99 shipping (session-4)", async ({ page }) => {
    // Measured live on the reference 2026-10-07: $34.99 cart -> Shipping
    // $9.99, Total $44.98 (and $79.99 -> $9.99; $299.99 -> Free).
    await page.goto("/product/vitamin-c-serum");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Subtotal").locator("..")).toContainText("$34.99");
    await expect(dialog.getByText("Shipping").locator("..")).toContainText("$9.99");
    await expect(dialog.getByText("Total").locator("..").last()).toContainText("$44.98");
  });

  test("adding to cart shows the reference's dark toast (session-4)", async ({ page }) => {
    // The reference toasts "«name» added to cart!" bottom-right: a dark
    // rounded-xl box with the orange CircleCheckBig icon, 3000ms lifetime.
    await page.goto("/product/ceramic-planter");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    // getByText resolves to the toast ITEM (the text is its direct child).
    const box = page.getByText("Ceramic Planter Set added to cart!");
    await expect(box).toBeVisible();
    await expect(box).toHaveCSS("background-color", "rgb(23, 23, 28)"); // bg-foreground
    await expect(box).toHaveCSS("color", "rgb(251, 250, 249)"); // text-background
    await expect(box).toHaveCSS("border-radius", "12px"); // rounded-xl
    await expect(box.locator("svg")).toHaveCSS("color", "rgb(230, 107, 26)"); // text-primary
    // Fixed to the bottom-right corner (bottom-6 right-6). A short settle
    // lets the enter spring finish; ±2px tolerance mirrors the reference's
    // own mid-spring sampling drift (its live values oscillate ~2px too).
    await page.waitForTimeout(450);
    const pos = await box.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { bottom: window.innerHeight - r.bottom, right: window.innerWidth - r.right };
    });
    expect(Math.round(pos.bottom)).toBeGreaterThanOrEqual(22);
    expect(Math.round(pos.bottom)).toBeLessThanOrEqual(26);
    expect(Math.round(pos.right)).toBeGreaterThanOrEqual(22);
    expect(Math.round(pos.right)).toBeLessThanOrEqual(26);
    // Auto-dismisses (~3s).
    await expect(box).toBeHidden({ timeout: 6000 });
  });

  test("rapid adds stack toasts without dedupe (reference parity)", async ({ page }) => {
    await page.goto("/product/yoga-mat");
    const add = page.getByRole("button", { name: "Add to Cart" }).first();
    await add.click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await add.click();
    await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
    // Two toasts stack in the region (gap-2), each its own element.
    const region = page.locator("div.fixed.bottom-6.right-6");
    await expect(region).toBeVisible();
    await expect(region.locator("> div")).toHaveCount(2);
  });

  test("adding from a card bumps the badge; the drawer (via header) shows correct totals", async ({ page }) => {
    await page.goto("/shop");
    await page.locator(".bg-card.group").first().hover();
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Cart \(1\)/ })).toBeVisible();
    await expect(dialog.getByText("Subtotal").locator("..")).toContainText("$299.99");
    await expect(dialog.getByText("Total").locator("..").last()).toContainText("$299.99");
    // Free shipping over $100 (the announcement's threshold).
    await expect(dialog.getByText("Shipping").locator("..")).toContainText("Free");
  });

  test("drawer item row matches the reference anatomy (session-2 parity)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");

    // The item name is a single-line truncated heading (not a 2-line link).
    const name = dialog.getByRole("heading", { name: "Wireless Noise-Cancelling Headphones" });
    await expect(name).toBeVisible();
    expect(await name.evaluate((el) => getComputedStyle(el).webkitLineClamp === "none")).toBe(true);

    // Unit price is bold (reference: text-sm font-bold mt-1).
    const unitPrice = dialog.getByText("$299.99").first();
    expect(await unitPrice.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("700");

    // A right-side LINE TOTAL exists (unit price AND line total both visible).
    expect(await dialog.getByText("$299.99").count()).toBeGreaterThanOrEqual(2);

    // Rows are border-separated (reference: py-4 border-b border-border/50).
    const row = name.locator("xpath=ancestor::div[contains(@class,'border-b')]");
    await expect(row).toBeVisible();

    // The trash button sits immediately after the stepper (gap-2, not
    // justify-between): measure from the stepper CONTAINER's right edge.
    const trash = dialog.getByLabel(/Remove/);
    const stepperBox = await dialog
      .getByLabel(/Decrease quantity/)
      .locator("xpath=..")
      .boundingBox();
    const trashBox = await trash.boundingBox();
    expect(stepperBox).not.toBeNull();
    expect(trashBox).not.toBeNull();
    expect(trashBox!.x - (stepperBox!.x + stepperBox!.width)).toBeLessThan(20);

    // "Free" shipping value is the primary color (reference: text-primary).
    const free = dialog.getByText("Free");
    const freeColor = await free.evaluate((el) => getComputedStyle(el).color);
    expect(freeColor).toBe("rgb(230, 107, 26)");
  });

  test("PDP add respects the quantity stepper", async ({ page }) => {
    await page.goto("/product/leather-watch");
    await page.getByLabel("Increase quantity", { exact: true }).click();
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 2 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    // The stepper was increased once: 2 × $189.00.
    await expect(dialog.getByRole("heading", { name: /Cart \(2\)/ })).toBeVisible();
    await expect(dialog.getByText("$189.00").first()).toBeVisible();
    await expect(dialog.getByText("$378.00").first()).toBeVisible();
  });

  test("quantity stepper in the drawer updates totals; remove clears the cart", async ({ page }) => {
    await page.goto("/product/vitamin-c-serum");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    const dialog = page.getByRole("dialog");
    // Increase twice: 3 × $34.99 = $104.97 (crosses the free-shipping line).
    // The intermediate assertion between clicks serializes the two server
    // mutations — the reference parity AND the regression pin for the
    // session-4 lost-update race (stale-state absolute quantities used to
    // collapse double-clicks into a single +1). Assert the DRAWER's own
    // totals (the header badge is aria-hidden behind the open Radix dialog).
    await dialog.getByLabel(/Increase quantity/).click();
    await expect(dialog.getByText("$69.98").first()).toBeVisible();
    await dialog.getByLabel(/Increase quantity/).click();
    await expect(dialog.getByText("$104.97").first()).toBeVisible();
    await expect(dialog.getByText("Shipping").locator("..")).toContainText("Free");
    // Remove empties the drawer.
    await dialog.getByLabel(/Remove/).click();
    await expect(dialog.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  });

  test("header badge tracks the item count", async ({ page }) => {
    await page.goto("/product/silk-pajama");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    // Reference parity: the drawer never auto-opens, so the badge is
    // assertable directly — no dialog to dismiss first.
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
  });

  test("the full-page cart mirrors the drawer", async ({ page }) => {
    await page.goto("/product/yoga-mat");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    await page.getByRole("dialog").getByRole("link", { name: "View Cart" }).click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();
    await expect(page.getByText("$69.99").first()).toBeVisible();
    // Line total alongside the unit price (drawer-anatomy consistency).
    expect(await page.getByText("$69.99").count()).toBeGreaterThanOrEqual(2);
    // Session-20 refinement: scoped to the MAIN region. The unscoped
    // locator raced the cart drawer's exit animation — navigating away
    // closes the drawer, but its portal content (with its own Checkout
    // link) persists through the ~500ms animate-out + the re-animation
    // on the /cart hydration commit, and a strict-mode getByRole matches
    // BOTH links when the assertion lands inside that window. The
    // drawer's exit timing is byte-identical to the baseline (measured:
    // animationend 137/487ms vs the baseline's 142/506ms); the page's
    // own Checkout link is what this test means.
    await expect(page.getByRole("main").getByRole("link", { name: "Checkout" })).toBeVisible();
  });
});
