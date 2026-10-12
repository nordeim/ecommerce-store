// VLM verification of the 5 new session-47 screenshots (246-250) — the
// createVision call per the session-17 lesson. Descriptions verified
// against the live DOM (scripts/capture-round47.mjs's probes — the
// short-password box, the mismatch-priority box, the login + forgot
// pending labels, and the rate-limit exhausted box) BEFORE this run —
// the round-40..46 lesson: describe reality, not intention; the DOM
// probe is the ground truth. The React-19 action reset (L38) means the
// password inputs render EMPTY with their dot placeholders after a
// failed submit — the placeholder-masking lesson from rounds 44/45.
// NOTE: z-ai-web-dev-sdk is NOT a repo dependency (DEPS-1 pruning) — this
// run uses the environment's node_modules carry; package.json + bun.lock
// are untouched.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "/home/z/my-project/ecommerce-store/docs/screenshots";

const checks = [
  {
    file: "246-register-short-password-box.png",
    expect:
      "A screenshot of the LUXE REGISTER page (standalone auth screen, desktop width, no storefront header): centered card with a rounded square icon tile, the bold heading 'Create your account' and its subtitle ABOVE the card, the 'Continue with Google' outline button, an 'or' divider, and a TINTED ROUNDED ERROR BOX directly above the form reading 'Password must be at least 8 characters long' in reddish text on a light red-tinted background. Below it the form: the Email input showing the dark typed text 'capture-r47@example.com' (a real typed value), while the Password and Confirm Password inputs are EMPTY showing light-gray dot placeholders '••••••••' (placeholder styling — the form reset its uncontrolled inputs after the failed submit). Icons inside the inputs on the left; a full-width primary button at the bottom.",
  },
  {
    file: "247-register-mismatch-priority-box.png",
    expect:
      "The same LUXE REGISTER page (standalone, no header): the tinted rounded ERROR BOX directly above the form reading 'Passwords do not match' in reddish text on a light red-tinted background (the mismatch copy is shown even though the password is also too short — the round's mismatch-first priority fix). Above the box: the 'Continue with Google' outline button and the 'or' divider. Below the box: the icon-led Email / Password / Confirm Password inputs (the password fields render as standard masked password inputs showing dots — their placeholder presentation, not typed values) and the full-width primary 'Create account' button at the bottom.",
  },
  {
    file: "248-login-pending-label.png",
    expect:
      "A screenshot of the LUXE LOGIN page (standalone auth screen, desktop width, no storefront header) captured DURING an in-flight submit: centered card with the 'Welcome back' heading above it, 'Continue with Google' outline button, 'or' divider, the Email and Password inputs (icon-led, filled), and the full-width primary submit button reading 'Logging in...' (three dots) — the button is in its DISABLED pending state (the in-flight window; the label is the round's ASCII-dots parity fix). No error box is visible yet (the response has not landed).",
  },
  {
    file: "249-forgot-pending-label.png",
    expect:
      "A screenshot of the LUXE 'Reset password' FORGOT-PASSWORD page (standalone auth screen, desktop width, no storefront header) captured DURING an in-flight submit: centered card with the 'Reset password' heading and 'We'll send you a link to reset it' subtitle above it, a single icon-led Email address input (filled), and the full-width primary submit button reading 'Sending...' (three dots) rendered DIMMED / faded — the disabled pending state (roughly half opacity). A 'Back to log in' link under the card. No error box (the response has not landed).",
  },
  {
    file: "250-login-rate-limit-exhausted.png",
    expect:
      "A screenshot of the LUXE LOGIN page (standalone, no header) with a TINTED ROUNDED ERROR BOX reading 'Too many attempts. Try again in 889s.' in reddish text on a light red-tinted background. The card's vertical order from the top: the 'Continue with Google' outline button, the 'or' divider, the error box, then the form — the icon-led Email input showing its light-gray 'you@example.com' PLACEHOLDER (an empty field — the text is the placeholder, not a typed value), the Password input rendering as a masked password field with dot placeholder, and the full-width primary 'Log in' button at the bottom.",
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
          {
            type: "text",
            text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: ${expect}`,
          },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  const answer = (res.choices[0]?.message?.content ?? "").trim();
  const ok = /^PASS/i.test(answer);
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}  —  ${answer.slice(0, 150).replace(/\n/g, " ")}`);
  if (ok) pass++;
}
console.log(`\nVLM VERIFICATION: ${pass}/${checks.length}`);
process.exit(pass === checks.length ? 0 : 1);
