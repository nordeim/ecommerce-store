// Round-39 pre-plan math verification (the independent oracle) — an INDEPENDENT oracle for the
// carrier-holiday refinement (hand-check every pinned instant + the holiday
// tables). This script does NOT import the seam; it re-implements the
// proposed math from first principles so the plan's expected strings are
// verified against an independent derivation (the audit's advice: deriving
// expectations from the seam itself would be tautological).

// --- The proposed holiday model (independent implementation) ---
// The six standard US carrier non-delivery dates (the UPS/FedEx ground
// tier set — NOT the USPS retail set): New Year's (Jan 1), Memorial Day
// (last Monday of May), Independence Day (Jul 4), Labor Day (first Monday
// of September), Thanksgiving (4th Thursday of November), Christmas (Dec 25).
// Exact-date policy: a fixed date falling on a weekend is already skipped
// by the weekday rule — no observed-day shift.
function nthWeekdayOfMonth(year, month, weekday, n) {
  // month is 0-based; weekday 0=Sun..6=Sat; n>=1 (first) or -1/-2 from the end
  if (n > 0) {
    const first = new Date(Date.UTC(year, month, 1));
    const offset = (weekday - first.getUTCDay() + 7) % 7;
    return new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7));
  }
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const offset = (lastDay.getUTCDay() - weekday + 7) % 7;
  return new Date(Date.UTC(year, month, lastDay.getUTCDate() - offset + (n + 1) * 7));
}
function carrierHolidaysForYear(year) {
  return [
    { name: "New Year's Day", date: new Date(Date.UTC(year, 0, 1)) },
    { name: "Memorial Day", date: nthWeekdayOfMonth(year, 4, 1, -1) }, // last Mon of May
    { name: "Independence Day", date: new Date(Date.UTC(year, 6, 4)) },
    { name: "Labor Day", date: nthWeekdayOfMonth(year, 8, 1, 1) }, // first Mon of Sep
    { name: "Thanksgiving", date: nthWeekdayOfMonth(year, 10, 4, 4) }, // 4th Thu of Nov
    { name: "Christmas Day", date: new Date(Date.UTC(year, 11, 25)) },
  ];
}
const iso = (d) => d.toISOString().slice(0, 10);
const dowName = (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];

console.log("=== HOLIDAY TABLES (the oracle values for the test pins) ===");
for (const y of [2026, 2027]) {
  for (const h of carrierHolidaysForYear(y)) {
    console.log(`${y}  ${h.name.padEnd(17)} ${iso(h.date)} (${dowName(h.date)})`);
  }
}

