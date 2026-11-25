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
