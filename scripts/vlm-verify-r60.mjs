// Round-60 VLM verification of captures 311-315 (the r53-r59 discipline:
// describe the surface as it IS — every description names DOM-probed facts
// only; sub-perceptual disputes settle by pixel measurement). The
// descriptions carry the live probe records: the resting tablist (the PDP
// variant — overflow-x visible), the Reviews panel swap (no ring on the
// clicked trigger), the keyboard-focused trigger (the ring paints), the
// account variant (the icons + the appended classes).
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();
const OUT = "docs/screenshots";

const checks = [
  {
    file: "311-pdp-tablist-resting.png",
    expect:
      "A desktop-viewport screenshot of an e-commerce product page (wireless over-ear headphones) scrolled to the information-tabs area below the product details: a wide light-gray pill-shaped container (a rounded rectangle with a soft beige-gray tint, about 36px tall, spanning the content column) holding three text tabs side by side starting from the left: 'Description' (the SELECTED tab — a white raised pill with dark text and a subtle drop shadow), then 'Reviews (234)' and 'Shipping' (unselected — transparent background, muted gray text). Below the tab list, the description paragraph text is visible. No orange focus ring or outline anywhere.",
  },
  {
    file: "312-reviews-panel-swap.png",
    expect:
      "The same e-commerce product page tabs area, captured after CLICKING the 'Reviews (234)' tab with a mouse: the 'Reviews (234)' tab is now the SELECTED one (a white raised pill with dark text and a subtle drop shadow), while 'Description' and 'Shipping' are unselected (transparent, gray text). Below the tab list, instead of the description paragraph, a centered gray placeholder message reads 'Customer reviews coming soon.'. Critically, the selected Reviews tab does NOT show any orange focus ring or halo around it (the mouse click leaves no visible focus indicator).",
  },
  {
    file: "313-clicked-trigger-no-ring.png",
    expect:
      "A close-up crop of a horizontal tab-list pill bar (a light beige-gray rounded container about 44px tall) with three tabs: 'Description' (unselected, gray text), 'Reviews (234)' (the SELECTED tab — a white pill with dark text and a soft drop shadow, NO orange ring or outline around it), and 'Shipping' (unselected, gray text). The crop contains ONLY the tab bar; no other page content.",
  },
  {
    file: "314-keyboard-focused-ring.png",
    expect:
      "A close-up crop of the same three-tab pill bar ('Description' gray/unselected, 'Reviews (234)' white selected pill, 'Shipping' gray/unselected), where the 'Reviews (234)' selected pill is KEYBOARD-FOCUSED: a visible bright ORANGE ring (about 2px of solid warm orange, with a thin white gap between the ring and the pill) traces the selected tab's rounded border, overlapping its soft drop shadow. The keyboard focus ring is the only orange element in the crop.",
  },
  {
    file: "315-account-variant.png",
    expect:
      "A desktop-viewport screenshot of an e-commerce account dashboard page: a bold dark text heading 'My Account' near the top, followed by a wide light-gray pill-shaped tab bar holding FOUR tabs, each with a small dark LINE-STYLE ICON (a person, a box, a map pin, a gear) followed by a text label: 'Profile' (the SELECTED tab — a white raised pill with dark text), then 'Orders', 'Addresses', 'Settings' (unselected — transparent, gray text). Below the selected Profile tab, a white account form card is partially visible with labeled text inputs. No orange focus rings anywhere.",
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
console.log(`\n${pass}/${checks.length} PASS`);
