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

  test("order rows match the reference anatomy (session-9, ACCOUNT-ORDER-ROW-1)", async ({ page }) => {
    // Reference rows (measured live 2026-10-08, both sites):
    //   container space-y-4 (16px between rows) inside p-6 pt-0
    //   row: flex flex-col sm:flex-row sm:items-center justify-between
    //        p-4 bg-secondary/30 rounded-xl gap-3 — tinted fill, NO border,
    //        stacks on mobile
    //   number p.font-semibold / total span.font-bold
    //   status badge: button-classed div — Delivered = bg-primary
    //   (rgb(230,107,26), white text, shadow, rounded-full, 22px tall),
    //   In Transit = bg-secondary (rgb(242,240,237)).
    // Pre-fix clone: border 1px + hover, weights 500/600, emerald/amber
    // chips, 12px row gap.
    await page.getByRole("tab", { name: "Orders" }).click();

    const geometry = await page.evaluate(() => {
      const panel = document.querySelector('[role=tabpanel][data-state="active"]');
      if (!panel) throw new Error("orders panel missing");
      const row = [...panel.querySelectorAll("div")].find(
        (d) => d.className.includes("justify-between") && /ORD-2026-001/.test(d.textContent ?? ""),
      );
      if (!row) throw new Error("order row missing");
      const cs = getComputedStyle(row);
      const number = row.querySelector("p");
      const total = [...row.querySelectorAll("span")].find((s) => /^\$/.test(s.textContent ?? ""));
      const badge = [...row.querySelectorAll("div, span")].find((e) =>
        (e.textContent ?? "").trim() === "Delivered",
      );
      const container = row.parentElement;
      const row2 = container?.children[1] as HTMLElement | undefined;
      const gap = row2
        ? row2.getBoundingClientRect().y - (row.getBoundingClientRect().y + row.getBoundingClientRect().height)
        : null;
      return {
        bg: cs.backgroundColor,
        borderWidth: cs.borderTopWidth,
        numberWeight: number ? getComputedStyle(number).fontWeight : null,
        totalWeight: total ? getComputedStyle(total).fontWeight : null,
        badgeBg: badge ? getComputedStyle(badge).backgroundColor : null,
        badgeRadius: badge ? getComputedStyle(badge).borderRadius : null,
        gap,
        containerCls: container?.className ?? null,
      };
    });

    // bg-secondary/30 — v4 serializes alpha utilities as lab() (trap log 6).
    expect(geometry.bg).toMatch(/rgba\(242, 240, 237, 0\.3\)|lab\([\d.]+ [\d.]+ [\d.]+ \/ 0\.3\)/);
    expect(geometry.borderWidth).toBe("0px");
    expect(geometry.numberWeight).toBe("600"); // font-semibold
    expect(geometry.totalWeight).toBe("700"); // font-bold
    expect(geometry.badgeBg).toBe("rgb(230, 107, 26)"); // bg-primary (Delivered)
    // rounded-full serializes as the huge pixel value on both engines.
    expect(parseFloat(geometry.badgeRadius ?? "0")).toBeGreaterThan(1000);
    expect(geometry.gap).toBe(16); // space-y-4
    expect(geometry.containerCls).toContain("space-y-4");

    // In Transit badge = the secondary variant.
    const transit = await page.evaluate(() => {
      const panel = document.querySelector('[role=tabpanel][data-state="active"]');
      const row = [...panel?.querySelectorAll("div") ?? []].find(
        (d) => d.className.includes("justify-between") && /ORD-2026-002/.test(d.textContent ?? ""),
      );
      const badge = [...(row?.querySelectorAll("div, span") ?? [])].find((e) =>
        (e.textContent ?? "").trim() === "In Transit",
      );
      return badge ? getComputedStyle(badge).backgroundColor : null;
    });
    expect(transit).toBe("rgb(242, 240, 237)"); // bg-secondary
  });

  // Session-33 (CUSTOMER-MONEY-1, ADR-041): the customer-side money-state
  // mirror. The payments family built every OPERATOR surface for the refund
  // state (the payments log, the trail, the refund action, the webhook's
  // order-state reflection); this is the CUSTOMER half — the persistent
  // order-history surface renders the money state. A fully refunded order
  // (paymentStatus "refunded" — the single-writer reflection, ADR-040) earns
  // a muted line under the date; every other row keeps the reference's
  // resting anatomy byte-identically (the calm state).
  test("refunded orders surface the money state in history (session-33, CUSTOMER-MONEY-1)", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    const history = page.getByRole("tabpanel");

    // The refunded fixture: ORD-2026-004 (cancelled + fully refunded, the
    // planter, $79.99 — matching evt_demo_fixture_r's refunded amount).
    await expect(history.getByText("ORD-2026-004")).toBeVisible();
    await expect(history.getByText("Feb 22, 2026 · 1 item")).toBeVisible();
    // The money line: the seam's full text, rendered under the date line.
    await expect(history.getByText("Refunded · $79.99 returned", { exact: true })).toBeVisible();
    // The fulfillment pill keeps its own vocabulary (the two states are
    // orthogonal — the refundEligibility design's own example, post-refund).
    await expect(history.getByText("Cancelled", { exact: true }).first()).toBeVisible();

    // The calm state: the demo-path + paid rows carry NO money line —
    // history never shows a paid line (the alert-fatigue lesson), and the
    // resting rows keep the reference's exact anatomy.
    await expect(history.getByText("Refunded ·", { exact: false })).toHaveCount(1);
    // And the paid fixture (ORD-2026-003) renders no money line either.
    const paidRow = history.locator("div.justify-between", {
      hasText: "ORD-2026-003",
    });
    await expect(paidRow.getByText(/Refunded|Paid/)).toHaveCount(0);
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

  // -------------------------------------------------------------------------
  // Session-34 (CUSTOMER-ORDER-DETAIL-1, ADR-042): the customer's per-order
  // read surface. The history rows' numbers link to /account/orders/[id]
  // (the DATABASE id — the admin-detail convention; never the public
  // number), the route renders the customer-safe detail, and the gate is
  // the GUEST-TOKEN-1 discipline: owner or the generic not-found block.
  // -------------------------------------------------------------------------

  test("order numbers in history link to the customer order detail (session-34, CUSTOMER-ORDER-DETAIL-1)", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    const link = page.getByRole("link", { name: "ORD-2026-001" });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    // The DATABASE id (a cuid), never the public number.
    expect(href).toMatch(/^\/account\/orders\/[a-z0-9]+$/);
    await link.click();
    // toHaveURL matches the FULL URL string (scheme + host) — anchor the
    // path pattern at the end.
    await expect(page).toHaveURL(/\/account\/orders\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "ORD-2026-001", exact: true })).toBeVisible();
  });

  test("the customer order detail renders the full read surface (ORD-2026-001)", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    await page.getByRole("link", { name: "ORD-2026-001" }).click();
    await expect(page.getByRole("heading", { name: "ORD-2026-001", exact: true })).toBeVisible();

    // The back affordance (the admin-detail pattern).
    await expect(page.getByRole("link", { name: "← Orders" })).toBeVisible();

    // The header: the fulfillment pill from the history vocabulary + the total
    // (the header total + the totals block both render $349.98 — .first()
    // scopes to the header's).
    await expect(page.getByText("Delivered", { exact: true })).toBeVisible();
    await expect(page.getByText("$349.98", { exact: true }).first()).toBeVisible();

    // The items card: the snapshot rows (name, unit × qty, line total).
    await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();
    await expect(page.getByText("Wireless Noise-Cancelling Headphones")).toBeVisible();
    await expect(page.getByText("$299.99 × 1")).toBeVisible();
    await expect(page.getByText("Organic Cotton Oversized Tee")).toBeVisible();
    await expect(page.getByText("$49.99 × 1")).toBeVisible();

    // The totals block (Subtotal / Shipping Free / Total — the operator
    // detail's rows, the same math).
    await expect(page.getByText("Subtotal", { exact: true })).toBeVisible();
    await expect(page.getByText("Shipping", { exact: true })).toBeVisible();
    await expect(page.getByText("Free", { exact: true })).toBeVisible();

    // The shipping card: the parsed address snapshot (ADR-015 pattern).
    // Scoped to the MAIN landmark — the footer carries the same contact
    // address (the account-tab convention).
    await expect(page.getByRole("heading", { name: "Shipping Address" })).toBeVisible();
    await expect(page.getByRole("main").getByText("John Doe").first()).toBeVisible();
    await expect(page.getByRole("main").getByText("123 Main Street")).toBeVisible();
    await expect(page.getByRole("main").getByText("New York, NY 10001")).toBeVisible();
    await expect(page.getByRole("main").getByText("United States").first()).toBeVisible();

    // The payment card: the method + card row, the placed date.
    await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
    await expect(page.getByText("Card ···· 4242")).toBeVisible();
    await expect(page.getByText("Mar 28, 2026", { exact: true })).toBeVisible();

    // The money line's CALM state: the demo-path order (paymentStatus
    // null) renders NO money line — the seam returns { visible: false }.
    await expect(page.getByText(/Payment received|Payment refunded/)).toHaveCount(0);
  });

  test("the refunded fixture's detail surfaces the money state (ORD-2026-004)", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    await page.getByRole("link", { name: "ORD-2026-004" }).click();
    await expect(page.getByRole("heading", { name: "ORD-2026-004", exact: true })).toBeVisible();

    // The fulfillment pill keeps its own vocabulary (cancelled — the two
    // states are orthogonal, the refundEligibility design's example).
    await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();

    // The item: 1× Ceramic Planter Set at $79.99.
    await expect(page.getByText("Ceramic Planter Set")).toBeVisible();
    await expect(page.getByText("$79.99 × 1")).toBeVisible();

    // The money line: the confirmation's customer-safe copy (the
    // per-order read vocabulary — R10-2: no operator vocabulary).
    await expect(
      page.getByText("Payment refunded — the amount has been returned to your original payment method."),
    ).toBeVisible();
  });

  // Session-35 (CUSTOMER-TIMELINE-1, ADR-043): the customer-safe order
  // timeline — the OrderEvent story rendered through the
  // operator→customer vocabulary mapping. The seeded fixtures carry
  // status_changed events with REALISTIC operator-attribution notes (the
  // admin action's exact format) so the mapping and the R10-2 no-leak
  // property are provable on the LIVE surface, not just at the seam.
  test("the order detail renders the customer-safe timeline (ORD-2026-001, session-35 CUSTOMER-TIMELINE-1)", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    await page.getByRole("link", { name: "ORD-2026-001" }).click();
    await expect(page.getByRole("heading", { name: "ORD-2026-001", exact: true })).toBeVisible();

    // The Timeline card joins the read surface.
    await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

    // The customer-safe vocabulary, in story order: placed → in transit →
    // delivered (the seeded fixture chain — composed through the
    // session-34 STATUS_LABELS seam, never the raw slug).
    const list = page.getByRole("list").filter({ has: page.getByText("Order placed", { exact: true }) });
    await expect(list).toBeVisible();
    await expect(list.getByText("Order placed", { exact: true })).toBeVisible();
    await expect(list.getByText("Status updated to In Transit", { exact: true })).toBeVisible();
    await expect(list.getByText("Status updated to Delivered", { exact: true })).toBeVisible();

    // The placed row's timestamp begins with the TZ-safe date part (the
    // formatOrderDate precedent — the full timestamp's clock time is
    // runner-TZ-dependent; the date part of 15:04Z is stable at UTC±8).
    await expect(list.getByText(/^Mar 28, 2026/).first()).toBeVisible();

    // R10-2 — the operator attribution NEVER renders: no actor emails, no
    // raw notes, no operator vocabulary (the admin's "Status changed").
    await expect(page.getByText(/by admin@luxestore\.com/)).toHaveCount(0);
    await expect(page.getByText("Seeded demo order")).toHaveCount(0);
    await expect(page.getByText("Status changed", { exact: true })).toHaveCount(0);
  });

  test("the refunded order's timeline carries the money story in order (ORD-2026-004, session-35 CUSTOMER-TIMELINE-1)", async ({ page }) => {
    await page.getByRole("tab", { name: "Orders" }).click();
    await page.getByRole("link", { name: "ORD-2026-004" }).click();
    await expect(page.getByRole("heading", { name: "ORD-2026-004", exact: true })).toBeVisible();

    // The full customer story: placed → cancelled → refunded (the money
    // story joins the fulfillment story — the seeded charge-then-refund
    // chain, Feb 22 13:45 → 14:03 → 14:03:30).
    const list = page.getByRole("list").filter({ has: page.getByText("Order placed", { exact: true }) });
    const labels = list.locator("p.font-medium");
    await expect(labels).toHaveCount(3);
    await expect(labels.nth(0)).toHaveText("Order placed");
    await expect(labels.nth(1)).toHaveText("Status updated to Cancelled");
    await expect(labels.nth(2)).toHaveText("Payment refunded");

    // R10-2 again, on the money story: the refund note's operator
    // vocabulary ("Refunded $79.99 via Stripe") never renders — the label
    // is the customer vocabulary.
    await expect(page.getByText("Refunded $79.99 via Stripe")).toHaveCount(0);
    await expect(page.getByText(/by admin@luxestore\.com/)).toHaveCount(0);
  });

  test("the owner gate: a non-owner gets the generic not-found block (GUEST-TOKEN-1 discipline)", async ({ browser, page }) => {
    // Grab john's ORD-2026-001 detail URL from the history link first.
    await page.getByRole("tab", { name: "Orders" }).click();
    const href = await page.getByRole("link", { name: "ORD-2026-001" }).getAttribute("href");
    expect(href).toMatch(/^\/account\/orders\//);

    // A signed-in NON-owner (the seeded admin — a customer-route non-owner
    // regardless of role; the second-context login draws from the admin
    // email's own rate-limit bucket, the stock-spec precedent).
    const ctx = await browser.newContext();
    const other = await ctx.newPage();
    await other.goto("/login");
    await other.getByLabel("Email").fill("admin@luxestore.com");
    await other.getByLabel("Password").fill("Admin1234!");
    await other.getByRole("button", { name: "Log in", exact: true }).click();
    await other.waitForURL("**/account");
    await other.goto(href!);

    // The GENERIC block — existence is never confirmed to a non-owner
    // (unknown id, not-owned id, and guest order all render the same).
    await expect(other.getByRole("heading", { name: "Order not found" })).toBeVisible();
    await expect(other.getByText("ORD-2026-001")).toHaveCount(0);
    await ctx.close();
  });

  test("anonymous visitors are redirected to login with intent (REDIRECT-1)", async ({ browser }) => {
    // The redirect fires before the lookup, so ANY id exercises it.
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("/account/orders/anything");
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)account(%2F|\/)orders(%2F|\/)anything$/);
    await ctx.close();
  });

});

