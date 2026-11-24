// Helpers for describing an EPRA pricing cycle in page copy and metadata.
// Dates from the API are plain YYYY-MM-DD strings; parse them as UTC so the
// server's timezone can't shift a cycle boundary by a day.

function parseDay(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`);
}

function fmt(isoDate: string, options: Intl.DateTimeFormatOptions) {
  return parseDay(isoDate).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    ...options
  });
}

/** "15 Nov – 14 Dec 2026" */
export function formatCycle(validFrom: string, validTo: string) {
  const from = fmt(validFrom, { day: "numeric", month: "short" });
  const to = fmt(validTo, { day: "numeric", month: "short", year: "numeric" });
  return `${from} – ${to}`;
}

/** "14 Dec" */
export function formatDayMonth(isoDate: string) {
  return fmt(isoDate, { day: "numeric", month: "short" });
}

/** "Nov 2026" */
export function formatMonthYear(isoDate: string) {
  return fmt(isoDate, { month: "short", year: "numeric" });
}

/**
 * How a price moved since the previous cycle, phrased for a sentence:
 * "unchanged at KSh 226.96", "up KSh 12.93 to KSh 226.96".
 */
export function describeChange(current: number, previous: number | null) {
  const now = `KSh ${current.toFixed(2)}`;
  if (previous === null) return `at ${now}`;
  const delta = Number((current - previous).toFixed(2));
  if (delta === 0) return `unchanged at ${now}`;
  const direction = delta > 0 ? "up" : "down";
  return `${direction} KSh ${Math.abs(delta).toFixed(2)} to ${now}`;
}
