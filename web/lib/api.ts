export interface PriceRecord {
  id: number;
  town: string;
  super_petrol: number;
  diesel: number;
  kerosene: number;
  valid_from: string;
  valid_to: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_FUELKENYA_API_URL ?? "http://localhost:8000/v1";

// Prices change once a month, so every page view does not need a fresh API
// call. Five minutes keeps review-day updates quick while letting a traffic
// spike be served from Next's data cache instead of hammering the API.
export const PRICE_REVALIDATE_SECONDS = 300;

// Server-only secret (no NEXT_PUBLIC_ prefix, so it never reaches the
// browser). When set to the API's TRUSTED_CLIENT_TOKEN, server renders skip
// the API's per-IP rate limit, which they would otherwise share.
function apiHeaders(): HeadersInit | undefined {
  const token = process.env.FUELKENYA_API_TOKEN;
  return token ? { "X-FuelKenya-Client-Token": token } : undefined;
}

/** Every price fetch carries this tag; POST /api/revalidate clears it after an upload. */
export const PRICE_CACHE_TAG = "prices";

async function apiFetch<T>(path: string): Promise<T> {
  // fresh=1 makes the API answer with no-store, so the CDN in front of it never
  // hands us a copy from before the latest upload. Our own data cache (tagged
  // below) is what keeps traffic off the API.
  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}fresh=1`;
  const res = await fetch(url, {
    headers: apiHeaders(),
    next: { revalidate: PRICE_REVALIDATE_SECONDS, tags: [PRICE_CACHE_TAG] }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

export function slugifyTown(town: string) {
  return town.toLowerCase().replace(/\s+/g, "-");
}

export async function fetchTowns() {
  return apiFetch<string[]>("/towns");
}

/**
 * Latest cycle prices. With a town, the result is filtered from the single
 * all-towns response, so 230 town pages share one cached API call.
 */
export async function fetchLatestPrices(town?: string) {
  const all = await apiFetch<PriceRecord[]>("/prices/latest");
  if (!town) return all;
  const key = town.trim().toLowerCase();
  return all.filter((row) => row.town.toLowerCase() === key);
}

/** Every cycle on record for a town, newest first (callers rely on that order). */
export async function fetchHistory(town: string) {
  return apiFetch<PriceRecord[]>(
    `/prices?town=${encodeURIComponent(town)}&limit=1000&offset=0`
  );
}

export async function fetchTownPriceSummary(town: string) {
  const list = await fetchLatestPrices(town);
  return list[0] ?? null;
}

export interface ExportRow {
  town: string;
  valid_from: string;
  valid_to: string;
  super_petrol: number;
  diesel: number;
  kerosene: number;
  towns_in_cycle: number;
  coverage: string;
  source: string;
}

export interface ExportPayload {
  license: string;
  attribution: string;
  columns: string[];
  count: number;
  data: ExportRow[];
}

/** The full price history (every town, every cycle); powers the /data page. */
export async function fetchExport() {
  return apiFetch<ExportPayload>("/export.json");
}

export const EXPORT_CSV_URL = `${BASE_URL}/export.csv`;
export const EXPORT_JSON_URL = `${BASE_URL}/export.json`;

export interface Cycle {
  valid_from: string;
  valid_to: string;
  towns: number;
}

/** Every pricing cycle on record, newest first. */
export async function fetchCycles() {
  return apiFetch<Cycle[]>("/cycles");
}

/** All town prices for one cycle. */
export async function fetchCyclePrices(cycle: Pick<Cycle, "valid_from" | "valid_to">) {
  return apiFetch<PriceRecord[]>(
    `/prices?start_date=${cycle.valid_from}&end_date=${cycle.valid_to}&limit=1000&offset=0`
  );
}

/** "2026-11-15" -> "2026-11", the slug of that month's /epra-review page. */
export function reviewSlug(validFrom: string) {
  return validFrom.slice(0, 7);
}

/** Public URL the browser posts alert signups to. */
export const ALERTS_SUBSCRIBE_URL = `${BASE_URL}/alerts/subscribe`;
