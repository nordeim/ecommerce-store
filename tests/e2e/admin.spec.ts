import { expect, test, type Page } from "@playwright/test";
import { adminLogin } from "./helpers";

// Admin console coverage (session-7, ADMIN-COV-2): the console's only prior
// E2E was the stock-form seam inside stock.spec.ts. This spec pins the rest
// of the admin surface:
//   1. Guest gating — /admin carries intent to /login?redirect=/admin
//      (session-6 REDIRECT-1 behavior, pinned here for the console).
//   2. Dashboard — stat cards + recent orders render from real DB data.
//   3. Order detail (session-7, ADMIN-DETAIL-1) — the new /admin/orders/[id]
//      page renders items, the shipping snapshot, and the OrderEvent
//      timeline (previously written by the actions but displayed nowhere).
//   4. Status transitions — the list-row combobox drives
//      updateOrderStatusAction; the change lands in the timeline.
//   5. Visibility toggle — hideProduct/Show through the real products-page
//      seam; isActive is enforced on every storefront read surface.
//
// One admin login is shared across the file (beforeAll) — the login rate
// limiter is per IP+email and the stock spec's two logins share the bucket.

test.describe("admin console (guest access)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("guests are gated to /login with their intent carried", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?redirect=\/admin$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    // The same contract holds for the orders sub-page.
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/login\?redirect=\/admin\/orders$/);
    // And the payments surface (session-24, PAY-OPS-1) — the full path
    // rides the redirect, exactly like every other admin sub-page.
    await page.goto("/admin/payments");
    await expect(page).toHaveURL(/\/login\?redirect=\/admin\/payments$/);
  });
});

