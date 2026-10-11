import { expect, test } from "@playwright/test";

// Session-45 (ACCOUNT-VALIDATION-1): the account family's validation paths +
// the address edit/default flows — the customer-surfaces pin-density sweep's
// third installment. The reference measured live (scripts/account-validation-
// probe-r45[a/b].mjs): its account family is FULLY COSMETIC (Add New opens
// NO form, Edit is inert, Profile/Password saves fire ZERO network calls, no
// validation copy anywhere) — every pin here is therefore a SUPERSET pin,
// zero parity risk by construction.
//
// The pins cover what the island + the server actions actually do (the code
// read line-by-line): the Zod field-level errors under the street/zip/email/
// password inputs, the form-level role=alert first-issue line, the recovery
// on fix (with the adjust-during-render collapse), the default-address
// exclusivity (the updateMany flip), the key={id} edit loop with its
// defaultValue prefill, the Cancel collapse, and the password rotation
// (proven via the change form itself — the old password stops verifying —
// WITHOUT consuming the login endpoint's rate-limit budget).
//
// Fixture contract: this file is named "acct-" so it sorts AFTER
// account.spec.ts (ASCII 'acct' > 'account' — verified:
// accessibility < account.spec < acct-validation < admin). The account
// family's existing resting assertions are single-card strict-mode pins
// (one Edit button, one "New York, NY 10001" text) written against the
// seeded one-card state; this spec's adds must not run before them. The
// [cleanup] test at the end still restores the seeded card's canonical
// fields + default badge (the belt-and-suspenders for any later consumer
// + the run-to-run contract with prisma/e2e-reset.ts's restores).

