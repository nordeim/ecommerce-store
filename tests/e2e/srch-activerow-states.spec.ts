import { expect, test, type Locator, type Page } from "@playwright/test";

// Search typeahead popover ROW interaction states (session-61,
// SRCHROWS-STATES-1) — the pin-density sweep's nineteenth installment, the
// thrice-deferred standing next (r58/r59/r60 each deferred it behind the
// parity-family closure). The superset's own deep states: the reference has
// NO typeahead popover (established sessions 8/46/58 — its search is the
// strip alone), so the audit bar is the app's OWN token vocabulary + the
// WAI-ARIA combobox pattern (the production-superset bar).
//
// Ground truth (the probe scripts/srchrows-clone-r61a.mjs — the clone's
// popover live on the production standalone, 1024x768, query "an" -> 5
// seeded rows in sortOrder: wireless-headphones $299.99,
// organic-cotton-tee $49.99, ceramic-planter $79.99, linen-blanket $89.99,
// titanium-sunglasses $245.00):
//   - THE CONSISTENT SET (green before AND after — the artifact guards):
//     the container (bg-popover white, 1px hairline, radius 12px, z-50,
//     992 wide), the rows (60px, gap 12px, padding 10px 16px, the 40px
//     image, name 14px/500, category 12px muted lowercase), the hover
//     (bg accent rgb(253,243,237), NO text flip, cursor pointer), the Tab
//     path (rows are buttons; the focused row paints the GLOBAL outline
//     auto 1px ring/50 — the r59 heart-icon register), the click path, the
//     Escape path, the Enter-submits-query contract (srch-behavior P6).
//   - THE THREE FINDINGS (the honest REDs):
//     FINDING 1 (P1/P4): NO combobox/listbox semantics — the input carries
//     no role/aria-expanded/aria-controls/aria-autocomplete/
//     aria-activedescendant; the container no role=listbox/id; the rows no
//     role=option/aria-selected. The visible listbox is invisible to AT.
//     FINDING 2 (P6..P9, P13): NO arrow-key navigation — ArrowDown/Up do
//     nothing (measured); Enter always submits the query. The fix: an
//     active-row state machine (wrap-around, entry-from-top = LAST, the
//     accent bg paint, Enter commits the active row, query-change reset).
//     FINDING 3 (P2's price read): the price render bypasses formatCents
//     (search-bar.tsx:242 inlines `(s.price / 100).toFixed(2)`) — the only
//     storefront price outside the money.ts seam. Output byte-identical
//     today; the pin guards the math (M7's mutation).
//
// FILE-ORDER CONTRACT (the rate-limit discipline): /api/search is
// rate-limited 60/min/IP and srch-behavior.spec.ts's P11 (LAST) EXHAUSTS
// the budget with a 70-request 429 burst. This spec therefore sorts
// BEFORE srch-behavior (ASCII "srch-a..." < "srch-behavior") so its ~13
// typeahead requests draw from the FRESH budget — the same ordering
// discipline searchpanel-states documents ("search." < "searchpanel-" <
// "smoke." < "srch-"). Do NOT rename this file to sort after
// "srch-behavior": the inherited bucket 429s every typeahead request for
// up to 60s and the whole spec fails.

type PageT = import("@playwright/test").Page;

const openPanel = async (page: PageT) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator('header button[aria-label="Search"]').click();
  const input = page.getByLabel("Search products");
  await expect(input).toBeVisible();
  await page.waitForTimeout(450); // outlive the enter animation
  return input;
};

/** Open the panel, type a query, wait for the typeahead round trip. */
const typeForSuggestions = async (page: PageT, q: string) => {
  const input = await openPanel(page);
  await input.fill(q);
  await page.waitForResponse((r) => r.url().includes("/api/search"));
  await page.waitForTimeout(350); // the post-response paint settle
  const popover = page.locator("header .bg-popover");
  await expect(popover).toBeVisible();
  return { input, popover };
};

/** The computed interaction state of a suggestion row. */
const rowState = (row: Locator) =>
  row.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      selected: el.getAttribute("aria-selected"),
      role: el.getAttribute("role"),
      id: el.id,
    };
  });

