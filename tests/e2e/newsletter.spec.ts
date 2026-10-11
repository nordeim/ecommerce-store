import { expect, test } from "@playwright/test";

// Newsletter (session-43, NEWSLETTER-E2E-1 — the customer-surfaces
// pin-density sweep's first installment): the footer's "Stay Updated"
// funnel. The reference's block renders the SAME resting anatomy but its
// Join click is fully INERT (zero network calls, no status line — the
// Base44 cosmetic mock, measured live 2026-10-11); the clone's funnel is
// the classic superset: island -> POST /api/newsletter -> Zod ->
// rate-limit (10/10min/IP) -> NewsletterSubscriber upsert -> the inline
// role="status" line.
//
// TEST ORDER IS LOAD-BEARING: the rate-limit test is LAST — it exhausts
// the shared in-memory limiter budget (10 requests / 10 min / IP, counted
// per POST regardless of validity: the gate runs before body parsing).
// P2..P6 consume 5 requests; the burst's 12-iteration ceiling trips the
// 429 at the 11th request. No other spec POSTs to /api/newsletter (the
// suite runs workers:1 / fullyParallel:false — the count is deterministic;
// each `bun run test:e2e` run boots a FRESH server, so the in-memory
// limiter resets per run).

test.describe("newsletter", () => {
  const EMAIL = "e2e.newsletter@example.com";

  test("the footer's Stay Updated block matches the reference resting anatomy (session-43, NEWSLETTER-E2E-1)", async ({ page }) => {
    await page.goto("/");
    // The reference's measured anatomy (live probe 2026-10-11): the h3, the
    // copy, the placeholder, the 32px small Join button, the privacy line.
    await expect(page.getByRole("heading", { name: "Stay Updated" })).toBeVisible();
    await expect(page.getByText("Subscribe for exclusive offers and new arrivals.")).toBeVisible();
    // The superset attrs (type=email + required + the accessible name) are
    // the clone's own contract — the reference ships a bare text input.
    const input = page.getByLabel("Email address");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", "Your email");
    await expect(input).toHaveAttribute("type", "email");
    // toBeRequired() is not in this Playwright version — the attribute form.
    await expect(input).toHaveAttribute("required", "");
    await expect(page.getByRole("button", { name: "Join", exact: true })).toBeVisible();
    await expect(page.getByText("By subscribing, you agree to our Privacy Policy.")).toBeVisible();
  });

  test("subscribing through the footer shows the inline success line and clears the input", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Email address");
    await input.fill(EMAIL);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/newsletter") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Join", exact: true }).click(),
    ]);
    expect(resp.status()).toBe(200);
    // The inline role="status" line — the reference's inert form renders
    // nothing here (the superset's visible delta).
    await expect(page.locator("footer").getByRole("status")).toContainText("Thanks for subscribing!");
    await expect(input).toHaveValue("");
  });

  test("re-subscribing the same email stays idempotent (the DB-backed upsert)", async ({ page }) => {
    // The upsert contract: a second subscribe with the SAME email succeeds
    // (a create-instead-of-upsert regression trips Prisma P2002 -> the
    // route's 500 fallback copy — this pin is the guard).
    await page.goto("/");
    const input = page.getByLabel("Email address");
    await input.fill(EMAIL);
    const [first] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/newsletter") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Join", exact: true }).click(),
    ]);
    expect(first.status()).toBe(200);
    await input.fill(EMAIL);
    const [second] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/newsletter") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Join", exact: true }).click(),
    ]);
    expect(second.status()).toBe(200);
    await expect(page.locator("footer").getByRole("status")).toContainText("Thanks for subscribing!");
  });

  test("the API rejects an invalid email with the Zod copy", async ({ request }) => {
    const res = await request.post("/api/newsletter", { data: { email: "not-an-email" } });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { ok: boolean; message: string };
    expect(body.ok).toBe(false);
    expect(body.message).toBe("Enter a valid email address");
  });

  test("the API rejects a non-JSON body", async ({ request }) => {
    // A string `data` gets JSON-quoted by the fixture (a valid JSON string
    // — the Zod non-object rejection); the route's OWN catch path (the
    // "Invalid request body." copy) needs a body that fails JSON.parse
    // entirely — an empty POST body is the honest drive.
    const res = await request.post("/api/newsletter", {
      headers: { "content-type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { ok: boolean; message: string };
    expect(body.ok).toBe(false);
    expect(body.message).toBe("Invalid request body.");
  });

  test("the API happy path returns the success shape", async ({ request }) => {
    const res = await request.post("/api/newsletter", { data: { email: "e2e.api.happy@example.com" } });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean; message: string };
    expect(body).toEqual({ ok: true, message: "Thanks for subscribing!" });
  });

  test("the API rate-limits a burst: 429 + Retry-After (10/10min/IP) — LAST, exhausts the budget", async ({ request }) => {
    // P2..P6 consumed 5 of the 10-request window; the burst continues until
    // the limiter trips (the 11th request), asserting the 429 contract.
    let saw429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await request.post("/api/newsletter", { data: { email: "e2e.burst@example.com" } });
      if (res.status() === 429) {
        saw429 = true;
        const body = (await res.json()) as { ok: boolean; message: string };
        expect(body.ok).toBe(false);
        expect(body.message).toBe("Too many attempts. Please try again later.");
        expect(res.headers()["retry-after"]).toBeTruthy();
        break;
      }
      // Pre-trip requests are all valid subscribes (the upsert makes the
      // repeated burst email idempotent).
      expect(res.status()).toBe(200);
    }
    expect(saw429).toBe(true);
  });
});
