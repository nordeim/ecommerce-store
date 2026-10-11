/**
 * The shared UTC day-bound seam (session-41, ORDER-WINDOW-1, ADR-048) —
 * the date-range validation + boundary math the console's LIST surfaces
 * compose, extracted from admin-payments' private helpers (the
 * session-35 formatTimelineDate precedent: when a SECOND surface needs
 * the same pure helper, it moves to a shared seam instead of being
 * copied). The payments surface (PAY-OPS-3, session-26) owns the
 * pattern; the orders surface (ORDER-WINDOW-1, session-41) joins it —
 * the two seams' date handling is identical BY CONSTRUCTION, and both
 * seams' unit pins (which pin the boundary `Date` values exactly) are
 * the shared module's regression guards.
 *
 * PURE: Prisma-free, SDK-free, node-dependency-free — importable from
 * any seam (the pure-to-pure import convention).
 *
 * The contract (the PAY-OPS-3 form, unchanged):
 * - `parseDayBound` validates ONE raw bound: the strict `YYYY-MM-DD`
 *   shape (no time, no slashes, 4-2-2) + the Date round-trip (2026-02-30
 *   parses but normalizes to 2026-03-02 — not the same day; 2026-13-01
 *   parses NaN). Returns the canonical string, or undefined for anything
 *   else — a bad bound falls through to the unfiltered list, never an
 *   error (the parse family's fall-through philosophy).
 * - `utcDayBounds` builds the UTC day-boundary range: `gte` from's
 *   midnight, `lt` the midnight AFTER to (exclusive — to's whole day is
 *   in range; 86,400,000ms of one UTC day). Open-ended bounds stay
 *   open-ended.
 */

/** The strict shape a date bound must carry (no time, no slashes, 4-2-2). */
const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate one raw bound: the shape regex + the Date round-trip
 * (2026-02-30 parses but normalizes to 2026-03-02 — not the same day;
 * 2026-13-01 parses NaN). Returns the canonical string or undefined.
 */
export function parseDayBound(raw: string | undefined): string | undefined {
  if (!raw || !ISO_DAY_RE.test(raw)) return undefined;
  const t = Date.parse(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(t)) return undefined;
  if (new Date(t).toISOString().slice(0, 10) !== raw) return undefined;
  return raw;
}

/** The UTC day-boundary range a filtered query composes on its time column. */
export type UtcDayBounds = { gte?: Date; lt?: Date };

/**
 * Build the [fromStart, toEnd) range from validated bounds: `gte` from's
 * midnight (inclusive), `lt` the midnight AFTER to (exclusive — to's whole
 * day is in range). A missing bound leaves its side open-ended; both
 * missing yields the empty object (the caller's no-clause case).
 */
export function utcDayBounds(bound: { from?: string; to?: string }): UtcDayBounds {
  const range: UtcDayBounds = {};
  if (bound.from) {
    range.gte = new Date(`${bound.from}T00:00:00.000Z`);
  }
  if (bound.to) {
    // The day AFTER `to`, exclusive — 86,400,000ms of one UTC day.
    range.lt = new Date(Date.parse(`${bound.to}T00:00:00.000Z`) + 86_400_000);
  }
  return range;
}
