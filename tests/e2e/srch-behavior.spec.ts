import { expect, test } from "@playwright/test";

// Search behavior (session-46, SEARCH-BEHAVIOR-1) — the search family's
// behavioral contract: the typeahead's state machine (loading / calm-empty),
// the close/reopen query preservation + the toggle-close (the round's two
// reference-measured parity fixes), the empty-submit no-op, the Enter
// submit, the case-insensitive match, the API's limit boundary + the 429
// burst, and the results page's plural count + case-insensitivity.
//
// FILE-ORDER CONTRACT (the round-45 lesson): this spec is named `srch-`
// because ASCII `srch` sorts AFTER `search.` AND AFTER `smoke.` — the 429
// pin (LAST in this file) EXHAUSTS the /api/search rate-limit budget, and
// no spec after this one in file order (stock, storefront-parity, stripe,
// verify-email, wishlist) touches the endpoint. search.spec's own typeahead
// tests run BEFORE this file and get a clean budget.
//
// Reference relationship (measured live 2026-10-12, the probes
// scripts/search-behavior-probe-r46[a/a2/b].mjs): the reference's dropdown
// fires ZERO search requests while typing (no typeahead, no loading line,
// no suggestion popover — the clone's typeahead is a SUPERSET surface), its
// input PRESERVES the typed query across close/reopen (measured: value
// "serum" after toggle-close + reopen), its toggle button CLOSES the open
// panel (the second click), its empty submit does NOT navigate, its typed +
// Enter submits navigate to /shop?search=, and its results page renders
// "2 products found" (the plural) with case-insensitive matching. The
// reference exposes NO JSON search API (its /api/search returns the SPA
// shell) — the clone's endpoint is a superset surface.

test.describe("search behavior (session-46)", () => {
  const openPanel = async (page: import("@playwright/test").Page) => {
    await page.goto("/");
    await page.locator('header button[aria-label="Search"]').click();
    const input = page.getByLabel("Search products");
    await expect(input).toBeVisible();
    return input;
  };

  test("P1: the typeahead renders the Searching… line while the fetch is in flight, then the suggestion", async ({ page }) => {
    // Defer /api/search ~800ms so the loading window is observable.
    await page.route("**/api/search*", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    const input = await openPanel(page);
    await input.fill("serum");
    // 250ms debounce + the held fetch: the loading line is visible mid-flight.
    await expect(page.getByText("Searching…")).toBeVisible({ timeout: 5000 });
    // The route fulfills: the suggestion replaces the loading line.
    const suggestion = page.locator("header button").filter({ hasText: "Vitamin C Serum" });
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Searching…")).toBeHidden();
    await page.unroute("**/api/search*");
  });

  test("P2: a no-match query renders NO popover after the fetch settles (the calm state)", async ({ page }) => {
    const input = await openPanel(page);
    await input.fill("zzzqqq");
    // Wait for the typeahead round trip to COMPLETE (the calm state is the
    // post-fetch absence, not the pre-fetch one).
    await page.waitForResponse((r) => r.url().includes("/api/search"));
    await page.waitForTimeout(400);
    await expect(page.locator("header .bg-popover")).toHaveCount(0);
    await expect(page.getByText("Searching…")).toHaveCount(0);
    // The input stays open with the unmatched query — nothing else appears.
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("zzzqqq");
  });

  test("P3: the typed query + cached suggestions are PRESERVED across close/reopen (reference parity, session-46)", async ({ page }) => {
    // Measured live on the reference (probe r46a2): type "serum" -> close
    // the panel -> reopen -> the input STILL CARRIES "serum". The clone's
    // old reset-on-close behavior was a measured divergence — this is the
    // round's parity fix #1.
    const input = await openPanel(page);
    await input.fill("serum");
    await page.waitForResponse((r) => r.url().includes("/api/search"));
    const suggestion = page.locator("header button").filter({ hasText: "Vitamin C Serum" });
    await expect(suggestion).toBeVisible({ timeout: 10_000 });

    // Escape closes the panel (the pinned superset affordance).
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Search products")).toBeHidden();

    // Reopen: the query is still there, and the cached popover re-appears.
    await page.locator('header button[aria-label="Search"]').click();
    const reopened = page.getByLabel("Search products");
    await expect(reopened).toBeVisible();
    await expect(reopened).toHaveValue("serum");
    await expect(
      page.locator("header button").filter({ hasText: "Vitamin C Serum" }),
    ).toBeVisible();
  });

  test("P4: the search toggle CLOSES the open panel (reference parity, session-46)", async ({ page }) => {
    // Measured live on the reference (probe r46a2): the second click on the
    // search toggle closes the open panel. The clone's old open-only button
    // was a measured divergence — this is the round's parity fix #2.
    const input = await openPanel(page);
    await expect(input).toBeVisible();

    // The toggle click closes the panel.
    await page.locator('header button[aria-label="Search"]').click();
    await expect(page.getByLabel("Search products")).toBeHidden();

    // And opens it again.
    await page.locator('header button[aria-label="Search"]').click();
    await expect(page.getByLabel("Search products")).toBeVisible();
  });

  test("P5: an empty submit is a no-op — no navigation, the panel stays open (reference parity)", async ({ page }) => {
    // Measured live on the reference (probe r46a2): clicking Search with an
    // empty input does NOT navigate.
    const input = await openPanel(page);
    await expect(input).toHaveValue("");
    await page.locator("header form").getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByLabel("Search products")).toBeVisible();
  });

  test("P6: pressing Enter submits the typed query to the results page", async ({ page }) => {
    // Measured live on the reference (probe r46a2): type + Enter navigates
    // to /shop?search=q.
    const input = await openPanel(page);
    await input.fill("watch");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/shop?search=watch");
    await expect(page.getByRole("heading", { name: 'Results for "watch"' })).toBeVisible();
  });

  test("P7: the typeahead matches case-insensitively (uppercase query, mixed-case product)", async ({ page }) => {
    const input = await openPanel(page);
    await input.fill("SERUM");
    await page.waitForResponse((r) => r.url().includes("/api/search"));
    const suggestion = page.locator("header button").filter({ hasText: "Vitamin C Serum" });
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
  });

  test("P8: the search API enforces the limit boundary (11 -> 400, 10 -> 200)", async ({ request }) => {
    const over = await request.get("/api/search?q=serum&limit=11");
    expect(over.status()).toBe(400);
    const boundary = await request.get("/api/search?q=serum&limit=10");
    expect(boundary.status()).toBe(200);
    const body = (await boundary.json()) as { results: { slug: string }[] };
    expect(body.results.length).toBeGreaterThanOrEqual(1);
    expect(body.results[0]?.slug).toBe("vitamin-c-serum");
  });

  test("P12: the typeahead popover is NOT clipped by the search strip — a real hit-test at the row's center (session-46)", async ({ page }) => {
    // The round's VLM verification caught the session-8-era defect: the
    // strip's overflow-hidden clipped the popover to a 4px sliver — the
    // superset feature was VISUALLY INVISIBLE while the E2E layer stayed
    // green, because Playwright's toBeVisible() is clipping-blind (a
    // non-zero bounding box passes). The honest check is a REAL DOM
    // hit-test: the suggestion row must be the topmost element at its own
    // center, and the popover must extend below the strip (not collapse
    // inside it).
    const input = await openPanel(page);
    await input.fill("serum");
    await page.waitForResponse((r) => r.url().includes("/api/search"));
    const suggestion = page.locator("header button").filter({ hasText: "Vitamin C Serum" });
    await expect(suggestion).toBeVisible({ timeout: 10_000 });

    const geo = await page.evaluate(() => {
      const strip = document.querySelector("header div.border-t");
      const popover = document.querySelector("header .bg-popover");
      const row = popover?.querySelector("button");
      if (!strip || !popover || !row) return null;
      const s = strip.getBoundingClientRect();
      const p = popover.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      const topHit = document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)[0];
      return {
        popoverExtendsBelowStrip: p.bottom > s.bottom + 10,
        rowHittable: row.contains(topHit),
        popoverWithinViewport: p.bottom <= window.innerHeight,
      };
    });
    expect(geo).toEqual({
      popoverExtendsBelowStrip: true,
      rowHittable: true,
      popoverWithinViewport: true,
    });
  });
});

