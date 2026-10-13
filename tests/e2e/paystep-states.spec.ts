import { expect, test } from "@playwright/test";
import { clearCartViaDrawer, openCartDrawer } from "./helpers";

// Checkout payment-step states (session-48, CHECKOUT-PAYSTEP-1 — the
// customer-surfaces pin-density sweep's sixth installment, session-93's
// standing "suggested next").
//
// THE REFERENCE RELATIONSHIP (measured live 2026-10-12 across seven probes,
// scripts/checkout-paystep-probe-r48[.mjs,b,c,d,e,f,g] — login-gated, the
// drawer path): the reference's "Review Order" is NEVER disabled (the Base44
// mock has no gate — the clone's cardValid gate is the registered superset);
// its CVC/expiry/card inputs do NO formatting and carry NO caps (the clone's
// formatters are the registered superset); its CARD FIELDS STAY VISIBLE when
// PayPal is selected (bbox + elementsFromPoint hit-test verified — the clone
// unmounted them: DIVERGENCE #1, fixed this round); its selected option's
// border is border-primary/30 — the theme orange at 30% alpha with NO
// background tint (the clone carried the full orange + bg-accent:
// DIVERGENCE #2, fixed); its card fields sit in an UNSTYLED container (the
// clone carried the p-4 rounded-xl bg-secondary/40 box: DIVERGENCE #3,
// fixed); its step-3 Place Order reads "Place Order — $299.99" (the em-dash
// + the cart total — label parity); and its step-3 → Back RESETS the
// payment (the clone preserves — session-44's registered superset family).
//
// Probe lessons: the reference's card inputs are PLACEHOLDER-ONLY (no
// accessible labels — the clone's <Label> elements are a superset); its
// option BOX is a parent div wrapping the radio + label (the clone's
// label-as-box renders equivalently — only the tokens diverged).
//
// The island keeps ONE React state across the steps (P9/P10 pin the
// preservation; the reference resets on every back — measured D5).

