// Round-57 VLM verification of captures 296-300 (the r53-r56 discipline:
// describe the surface as it IS — every description names DOM-probed facts
// only; sub-perceptual disputes settle by pixel measurement). The
// descriptions carry the live probe records: the pill 77x22 orange, the
// 3-row timelines (the restored canonical stories — the round's honest
// RED's visible effect), the wrapped 375w header, the hover underline,
// the focus ring.
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync } from "node:fs";

const zai = await ZAI.create();

const shots = [
  {
    id: "296 (ORD-2026-001 desktop — the full read surface)",
    file: "docs/screenshots/296-orderdetail-001-desktop-full-read-surface.png",
    desc: `A full-page screenshot of an e-commerce order-detail page on a warm-white background. At the top of the content: a small outlined "← Orders" back button, followed by a large bold dark heading reading "ORD-2026-001", then a small solid ORANGE rounded pill reading "Delivered" in white text (the pill is tiny, about 77x22 pixels), then "$349.98" in large bold dark text pushed to the far right edge of the content area. Below: two side-by-side white cards with rounded corners and thin borders side by side — the left one titled "Payment" (rows reading "Method / Card ···· 4242" and "Placed / Mar 28, 2026"), the right one titled "Shipping Address" (an address block reading John Doe, 123 Main Street, New York, NY 10001, United States). Below those: a wider card titled "Items" containing TWO product rows, each a thin-bordered rounded rectangle with a small square product thumbnail on the left, a product name, a gray "unit price × qty" line, and a bold dollar amount on the right; then a "Subtotal / Shipping Free / Total" block at the card's bottom. At the page's bottom: a card titled "Timeline" with THREE rows, each row having a small light-gray circular icon holder on the left (a small dark icon inside), a short bold label, and a small gray date under it. A dark site header bar sits above the content and a dark footer with an email field sits below.`,
  },
  {
    id: "297 (ORD-2026-002 desktop — the in-transit surface, tracking + estimate)",
    file: "docs/screenshots/297-orderdetail-002-intransit-tracking-estimate.png",
    desc: `A full-page screenshot of an order-detail page on a warm-white background. The header: a small outlined "← Orders" button, the large bold heading "ORD-2026-002", a small LIGHT-GRAY rounded pill reading "In Transit" in dark text (about 71x22 pixels), and "$189.00" in large bold text at the far right. Directly under the heading row, a small gray line reading "Estimated delivery: Mar 18 – 24, 2026". Two side-by-side white cards follow — "Payment" and "Shipping Address"; the Shipping card additionally contains a "Tracking" section at its bottom reading "UPS · 1Z999AA10123456784" with the long tracking number rendered in ORANGE text. Below: the "Items" card with ONE product row (a small square thumbnail, a product name, a gray price line, a bold amount). At the bottom: the "Timeline" card with THREE rows (small light-gray circles with dark icons, bold labels, small gray dates). Dark header bar above, dark footer with an email field below.`,
  },
  {
    id: "298 (ORD-2026-001 at 375w — the responsive collapse)",
    file: "docs/screenshots/298-orderdetail-001-mobile-375-collapse.png",
    desc: `A full-page MOBILE-width screenshot of the same order-detail page, now in a single narrow column on a warm-white background. The heading area WRAPS onto two lines: the first line has the small outlined "← Orders" button and the large bold "ORD-2026-001" beside it; the second line has the small solid ORANGE "Delivered" pill on the left and "$349.98" in large bold text aligned to the RIGHT edge of the narrow content area. The two white cards that sat side-by-side on desktop now STACK VERTICALLY one above the other ("Payment" first, "Shipping Address" below). The "Items" card and the three-row "Timeline" card follow, all full-width. The dark site header at the top shows a compact mobile layout; the dark footer at the bottom stacks its sections.`,
  },
  {
    id: "299 (the tracking link's hover — the live underline)",
    file: "docs/screenshots/299-orderdetail-tracking-link-hover-underline.png",
    desc: `A desktop-viewport screenshot of the order-detail page. The relevant detail is inside the white "Shipping Address" card's lower section, a small "Tracking" area reading "UPS · 1Z999AA10123456784": the long tracking number "1Z999AA10123456784" is rendered in ORANGE text WITH A THIN UNDERLINE beneath it (the hover state, live during the capture) — the only underlined orange text on the page. The rest of the page shows the in-transit order: the light-gray "In Transit" pill near the heading, the two side-by-side cards, the start of the Items card below.`,
  },
  {
    id: "300 (the back link's focus ring — the real-Tab indicator)",
    file: "docs/screenshots/300-orderdetail-backlink-focus-ring.png",
    desc: `A desktop-viewport screenshot of the order-detail page where the FIRST interactive element — the small outlined "← Orders" back button at the top-left of the content area — carries a THIN ORANGE RING drawn tightly around its rounded-rectangle outline (the keyboard-focus indicator, live during the capture). The ring traces the button's rounded corners about 1px outside its border; no other element on the page shows any focus ring or outline. The rest of the page reads normally: the large bold "ORD-2026-002" heading, the light-gray "In Transit" pill, "$189.00" at the far right, the gray estimate line, the two side-by-side cards.`,
  },
];

let pass = 0;
let fail = 0;
for (const s of shots) {
  const b64 = readFileSync(s.file).toString("base64");
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Does this screenshot match the following description? Answer with exactly PASS or FAIL, then one short sentence of justification.\n\nDESCRIPTION: ${s.desc}`,
          },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  const answer = res.choices[0]?.message?.content ?? "";
  const verdict = answer.trim().toUpperCase().startsWith("PASS") ? "PASS" : "FAIL";
  console.log(`${verdict} ${s.id}`);
  console.log(`     ${answer.trim().slice(0, 220).replace(/\n/g, " ")}`);
  if (verdict === "PASS") pass++;
  else fail++;
}
console.log(`\n== r57 VLM: ${pass} PASS / ${fail} FAIL of ${shots.length} ==`);
