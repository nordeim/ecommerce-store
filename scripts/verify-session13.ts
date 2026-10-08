// Session-13 live re-verification (production standalone server on :3000,
// the remediated build). Mirrors scripts/verify-session12.ts. Run:
//   bun scripts/verify-session13.ts
// Verifies the ADMIN-SEARCH-1 remediation end-to-end against the live
// server: the filter bar renders, status filter + search drive the
// URL-deep-linkable state, the count line reports the filtered size, the
// empty state offers a way out, and the unfiltered list is unchanged.
// All assertions use expect() (retrying) — router.push navigations resolve
// in the URL bar before the RSC payload lands (the verify-session12 lesson
// generalized: never isVisible() right after a client-side navigation).
import { devices, chromium, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
let pass = 0;
let fail = 0;
const check = async (name: string, fn: () => Promise<void>) => {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${name} — ${String(e).split("\n").slice(0, 3).join(" ")}`);
  }
};

const browser = await chromium.launch();

// Admin login (fresh context; the dev DB's seeded admin).
const admin = await (await browser.newContext({ ...devices["Desktop Chrome"] })).newPage();
await admin.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await admin.getByLabel("Email").fill("admin@luxestore.com");
await admin.getByLabel("Password").fill("Admin1234!");
await admin.getByRole("button", { name: "Log in", exact: true }).click();
await admin.waitForURL(/\/(account|admin)/, { timeout: 15_000 });

// --- 1. The unfiltered list renders the filter bar + count line --------
await admin.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
await check("filter bar renders (search input + status select)", async () => {
  await expect(admin.getByLabel("Search orders")).toBeVisible();
  await expect(admin.getByRole("combobox", { name: "Filter by status" })).toBeVisible();
});
await check("count line: 3 orders (canonical seed)", async () => {
  await expect(admin.getByText("3 orders", { exact: true })).toBeVisible();
});
await check("all three seeded order rows render", async () => {
  await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toBeVisible();
  await expect(admin.getByRole("link", { name: "ORD-2026-002" })).toBeVisible();
  await expect(admin.getByRole("link", { name: "ORD-2026-003" })).toBeVisible();
});

// --- 2. Status filter (deep-linkable) -----------------------------------
await admin.getByRole("combobox", { name: "Filter by status" }).click();
await admin.getByRole("option", { name: "Delivered" }).click();
await admin.waitForURL(/\/admin\/orders\?status=delivered$/);
await check("status=delivered → URL deep-linked + count line: 2 orders + in_transit row hidden", async () => {
  await expect(admin.getByText("2 orders", { exact: true })).toBeVisible();
  await expect(admin.getByRole("link", { name: "ORD-2026-002" })).toHaveCount(0);
});

// --- 3. Deep-link into the filtered state -------------------------------
await admin.goto(`${BASE}/admin/orders?status=in_transit`, { waitUntil: "networkidle" });
await check("deep-link ?status=in_transit → count line: 1 order, only ORD-2026-002", async () => {
  await expect(admin.getByText("1 order", { exact: true })).toBeVisible();
  await expect(admin.getByRole("link", { name: "ORD-2026-002" })).toBeVisible();
  await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toHaveCount(0);
});
await check("invalid status deep-link falls back to the unfiltered list", async () => {
  await admin.goto(`${BASE}/admin/orders?status=bogus`, { waitUntil: "networkidle" });
  await expect(admin.getByText("3 orders", { exact: true })).toBeVisible();
});

// --- 4. Search (number + email branches) --------------------------------
const search = admin.getByLabel("Search orders");
await search.fill("001");
await search.press("Enter");
await admin.waitForURL(/\/admin\/orders\?q=001$/);
await check("q=001 → URL deep-linked, count line: 1 order, ORD-2026-001 visible", async () => {
  await expect(admin.getByText("1 order", { exact: true })).toBeVisible();
  await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toBeVisible();
});

await search.fill("john@");
await search.press("Enter");
await admin.waitForURL(/\/admin\/orders\?q=john%40$/);
await check("q=john@ (email branch) → 3 orders", async () => {
  await expect(admin.getByText("3 orders", { exact: true })).toBeVisible();
});

// --- 5. Combined filters + empty state + Clear --------------------------
await admin.getByRole("combobox", { name: "Filter by status" }).click();
await admin.getByRole("option", { name: "Processing" }).click();
await admin.waitForURL(/status=processing/);
await check("combined filters (q + status) → empty state heading + way out", async () => {
  await expect(admin.getByRole("heading", { name: "No orders match your filters" })).toBeVisible();
  await expect(admin.getByRole("link", { name: "Clear all filters" })).toBeVisible();
});

await admin.getByRole("button", { name: "Clear", exact: true }).click();
await admin.waitForURL(/\/admin\/orders$/);
await check("Clear → back to the unfiltered 3-order list", async () => {
  await expect(admin.getByText("3 orders", { exact: true })).toBeVisible();
  await expect(admin.getByRole("link", { name: "ORD-2026-001" })).toBeVisible();
});

// --- 6. The admin detail page still works from the filtered list --------
await admin.getByRole("link", { name: "ORD-2026-001" }).click();
await admin.waitForURL(/\/admin\/orders\/[a-z0-9]+$/);
await check("order detail still reachable", async () => {
  await expect(admin.getByRole("heading", { name: "ORD-2026-001" })).toBeVisible();
});

await browser.close();
console.log(`\n${pass}/${pass + fail} green`);
process.exit(fail === 0 ? 0 : 1);