// --- The proposed window math (independent) ---
const holidayISO = new Set();
for (const y of [2025, 2026, 2027, 2028]) {
  for (const h of carrierHolidaysForYear(y)) holidayISO.add(iso(h.date));
}
const isDeliverable = (d) => {
  const dow = d.getUTCDay();
  return dow >= 1 && dow <= 5 && !holidayISO.has(iso(d));
};
function addDeliverableDays(start, n) {
  let cursor = start.getTime();
  let counted = 0;
  while (counted < n) {
    cursor += 86_400_000;
    if (isDeliverable(new Date(cursor))) counted += 1;
  }
  return new Date(cursor);
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmt(d) {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
function windowText(placedIso) {
  const placed = new Date(placedIso);
  const from = addDeliverableDays(placed, 3);
  const to = addDeliverableDays(placed, 7);
  const fy = from.getUTCFullYear();
  const ty = to.getUTCFullYear();
  if (fy === ty) {
    if (from.getUTCMonth() === to.getUTCMonth()) return `${fmt(from)} – ${to.getUTCDate()}, ${ty}`;
    return `${fmt(from)} – ${fmt(to)}, ${ty}`;
  }
  return `${fmt(from)}, ${fy} – ${fmt(to)}, ${ty}`;
}

console.log("\n=== THE PINNED INSTANTS (proposed-holiday vs current-holiday-blind) ===");
// Current (round-38) math for comparison: Mon-Fri only, no holidays.
function addBusinessDaysOnly(start, n) {
  let cursor = start.getTime();
  let counted = 0;
  while (counted < n) {
    cursor += 86_400_000;
    const dow = new Date(cursor).getUTCDay();
    if (dow >= 1 && dow <= 5) counted += 1;
  }
  return new Date(cursor);
}
function windowTextBlind(placedIso) {
  const placed = new Date(placedIso);
  const from = addBusinessDaysOnly(placed, 3);
  const to = addBusinessDaysOnly(placed, 7);
  const fy = from.getUTCFullYear();
  const ty = to.getUTCFullYear();
  if (fy === ty) {
    if (from.getUTCMonth() === to.getUTCMonth()) return `${fmt(from)} – ${to.getUTCDate()}, ${ty}`;
    return `${fmt(from)} – ${fmt(to)}, ${ty}`;
  }
  return `${fmt(from)}, ${fy} – ${fmt(to)}, ${ty}`;
}

const PINS = [
  ["ORD-2026-002 (Sunday, existing E2E pin basis)", "2026-03-15T10:22:00Z"],
  ["Saturday instant (existing pin)", "2026-03-28T15:04:05Z"],
  ["Friday instant (existing pin)", "2026-03-20T12:00:00Z"],
  ["cross-year (EXISTING pin — MUST UPDATE)", "2026-12-28T09:00:00Z"],
  ["Thanksgiving week (NEW pin)", "2026-11-24T12:00:00Z"],
  ["Christmas week (NEW pin)", "2026-12-21T12:00:00Z"],
  ["double holiday (NEW pin)", "2026-12-22T12:00:00Z"],
  ["Memorial Day (NEW pin — also the cross-month exact pin)", "2026-05-21T12:00:00Z"],
  ["Labor Day (NEW pin)", "2026-09-03T12:00:00Z"],
  ["Jul 4 weekend-fall (NEW policy pin — green through RED+GREEN)", "2026-07-02T12:00:00Z"],
];
for (const [label, iso_] of PINS) {
  const withH = windowText(iso_);
  const blind = windowTextBlind(iso_);
  const mark = withH === blind ? "SAME (no holiday in span)" : "SHIFTS (RED delta)";
  console.log(`${label.padEnd(58)} placed ${iso_}`);
  console.log(`${" ".repeat(58)}  holiday-aware: "${withH}"`);
  console.log(`${" ".repeat(58)}  holiday-blind: "${blind}"  <- ${mark}`);
}

console.log("\n=== FULL-YEAR 2026 SWEEP (the extended property pin) ===");
let weekendViol = 0, holidayViol = 0, inversions = 0, maxSpan = 0;
const violations = [];
for (let d = 0; d < 365; d++) {
  const placed = new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + d * 86_400_000);
  const text = windowText(placed.toISOString());
  // parse back (the test's three branches)
  let m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}) – (\d{1,2}), (\d{4})$/);
  let from, to;
  if (m) { from = new Date(Date.UTC(+m[4], MONTHS.indexOf(m[1]), +m[2])); to = new Date(Date.UTC(+m[4], MONTHS.indexOf(m[1]), +m[3])); }
  else {
    m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}) – ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
    if (m) { from = new Date(Date.UTC(+m[5], MONTHS.indexOf(m[1]), +m[2])); to = new Date(Date.UTC(+m[5], MONTHS.indexOf(m[3]), +m[4])); }
    else {
      m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4}) – ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
      from = new Date(Date.UTC(+m[3], MONTHS.indexOf(m[1]), +m[2])); to = new Date(Date.UTC(+m[6], MONTHS.indexOf(m[4]), +m[5]));
    }
  }
  if (from.getTime() > to.getTime()) { inversions++; violations.push(`INVERSION ${placed.toISOString().slice(0, 10)} "${text}"`); }
  for (const b of [from, to]) {
    const dow = b.getUTCDay();
    if (dow < 1 || dow > 5) { weekendViol++; violations.push(`WEEKEND ${placed.toISOString().slice(0, 10)} "${text}" bound ${iso(b)}`); }
    if (holidayISO.has(iso(b))) { holidayViol++; violations.push(`HOLIDAY ${placed.toISOString().slice(0, 10)} "${text}" bound ${iso(b)}`); }
  }
  const span = Math.round((to - from) / 86_400_000);
  if (span > maxSpan) maxSpan = span;
}
console.log(`365 placements: weekend violations=${weekendViol} holiday violations=${holidayViol} inversions=${inversions} maxCalSpan=${maxSpan}d`);
if (violations.length) { console.log("VIOLATIONS:"); violations.slice(0, 10).forEach((v) => console.log(" ", v)); }

// The holiday-blind math's violation count (the RED proof — the sweep FAILS today):
let blindViol = 0;
for (let d = 0; d < 365; d++) {
  const placed = new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + d * 86_400_000);
  const text = windowTextBlind(placed.toISOString());
  let m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}) – (\d{1,2}), (\d{4})$/);
  let from, to;
  if (m) { from = new Date(Date.UTC(+m[4], MONTHS.indexOf(m[1]), +m[2])); to = new Date(Date.UTC(+m[4], MONTHS.indexOf(m[1]), +m[3])); }
  else {
    m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}) – ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
    if (m) { from = new Date(Date.UTC(+m[5], MONTHS.indexOf(m[1]), +m[2])); to = new Date(Date.UTC(+m[5], MONTHS.indexOf(m[3]), +m[4])); }
    else {
      m = text.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4}) – ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
      from = new Date(Date.UTC(+m[3], MONTHS.indexOf(m[1]), +m[2])); to = new Date(Date.UTC(+m[6], MONTHS.indexOf(m[4]), +m[5]));
    }
  }
  for (const b of [from, to]) if (holidayISO.has(iso(b))) { blindViol++; break; }
}
console.log(`holiday-blind math (TODAY's code): ${blindViol} placements land a bound on a carrier holiday -> the extended sweep FAILS RED`);