test.describe("search results page copy (session-46)", () => {
  test("P9: the multi-match results page renders the PLURAL count line (reference parity)", async ({ page }) => {
    // Measured live on the reference (probe r46b): /shop?search=wireless ->
    // "2 products found" (Wireless Noise-Cancelling Headphones + Wireless
    // Charging Pad) — the plural template is identical on both sites.
    await page.goto("/shop?search=wireless");
    await expect(page.getByRole("heading", { name: 'Results for "wireless"' })).toBeVisible();
    await expect(page.getByText("2 products found")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Wireless Noise-Cancelling Headphones/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Wireless Charging Pad/ }).first(),
    ).toBeVisible();
  });

  test("P10: the results page matches case-insensitively (reference parity)", async ({ page }) => {
    // Measured live on the reference (probe r46b): /shop?search=SERUM ->
    // "1 product found" + the Vitamin C Serum card.
    await page.goto("/shop?search=SERUM");
    await expect(page.getByRole("heading", { name: 'Results for "SERUM"' })).toBeVisible();
    await expect(page.getByText("1 product found")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Vitamin C Serum/ }).first(),
    ).toBeVisible();
  });

  test("P11 (LAST): the search API rate limit bursts to 429 with Retry-After (60/min/IP)", async ({ request }) => {
    // The newsletter spec's pattern (session-43): the burst test is LAST in
    // the file because it EXHAUSTS the shared in-memory budget. The fixed
    // window is 60 requests/60s per IP; earlier specs consumed a handful,
    // so exhaustion lands within the loop cap. Deterministic: workers:1, a
    // fresh server per run, and only search.spec + this spec touch the
    // endpoint before this test.
    let saw429 = false;
    let ok = 0;
    for (let i = 0; i < 70 && !saw429; i++) {
      const res = await request.get(`/api/search?q=burst-${i}&limit=1`);
      if (res.status() === 429) {
        saw429 = true;
        const retryAfter = res.headers()["retry-after"];
        expect(retryAfter).toBeTruthy();
        const body = (await res.json()) as { error?: string };
        expect(body.error).toBe("Too many requests");
      } else {
        ok++;
      }
    }
    expect(saw429).toBe(true);
    expect(ok).toBeGreaterThanOrEqual(1); // the endpoint served requests before gating
  });
});