test.describe("account validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  });

  async function openAddresses(page: import("@playwright/test").Page) {
    await page.getByRole("tab", { name: "Addresses" }).click();
  }

  async function openAddressForm(page: import("@playwright/test").Page) {
    await page.getByRole("button", { name: "Add New" }).click();
    const main = page.getByRole("main");
    await expect(main.getByLabel("Street Address")).toBeVisible();
    return main;
  }

  // The field-level error <p> renders directly after its input (inside the
  // field wrapper) — the following-sibling locator pins it under the input.
  const fieldError = (input: import("@playwright/test").Locator) =>
    input.locator("xpath=following-sibling::p");

  test("P1: the address ZIP gate blocks a bad ZIP, the fix recovers (session-45, ACCOUNT-VALIDATION-1)", async ({ page }) => {
    await openAddresses(page);
    const main = await openAddressForm(page);
    await main.getByLabel("Full Name").fill("Ada Lovelace");
    await main.getByLabel("Street Address").fill("742 Evergreen Terrace");
    await main.getByLabel("City").fill("Springfield");
    await main.getByLabel("State").fill("IL");
    await main.getByLabel("ZIP Code").fill("abcde");
    await main.getByLabel("Country").fill("United States");
    await page.getByRole("button", { name: "Save Address" }).click();

    // The Zod zip regex gate renders under the input; the save is blocked.
    await expect(fieldError(main.getByLabel("ZIP Code"))).toHaveText("Enter a valid ZIP code");
    // The form is still open (no collapse without success).
    await expect(main.getByLabel("Street Address")).toBeVisible();

    // Recovery — re-fill the WHOLE form: React 19 resets action-submitted
    // forms' uncontrolled inputs to defaultValue after every submission
    // (success OR failure — measured first-hand this round), so the fixed
    // ZIP alone is not enough; the save succeeds and the card appears + the
    // form collapses (the adjust-during-render contract).
    await main.getByLabel("Full Name").fill("Ada Lovelace");
    await main.getByLabel("Street Address").fill("742 Evergreen Terrace");
    await main.getByLabel("City").fill("Springfield");
    await main.getByLabel("State").fill("IL");
    await main.getByLabel("ZIP Code").fill("62704");
    await main.getByLabel("Country").fill("United States");
    await page.getByRole("button", { name: "Save Address" }).click();
    await expect(main.getByText("742 Evergreen Terrace")).toBeVisible();
    await expect(main.getByLabel("Street Address")).toHaveCount(0);
  });

  test("P2: the two-level shape errors — the form alert carries the first issue, the street error renders under its input (session-45)", async ({ page }) => {
    await openAddresses(page);
    const main = await openAddressForm(page);
    await main.getByLabel("Full Name").fill("J"); // 1 char < 2 — no field <p> for fullName in the island
    await main.getByLabel("Street Address").fill("12"); // 2 chars < 3
    await main.getByLabel("City").fill("New York");
    await main.getByLabel("State").fill("NY");
    await main.getByLabel("ZIP Code").fill("10001");
    await main.getByLabel("Country").fill("United States");
    await page.getByRole("button", { name: "Save Address" }).click();

    // The form-level alert renders the FIRST issue (fullName precedes
    // street in addressSchema) — one alert, one message.
    await expect(main.getByRole("alert")).toHaveText("Full name is required");
    // ...while the street's own field error renders under its input.
    await expect(fieldError(main.getByLabel("Street Address"))).toHaveText("Street address is required");

    // Recovery — re-fill the whole form (the React-19 action reset, above)
    // with BOTH fields fixed and TEXT-DISTINCT coordinates (no added card
    // may duplicate the seeded card's "New York, NY 10001" line — the
    // strict-mode hygiene rule) -> the save succeeds.
    await main.getByLabel("Full Name").fill("Grace Hopper");
    await main.getByLabel("Street Address").fill("12 Navy Way");
    await main.getByLabel("City").fill("Arlington");
    await main.getByLabel("State").fill("VA");
    await main.getByLabel("ZIP Code").fill("22202");
    await main.getByLabel("Country").fill("United States");
    await page.getByRole("button", { name: "Save Address" }).click();
    await expect(main.getByText("12 Navy Way")).toBeVisible();
  });

  test("P3: the default-address exclusivity — a checked default moves the badge (session-45)", async ({ page }) => {
    await openAddresses(page);
    const main = await openAddressForm(page);
    const seeded = main.locator("div.rounded-xl").filter({ hasText: "123 Main Street" }).first();

    // Resting: the seeded card carries the Default badge.
    await expect(seeded.getByText("Default", { exact: true })).toBeVisible();

    await main.getByLabel("Full Name").fill("Katherine Johnson");
    await main.getByLabel("Street Address").fill("99 Computing Rd");
    await main.getByLabel("City").fill("Hampton");
    await main.getByLabel("State").fill("VA");
    await main.getByLabel("ZIP Code").fill("23681");
    await main.getByLabel("Country").fill("United States");
    await main.getByLabel("Set as default address").check();
    await page.getByRole("button", { name: "Save Address" }).click();

    // The updateMany flip: the NEW card is default, the seeded card is not —
    // exactly one badge in the list.
    const added = main.locator("div.rounded-xl").filter({ hasText: "99 Computing Rd" }).first();
    await expect(added.getByText("Default", { exact: true })).toBeVisible();
    await expect(seeded.getByText("Default", { exact: true })).toHaveCount(0);
  });

  test("P4: the edit loop — Edit opens the form prefilled, the change reaches the card (session-45)", async ({ page }) => {
    await openAddresses(page);
    const main = page.getByRole("main");

    // Edit the card P3 just made default (unique street).
    const card = main.locator("div.rounded-xl").filter({ hasText: "99 Computing Rd" }).first();
    await card.getByRole("button", { name: "Edit" }).click();

    // The form opens PREFILLED — the key={id} remount + defaultValue contract.
    await expect(main.getByLabel("Street Address")).toHaveValue("99 Computing Rd");
    await expect(main.getByLabel("City")).toHaveValue("Hampton");
    await expect(main.getByLabel("Full Name")).toHaveValue("Katherine Johnson");

    // Change the city -> Save -> the card renders the UPDATED city.
    await main.getByLabel("City").fill("Newport News");
    await page.getByRole("button", { name: "Save Address" }).click();
    const updated = main.locator("div.rounded-xl").filter({ hasText: "99 Computing Rd" }).first();
    await expect(updated.getByText("Newport News, VA 23681")).toBeVisible();
  });

  test("P5: Cancel collapses the form without writing (session-45)", async ({ page }) => {
    await openAddresses(page);
    const main = await openAddressForm(page);
    await main.getByLabel("Street Address").fill("999 Cancel Lane");
    await page.getByRole("button", { name: "Cancel" }).click();

    // The form collapses and no card with that street renders (no write).
    await expect(main.getByLabel("Street Address")).toHaveCount(0);
    await expect(main.getByText("999 Cancel Lane")).toHaveCount(0);
  });

  test("P6: the profile email-taken path renders the field error (session-45)", async ({ page }) => {
    await page.getByRole("tab", { name: "Profile" }).click();
    const main = page.getByRole("main");
    await main.getByLabel("Email").fill("admin@luxestore.com");
    await page.getByRole("button", { name: "Save Changes" }).click();
    // The dupe lookup's field error renders under the email input; no write.
    await expect(fieldError(main.getByLabel("Email"))).toHaveText("Email already in use");
  });

  test("P7: the profile success line renders (session-45)", async ({ page }) => {
    await page.getByRole("tab", { name: "Profile" }).click();
    const main = page.getByRole("main");
    await main.getByLabel("Phone").fill("+1 (555) 987-6543");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(main.getByText("Profile updated.")).toBeVisible();
    // (The e2e reset restores the demo phone — the run-to-run contract.)
  });

  test("P8: the short new-password gate renders the field error (session-45)", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    const main = page.getByRole("main");
    await main.getByLabel("Current Password").fill("Demo1234!");
    await main.getByLabel("New Password").fill("short");
    await main.getByLabel("Confirm Password").fill("short");
    await page.getByRole("button", { name: "Update Password" }).click();
    // noValidate on this form — the server-side Zod min(8) is the only gate.
    await expect(fieldError(main.getByLabel("New Password"))).toHaveText(
      "New password must be at least 8 characters",
    );
  });

  test("P9: the password mismatch gate renders the field error (session-45)", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    const main = page.getByRole("main");
    await main.getByLabel("Current Password").fill("Demo1234!");
    await main.getByLabel("New Password").fill("NewPass1234!");
    await main.getByLabel("Confirm Password").fill("Different1234!");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(fieldError(main.getByLabel("Confirm Password"))).toHaveText("Passwords do not match");
  });

  test("P10: the password rotation — the success line, the old hash dies, the restore (session-45)", async ({ page }) => {
    await page.getByRole("tab", { name: "Settings" }).click();
    const main = page.getByRole("main");

    // Rotate: Demo1234! -> FreshPass1234!.
    await main.getByLabel("Current Password").fill("Demo1234!");
    await main.getByLabel("New Password").fill("FreshPass1234!");
    await main.getByLabel("Confirm Password").fill("FreshPass1234!");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(main.getByText("Password updated.")).toBeVisible();

    // The OLD password no longer verifies — proven through the change form
    // itself (scryptVerify against the stored hash), consuming none of the
    // login endpoint's rate-limit budget.
    await main.getByLabel("Current Password").fill("Demo1234!");
    await main.getByLabel("New Password").fill("AnotherPass99!");
    await main.getByLabel("Confirm Password").fill("AnotherPass99!");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(fieldError(main.getByLabel("Current Password"))).toHaveText("Incorrect password");

    // Restore the fixture password (the new hash verifies — the rotation's
    // own proof — and every later spec sees Demo1234! again).
    await main.getByLabel("Current Password").fill("FreshPass1234!");
    await main.getByLabel("New Password").fill("Demo1234!");
    await main.getByLabel("Confirm Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(main.getByText("Password updated.")).toBeVisible();
  });

  // [cleanup] NOT a pin — the fixture-restore housekeeping (this file sorts
  // BEFORE account.spec.ts: '-' < '.'; the within-run isolation contract).
  // Restores the seeded card's canonical fields AND its Default badge (P3
  // flipped it, P4 moved the edited card's city — the seeded card itself was
  // never edited, only its badge state changed).
  test("[cleanup] restore the seeded address fixtures for the following specs (session-45)", async ({ page }) => {
    await openAddresses(page);
    const main = page.getByRole("main");
    const seeded = main.locator("div.rounded-xl").filter({ hasText: "123 Main Street" }).first();
    await seeded.getByRole("button", { name: "Edit" }).click();

    // The edit form opens prefilled with the canonical values.
    await expect(main.getByLabel("Street Address")).toHaveValue("123 Main Street");
    await expect(main.getByLabel("City")).toHaveValue("New York");
    // Re-check default -> the badge returns to the seeded card.
    await main.getByLabel("Set as default address").check();
    await page.getByRole("button", { name: "Save Address" }).click();

    await expect(seeded.getByText("New York, NY 10001")).toBeVisible();
    await expect(seeded.getByText("Default", { exact: true })).toBeVisible();
  });
});
