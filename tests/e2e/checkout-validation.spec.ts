import { expect, test } from "@playwright/test";
import { clearCartViaDrawer, openCartDrawer } from "./helpers";

// Checkout validation paths + the edit-back navigation (session-44,
// CHECKOUT-VALIDATION-1 — the customer-surfaces pin-density sweep's second
// installment, session-85's standing "natural next").
//
// THE REFERENCE RELATIONSHIP (measured live 2026-10-11,
// scripts/checkout-validation-probe-r44[e/f].mjs — the drawer path: PDP add
// → the ICON-ONLY header cart button → the drawer's Checkout link): the
// reference's step-1 "Continue to Payment" is NEVER disabled (resting, every
// invalid state — the Base44 mock has NO gate), its card input does NO
// formatting (raw digits stay raw; "1228" stays "1228"), its step-2 → Back
// → step-1 RESETS the form (fields render empty), and its step-3 carries NO
// shipping/payment summary cards and NO Edit affordances (Back + Place
// Order only). Every pin below is therefore a SUPERSET pin — the clone's
// own contract, zero parity risk by construction.
//
// Probe lesson (v4's misfire, VLM-diagnosed): the reference's header cart
// button is ICON-ONLY (its accessible name is the badge count) — a /cart/i
// role-name regex matches the PDP's "Add to Cart" instead. The clone's
// cart button carries "Cart, N items" (pinned since session-5); the
// helper's shopping-bag filter is the portable form.
//
// The island keeps ONE React state across the steps (shipping + payment
// objects; the `step` machine never remounts the section contents), which
// is what P7–P9 pin: the values survive every back/edit transition.

