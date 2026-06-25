import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://fuelkenya.com";
  const apiBase = "https://api.fuelkenya.com/v1";

  let towns: string[] = [];
  try {
    const res = await fetch(`${apiBase}/towns`, {
      next: { revalidate: 86400 }
    });
    towns = await res.json();
  } catch (error) {
    console.error("Failed to fetch towns for sitemap", error);
  }

  const townUrls = towns.map((town: string) => ({
    url: `${baseUrl}/town/${town.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1.0
    },
    ...townUrls
  ];
}
