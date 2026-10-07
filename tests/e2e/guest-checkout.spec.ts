import { expect, test } from "@playwright/test";

// Guest checkout (session-6, GUEST-CHECKOUT-COV): every checkout spec ran
// authenticated under the shared storageState — the cookie-cart → order
// seam had no end-to-end coverage since the session-4 guest-cart bug (which
// hid for three rounds behind authenticated-only specs). This spec opts out
// of storageState and drives the FULL guest funnel: PDP add → 3-step
// wizard → placed order → success page → gated "View Orders".

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("guest checkout (session-6)", () => {
  test("a guest checks out from a cookie cart end-to-end", async ({ page }) => {
    // 1. Guest adds from the PDP — the badge bumps (no drawer auto-open).
    await page.goto("/product/charging-pad");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();

    // 2. The checkout renders for the anonymous visitor with NO prefill
    //    (no session user — every field starts empty). Wait for hydration
    //    before filling: the wizard is a client island, and values typed
    //    pre-hydration get wiped by React's adoption of the server DOM.
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.getByRole("main").getByLabel("First Name")).toHaveValue("");

    // 3. Fill the wizard — PayPal needs no card fields.
    await page.getByRole("main").getByLabel("First Name").fill("Guest");
    await page.getByRole("main").getByLabel("Last Name").fill("Shopper");
    await page.getByRole("main").getByLabel("Email").fill("guest-e2e@example.com");
    await page.getByRole("main").getByLabel("Address").fill("789 Pine Rd");
    await page.getByRole("main").getByLabel("City").fill("Austin");
    await page.getByRole("main").getByLabel("State").fill("TX");
    await page.getByRole("main").getByLabel("ZIP").fill("73301");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("radio", { name: "PayPal" }).check();
    await page.getByRole("button", { name: "Review Order" }).click();
    await page.getByRole("button", { name: /Place Order — \$49\.98/ }).click();

    // 4. Success — order number + line + total, badge cleared.
    await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();
    await expect(page.getByText(/Your order ORD-\d{4}-\d+ has been placed/)).toBeVisible();
    await expect(page.getByText("guest-e2e@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cart", exact: true })).toBeVisible();

    // 5. "View Orders" gates the anonymous buyer to the login screen —
    //    carrying the intent (session-6 REDIRECT-1).
    await page.getByRole("link", { name: "View Orders" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