test.describe("account mobile (session-9)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("profile Save button is fit-content on mobile (session-9, ACCOUNT-BTN-W-1)", async ({ page }) => {
    // Reference (iPhone 14, measured live 2026-10-08): the Save button is a
    // FLOW sibling of the fields grid (own mt-4) — inline-flex buttons in
    // flow layout size to their content: 127px wide. The clone had the
    // button INSIDE the grid; grid items stretch by default and the
    // `sm:col-span-2 sm:w-fit` constraints only apply ≥640px — mobile
    // rendered 308px. Desktop was 127px on both sites (the sm: mask).
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
    // The reference measured 127px in its Chrome; Playwright's Chromium
    // renders the same fit-content layout at 125px (font-metric drift of
    // 2px across builds). Pin the STRUCTURE (content-driven width, not
    // grid-stretched) with a range instead of a single engine's pixel.
    const btn = page.getByRole("button", { name: "Save Changes" });
    const width = await btn.evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeGreaterThanOrEqual(110);
    expect(width).toBeLessThanOrEqual(140);
    // The pre-fix bug stretched the button to the full grid cell (~308px).
    expect(width).toBeLessThan(200);
    // Flow child of the form (not a grid item) — the structural fix.
    const isFlowChild = await btn.evaluate(
      (el) => (el.parentElement as HTMLElement).tagName === "FORM",
    );
    expect(isFlowChild).toBe(true);
  });

  test("order rows stack vertically on mobile (session-9, ACCOUNT-ORDER-ROW-1)", async ({ page }) => {
    // The reference row is flex flex-col → sm:flex-row: on a 390px viewport
    // the badge/total block sits BELOW the number block.
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
    await page.getByRole("tab", { name: "Orders" }).click();
    const stacked = await page.evaluate(() => {
      const panel = document.querySelector('[role=tabpanel][data-state="active"]');
      const row = [...panel?.querySelectorAll("div") ?? []].find(
        (d) => d.className.includes("justify-between") && /ORD-2026-001/.test(d.textContent ?? ""),
      );
      if (!row) return null;
      const cs = getComputedStyle(row);
      const [left, right] = [...row.children] as HTMLElement[];
      return {
        flexDirection: cs.flexDirection,
        stacksVertically: right.getBoundingClientRect().y >= left.getBoundingClientRect().bottom - 1,
      };
    });
    expect(stacked?.flexDirection).toBe("column");
    expect(stacked?.stacksVertically).toBe(true);
  });
});
