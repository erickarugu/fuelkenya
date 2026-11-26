import type { PriceRecord } from "@/lib/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/** "2026-11" -> "November 2026" */
export function monthLabel(slug: string) {
  const [y, m] = slug.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** "2026-11-15" -> "15 Nov 2026" */
export function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function ksh(n: number) {
  return `KSh ${n.toFixed(2)}`;
}

export function change(now: number, before?: number) {
  if (before === undefined) return null;
  return Math.round((now - before) * 100) / 100;
}

export function describeChange(delta: number | null) {
  if (delta === null) return "no earlier price";
  if (delta === 0) return "unchanged";
  return `${delta > 0 ? "up" : "down"} KSh ${Math.abs(delta).toFixed(2)}`;
}

export function byTown(rows: PriceRecord[]) {
  return new Map(rows.map((r) => [r.town.toLowerCase(), r]));
}

export const MONTH_SLUG_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
