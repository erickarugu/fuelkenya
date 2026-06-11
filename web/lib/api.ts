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
  process.env.NEXT_PUBLIC_FUELKENYA_API_URL ?? "http://localhost:8000/api/v1";

async function safeFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

export async function fetchTowns() {
  return safeFetch<string[]>(`${BASE_URL}/towns`);
}

export async function fetchLatestPrices(town?: string) {
  const query = town ? `?town=${encodeURIComponent(town)}` : "";
  return safeFetch<PriceRecord[]>(`${BASE_URL}/prices/latest${query}`);
}

export async function fetchHistory(town: string) {
  return safeFetch<PriceRecord[]>(
    `${BASE_URL}/prices?town=${encodeURIComponent(town)}&limit=12&offset=0`
  );
}

export async function fetchTownPriceSummary(town: string) {
  const list = await fetchLatestPrices(town);
  return list[0] ?? null;
}
