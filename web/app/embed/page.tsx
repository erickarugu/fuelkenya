import type { Metadata } from "next";
import { fetchHistory, fetchTowns } from "@/lib/api";
import EmbedChart from "@/components/EmbedChart";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kenya fuel price chart",
  robots: { index: false, follow: true }
};

type Props = { searchParams: { town?: string; period?: string; theme?: string } };

export default async function EmbedPage({ searchParams }: Props) {
  const towns = await fetchTowns().catch(() => [] as string[]);
  const wanted = (searchParams.town ?? "Nairobi").trim().toLowerCase();
  const town = towns.find((t) => t.toLowerCase() === wanted) ?? "Nairobi";
  const history = await fetchHistory(town).catch(() => []);
  const theme = searchParams.theme === "light" ? "light" : "dark";

  return (
    <EmbedChart
      towns={towns}
      town={town}
      history={[...history].reverse()}
      period={searchParams.period ?? "1Y"}
      theme={theme}
    />
  );
}
