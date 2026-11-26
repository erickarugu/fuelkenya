import { MetadataRoute } from "next";
import { slugifyTown } from "@/lib/api";

const baseUrl = "https://fuelkenya.com";
const apiBase =
  process.env.NEXT_PUBLIC_FUELKENYA_API_URL ?? "https://api.fuelkenya.com/v1";

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${path} for sitemap`, error);
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [towns, newest, cycles] = await Promise.all([
    getJson<string[]>("/towns"),
    getJson<{ valid_from: string }[]>("/prices?limit=1"),
    getJson<{ valid_from: string; valid_to: string }[]>("/cycles")
  ]);

  // Pages only change when EPRA publishes a new cycle. Using the cycle start
  // date (instead of "now" on every build) keeps lastmod a signal Google trusts.
  const lastModified = newest?.[0]?.valid_from
    ? new Date(`${newest[0].valid_from}T00:00:00+03:00`)
    : undefined;

  const townUrls = (towns ?? []).map((town) => ({
    url: `${baseUrl}/town/${slugifyTown(town)}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8
  }));

  const reviewMonths = new Map<string, string>();
  for (const c of cycles ?? []) {
    const slug = c.valid_from.slice(0, 7);
    if (!reviewMonths.has(slug)) reviewMonths.set(slug, c.valid_from);
  }
  const reviewUrls = [...reviewMonths].map(([slug, from]) => ({
    url: `${baseUrl}/epra-review/${slug}`,
    lastModified: new Date(`${from}T00:00:00+03:00`),
    changeFrequency: "yearly" as const,
    priority: 0.6
  }));

  return [
    {
      url: `${baseUrl}/epra-review`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8
    },
    ...reviewUrls,
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 1.0
    },
    {
      url: `${baseUrl}/data`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7
    },
    {
      url: `${baseUrl}/towns`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9
    },
    ...townUrls
  ];
}