test.describe("search popover row states (session-61, SRCHROWS-STATES-1)", () => {
  test("P1: the popover container's computed anatomy + the listbox semantics (bg white, 1px hairline, radius 12px, z-50, role/id/aria-label)", async ({ page }) => {
    const { popover } = await typeForSuggestions(page, "an");
    const d = await popover.evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        bg: s.backgroundColor,
        borderW: s.borderTopWidth,
        borderColor: s.borderTopColor,
        radius: s.borderRadius,
        z: s.zIndex,
        w: Math.round(r.width),
        h: Math.round(r.height),
        role: el.getAttribute("role"),
        id: el.id,
        label: el.getAttribute("aria-label"),
      };
    });
    // The container's computed set (the probe's measured ground truth):
    expect(d.bg).toBe("rgb(255, 255, 255)");
    expect(d.borderW).toBe("1px");
    expect(d.borderColor).toBe("rgb(233, 230, 226)");
    expect(d.radius).toBe("12px");
    expect(d.z).toBe("50");
    expect(d.w).toBe(1248); // the 1280 Desktop-Chrome viewport - the px-4 strip margins - left-4/right-4
    expect(d.h).toBe(302); // 5 rows x 60 + 2px border
    // FINDING 1's container half (RED pre-fix):
    expect(d.role).toBe("listbox");
    expect(d.id).toBe("search-suggestions");
    expect(d.label).toBe("Search suggestions");
  });

  test("P2: the row's resting anatomy (60px, gap 12px, padding 10px 16px, 40px image, name 14px/500, category lowercase muted) + the price renders the formatCents output", async ({ page }) => {
    const { popover } = await typeForSuggestions(page, "an");
    const row = popover.locator("button").first();
    const d = await row.evaluate((el) => {
      const s = getComputedStyle(el);
      const img = el.querySelector("img");
      const spans = Array.from(el.querySelectorAll("span"));
      const name = el.querySelector("span > span:nth-child(1)");
      const cat = el.querySelector("span > span:nth-child(2)");
      const price = spans[spans.length - 1];
      const r = el.getBoundingClientRect();
      const ir = img?.getBoundingClientRect();
      return {
        h: Math.round(r.height),
        gap: s.gap,
        padding: s.padding,
        imgW: ir ? Math.round(ir.width) : null,
        imgH: ir ? Math.round(ir.height) : null,
        imgRadius: img ? getComputedStyle(img).borderRadius : null,
        nameText: name?.textContent ?? null,
        nameFont: name ? getComputedStyle(name).fontSize + "/" + getComputedStyle(name).fontWeight : null,
        catText: cat?.textContent ?? null,
        catFont: cat ? getComputedStyle(cat).fontSize + "/" + getComputedStyle(cat).fontWeight : null,
        catColor: cat ? getComputedStyle(cat).color : null,
        priceText: price?.textContent ?? null,
        priceFont: price ? getComputedStyle(price).fontSize + "/" + getComputedStyle(price).fontWeight : null,
      };
    });
    expect(d.h).toBe(60);
    expect(d.gap).toBe("12px");
    expect(d.padding).toBe("10px 16px");
    expect(d.imgW).toBe(40);
    expect(d.imgH).toBe(40);
    expect(d.imgRadius).toBe("10px");
    expect(d.nameText).toBe("Wireless Noise-Cancelling Headphones");
    expect(d.nameFont).toBe("14px/500");
    expect(d.catText).toBe("electronics"); // lowercase — the session-8 SEARCH-CASE-1 register
    expect(d.catFont).toBe("12px/400");
    expect(d.catColor).toBe("rgb(111, 111, 123)");
    // FINDING 3's guard: the price renders the formatCents output
    // (integer cents -> the en-US currency string):
    expect(d.priceText).toBe("$299.99");
    expect(d.priceFont).toBe("14px/600");
  });

  test("P3: the row's hover — bg flips to the accent tint, NO text flip, cursor pointer", async ({ page }) => {
    const { popover } = await typeForSuggestions(page, "an");
    const row = popover.locator("button").nth(1);
    await row.hover();
    await page.waitForTimeout(250);
    const d = await row.evaluate((el) => {
      const s = getComputedStyle(el);
      const name = el.querySelector("span > span:nth-child(1)");
      return {
        matchesHover: el.matches(":hover"),
        bg: s.backgroundColor,
        color: s.color,
        cursor: s.cursor,
        nameColor: name ? getComputedStyle(name).color : null,
      };
    });
    expect(d.matchesHover).toBe(true);
    expect(d.bg).toBe("rgb(253, 243, 237)"); // --color-accent — the X button's hover pair
    expect(d.color).toBe("rgb(23, 23, 28)"); // NO text flip (rows keep foreground)
    expect(d.nameColor).toBe("rgb(23, 23, 28)");
    expect(d.cursor).toBe("pointer"); // the session-49 platform-cursor rule
  });

  test("P4: the input's combobox census (role, aria-expanded, aria-controls, aria-autocomplete)", async ({ page }) => {
    const { input } = await typeForSuggestions(page, "an");
    const d = await input.evaluate((el) => ({
      role: el.getAttribute("role"),
      expanded: el.getAttribute("aria-expanded"),
      controls: el.getAttribute("aria-controls"),
      autocomplete: el.getAttribute("aria-autocomplete"),
      label: el.getAttribute("aria-label"),
    }));
    // FINDING 1's input half (RED pre-fix):
    expect(d.role).toBe("combobox");
    expect(d.expanded).toBe("true"); // while the popover is open
    expect(d.controls).toBe("search-suggestions");
    expect(d.autocomplete).toBe("list");
    // The standing a11y superset (green before AND after):
    expect(d.label).toBe("Search products");
  });

  test("P5: the keyboard Tab path — the rows are tab stops and the focused row paints the global outline (the raw-button register)", async ({ page }) => {
    const { input } = await typeForSuggestions(page, "an");
    await input.click(); // ensure the caret sits in the input
    await page.keyboard.press("Tab"); // -> the Search submit button
    await page.keyboard.press("Tab"); // -> the X close button
    await page.keyboard.press("Tab"); // -> the FIRST suggestion row
    await page.waitForTimeout(120);
    const d = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return { tag: null as string | null };
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: el.textContent?.slice(0, 30) ?? "",
        matchesFV: el.matches(":focus-visible"),
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
      };
    });
    expect(d.tag).toBe("BUTTON");
    expect(d.text).toContain("Wireless Noise-Cancelling");
    // The r59 heart-icon register: keyboard-focused raw buttons paint the
    // browser-default auto outline tinted ring/50 by the global rule:
    expect(d.matchesFV).toBe(true);
    expect(d.outlineStyle).toBe("auto");
    expect(d.outlineWidth).toBe("1px");
  });

  test("P6 (THE HEADLINE): ArrowDown activates the first row — the accent bg, aria-selected, role=option, and the input's aria-activedescendant", async ({ page }) => {
    const { input, popover } = await typeForSuggestions(page, "an");
    await input.click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(150);
    const row1 = popover.locator("button").first();
    const d = await rowState(row1);
    // FINDING 2's headline (RED pre-fix):
    expect(d.role).toBe("option");
    expect(d.selected).toBe("true");
    expect(d.bg).toBe("rgb(253, 243, 237)"); // the active paint = the accent token (the hover's pair)
    expect(d.id).toBe("srch-opt-wireless-headphones");
    const ad = await input.getAttribute("aria-activedescendant");
    expect(ad).toBe("srch-opt-wireless-headphones");
    // The other rows are NOT active:
    const d2 = await rowState(popover.locator("button").nth(1));
    expect(d2.selected).toBe("false");
  });

  test("P7: the movement + the wrap — ArrowDown walks the rows and wraps from the LAST to the FIRST", async ({ page }) => {
    const { input, popover } = await typeForSuggestions(page, "an");
    await input.click();
    await page.keyboard.press("ArrowDown"); // row 1
    await page.keyboard.press("ArrowDown"); // row 2 (tee)
    await page.waitForTimeout(150);
    const row2 = popover.locator("button").nth(1);
    let d = await rowState(row2);
    expect(d.selected).toBe("true");
    expect(d.id).toBe("srch-opt-organic-cotton-tee");
    let d1 = await rowState(popover.locator("button").first());
    expect(d1.selected).toBe("false"); // the previous row de-activates
    // Walk to the LAST row (row 5 = titanium-sunglasses):
    await page.keyboard.press("ArrowDown"); // row 3
    await page.keyboard.press("ArrowDown"); // row 4
    await page.keyboard.press("ArrowDown"); // row 5
    await page.waitForTimeout(150);
    const row5 = popover.locator("button").nth(4);
    d = await rowState(row5);
    expect(d.selected).toBe("true");
    expect(d.id).toBe("srch-opt-titanium-sunglasses");
    // The wrap: one more ArrowDown lands back on the FIRST row:
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(150);
    d1 = await rowState(popover.locator("button").first());
    expect(d1.selected).toBe("true");
    d = await rowState(popover.locator("button").nth(4));
    expect(d.selected).toBe("false");
  });

  test("P8: the entry-from-top — ArrowUp from NO active row activates the LAST row (the listbox standard)", async ({ page }) => {
    const { input, popover } = await typeForSuggestions(page, "an");
    await input.click();
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(150);
    const row5 = popover.locator("button").nth(4);
    const d = await rowState(row5);
    expect(d.selected).toBe("true");
    expect(d.id).toBe("srch-opt-titanium-sunglasses");
    const ad = await input.getAttribute("aria-activedescendant");
    expect(ad).toBe("srch-opt-titanium-sunglasses");
  });

  test("P9: the Enter commit — with a row active, Enter navigates to that row's PDP (the panel closes)", async ({ page }) => {
    const { input } = await typeForSuggestions(page, "an");
    await input.click();
    await page.keyboard.press("ArrowDown"); // row 1 = wireless-headphones
    await page.waitForTimeout(150);
    await page.keyboard.press("Enter");
    await page.waitForURL("**/product/wireless-headphones");
    await expect(page.getByRole("heading", { name: "Wireless Noise-Cancelling Headphones" })).toBeVisible();
    // The panel closed with the navigation:
    await expect(page.getByLabel("Search products")).toHaveCount(0);
    await expect(page.locator("header .bg-popover")).toHaveCount(0);
  });

  test("P10: the Enter guard — popover open, NO row active, Enter submits the QUERY (the srch-behavior P6 contract preserved under the intercept)", async ({ page }) => {
    const { input } = await typeForSuggestions(page, "an");
    // No ArrowDown: no active row. Enter must keep submitting the query:
    await input.click();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/shop?search=an");
    await expect(page.getByRole("heading", { name: 'Results for "an"' })).toBeVisible();
  });

  test("P11: the click path — clicking a row navigates to the PDP (unchanged under the fix)", async ({ page }) => {
    const { popover } = await typeForSuggestions(page, "an");
    await popover.locator("button").nth(1).click(); // the tee row
    await page.waitForURL("**/product/organic-cotton-tee");
    await expect(page.getByRole("heading", { name: "Organic Cotton Oversized Tee" })).toBeVisible();
  });

  test("P12: the Escape path — with the popover open, Escape closes the panel (the popover + the input unmount)", async ({ page }) => {
    const { input } = await typeForSuggestions(page, "an");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700); // outlive the exit animation
    await expect(page.locator("header .bg-popover")).toHaveCount(0);
    await expect(page.getByLabel("Search products")).toHaveCount(0);
    expect(page.url()).toMatch(/\/$/); // no navigation — the panel just closes
  });

  test("P13: the query-change reset — typing more clears the active row (the stale-highlight guard)", async ({ page }) => {
    const { input, popover } = await typeForSuggestions(page, "an");
    await input.click();
    await page.keyboard.press("ArrowDown"); // row 1 active
    await page.waitForTimeout(150);
    let d = await rowState(popover.locator("button").first());
    expect(d.selected).toBe("true");
    // Type one more character ("ant" -> the planter row alone):
    await input.fill("ant");
    await page.waitForResponse((r) => r.url().includes("/api/search"));
    await page.waitForTimeout(350);
    const popover2 = page.locator("header .bg-popover");
    await expect(popover2).toBeVisible();
    const newRow = popover2.locator("button").first();
    d = await rowState(newRow);
    // The active row CLEARED on the query change:
    expect(d.selected).toBe("false");
    const ad = await input.getAttribute("aria-activedescendant");
    expect(ad).toBeNull();
  });

  test("P14: the @375 pass — the popover renders unclipped (343 wide, rows 60 tall, the hit-test) and the arrow activation works on mobile geometry", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const { input, popover } = await typeForSuggestions(page, "an");
    const d = await popover.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), x: Math.round(r.x) };
    });
    expect(d.w).toBe(343); // 375 - 2x16 strip margins
    expect(d.x).toBe(16);
    const row = popover.locator("button").first();
    const rd = await row.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(rd.w).toBe(341); // the container's 343 minus the 1px borders each side
    expect(rd.h).toBe(60);
    // The unclipped hit-test (the session-46 contract, srch-behavior P12's form):
    const hit = await row.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return !!at && (at === el || el.contains(at));
    });
    expect(hit).toBe(true);
    // The arrow activation works on the mobile geometry too:
    await input.click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(150);
    const st = await rowState(row);
    expect(st.selected).toBe("true");
    expect(st.bg).toBe("rgb(253, 243, 237)");
  });
});
