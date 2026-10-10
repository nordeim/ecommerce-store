import { expect, test } from "@playwright/test";
import { clearCartViaDrawer, openCartDrawer } from "./helpers";

// The checkout funnel: the 3-step wizard, server-side validation gates
// (Continue is disabled until the step is valid), the placed order, and the
// account order history. Runs authenticated; the cart is seeded per test.

test.describe("checkout (empty cart)", () => {
  test("an empty cart renders the reference's 'No items in cart' block", async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "No items in cart" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue Shopping" })).toBeVisible();
    // Reference parity: a bare h1 + default button — no icon circle, no
    // helper paragraph (captured live 2026-10-07).
    await expect(page.getByText("Your cart is empty")).toHaveCount(0);
    await expect(page.getByText("Add some items before checking out.")).toHaveCount(0);
  });
});

test.describe("checkout", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    // Reference parity: adding does NOT open the drawer — open it via the
    // header cart button (the reference's only drawer entry point), then
    // continue to checkout from the drawer.
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("the full 3-step flow places the order and confirms", async ({ page }) => {
    // Step 1: shipping — Continue stays disabled until the form is valid.
    const cont = page.getByRole("button", { name: "Continue to Payment" });
    await expect(cont).toBeDisabled();
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await expect(cont).toBeEnabled();
    await cont.click();

    // Step 2: payment — card fields gate Review Order.
    const review = page.getByRole("button", { name: "Review Order" });
    await expect(review).toBeDisabled();
    await page.getByRole("main").getByLabel("Card Number").fill("4242424242424242");
    await page.getByRole("main").getByLabel("Expiry").fill("12/28");
    await page.getByRole("main").getByLabel("CVC").fill("123");
    await expect(review).toBeEnabled();
    await review.click();

    // Step 3: review + place.
    await expect(page.getByRole("heading", { name: /Review & Place Order/ })).toBeVisible();
    await expect(page.getByText("Card ending in 4242")).toBeVisible();
    const place = page.getByRole("button", { name: /Place Order — \$299\.99/ });
    await expect(place).toBeEnabled();
    await place.click();

    // Confirmation page with the order number.
    await page.waitForURL(/\/checkout\/success\?order=/);
    await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();
    await expect(page.getByText(/ORD-\d{4}-\d+/)).toBeVisible();

    // Session-5 (CHECKOUT-BADGE-1): the header badge re-syncs from server
    // truth after the order clears the cart — the accessible name must be
    // exactly "Cart" (no ", N items") WITHOUT a manual reload. Before the
    // StoreProvider prop re-sync, the badge kept the stale count until a
    // full page load.
    await expect(page.getByRole("button", { name: "Cart", exact: true })).toBeVisible();
  });

  test("the placed order lands in the account order history", async ({ page }) => {
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("main").getByLabel("Card Number").fill("4242424242424242");
    await page.getByRole("main").getByLabel("Expiry").fill("12/28");
    await page.getByRole("main").getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: "Review Order" }).click();
    await page.getByRole("button", { name: /Place Order/ }).click();
    await page.waitForURL(/\/checkout\/success\?order=/);
    const number = (await page.url()).match(/order=([^&]+)/)?.[1] ?? "";

    await page.goto("/account");
    await page.getByRole("tab", { name: "Orders" }).click();
    const history = page.getByRole("tabpanel");
    await expect(history.getByText(number)).toBeVisible();
    // Freshly placed orders start as Processing.
    await expect(history.getByText("Processing").first()).toBeVisible();
  });

  test("PayPal skips the card fields", async ({ page }) => {
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByText("PayPal").click();
    const review = page.getByRole("button", { name: "Review Order" });
    await expect(review).toBeEnabled();
    await review.click();
    await expect(page.getByText("PayPal", { exact: true }).last()).toBeVisible();
  });

  test("the order summary aside shows line items and total", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Order Summary" })).toBeVisible();
    await expect(page.getByText("Wireless Noise-Cancelling Headphones").first()).toBeVisible();
    await expect(page.getByText("$299.99").first()).toBeVisible();
  });

  test("the shipping step carries field-purpose autoComplete tokens (session-31, CHECKOUT-AC-1)", async ({ page }) => {
    // WCAG 1.3.5 (Identify Input Purpose) + the browser-autofill contract:
    // every shipping input declares its semantic purpose so saved
    // addresses fill reliably — the high-end checkout hygiene the card
    // fields already had (cc-number/cc-exp/cc-csc).
    const main = page.getByRole("main");
    const expectAuto = async (label: string, token: string) => {
      await expect(main.getByLabel(label)).toHaveAttribute("autocomplete", token);
    };
    await expectAuto("First Name", "given-name");
    await expectAuto("Last Name", "family-name");
    await expectAuto("Email", "email");
    await expectAuto("Address", "street-address");
    await expectAuto("City", "address-level2");
    await expectAuto("State", "address-level1");
    await expectAuto("ZIP", "postal-code");
    // The card fields keep their payment-method tokens (session-15).
    const cont = page.getByRole("button", { name: "Continue to Payment" });
    await main.getByLabel("First Name").fill("John");
    await main.getByLabel("Last Name").fill("Doe");
    await main.getByLabel("Email").fill("john@example.com");
    await main.getByLabel("Address").fill("123 Main St");
    await main.getByLabel("City").fill("New York");
    await main.getByLabel("State").fill("NY");
    await main.getByLabel("ZIP").fill("10001");
    await cont.click();
    await expect(main.getByLabel("Card Number")).toHaveAttribute("autocomplete", "cc-number");
    await expect(main.getByLabel("Expiry")).toHaveAttribute("autocomplete", "cc-exp");
    await expect(main.getByLabel("CVC")).toHaveAttribute("autocomplete", "cc-csc");
  });

  // Session-33 (CUSTOMER-MONEY-1, ADR-041): the confirmation half of the
  // customer-side money-state mirror. The success page's money line handled
  // "paid" only (session-22) — a refunded order revisiting its confirmation
  // rendered NOTHING. Now both states compose ONE seam
  // (confirmationMoneyLineView): the paid wording byte-exact, the refunded
  // state carrying the customer-safe copy.
  test("a refunded order's confirmation reflects the refund (session-33, CUSTOMER-MONEY-1)", async ({ page }) => {
    // The authenticated demo user IS the fixture order's owner (john) —
    // the owner view renders the details block.
    await page.goto("/checkout/success?order=ORD-2026-004");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();
    await expect(page.getByText("ORD-2026-004")).toBeVisible();
    // The refunded money line — the customer-safe copy, no operator
    // vocabulary (the R10-2 rule).
    await expect(
      page.getByText("Payment refunded — the amount has been returned to your original payment method.", {
        exact: true,
      })
    ).toBeVisible();
    // The branch exclusivity: the PAID vocabulary must NOT render on a
    // refunded order (the pre-fix page rendered the paid line's mb rhythm
    // for every non-null state it didn't understand).
    await expect(page.getByText("Payment received", { exact: false })).toHaveCount(0);
    // The confirmation card still renders the fixture's total.
    await expect(page.getByText("$79.99").first()).toBeVisible();
    // The items snapshot renders the planter line (the owner view's details).
    await expect(page.getByText("Ceramic Planter Set").first()).toBeVisible();
  });

  // Session-35 (CHECKOUT-DEEPLINK-1, ADR-043): the owner's confirmation
  // deep-links "View Orders" to the placed order's detail page (session-34's
  // persistent read surface) — the account root defaults to the PROFILE tab,
  // two clicks away from the order the customer just placed. The href is the
  // ONLY delta: the button's text/variant/geometry are byte-identical (the
  // zero-visual-delta superset pattern). The guest token view and the
  // generic view keep /account (the guest-checkout spec pins those paths).
  test("the owner's confirmation deep-links View Orders to the placed order's detail (session-35, CHECKOUT-DEEPLINK-1)", async ({ page }) => {
    // The authenticated demo user IS the fixture order's owner (john) —
    // the owner view renders the details block + the deep-linked button.
    await page.goto("/checkout/success?order=ORD-2026-004");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();

    // The href: the placed order's detail route — the DATABASE id (a
    // cuid), never the public number.
    const viewOrders = page.getByRole("link", { name: "View Orders" });
    await expect(viewOrders).toHaveAttribute("href", /^\/account\/orders\/[a-z0-9]+$/);

    // The click lands on the order's persistent read surface.
    await viewOrders.click();
    await expect(page).toHaveURL(/\/account\/orders\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "ORD-2026-004", exact: true })).toBeVisible();
  });
});
