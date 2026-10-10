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

  test("a bare order number never leaks guest details to an enumerator (session-31, GUEST-TOKEN-1)", async ({ page, browser }) => {
    // THE REGRESSION: before GUEST-TOKEN-1 the success page gated on
    // `!order.userId` — every GUEST order rendered its email, items, and
    // total to ANYONE walking the sequential ORD-YYYY-NNN space. The fix
    // gates details on ownership OR an HMAC view token carried by the
    // placement redirect (?order=X&t=…).
    //
    // 1. A guest places an order and captures the tokened success URL.
    await page.goto("/product/charging-pad");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await page.getByRole("main").getByLabel("First Name").fill("Enum");
    await page.getByRole("main").getByLabel("Last Name").fill("Victim");
    await page.getByRole("main").getByLabel("Email").fill("enum-victim@example.com");
    await page.getByRole("main").getByLabel("Address").fill("42 Hidden Way");
    await page.getByRole("main").getByLabel("City").fill("Austin");
    await page.getByRole("main").getByLabel("State").fill("TX");
    await page.getByRole("main").getByLabel("ZIP").fill("73301");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("radio", { name: "PayPal" }).check();
    await page.getByRole("button", { name: "Review Order" }).click();
    await page.getByRole("button", { name: /Place Order/ }).click();
    await page.waitForURL(/\/checkout\/success\?order=.+&t=/, { timeout: 15_000 });
    const successUrl = new URL(page.url());
    const orderNumber = successUrl.searchParams.get("order") ?? "";
    const token = successUrl.searchParams.get("t") ?? "";
    expect(orderNumber).toMatch(/^ORD-\d{4}-\d+$/);
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    // The guest's own tokened URL renders the full confirmation.
    await expect(page.getByText(/Your order ORD-\d{4}-\d+ has been placed/)).toBeVisible();
    await expect(page.getByText("enum-victim@example.com")).toBeVisible();

    // 2. THE EXPLOIT: a FRESH anonymous context (no cookies, no session)
    //    visits the BARE order number — the enumeration scenario.
    const attacker = await browser.newContext();
    const ap = await attacker.newPage();
    await ap.goto(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
    // The generic confirmation — NOT the victim's details.
    await expect(ap.getByText("Your order has been placed.")).toBeVisible();
    await expect(ap.getByText("enum-victim@example.com")).toHaveCount(0);
    await expect(ap.getByText("Wireless Charging Pad")).toHaveCount(0);
    await expect(ap.getByRole("link", { name: "View Orders" })).toBeVisible();

    // 3. A signed-in NON-owner gets the generic block too (the old gate
    //    leaked guest orders to every authenticated user as well —
    //    `!order.userId` was true regardless of who was signed in).
    const ownerCtx = await browser.newContext();
    const op = await ownerCtx.newPage();
    await op.goto("/login");
    await op.waitForLoadState("networkidle");
    await op.getByLabel("Email").fill("john@example.com");
    await op.getByLabel("Password").fill("Demo1234!");
    await op.getByRole("button", { name: "Log in", exact: true }).click();
    await op.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
    await op.goto(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
    await expect(op.getByText("Your order has been placed.")).toBeVisible();
    await expect(op.getByText("enum-victim@example.com")).toHaveCount(0);
    await op.close();
    await ownerCtx.close();

    // 4. The VALID token still unlocks the details for the anonymous
    //    holder (the bookmarked-confirmation contract).
    await ap.goto(`/checkout/success?order=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(token)}`);
    await expect(ap.getByText("enum-victim@example.com")).toBeVisible();
    await ap.close();
    await attacker.close();
  });

  // Session-35 (CHECKOUT-DEEPLINK-1, ADR-043): the deep-link is the
  // OWNER's affordance ONLY. The guest's two confirmation paths keep the
  // generic /account href — a guest order's detail route renders the
  // not-found block for everyone but the token (the GUEST-TOKEN-1
  // discipline), so a deep-linked button would land the guest on "Order
  // not found". The pinned behavior holds: the button gates the anonymous
  // buyer to the login screen (session-6 REDIRECT-1, the first test).
  test("the non-owner confirmation paths keep the generic View Orders href (session-35, CHECKOUT-DEEPLINK-1)", async ({ page, browser }) => {
    // 1. A guest places an order — the placement redirect carries the
    //    tokened success URL (the token view).
    await page.goto("/product/charging-pad");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    // The hydration gate (the first test's documented pattern): the wizard
    // is a client island — values typed pre-hydration get wiped by React's
    // adoption of the server DOM (the round-35 RED run caught this race in
    // this very test: Address/ZIP filled during hydration rendered empty).
    await expect(page.getByRole("main").getByLabel("First Name")).toHaveValue("");
    await page.getByRole("main").getByLabel("First Name").fill("Href");
    await page.getByRole("main").getByLabel("Last Name").fill("Probe");
    await page.getByRole("main").getByLabel("Email").fill("href-probe@example.com");
    await page.getByRole("main").getByLabel("Address").fill("12 Generic Ln");
    await page.getByRole("main").getByLabel("City").fill("Austin");
    await page.getByRole("main").getByLabel("State").fill("TX");
    await page.getByRole("main").getByLabel("ZIP").fill("73301");
    // The fill-stuck verification (cheap insurance against the late-
    // hydration wipe — a wiped field fails HERE with a clear signal
    // instead of a 45s radio timeout downstream).
    await expect(page.getByRole("main").getByLabel("Address")).toHaveValue("12 Generic Ln");
    await expect(page.getByRole("main").getByLabel("ZIP")).toHaveValue("73301");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("radio", { name: "PayPal" }).check();
    await page.getByRole("button", { name: "Review Order" }).click();
    await page.getByRole("button", { name: /Place Order/ }).click();
    await page.waitForURL(/\/checkout\/success\?order=.+&t=/, { timeout: 15_000 });
    const orderNumber = new URL(page.url()).searchParams.get("order") ?? "";
    expect(orderNumber).toMatch(/^ORD-\d{4}-\d+$/);

    // 2. The token view (the guest's own placement confirmation — the
    //    details render, the token unlocks them): "View Orders" stays the
    //    generic /account link, NOT the deep-linked detail.
    await expect(page.getByText(/Your order ORD-\d{4}-\d+ has been placed/)).toBeVisible();
    await expect(page.getByRole("link", { name: "View Orders" })).toHaveAttribute("href", "/account");

    // 3. The generic view (a fresh anonymous context, the bare number):
    //    the same generic href.
    const anon = await browser.newContext();
    const ap = await anon.newPage();
    await ap.goto(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
    await expect(ap.getByText("Your order has been placed.")).toBeVisible();
    await expect(ap.getByRole("link", { name: "View Orders" })).toHaveAttribute("href", "/account");
    await ap.close();
    await anon.close();
  });
});
