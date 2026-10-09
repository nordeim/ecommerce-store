import { expect, test } from "@playwright/test";
import { clearCartViaDrawer, openCartDrawer } from "./helpers";

/**
 * PAY-STRIPE-1 (session-22) — the UNCONFIGURED Stripe contract, E2E-pinned.
 *
 * The Stripe integration ships env-gated OFF by default (the repo's
 * AUTH_REQUIRE_EMAIL_VERIFICATION pattern): with no keys the checkout wizard
 * renders and behaves EXACTLY as the reference (the mock card form is the
 * parity surface; the pixel sweep + checkout.spec pin it). This spec pins the
 * unconfigured CONTRACT so the gated machinery can never leak into the
 * customer experience:
 *
 *  1. The mock wizard's parity anchors are intact (card fields, PayPal radio).
 *  2. ZERO network traffic to Stripe (no js.stripe.com, no api.stripe.com) —
 *     the client island must not even load stripe.js when unconfigured.
 *  3. The customer DOM carries no operator vocabulary (env var names, key
 *     formats, webhook secrets — the R10-2 lesson from the reference skill).
 *  4. The webhook route answers a signature-less POST with a 400 + safe copy
 *     (it exists, it is hardened, and it leaks nothing).
 */

test.describe("stripe checkout (unconfigured)", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
    await openCartDrawer(page);
    await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("the payment step renders the reference-parity mock card fields (no Payment Element)", async ({ page }) => {
    // Step 1 → 2: the wizard is a client island — hydrate before filling.
    await page.waitForLoadState("networkidle");
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    // The parity anchors: the three labeled mock card inputs + the radio pair.
    await expect(page.getByRole("main").getByLabel("Card Number")).toBeVisible();
    await expect(page.getByRole("main").getByLabel("Expiry")).toBeVisible();
    await expect(page.getByRole("main").getByLabel("CVC")).toBeVisible();
    await expect(page.getByRole("radio", { name: /Credit \/ Debit Card/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: "PayPal" })).toBeVisible();

    // No Stripe iframe may mount when unconfigured (the Payment Element lives
    // in an iframe from js.stripe.com — its absence is the contract).
    const stripeFrames = page.frames().filter((f) => f.url().includes("js.stripe.com"));
    expect(stripeFrames).toHaveLength(0);
    await expect(page.locator("iframe[src*='js.stripe.com']")).toHaveCount(0);
  });

  test("the full mock 3-step flow places the order with ZERO Stripe network traffic", async ({ page }) => {
    const stripeRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("js.stripe.com") || url.includes("api.stripe.com") || url.includes("hooks.stripe.com")) {
        stripeRequests.push(url);
      }
    });

    // The beforeEach already navigated to /checkout BEFORE this listener
    // attached — a full reload re-evaluates the client chunks so ANY eager
    // third-party script injection (the @stripe/stripe-js default-entry
    // class, caught live in the round's audit) fires under the listener.
    await page.reload({ waitUntil: "networkidle" });
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
    await expect(page.getByText("Card ending in 4242")).toBeVisible();
    await page.getByRole("button", { name: /Place Order/ }).click();

    await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible();
    // The unconfigured gate: the whole funnel (including placement) talks to
    // NO Stripe host.
    expect(stripeRequests).toEqual([]);
  });

  test("the checkout DOM carries no operator vocabulary (R10-2 customer-safe rule)", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByRole("main").getByLabel("First Name").fill("John");
    await page.getByRole("main").getByLabel("Last Name").fill("Doe");
    await page.getByRole("main").getByLabel("Email").fill("john@example.com");
    await page.getByRole("main").getByLabel("Address").fill("123 Main St");
    await page.getByRole("main").getByLabel("City").fill("New York");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP").fill("10001");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").innerText();
    for (const banned of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE", "whsec_", "sk_test", "pk_test_set-me", "payment_intent"]) {
      expect(body, `operator vocabulary leaked: ${banned}`).not.toContain(banned);
    }
  });
});

test.describe("stripe webhook route (unconfigured)", () => {
  test("a signature-less POST is rejected 400 with customer-safe copy", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", {
      data: JSON.stringify({ id: "evt_probe", type: "payment_intent.succeeded", data: { object: {} } }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const body = await res.text();
    // Safe copy: generic rejection, no internals (no key formats, no
    // signature-material echoes, no stack traces).
    expect(body).not.toMatch(/whsec_|sk_live|sk_test|STRIPE_SECRET|signature header value/i);
    expect(body.length).toBeGreaterThan(0);
  });

  test("an empty POST body is rejected 400 (never a 500)", async ({ request }) => {
    const res = await request.post("/api/stripe/webhook", { data: "" });
    expect(res.status()).toBe(400);
  });
});