test.describe("checkout payment-step states (session-48, CHECKOUT-PAYSTEP-1)", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 item" })).toBeVisible();
    await openCartDrawer(page);
    await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  // The shared step-1 fill — the demo user's defaults prefill
  // First/Last/Email (john@example.com), so only the address block needs
  // filling.
  const fillAddress = async (page: import("@playwright/test").Page, over: Record<string, string> = {}) => {
    const main = page.getByRole("main");
    const fields: Record<string, string> = {
      Address: "123 Main St",
      City: "New York",
      State: "NY",
      ZIP: "10001",
      ...over,
    };
    for (const [label, value] of Object.entries(fields)) {
      await main.getByLabel(label).fill(value);
    }
  };

  // The step-2 entry helper.
  const toStep2 = async (page: import("@playwright/test").Page) => {
    await fillAddress(page);
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await expect(page.getByRole("heading", { name: "Payment Method" })).toBeVisible();
  };

  test("P1 — the card fields stay rendered under PayPal selection (the reference keeps them visible)", async ({ page }) => {
    await toStep2(page);

    // Select PayPal — the reference's card fields STAY VISIBLE (the
    // visibility probe: bbox 573x36, elementsFromPoint hit-test true).
    await page.getByText("PayPal", { exact: true }).click();

    const card = page.getByRole("main").getByLabel("Card Number");
    // The honest visibility check — the round-46 lesson: presence AND a
    // real elementsFromPoint hit-test at the input's center.
    await expect(card).toBeAttached();
    const hit = await card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return {
        hasBox: r.width > 0 && r.height > 0,
        hit: document.elementsFromPoint(cx, cy).includes(el),
      };
    });
    expect(hit.hasBox).toBe(true);
    expect(hit.hit).toBe(true);

    // The other two fields stay rendered too.
    await expect(page.getByRole("main").getByLabel("Expiry")).toBeAttached();
    await expect(page.getByRole("main").getByLabel("CVC")).toBeAttached();
  });

  test("P2 — PayPal + empty card fields advances to the review (no native block)", async ({ page }) => {
    await toStep2(page);
    await page.getByText("PayPal", { exact: true }).click();

    // The reference's Review advances with the empty visible card fields
    // (its inputs carry no `required`). The clone's required-drop keeps the
    // same contract; a restored `required` stalls the advance here (M2's
    // proof target).
    const review = page.getByRole("button", { name: "Review Order" });
    await expect(review).toBeEnabled();
    await review.click();
    await expect(page.getByRole("heading", { name: "Review & Place Order" })).toBeVisible();
  });

  test("P3 — the CVC gate paths (empty, short, 3-digit, Amex 4-digit)", async ({ page }) => {
    await toStep2(page);
    const main = page.getByRole("main");
    const review = page.getByRole("button", { name: "Review Order" });

    // The clone's cardValid gate (the registered superset — the reference
    // never disables Review): a valid card + expiry with CVC EMPTY keeps
    // the gate closed.
    await main.getByLabel("Card Number").fill("4242424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await expect(review).toBeDisabled();

    // 1-2 digits stay under the 3-digit floor.
    await main.getByLabel("CVC").fill("12");
    await expect(review).toBeDisabled();

    // The 3-digit form opens it.
    await main.getByLabel("CVC").fill("123");
    await expect(review).toBeEnabled();

    // The Amex 4-digit form opens it too (the 3-4-digit contract).
    await main.getByLabel("CVC").fill("1234");
    await expect(review).toBeEnabled();
  });

  test("P4 — the CVC formatter strips non-digits and caps at 4", async ({ page }) => {
    await toStep2(page);
    const main = page.getByRole("main");

    // The clone's digits-only 4-cap formatter (the registered superset —
    // the reference keeps the raw "12a4b56" with no cap).
    const cvc = main.getByLabel("CVC");
    await cvc.pressSequentially("12a4b56", { delay: 15 });
    await expect(cvc).toHaveValue("1245");
  });

  test("P5 — the card formatter caps at 19 digits", async ({ page }) => {
    await toStep2(page);
    const main = page.getByRole("main");

    // The 13-19-digit contract: typing 20 raw digits keeps the first 19,
    // grouped (the reference keeps all 20 — the registered superset).
    const card = main.getByLabel("Card Number");
    await card.pressSequentially("42424242424242424242", { delay: 12 });
    await expect(card).toHaveValue("4242 4242 4242 4242 424");
  });

  test("P6 — the selected option renders the /30-alpha border with no background tint", async ({ page }) => {
    await toStep2(page);
    await page.getByText("PayPal", { exact: true }).click();
    // The 150ms transition-colors must settle before measuring (a mid-flight
    // read catches the interpolated alpha — the round's own debugging
    // lesson: 0.513 measured 60ms after the click).
    await page.waitForTimeout(350);

    // The reference's selected box: border rgba(230,107,26,0.3) — the theme
    // orange at 30% alpha — and NO background tint (transparent in all
    // states). Tailwind v4 compiles border-primary/30 to a lab() color
    // layer (lab(60.08 45.96 63.0 / .3) — the SAME color in a different
    // serialization), so the honest comparison runs both through the canvas
    // pixel pipeline to sRGB bytes: #e66b1a at 30% alpha = (230,107,26,77),
    // ±2 per channel for the premultiply round-trip at low alphas.
    const paypalLabel = page.locator("label").filter({ hasText: /paypal/i }).first();
    const style = await paypalLabel.evaluate((el) => {
      const s = getComputedStyle(el);
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return { border: null as number[] | null, bg: s.backgroundColor };
      ctx.fillStyle = s.borderColor;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { border: [d[0], d[1], d[2], d[3]], bg: s.backgroundColor };
    });
    expect(style.border).not.toBeNull();
    // The ?? fallback fails every tolerance below if the canvas was somehow
    // unavailable (the honest sentinel) while keeping the type narrow.
    const [br, bgc, bb, ba] = style.border ?? [-1, -1, -1, -1];
    expect(Math.abs(br - 230)).toBeLessThanOrEqual(2);
    expect(Math.abs(bgc - 107)).toBeLessThanOrEqual(2);
    expect(Math.abs(bb - 26)).toBeLessThanOrEqual(2);
    expect(Math.abs(ba - 77)).toBeLessThanOrEqual(2);
    expect(style.bg).toBe("rgba(0, 0, 0, 0)");
  });

  test("P8 — the card fields sit in an unstyled container (no tinted box)", async ({ page }) => {
    await toStep2(page);

    // The reference's card fields' group: an unstyled div (no bg, no
    // border, radius 0, padding 0) inside the form's rhythm — the clone's
    // bg-secondary/40 rounded-xl box was the divergence. The container is
    // the fields' grid ancestor (the walk-up from the Card Number input —
    // the field wrappers in between are unstyled either way).
    const style = await page.getByRole("main").getByLabel("Card Number").evaluate((el) => {
      let cur = el.parentElement;
      while (cur && !/sm:grid-cols-2/.test(String(cur.className))) cur = cur.parentElement;
      const s = cur ? getComputedStyle(cur) : null;
      return {
        found: !!cur,
        bg: s?.backgroundColor ?? null,
        radius: s?.borderRadius ?? null,
        pad: s?.padding ?? null,
        border: s?.borderTopWidth ?? null,
      };
    });
    expect(style.found).toBe(true);
    expect(style.bg).toBe("rgba(0, 0, 0, 0)");
    expect(style.radius).toBe("0px");
    expect(style.pad).toBe("0px");
    expect(style.border).toBe("0px");
  });

  test("P7 — the unselected option keeps the stone border with no tint", async ({ page }) => {
    await toStep2(page);
    await page.getByText("PayPal", { exact: true }).click();
    await page.waitForTimeout(350);

    // The reference's unselected box: the stone border rgb(233,230,226) +
    // transparent bg — the same in both selection states (only the SELECTED
    // box swaps its border; the unselected never tints).
    const cardLabel = page.locator("label").filter({ hasText: /credit/i }).first();
    const style = await cardLabel.evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: s.borderColor, bg: s.backgroundColor };
    });
    expect(style.border).toBe("rgb(233, 230, 226)");
    expect(style.bg).toBe("rgba(0, 0, 0, 0)");
  });

  test("P9 — the method toggle preserves the card values (card → PayPal → card)", async ({ page }) => {
    await toStep2(page);
    const main = page.getByRole("main");

    // Fill the card, toggle to PayPal and back — the reference preserves
    // every value across the method round trip (D3 measured); the clone's
    // one-state island does the same.
    await main.getByLabel("Card Number").fill("4242424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await main.getByLabel("CVC").fill("123");
    await page.getByText("PayPal", { exact: true }).click();
    await expect(page.getByRole("radio", { name: "PayPal" })).toBeChecked();
    await page.getByText("Credit / Debit Card", { exact: false }).click();

    await expect(main.getByLabel("Card Number")).toHaveValue("4242 4242 4242 4242");
    await expect(main.getByLabel("Expiry")).toHaveValue("12/28");
    await expect(main.getByLabel("CVC")).toHaveValue("123");
  });

  test("P10 — the step-3 Back keeps the payment intact (the clone's superset)", async ({ page }) => {
    await toStep2(page);
    const main = page.getByRole("main");

    // The reference RESETS on the step-3 Back (method back to card, every
    // value wiped — D5 measured); the clone's one-state island PRESERVES —
    // session-44's registered superset family, pinned here on the payment
    // half.
    await main.getByLabel("Card Number").fill("4242424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await main.getByLabel("CVC").fill("123");
    await page.getByText("PayPal", { exact: true }).click();
    await page.getByRole("button", { name: "Review Order" }).click();
    await expect(page.getByRole("heading", { name: "Review & Place Order" })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();

    await expect(page.getByRole("heading", { name: "Payment Method" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "PayPal" })).toBeChecked();
    await expect(main.getByLabel("Card Number")).toHaveValue("4242 4242 4242 4242");
    await expect(main.getByLabel("Expiry")).toHaveValue("12/28");
    await expect(main.getByLabel("CVC")).toHaveValue("123");
  });

  test("P11 — the Place Order label carries the em-dash price + the lock icon", async ({ page }) => {
    await toStep2(page);
    const main = page.getByRole("main");

    // The reference's step-3 button reads "Place Order — $299.99" (the
    // em-dash + the cart total; its $299.99 cart ships free) — label parity
    // with the clone (the free-shipping-over-$100 rule makes the 1-item
    // $299.99 cart total $299.99). The Lock icon is the clone's registered
    // superset trust affordance (the reference has none).
    await main.getByLabel("Card Number").fill("4242424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await main.getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: "Review Order" }).click();

    const place = page.getByRole("button", { name: /Place Order/ });
    await expect(place).toHaveText("Place Order — $299.99");
    const hasLock = await place.evaluate((b) => !!b.querySelector("svg.lucide-lock, svg[class*=lock]"));
    expect(hasLock).toBe(true);
  });
});
