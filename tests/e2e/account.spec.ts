import { expect, test } from "@playwright/test";

// Account dashboard (the "dashboard" surface): tabs, profile form, order
// history (seeded reference orders), addresses, settings. Authenticated via
// the setup project's storageState (john@example.com / Demo1234!).

test.describe("account", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  });

  test("renders the four reference tabs", async ({ page }) => {
    for (const tab of ["Profile", "Orders", "Addresses", "Settings"]) {
      await expect(page.getByRole("tab", { name: tab, exact: true })).toBeVisible();
    }
  });

  test("profile shows the identity block and prefilled form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "John Doe" })).toBeVisible();
    await expect(page.getByRole("main").getByText("john@example.com").first()).toBeVisible();
    await expect(page.getByRole("main").getByLabel("First Name")).toHaveValue("John");
    await expect(page.getByRole("main").getByLabel("Last Name")).toHaveValue("Doe");
    await expect(page.getByRole("main").getByLabel("Email")).toHaveValue("john@example.com");
  });

  test("profile avatar is the reference User icon, not initials (session-3)", async ({ page }) => {
    const avatar = page.locator("main .h-20.w-20.rounded-full");
    await expect(avatar).toBeVisible();
    // Reference renders a lucide user glyph inside the bg-primary/10 circle.
    await expect(avatar.locator("svg")).toBeVisible();
    await expect(avatar).not.toContainText("JD");
    // bg-primary/10 — v4 serializes alpha utilities as lab() (trap log 6).
    const bg = await avatar.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgba\(230, 107, 26, 0\.1\)|lab\([\d.]+ [\d.]+ [\d.]+ \/ 0\.1\)/);
  });

  test("tab panel spacing matches the reference 24px (session-8, trap-5 variant)", async ({ page }) => {
    // SPACE-TABS-1: v4's space-y-6 margin-block-end on the TabsList STACKS
    // with the panel's own mt-2 (adjacent flex-row siblings don't collapse
    // here — the Tabs root is a plain block, but the v3 engine's
    // higher-specificity margin-top REPLACED mt-2 instead of adding to it).
    // Reference gap: 24px; pre-fix clone: 32px. Measured live 2026-10-08.
    const gap = await page.evaluate(() => {
      const list = document.querySelector('[role=tablist]');
      const panel = document.querySelector('[role=tabpanel]');
      if (!list || !panel) throw new Error("tabs not found");
      return (
        panel.getBoundingClientRect().y -
        (list.getBoundingClientRect().y + list.getBoundingClientRect().height)
      );
    });
    expect(Math.abs(gap - 24)).toBeLessThanOrEqual(1);
  });

  test("profile form fields use the reference inline-label geometry (session-8)", async ({ page }) => {
    // LABEL-BLOCK-1: the reference renders inline <label> (18px natural
    // line box) + input with margin-top 6px (mt-1.5) in an unclassed div;
    // the clone had block labels (14px) with mb-2. Computed parity pins:
    // label display inline, input margin-top 6px (measured live on both
    // sites 2026-10-08; the clone's own Change-Password form already used
    // this pattern — the profile form just wasn't converted).
    const firstLabel = page.locator("main label").filter({ hasText: /^First Name$/ });
    await expect(firstLabel).toHaveCSS("display", "inline");
    await expect(page.locator("#acc-first")).toHaveCSS("margin-top", "6px");
    await expect(page.locator("#acc-email")).toHaveCSS("margin-top", "6px");
    await expect(page.locator("#acc-phone")).toHaveCSS("margin-top", "6px");
    // The label→input visual gap on the reference: 9px (24px line box
    // strut + 6px margin over the 18px inline box).
    const gap = await page.evaluate(() => {
      const label = [...document.querySelectorAll("label")].find(
        (l) => l.textContent?.trim() === "First Name",
      );
      const input = document.querySelector("#acc-first");
      if (!label || !input) throw new Error("profile field not found");
      const lr = label.getBoundingClientRect();
      const ir = input.getBoundingClientRect();
      return ir.y - (lr.y + lr.height);
    });
    expect(Math.abs(gap - 9)).toBeLessThanOrEqual(1);
  });

  test("profile Save button sits 16px below the fields (session-8)", async ({ page }) => {
    // ACCOUNT-BTN-1: the button is a grid child — the grid's gap-4 (16px)
    // alone must supply the field→button spacing (the reference renders
    // the button as a plain sibling with mt-4 = 16px). The clone's extra
    // mt-4 stacked with the gap to 32px and pushed the card + footer 16px
    // low. Measured on both sites 2026-10-08.
    const spacing = await page.evaluate(() => {
      const phone = document.querySelector("#acc-phone");
      const button = [...document.querySelectorAll("button")].find((b) =>
        /Save Changes/.test(b.textContent ?? ""),
      );
      if (!phone || !button) throw new Error("profile form not found");
      const row = phone.parentElement as HTMLElement;
      return button.getBoundingClientRect().y - row.getBoundingClientRect().bottom;
    });
    expect(Math.abs(spacing - 16)).toBeLessThanOrEqual(1);
  });

  test("profile edits persist", async ({ page }) => {
    await page.getByRole("main").getByLabel("Phone").fill("+1 (555) 999-0000");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByLabel("Profile saved")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("main").getByLabel("Phone")).toHaveValue("+1 (555) 999-0000");
  });

  test("orders tab lists the seeded reference order history", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    const history = page.getByRole("tabpanel");
    await expect(history.getByText("ORD-2026-001")).toBeVisible();
    await expect(history.getByText("Mar 28, 2026 · 2 items")).toBeVisible();
    await expect(history.getByText("ORD-2026-002")).toBeVisible();
    await expect(history.getByText("ORD-2026-003")).toBeVisible();
    await expect(history.getByText("$349.98")).toBeVisible();
    await expect(history.getByText("Delivered").first()).toBeVisible();
    await expect(history.getByText("In Transit").first()).toBeVisible();
  });

  test("addresses tab shows the seeded default address", async ({ page }) => {
    await page.getByRole("tab", { name: "Addresses" }).click();
    await expect(page.getByRole("button", { name: "Add New" })).toBeVisible();
    await expect(page.getByRole("main").getByText("Default").first()).toBeVisible();
    await expect(page.getByRole("main").getByText("123 Main Street")).toBeVisible();
    await expect(page.getByRole("main").getByText("New York, NY 10001")).toBeVisible();
    await expect(page.getByRole("main").getByText("United States").first()).toBeVisible();
  });

  test("addresses tab matches the reference card + button anatomy (session-3)", async ({ page }) => {
    await page.getByRole("tab", { name: "Addresses" }).click();
    // "Add New" is the reference's OUTLINE button (transparent bg, 1px border,
    // shadcn rounded-lg = --radius = 12px) — not the primary fill.
    const addNew = page.getByRole("button", { name: "Add New" });
    await expect(addNew).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(addNew).toHaveCSS("border-width", "1px");
    await expect(addNew).toHaveCSS("border-radius", "12px");
    // The default address card is the reference's highlighted single card:
    // 2px primary/20 border over the secondary/30 wash.
    const card = page.getByRole("main").locator("div.border-2.border-primary\\/20");
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS("border-width", "2px");
    const borderColor = await card.evaluate((el) => getComputedStyle(el).borderColor);
    // border-primary/20 — v4 serializes alpha utilities as lab() (trap log 6).
    expect(borderColor).toMatch(
      /rgba\(230, 107, 26, 0\.2\)|lab\([\d.]+ [\d.]+ [\d.]+ \/ 0\.2\)/,
    );
    // No "Home" label span next to the Default badge (reference has none).
    await expect(page.getByRole("main").locator("span", { hasText: /^Home$/ })).toHaveCount(0);
    // "Edit" is the reference's ghost button (transparent, borderless).
    const edit = page.getByRole("button", { name: "Edit" });
    await expect(edit).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(edit).toHaveCSS("border-width", "0px");
  });

  test("a new address can be added and becomes selectable", async ({ page }) => {
    await page.getByRole("tab", { name: "Addresses" }).click();
    await page.getByRole("button", { name: "Add New" }).click();
    await page.getByRole("main").getByLabel("Full Name").fill("John Doe");
    await page.getByRole("main").getByLabel("Street Address").fill("456 Broadway");
    await page.getByRole("main").getByLabel("City").fill("Brooklyn");
    await page.getByRole("main").getByLabel("State").fill("NY");
    await page.getByRole("main").getByLabel("ZIP Code").fill("11211");
    await page.getByRole("button", { name: "Save Address" }).click();
    await expect(page.getByRole("main").getByText("456 Broadway")).toBeVisible();
  });

  test("settings renders the password form and notifications placeholder", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    await expect(page.getByRole("main").getByLabel("Current Password")).toBeVisible();
    await expect(page.getByRole("main").getByLabel("New Password")).toBeVisible();
    await expect(page.getByRole("main").getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByText("Email notification preferences coming soon.")).toBeVisible();
  });

  test("settings card carries the reference section headings (session-3)", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    // Reference: "Change Password" h3 (font-medium mb-2) above the fields,
    // "Notifications" h3 of the same style, card content spaced space-y-6.
    const changeH3 = page.getByRole("main").getByRole("heading", { name: "Change Password" });
    await expect(changeH3).toBeVisible();
    await expect(changeH3).toHaveCSS("font-weight", "500");
    await expect(changeH3).toHaveCSS("margin-bottom", "8px");
    await expect(page.getByRole("main").getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("heading", { name: "Session" })).toBeVisible(); // superset
    // Fields sit in the reference's space-y-3 max-w-md column (not a grid).
    const fields = page.getByRole("main").getByLabel("Current Password").locator("..");
    await expect(fields).toHaveCSS("display", "block");
  });

  test("wrong current password is rejected with an inline error", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByRole("main").getByLabel("Current Password").fill("not-the-password");
    await page.getByRole("main").getByLabel("New Password").fill("NewPass1234!");
    await page.getByRole("main").getByLabel("Confirm Password").fill("NewPass1234!");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(page.getByRole("main").getByText("Incorrect password")).toBeVisible();
  });
});