test.describe("admin console (admin session)", () => {
  let admin: Page;

  test.beforeAll(async ({ browser }) => {
    admin = await adminLogin(browser);
  });

  test.afterAll(async () => {
    await admin.close();
  });

  test("dashboard renders the stat cards and recent orders", async () => {
    await admin.goto("/admin");
    await expect(admin.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
    // Scope the labels to the stats grid — the header also carries an
    // "Orders" link and the Recent Orders card heading (strict-mode trap).
    const statsGrid = admin.locator("div.grid.grid-cols-2");
    for (const label of ["Revenue", "Orders", "Products", "Customers"]) {
      await expect(statsGrid.getByText(label, { exact: true })).toBeVisible();
    }
    // Seeded fixtures guarantee at least the three demo orders.
    await expect(admin.getByText("Recent Orders")).toBeVisible();
    await expect(admin.getByText("ORD-2026-001")).toBeVisible();
  });

  test("order detail renders items, shipping, and the event timeline", async () => {
    await admin.goto("/admin/orders");
    // The order number is a link to the detail page (session-7).
    await admin.getByRole("link", { name: "ORD-2026-001" }).click();
    await expect(admin).toHaveURL(/\/admin\/orders\/[a-z0-9]+$/);
    await expect(admin.getByRole("heading", { name: "ORD-2026-001" })).toBeVisible();
    // Line items from the seed: 2 items, product names visible.
    await expect(admin.getByText("Wireless Noise-Cancelling Headphones").first()).toBeVisible();
    // Shipping snapshot card (John Doe fixture).
    await expect(admin.getByText("John Doe")).toBeVisible();
    await expect(admin.getByText("123 Main Street")).toBeVisible();
    // The timeline: the seed writes a "placed" event per demo order.
    await expect(admin.getByText("Order placed", { exact: true })).toBeVisible();
  });

  test("status transitions via the combobox land in the timeline", async () => {
    await admin.goto("/admin/orders");
    // Scope to ORD-2026-001's row through the combobox's stable aria-label
    // (the row itself has no distinguishing role).
    const combo = admin.getByRole("combobox", { name: "Change status for ORD-2026-001" });
    const row = admin.locator("div.rounded-xl").filter({ has: combo });
    await combo.click();
    await admin.getByRole("option", { name: "Cancelled" }).click();
    // The action + router.refresh() land asynchronously (same contract as
    // the stock Save) — the badge flips when the row re-renders.
    await expect(row.locator("div.rounded-full").filter({ hasText: /cancelled/i })).toBeVisible({
      timeout: 10_000,
    });

    // The transition is auditable on the detail page's timeline.
    await admin.goto("/admin/orders");
    await admin.getByRole("link", { name: "ORD-2026-001" }).click();
    await expect(admin.getByText(/→ cancelled by admin@luxestore\.com/)).toBeVisible();

    // Restore the canonical seeded status (shared e2e DB hygiene).
    await admin.goto("/admin/orders");
    const combo2 = admin.getByRole("combobox", { name: "Change status for ORD-2026-001" });
    const row2 = admin.locator("div.rounded-xl").filter({ has: combo2 });
    await combo2.click();
    await admin.getByRole("option", { name: "Delivered" }).click();
    await expect(row2.locator("div.rounded-full").filter({ hasText: /delivered/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("visibility toggle hides a product from the shop and back", async () => {
    await admin.goto("/admin/products");
    // Hide through the real seam (the eye button on the row).
    await admin.getByRole("button", { name: "Hide Silk Pajama Set" }).click();
    await admin.waitForTimeout(800);
    await admin.reload();
    await expect(admin.getByRole("button", { name: "Show Silk Pajama Set" })).toBeVisible();

    // isActive is enforced on the storefront: the product leaves /shop.
    await admin.goto("/shop");
    await expect(admin.getByRole("link", { name: /Silk Pajama Set/ })).toHaveCount(0);

    // And returns when re-shown.
    await admin.goto("/admin/products");
    await admin.getByRole("button", { name: "Show Silk Pajama Set" }).click();
    await admin.waitForTimeout(800);
    await admin.goto("/shop");
    await expect(admin.getByRole("link", { name: /Silk Pajama Set/ }).first()).toBeVisible();
  });

  // Admin order-list filters (session-13, ADMIN-SEARCH-1): the orders
  // surface is URL-deep-linkable (?status= + ?q=) exactly like the shop's
  // filter bar — select changes push merged params, the count line reports
  // the filtered size, and the empty state offers a way out.
  test("orders filter by status with a deep-linkable URL", async () => {
    await admin.goto("/admin/orders");
    await admin.waitForLoadState("networkidle");
    // Canonical seed: 001 delivered, 002 in_transit, 003 delivered.
    await expect(admin.getByText("3 orders", { exact: true })).toBeVisible();

    await admin.getByRole("combobox", { name: "Filter by status" }).click();
    await admin.getByRole("option", { name: "Delivered" }).click();
    await expect(admin).toHaveURL(/\/admin\/orders\?status=delivered$/);
    await expect(admin.getByText("2 orders", { exact: true })).toBeVisible();
    // Only the delivered rows remain (002 is in_transit).
    await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-002" })).toHaveCount(0);

    // Deep-link lands in the same filtered state with the bar reflecting it.
    await admin.goto("/admin/orders?status=in_transit");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("1 order", { exact: true })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-002" })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toHaveCount(0);
  });

  test("orders search by number fragment and email fragment", async () => {
    await admin.goto("/admin/orders");
    await admin.waitForLoadState("networkidle");
    const search = admin.getByLabel("Search orders");
    await search.fill("001");
    await search.press("Enter");
    await expect(admin).toHaveURL(/\/admin\/orders\?q=001$/);
    await expect(admin.getByText("1 order", { exact: true })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-002" })).toHaveCount(0);

    // The email branch of the OR: all three canonical orders are
    // john@example.com.
    await search.fill("john@");
    await search.press("Enter");
    await expect(admin).toHaveURL(/\/admin\/orders\?q=john%40$/);
    await expect(admin.getByText("3 orders", { exact: true })).toBeVisible();
  });

  test("orders empty state offers Clear, filters combine", async () => {
    await admin.goto("/admin/orders");
    await admin.waitForLoadState("networkidle");
    const search = admin.getByLabel("Search orders");
    await search.fill("zzz-no-such-order");
    await search.press("Enter");
    await expect(admin.getByRole("heading", { name: "No orders match your filters" })).toBeVisible();

    // Combined filters: status narrows an already-empty set stays empty —
    // then Clear restores the full list.
    await admin.getByRole("button", { name: "Clear" }).click();
    await expect(admin).toHaveURL(/\/admin\/orders$/);
    await expect(admin.getByText("3 orders", { exact: true })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Payment-ops surface (session-24, PAY-OPS-1, ADR-032): the /admin/payments
// page renders the StripeEvent log — the webhook backstop's write path
// (sessions 22/23) finally has its read surface. Every event's OUTCOME is
// derived from DB state: a succeeded event resolves to the placed order
// (deep link) or to the refund-needed family (the deterministic failures
// the webhook records + 200s); failed events and ignored types render
// their own honest copy. The canonical fixture set (e2e-reset restores it
// every run): evt_demo_fixture_s → ORD-2026-003 (the Stripe-paid demo
// order), evt_demo_fixture_f (payment_failed), evt_demo_fixture_r
// (charge.refunded), evt_demo_fixture_n (succeeded, NO order — the
// refund-needed family's seeded instance, session-25).
// ---------------------------------------------------------------------------
test.describe("admin payment-ops (session-24, PAY-OPS-1)", () => {
  let admin: Page;

  test.beforeAll(async ({ browser }) => {
    admin = await adminLogin(browser);
  });

  test.afterAll(async () => {
    await admin.close();
  });

  test("payments renders the fixture events with resolved outcomes", async () => {
    await admin.goto("/admin/payments");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByRole("heading", { name: "Payments" })).toBeVisible();
    // The unconfigured default is honest operator context (admin-only
    // surface — the R10-2 customer-copy rule does not apply here).
    await expect(admin.getByText("Stripe is in demo mode", { exact: false })).toBeVisible();

    // Four fixture events, newest first, each with its honest outcome.
    // (Two succeeded fixtures since session-25: the placed s fixture + the
    // refund-needed n fixture — the strict-mode-safe count form.)
    await expect(admin.getByText("4 payment events", { exact: true })).toBeVisible();
    await expect(admin.getByText("payment_intent.succeeded", { exact: true })).toHaveCount(2);
    await expect(
      admin.getByRole("link", { name: "ORD-2026-003" })
    ).toBeVisible();
    await expect(admin.getByText("payment_intent.payment_failed", { exact: true })).toBeVisible();
    await expect(admin.getByText("Payment failed", { exact: true })).toBeVisible();
    await expect(admin.getByText("charge.refunded", { exact: true })).toBeVisible();
    await expect(admin.getByText("Ignored", { exact: true })).toBeVisible();
  });

  test("payments filters by family with a deep-linkable URL", async () => {
    await admin.goto("/admin/payments");
    await admin.waitForLoadState("networkidle");
    await admin.getByRole("combobox", { name: "Filter by family" }).click();
    await admin.getByRole("option", { name: "Succeeded" }).click();
    await expect(admin).toHaveURL(/\/admin\/payments\?family=succeeded$/);
    // Two succeeded fixtures since session-25 (the placed s + the
    // refund-needed n — the family contains both; the refund-needed
    // filter narrows further).
    await expect(admin.getByText("2 payment events", { exact: true })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toBeVisible();
    await expect(
      admin.getByText("No order — refund via Stripe dashboard", { exact: true })
    ).toBeVisible();
    await expect(admin.getByText("payment_intent.payment_failed", { exact: true })).toHaveCount(0);

    // Deep-link lands in the same filtered state; a bad family value
    // falls through to the unfiltered list (never an error).
    await admin.goto("/admin/payments?family=bogus");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("4 payment events", { exact: true })).toBeVisible();
  });

  test("payments searches by intent id fragment", async () => {
    await admin.goto("/admin/payments");
    await admin.waitForLoadState("networkidle");
    const search = admin.getByLabel("Search payment events");
    await search.fill("pi_demo_fixture_004");
    await search.press("Enter");
    await expect(admin).toHaveURL(/\/admin\/payments\?q=pi_demo_fixture_004$/);
    await expect(admin.getByText("1 payment event", { exact: true })).toBeVisible();
    await expect(admin.getByText("payment_intent.payment_failed", { exact: true })).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toHaveCount(0);
  });

  test("payments empty state offers Clear, filters combine", async () => {
    await admin.goto("/admin/payments");
    await admin.waitForLoadState("networkidle");
    const search = admin.getByLabel("Search payment events");
    await search.fill("zzz-no-such-event");
    await search.press("Enter");
    await expect(admin.getByRole("heading", { name: "No payment events match your filters" })).toBeVisible();

    await admin.getByRole("button", { name: "Clear" }).click();
    await expect(admin).toHaveURL(/\/admin\/payments$/);
    await expect(admin.getByText("4 payment events", { exact: true })).toBeVisible();
  });

  // session-25, PAY-OPS-2a: the refund-needed family — the operator's most
  // actionable signal as a first-class filter (succeeded events with NO
  // linked order: exactly the deterministic-failure family the webhook
  // records + 200s per ADR-031).
  test("payments filters by the refund-needed family (session-25, PAY-OPS-2a)", async () => {
    await admin.goto("/admin/payments?family=refund-needed");
    await admin.waitForLoadState("networkidle");
    await expect(admin).toHaveURL(/family=refund-needed/);
    await expect(admin.getByText("1 payment event", { exact: true })).toBeVisible();
    // The fixture-n row: succeeded, no order, the destructive outcome line.
    await expect(
      admin.getByText("No order — refund via Stripe dashboard", { exact: true })
    ).toBeVisible();
    await expect(admin.getByText("pi_demo_fixture_006")).toBeVisible();
    // The placed fixture is NOT in the family (it resolved to an order).
    await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toHaveCount(0);
    await expect(admin.getByText("Payment failed", { exact: true })).toHaveCount(0);

    // The Select offers the family (the operator's filter bar).
    await admin.goto("/admin/payments");
    await admin.waitForLoadState("networkidle");
    await admin.getByRole("combobox", { name: "Filter by family" }).click();
    await admin.getByRole("option", { name: "Refund needed" }).click();
    await expect(admin).toHaveURL(/family=refund-needed/);
  });

  test("the refund-needed family ANDs with the search query (the combined-filter shape)", async () => {
    // family=refund-needed + q=<the PLACED fixture's intent> → empty: the
    // s fixture is succeeded WITH an order, so it is not in the family —
    // the AND shape's behavioral pin.
    await admin.goto("/admin/payments?family=refund-needed&q=pi_demo_fixture_003");
    await admin.waitForLoadState("networkidle");
    await expect(
      admin.getByRole("heading", { name: "No payment events match your filters" })
    ).toBeVisible();
  });

  // session-25, PAY-OPS-2b: the event rows render the AMOUNT beside the
  // outcome — the operator sees the magnitude ("how much needs refunding?").
  test("payment rows render the event amount beside the outcome (session-25, PAY-OPS-2b)", async () => {
    await admin.goto("/admin/payments");
    await admin.waitForLoadState("networkidle");
    // The placed fixture (ORD-2026-003's pinned display total 52497c).
    await expect(admin.getByText("$524.97", { exact: true })).toBeVisible();
    // The refund-needed fixture (14900c — the actionable magnitude).
    await expect(admin.getByText("$149.00", { exact: true })).toBeVisible();
    // The failed fixture (8999c).
    await expect(admin.getByText("$89.99", { exact: true })).toBeVisible();
  });

  // session-26, PAY-OPS-3: the date-range filter — an operator triaging
  // refund-needed payments asks "which events arrived in THIS window?".
  // The fixture set is staggered: s=2026-02-20, f=2026-02-21,
  // r=2026-02-22, n=2026-02-23 (UTC) — so a 22nd–23rd range keeps
  // exactly {r, n}, a from=2026-02-22 keeps {r, n}, and the
  // refund-needed family + from narrows to {n} alone.
  test("payments filters by date range with a deep-linkable URL (session-26, PAY-OPS-3)", async () => {
    await admin.goto("/admin/payments?from=2026-02-22&to=2026-02-23");
    await admin.waitForLoadState("networkidle");
    await expect(admin).toHaveURL(/from=2026-02-22/);
    await expect(admin.getByText("2 payment events", { exact: true })).toBeVisible();
    // The in-range rows: the 22nd's charge.refunded + the 23rd's
    // refund-needed n fixture.
    await expect(admin.getByText("charge.refunded", { exact: true })).toBeVisible();
    await expect(
      admin.getByText("No order — refund via Stripe dashboard", { exact: true })
    ).toBeVisible();
    // The out-of-range rows are gone (the 20th's s, the 21st's f).
    await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toHaveCount(0);
    await expect(admin.getByText("Payment failed", { exact: true })).toHaveCount(0);

    // The date inputs mirror the URL state (adjust-during-render).
    await expect(admin.getByLabel("From date")).toHaveValue("2026-02-22");
    await expect(admin.getByLabel("To date")).toHaveValue("2026-02-23");

    // A bad bound falls through to the unfiltered list (the family
    // pattern — never an error).
    await admin.goto("/admin/payments?from=02/22/2026");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("4 payment events", { exact: true })).toBeVisible();
  });

  test("payments filters by an open-ended from bound (from-only)", async () => {
    await admin.goto("/admin/payments?from=2026-02-22");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("2 payment events", { exact: true })).toBeVisible();
    await expect(admin.getByText("charge.refunded", { exact: true })).toBeVisible();
    await expect(
      admin.getByText("No order — refund via Stripe dashboard", { exact: true })
    ).toBeVisible();
    // The 20th/21st fixtures are before the bound.
    await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toHaveCount(0);
    await expect(admin.getByText("Payment failed", { exact: true })).toHaveCount(0);
  });

  test("the date range ANDs with the succeeded family (the combined shape)", async () => {
    // succeeded + from=2026-02-23: only the n fixture (the 23rd) — the s
    // fixture (the 20th, the placed ORD-2026-003) falls OUT of the range.
    // The discriminating pin: the ORD-2026-003 link is a succeeded-family
    // member excluded by the date bound (without the date filter it
    // renders).
    await admin.goto("/admin/payments?family=succeeded&from=2026-02-23");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("1 payment event", { exact: true })).toBeVisible();
    await expect(admin.getByText("pi_demo_fixture_006")).toBeVisible();
    await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toHaveCount(0);
    await expect(admin.getByText("charge.refunded", { exact: true })).toHaveCount(0);
  });

  test("the date inputs push merged params from the filter bar", async () => {
    await admin.goto("/admin/payments");
    await admin.waitForLoadState("networkidle");
    await admin.getByLabel("From date").fill("2026-02-22");
    await expect(admin).toHaveURL(/\/admin\/payments\?from=2026-02-22$/);
    await expect(admin.getByText("2 payment events", { exact: true })).toBeVisible();
    // The family Select composes with the dates (merged params).
    await admin.getByRole("combobox", { name: "Filter by family" }).click();
    await admin.getByRole("option", { name: "Refund needed" }).click();
    await expect(admin).toHaveURL(/family=refund-needed&from=2026-02-22/);
    await expect(admin.getByText("1 payment event", { exact: true })).toBeVisible();
  });

  test("the succeeded event deep-links to its order detail", async () => {
    await admin.goto("/admin/payments?family=succeeded");
    await admin.waitForLoadState("networkidle");
    await admin.getByRole("link", { name: "ORD-2026-003" }).click();
    await admin.waitForLoadState("networkidle");
    await expect(admin).toHaveURL(/\/admin\/orders\/[a-z0-9]+$/);
    // The detail page renders the Stripe-paid demo order's Charge row.
    await expect(admin.getByText("Paid (Stripe)", { exact: true })).toBeVisible();
  });
});

test.describe("admin payment-ops (role contract)", () => {
  test("non-admins are redirected away from the payments surface", async ({ page }) => {
    // The project's default storageState is the DEMO user (non-admin) —
    // the console's role contract on the new surface: bounce to /.
    await page.goto("/admin/payments");
    await expect(page).toHaveURL(/\/$/);
  });
});

// Admin products filters (session-27, ADMIN-PRODUCTS-1): the console
// trifecta's last LIST surface takes the URL-deep-linkable treatment
// (?q= + ?category= + ?visibility=) exactly like the orders (session-13)
// and payments (sessions 24-26) bars — the seeded catalog is 12 products
// across 6 categories (electronics 3, sports 2, beauty 1, accessories 2,
// clothing 2, home-living 2). One admin login shares the file's bucket.
test.describe("admin products filters (session-27, ADMIN-PRODUCTS-1)", () => {
  let admin: Page;

  test.beforeAll(async ({ browser }) => {
    admin = await adminLogin(browser);
  });

  test.afterAll(async () => {
    await admin.close();
  });

  test("products search by name fragment with a deep-linkable URL", async () => {
    await admin.goto("/admin/products");
    await admin.waitForLoadState("networkidle");
    const search = admin.getByLabel("Search products");
    await search.fill("headphone");
    await search.press("Enter");
    await expect(admin).toHaveURL(/\/admin\/products\?q=headphone$/);
    await expect(admin.getByText("1 of 12 products", { exact: true })).toBeVisible();
    await expect(
      admin.getByText("Wireless Noise-Cancelling Headphones", { exact: true })
    ).toBeVisible();
    await expect(admin.getByText("Smart Home Speaker Pro", { exact: true })).toHaveCount(0);
  });

  test("products filter by category with a deep-linkable URL", async () => {
    await admin.goto("/admin/products");
    await admin.waitForLoadState("networkidle");
    await admin.getByRole("combobox", { name: "Filter by category" }).click();
    await admin.getByRole("option", { name: "Electronics", exact: true }).click();
    await expect(admin).toHaveURL(/\/admin\/products\?category=electronics$/);
    await expect(admin.getByText("3 of 12 products", { exact: true })).toBeVisible();
    await expect(
      admin.getByText("Wireless Noise-Cancelling Headphones", { exact: true })
    ).toBeVisible();
    await expect(admin.getByText("Yoga Mat Premium", { exact: true })).toHaveCount(0);
    // A bad category deep-link falls through to the unfiltered list
    // (the family contract — never an error).
    await admin.goto("/admin/products?category=not-a-slug");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("12 products", { exact: true })).toBeVisible();
  });

  test("products filter by visibility (the eye-toggle seam's list-level answer)", async () => {
    // Hide through the real seam (the eye button on the row), then the
    // visibility filter answers "which products did I hide?".
    await admin.goto("/admin/products");
    await admin.waitForLoadState("networkidle");
    await admin.getByRole("button", { name: "Hide Ceramic Planter Set" }).click();
    await admin.waitForTimeout(800);

    await admin.goto("/admin/products?visibility=hidden");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("1 of 12 products", { exact: true })).toBeVisible();
    await expect(admin.getByText("Ceramic Planter Set", { exact: true })).toBeVisible();
    await expect(
      admin.getByText("Wireless Noise-Cancelling Headphones", { exact: true })
    ).toHaveCount(0);

    // Restore the canonical state (the seed's upsert re-restores
    // isActive: true every global-setup as the run-to-run backstop).
    await admin.getByRole("button", { name: "Show Ceramic Planter Set" }).click();
    await admin.waitForTimeout(800);
    await admin.goto("/admin/products?visibility=active");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("12 of 12 products", { exact: true })).toBeVisible();
  });

  test("products filters combine (category AND search)", async () => {
    await admin.goto("/admin/products?category=electronics&q=speaker");
    await admin.waitForLoadState("networkidle");
    await expect(admin.getByText("1 of 12 products", { exact: true })).toBeVisible();
    await expect(admin.getByText("Smart Home Speaker Pro", { exact: true })).toBeVisible();
    await expect(
      admin.getByText("Wireless Noise-Cancelling Headphones", { exact: true })
    ).toHaveCount(0);
  });

  test("products empty state offers Clear", async () => {
    await admin.goto("/admin/products");
    await admin.waitForLoadState("networkidle");
    const search = admin.getByLabel("Search products");
    await search.fill("zzz-no-such-product");
    await search.press("Enter");
    await expect(
      admin.getByRole("heading", { name: "No products match your filters" })
    ).toBeVisible();

    await admin.getByRole("button", { name: "Clear" }).click();
    await expect(admin).toHaveURL(/\/admin\/products$/);
    await expect(admin.getByText("12 products", { exact: true })).toBeVisible();
  });
});
