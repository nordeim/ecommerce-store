import { expect, test } from "@playwright/test";

// Round-47 (AUTH-ERROR-1): the auth family's error-state density — the
// customer-surfaces pin-density sweep's fifth installment. This spec OPTS
// OUT of the shared storageState because it drives the anonymous auth
// screens (like auth.spec.ts) — and its name sorts AFTER auth.spec.ts
// ('autherr' > 'auth.' in ASCII: 'e' 101 > '.' 46) and before cart.spec.ts,
// so it never disturbs earlier or later specs' resting pins (new specs
// never modify existing pins).
//
// The pins' ground truth — the reference measured live
// (scripts/auth-error-probe-r47.mjs + r47d2.mjs) and the Zod ground truth
// (scripts/zod-groundtruth-r47.mjs):
//   - the reference shows "Passwords do not match" when the mismatch
//     condition is true, regardless of the password's length (the
//     mismatch-first priority — A3 + A4b);
//   - the reference's four pending labels use THREE ASCII DOTS
//     ("Logging in..." / "Creating account..." / "Sending..." /
//     "Resetting..."), with the button disabled during flight;
//   - the reference blocks malformed emails natively (type=email, no
//     noValidate) with ZERO network posts;
//   - the reference has NO login rate-limit copy after 11 wrong attempts
//     (the clone's "Too many attempts." is a superset);
//   - the reference rejects passwords over 72 BYTES with a Base44/bcrypt
//     platform copy — the clone's 128-char scrypt rule is the REGISTERED
//     deliberate divergence (the clone's copy: Zod 3's "String must
//     contain at most 128 character(s)").
//
// P11 (the rate-limit burst) is LAST IN FILE: it exhausts the login
// endpoint's in-memory budget for the dedicated nonexistent
// rl-429-r47@example.com; no spec after this file in alphabetical order
// touches the login endpoint with that address (a fresh server per run
// keeps the ×2 consecutive full-run determinism).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("auth error states (round 47, AUTH-ERROR-1)", () => {
  // A POST-to-page counter — the native-block and client-first pins' teeth
  // (a blocked submit must fire ZERO action posts; the box alone cannot
  // distinguish a client-side block from a server-side one).
  const postCounter = (page: import("@playwright/test").Page, pathname: string) => {
    const state = { posts: 0 };
    page.on("request", (r) => {
      try {
        if (r.method() === "POST" && new URL(r.url()).pathname === pathname) state.posts++;
      } catch {
        /* non-URL — ignore */
      }
    });
    return state;
  };

  // The held-POST mechanism: hold the action POST on the page URL, read
  // the in-flight state (the label + the disabled attribute), then release.
  const holdPosts = (page: import("@playwright/test").Page, pattern: string) => {
    let release!: () => void;
    const held = page.route(pattern, (route) => {
      if (route.request().method() === "POST") {
        return new Promise<void>((resolve) => {
          release = resolve;
        }).then(() => route.continue());
      }
      return route.continue();
    });
    return {
        release,
        unroute: async () => {
          release();
          await held;
        },
    } as const;
  };

  test("P1: register short+MATCH surfaces the length copy (the reference's measured box)", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(`p1-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await page.getByLabel("Confirm Password").fill("abc");
    await page.getByRole("button", { name: "Create account" }).click();
    // The reference (measured live, probe A2): byte-identical copy.
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(box).toContainText("Password must be at least 8 characters long");
    await expect(box).not.toContainText("Passwords do not match");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("P2: register short+MISMATCH surfaces the mismatch copy (the reference's mismatch-first priority)", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(`p2-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await page.getByLabel("Confirm Password").fill("xyz");
    await page.getByRole("button", { name: "Create account" }).click();
    // The reference (measured live, probe A3): "Passwords do not match" —
    // the mismatch check wins over the length check when both are wrong.
    // The clone pre-fix showed the LENGTH copy (Zod issues[0] = the shape's
    // password issue) — the round's Fix #1 parity divergence.
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(box).toContainText("Passwords do not match");
    await expect(box).not.toContainText("at least 8 characters");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("P3: the register native-email block fires ZERO posts (the reference parity, no noValidate)", async ({
    page,
  }) => {
    await page.goto("/register");
    const net = postCounter(page, "/register");
    await page.getByLabel("Email").fill("notanemail");
    await page.getByLabel("Password", { exact: true }).fill("ValidPass123!");
    await page.getByLabel("Confirm Password").fill("ValidPass123!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForTimeout(600); // the settle: a fired action would have boxed by now
    // The reference (probe A1): the type=email input blocks the submit —
    // the server never sees the malformed value (0 posts, no box).
    expect(await page.getByLabel("Email").evaluate((el) => (el as HTMLInputElement).checkValidity())).toBe(false);
    await expect(page.locator("div.mb-4.p-3.rounded-lg")).toHaveCount(0);
    expect(net.posts).toBe(0);
    await expect(page).toHaveURL(/\/register$/);
  });

  test("P4: the login native-email block fires ZERO posts", async ({ page }) => {
    await page.goto("/login");
    const net = postCounter(page, "/login");
    await page.getByLabel("Email").fill("notanemail");
    await page.getByLabel("Password", { exact: true }).fill("whatever123");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForTimeout(600);
    expect(await page.getByLabel("Email").evaluate((el) => (el as HTMLInputElement).checkValidity())).toBe(false);
    await expect(page.locator("div.mb-4.p-3.rounded-lg")).toHaveCount(0);
    expect(net.posts).toBe(0);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("P5: the login pending label reads three ASCII dots and disables the button during flight", async ({
    page,
  }) => {
    await page.goto("/login");
    const btn = page.locator("form button[type=submit]");
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(btn).toHaveText("Log in");

    // Hold the action POST (the reference measured: the pending state is a
    // real in-flight window — the label + disabled attribute render while
    // the request is outstanding; three ASCII dots, not the U+2026
    // ellipsis the clone carried — the round's Fix #2 parity divergence).
    const held = holdPosts(page, "**/login");

    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await btn.click();

    await expect(btn).toHaveText("Logging in...");
    await expect(btn).toBeDisabled();

    await held.unroute();
    await expect(box).toContainText("Invalid email or password");
    await expect(btn).toHaveText("Log in");
    await expect(btn).toBeEnabled();
  });

  test("P6: the register pending label reads three ASCII dots; the duplicate copy lands after release", async ({
    page,
  }) => {
    await page.goto("/register");
    const btn = page.locator("form button[type=submit]");
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(btn).toHaveText("Create account");

    // A duplicate-email payload: after release the box carries the
    // session-4-measured copy — the pending window is the pin's subject.
    const held = holdPosts(page, "**/register");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
    await page.getByLabel("Confirm Password").fill("Demo1234!");
    await btn.click();

    await expect(btn).toHaveText("Creating account...");
    await expect(btn).toBeDisabled();

    await held.unroute();
    await expect(box).toContainText("A user with this email already exists");
    await expect(btn).toHaveText("Create account");
    await expect(btn).toBeEnabled();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("P7: the forgot-password pending label reads three ASCII dots; the neutral confirmation replaces the form", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    const btn = page.locator("form button[type=submit]");
    await expect(btn).toHaveText("Send reset link");

    const held = holdPosts(page, "**/forgot-password");
    await page.getByLabel("Email address").fill(`p7-${Date.now()}@example.com`);
    await btn.click();

    await expect(btn).toHaveText("Sending...");
    await expect(btn).toBeDisabled();

    await held.unroute();
    // The reference's anti-enumeration confirmation (probe C1) — the form
    // is replaced entirely.
    await expect(
      page.getByText("If an account exists with that email, you'll receive a password reset link shortly."),
    ).toBeVisible();
    await expect(page.locator("form button[type=submit]")).toHaveCount(0);
  });

  test("P8: the reset form's mismatch check fires CLIENT-SIDE first — zero posts (the reference parity)", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=bogus-r47-e2e");
    await expect(page.getByRole("heading", { name: "New password" })).toBeVisible();
    const net = postCounter(page, "/reset-password");
    const box = page.locator("div.mb-4.p-3.rounded-lg");

    await page.getByLabel("New Password", { exact: true }).fill("ValidPass123!");
    await page.getByLabel("Confirm Password").fill("different!");
    await page.getByRole("button", { name: "Reset password", exact: true }).click();
    await page.waitForTimeout(600);
    // The reference (probe D1): "Passwords do not match", 0 posts — the
    // client check precedes the server's token validation. Without the
    // posts counter this pin would be blind (the server produces the same
    // copy through the refine).
    await expect(box).toContainText("Passwords do not match");
    expect(net.posts).toBe(0);
    await expect(page).toHaveURL(/\/reset-password\?token=bogus-r47-e2e$/);
  });

  test("P9: the register 129-char boundary surfaces the clone's 128-char rule (the registered divergence)", async ({
    page,
  }) => {
    await page.goto("/register");
    const long = "x".repeat(129);
    await page.getByLabel("Email").fill(`p9-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill(long);
    await page.getByLabel("Confirm Password").fill(long);
    await page.getByRole("button", { name: "Create account" }).click();
    // The reference (probe A4) rejects >72 BYTES with a Base44/bcrypt
    // platform copy ("password cannot be longer than 72 bytes, truncate
    // manually if necessary (e.g. my_password[:72])"). The clone's
    // scrypt-appropriate 128-char rule is the REGISTERED deliberate
    // divergence — this pin documents the clone's boundary + copy as-is.
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(box).toContainText("String must contain at most 128 character(s)");
    await expect(box).not.toContainText("Passwords do not match");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("P10: the reset pending label reads three ASCII dots; the invalid-token copy lands after release", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=bogus-r47-e2e");
    const btn = page.locator("form button[type=submit]");
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    await expect(btn).toHaveText("Reset password");

    const held = holdPosts(page, "**/reset-password*");
    await page.getByLabel("New Password", { exact: true }).fill("ValidPass123!");
    await page.getByLabel("Confirm Password").fill("ValidPass123!");
    await btn.click();

    await expect(btn).toHaveText("Resetting...");
    await expect(btn).toBeDisabled();

    await held.unroute();
    // The reference (probe D2 after-release): the same measured copy.
    await expect(box).toContainText("Invalid or expired reset token");
    await expect(btn).toHaveText("Reset password");
    await expect(btn).toBeEnabled();
  });

  // LAST IN FILE — exhausts the login endpoint's in-memory budget for the
  // dedicated address; the fixed window is 10/15min/IP+email (the limiter
  // counts BEFORE the user lookup, so a nonexistent address still budgets).
  //
  // The per-iteration sync point (the round's race lesson): an expect on
  // text that is IDENTICAL across iterations ("Invalid email or password")
  // resolves instantly on the PREVIOUS response's box — it is not a
  // response sync point. Sync each iteration on its own TRANSITIONS
  // instead: the pending flag's return (the button re-enabled) + the
  // React-19 action reset (the inputs back to "" — the L38 lesson), both
  // of which commit with the response. Without this, a click can land in
  // the post-response reset window, the native `required` blocks the
  // submit, and the loop stalls one POST short of exhaustion.
  test("P11 (LAST): the login rate-limit exhausted copy — the 11th attempt reads \"Too many attempts. Try again in Ns.\"", async ({
    page,
  }) => {
    await page.goto("/login");
    const box = page.locator("div.mb-4.p-3.rounded-lg");
    const btn = page.locator("form button[type=submit]");
    const emailInput = page.getByLabel("Email");
    const email = "rl-429-r47@example.com";
    for (let i = 1; i <= 10; i++) {
      await emailInput.fill(email);
      await page.getByLabel("Password", { exact: true }).fill("wrong-password");
      await btn.click();
      // The response's own commit: the pending flag returns + the L38
      // reset empties the inputs — THEN the box content is this
      // iteration's response, not the previous one's.
      await expect(btn).toBeEnabled();
      await expect(emailInput).toHaveValue("");
      await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
      await expect(box).toContainText("Invalid email or password");
    }
    // The 11th — the window is exhausted (the reference has NO such copy
    // after 11 attempts: a superset, zero parity risk by construction).
    await emailInput.fill(email);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await btn.click();
    await expect(box).toContainText(/Too many attempts\. Try again in \d+s\./);
    await expect(box).not.toContainText("Invalid email or password");
    await expect(page).toHaveURL(/\/login$/);
  });
});