test.describe("checkout validation paths (session-44, CHECKOUT-VALIDATION-1)", () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaDrawer(page);
    await page.goto("/product/wireless-headphones");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();
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

  test("P1 — the step-1 email gate blocks an invalid email until fixed", async ({ page }) => {
    const main = page.getByRole("main");
    const cont = page.getByRole("button", { name: "Continue to Payment" });
    await expect(cont).toBeDisabled();

    // Everything valid EXCEPT the email (no TLD).
    await fillAddress(page);
    await main.getByLabel("Email").fill("ada@example");
    await expect(cont).toBeDisabled();

    // The recovery: fix the email → the gate opens.
    await main.getByLabel("Email").fill("ada@example.com");
    await expect(cont).toBeEnabled();
  });

  test("P2 — the step-1 ZIP gate blocks non-5-digit ZIPs until fixed", async ({ page }) => {
    const main = page.getByRole("main");
    const cont = page.getByRole("button", { name: "Continue to Payment" });
    await expect(cont).toBeDisabled();

    // Letters — not the ^\d{5}(-\d{4})?$ shape.
    await fillAddress(page, { ZIP: "abcde" });
    await expect(cont).toBeDisabled();

    // Four digits — still not the shape.
    await fillAddress(page, { ZIP: "1000" });
    await expect(cont).toBeDisabled();

    // The recovery.
    await fillAddress(page, { ZIP: "10001" });
    await expect(cont).toBeEnabled();

    // The ZIP+4 extension stays valid (the full regex shape).
    await fillAddress(page, { ZIP: "10001-1234" });
    await expect(cont).toBeEnabled();
  });

  test("P3 — the step-1 length floors block short address/city/state until fixed", async ({ page }) => {
    const main = page.getByRole("main");
    const cont = page.getByRole("button", { name: "Continue to Payment" });
    await expect(cont).toBeDisabled();

    // Address floor: >= 3 chars.
    await fillAddress(page, { Address: "12" });
    await expect(cont).toBeDisabled();
    await fillAddress(page, { Address: "123 Main St" });
    await expect(cont).toBeEnabled();

    // City floor: >= 2 chars.
    await fillAddress(page, { City: "N" });
    await expect(cont).toBeDisabled();
    await fillAddress(page, { City: "New York" });
    await expect(cont).toBeEnabled();

    // State floor: >= 2 chars.
    await fillAddress(page, { State: "N" });
    await expect(cont).toBeDisabled();
    await fillAddress(page, { State: "NY" });
    await expect(cont).toBeEnabled();
  });

  test("P4 — the card formatter groups digits as the customer types", async ({ page }) => {
    const main = page.getByRole("main");
    await fillAddress(page);
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    // Type the card number RAW — the island formats per keystroke into
    // 4-digit groups (the reference does no formatting at all).
    const card = main.getByLabel("Card Number");
    await card.pressSequentially("4242424242424242", { delay: 15 });
    await expect(card).toHaveValue("4242 4242 4242 4242");
  });

  test("P5 — the expiry formatter inserts the slash", async ({ page }) => {
    const main = page.getByRole("main");
    await fillAddress(page);
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    // Type the expiry RAW — the island inserts the slash after the month.
    const exp = main.getByLabel("Expiry");
    await exp.pressSequentially("1228", { delay: 15 });
    await expect(exp).toHaveValue("12/28");
  });

  test("P6 — the card gate blocks an under-length card until complete", async ({ page }) => {
    const main = page.getByRole("main");
    await fillAddress(page);
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    const review = page.getByRole("button", { name: "Review Order" });
    await expect(review).toBeDisabled();

    // A 12-digit card is under the 13-digit floor — expiry + CVC alone
    // cannot open the gate.
    await main.getByLabel("Card Number").fill("424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await main.getByLabel("CVC").fill("123");
    await expect(review).toBeDisabled();

    // The full 16-digit card opens it (the formatted value groups itself).
    await main.getByLabel("Card Number").fill("4242424242424242");
    await expect(review).toBeEnabled();
  });

  test("P7 — step 2 → Back preserves the shipping values (and the card survives the round trip)", async ({ page }) => {
    const main = page.getByRole("main");
    await fillAddress(page);
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    // Fill the card, then go back.
    await main.getByLabel("Card Number").fill("4242424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await main.getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: "Back" }).click();

    // Step 1 renders with every shipping value INTACT (the reference
    // resets the form on back — measured live).
    await expect(main.getByLabel("Address")).toHaveValue("123 Main St");
    await expect(main.getByLabel("City")).toHaveValue("New York");
    await expect(main.getByLabel("State")).toHaveValue("NY");
    await expect(main.getByLabel("ZIP")).toHaveValue("10001");
    await expect(main.getByLabel("Email")).toHaveValue("john@example.com");

    // Forward again — the card survived the round trip too.
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await expect(main.getByLabel("Card Number")).toHaveValue("4242 4242 4242 4242");
    await expect(main.getByLabel("Expiry")).toHaveValue("12/28");
    await expect(main.getByLabel("CVC")).toHaveValue("123");
  });

  test("P8 — the step-3 review carries the Shipping card + Edit; the edit loop closes", async ({ page }) => {
    const main = page.getByRole("main");
    await fillAddress(page);
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await main.getByLabel("Card Number").fill("4242424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await main.getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: "Review Order" }).click();

    // The review's Shipping Address card — a superset surface (the
    // reference's step 3 has no summary cards at all).
    await expect(page.getByRole("heading", { name: "Review & Place Order" })).toBeVisible();
    const shipCard = page.locator("div.rounded-xl", { hasText: "Shipping Address" }).first();
    await expect(shipCard.getByText("123 Main St")).toBeVisible();
    await expect(shipCard.getByText("New York, NY 10001")).toBeVisible();

    // Edit → step 1 with the values preserved.
    await shipCard.getByRole("button", { name: "Edit" }).click();
    await expect(main.getByLabel("Address")).toHaveValue("123 Main St");
    await expect(main.getByLabel("City")).toHaveValue("New York");

    // Change the city, walk forward, and the EDITED value reaches the
    // review — the edit loop closes.
    await main.getByLabel("City").fill("Boston");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("button", { name: "Review Order" }).click();
    const shipCard2 = page.locator("div.rounded-xl", { hasText: "Shipping Address" }).first();
    await expect(shipCard2.getByText("Boston, NY 10001")).toBeVisible();
  });

  test("P9 — the step-3 Edit (Payment) preserves the card; the full round trip holds", async ({ page }) => {
    const main = page.getByRole("main");
    await fillAddress(page);
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await main.getByLabel("Card Number").fill("4242424242424242");
    await main.getByLabel("Expiry").fill("12/28");
    await main.getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: "Review Order" }).click();

    // The Payment card's Edit → step 2 with the card intact.
    const payCard = page.locator("div.rounded-xl", { hasText: "Payment" }).first();
    await expect(payCard.getByText("Card ending in 4242")).toBeVisible();
    await payCard.getByRole("button", { name: "Edit" }).click();
    await expect(main.getByLabel("Card Number")).toHaveValue("4242 4242 4242 4242");
    await expect(main.getByLabel("Expiry")).toHaveValue("12/28");
    await expect(main.getByLabel("CVC")).toHaveValue("123");

    // Step 2 → Back → step 1: the three-way round trip preserves the
    // shipping values through every transition.
    await page.getByRole("button", { name: "Back" }).click();
    await expect(main.getByLabel("Address")).toHaveValue("123 Main St");
    await expect(main.getByLabel("City")).toHaveValue("New York");
  });
});
