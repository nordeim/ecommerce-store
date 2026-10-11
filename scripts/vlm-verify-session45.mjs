// VLM verification of the 5 new session-45 screenshots (236-240) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round45.mjs's probes — the resting
// addresses tab, the ZIP-gate error state, the exclusivity badge flip, the
// prefilled edit form, and the password field error) BEFORE this run —
// the round-40..44 lesson: describe reality, not intention. Round-45's own
// lesson applied: React 19 RESETS action-submitted forms after every
// submission — the invalid-state captures show EMPTY inputs + the error
// lines (the typed values were cleared by the reset; the DOM probe is the
// ground truth).
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry (npm --no-save);
// package.json + bun.lock are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "236-addresses-resting.png",
    expect: "A screenshot of the LUXE storefront ACCOUNT page, desktop width: an 'My Account' heading, a pill tab bar (Profile, Orders, Addresses, Settings — Addresses selected), a 'Saved Addresses' heading with an outlined 'Add New' button on the right, and ONE address card highlighted with a 2px orange-tinted border over a light wash: a small 'Default' badge, the name 'John Doe', '123 Main Street', 'New York, NY 10001', 'United States', and a borderless 'Edit' button at the card's top right.",
  },
  {
    file: "237-address-form-invalid-zip.png",
    expect: "The LUXE account Addresses tab with the add-address form OPEN (a tinted rounded form block): labeled inputs in a two-column grid (Label 'Home' pre-filled with dark text, Full Name pre-filled with dark text 'John Doe' — the account holder's name is the field's default value, Street Address, City, State, ZIP Code, Country 'United States' pre-filled). The Street Address and ZIP Code inputs show LIGHT-GRAY PLACEHOLDER text ('123 Main St' and '10001' — placeholder styling, NOT typed values; the City and State inputs are empty — the typed values were cleared by the form reset after the rejected submission). Beneath the ZIP Code input a small red error line reads 'Enter a valid ZIP code', and a red alert line with the same message 'Enter a valid ZIP code' appears near the bottom of the form above the orange 'Save Address' button and the outlined 'Cancel' button.",
  },
  {
    file: "238-default-exclusivity.png",
    expect: "The LUXE account Addresses tab after adding a new default address: TWO address cards. The FIRST card (the new one) is highlighted with the 2px orange-tinted border and carries the small 'Default' badge: 'Ada Lovelace', '742 Evergreen Terrace', 'Springfield, IL 62704', 'United States', with an Edit button. The SECOND card (the seeded one) has NO Default badge and NO highlight border: 'John Doe', '123 Main Street', 'New York, NY 10001', 'United States', with an Edit button — the default badge MOVED to the new card (exactly one default).",
  },
  {
    file: "239-edit-form-prefilled.png",
    expect: "The LUXE account Addresses tab with the EDIT form open (a tinted rounded form block): the labeled inputs PRE-FILLED with dark typed-value text — Full Name 'Ada Lovelace', Street Address '742 Evergreen Terrace', City 'Springfield', State 'IL', ZIP Code '62704', Country 'United States', Label 'Home' — and the 'Set as default address' checkbox CHECKED (a dark checkmark in the box). An orange 'Save Address' button and an outlined 'Cancel' button at the form's bottom. The address card list below.",
  },
  {
    file: "240-password-field-error.png",
    expect: "The LUXE account SETTINGS tab: an 'Account Settings' card with a 'Change Password' heading and three labeled password inputs stacked in a single column (Current Password, New Password, Confirm Password — all rendering EMPTY, the typed values cleared by the form reset after the rejected update). Beneath the empty New Password input a small red error line reads 'New password must be at least 8 characters'. An 'Update Password' button below the fields, and 'Notifications' and 'Session' sections further down the card.",
  },
];

let pass = 0;
for (const { file, expect } of checks) {
  const b64 = readFileSync(`${OUT}/${file}`).toString("base64");
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `Does this screenshot match the following description? Answer PASS or FAIL followed by one sentence of what you actually see.\n\nDESCRIPTION: ${expect}` },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });
  const content = res.choices[0].message.content ?? "";
  const ok = /PASS/i.test(content) && !/FAIL/i.test(content);
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"} — ${file}\n  ${content.slice(0, 260)}\n`);
}
console.log(`VLM: ${pass}/${checks.length} PASS`);
