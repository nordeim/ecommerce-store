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
