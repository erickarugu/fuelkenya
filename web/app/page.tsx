import dynamicImport from "next/dynamic";
import PriceCard from "@/components/PriceCard";
import RegionVariance from "@/components/RegionVariance";
import SearchBar from "@/components/SearchBar";
import UpdateCountdown from "@/components/UpdateCountdown";
import { fetchHistory, fetchLatestPrices, fetchTowns } from "@/lib/api";

export const dynamic = "force-dynamic";

const TrendChart = dynamicImport(() => import("@/components/TrendChart"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-stone-500">
      Loading chart…
    </div>
  )
});

interface Props {
  searchParams?: { town?: string };
}

function calculateDelta(current: number, previous: number | null) {
  if (previous === null) return null;
  return Number((current - previous).toFixed(2));
}

function getActiveCycle() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (day < 15) {
    // Current cycle started on 15th of previous month
    const startMonth = month === 0 ? 11 : month - 1;
    const startYear = month === 0 ? year - 1 : year;
    const endMonth = month;
    const endYear = year;
    const startDate = new Date(startYear, startMonth, 15);
    const endDate = new Date(endYear, endMonth, 14);
    return {
      start: startDate,
      end: endDate,
      display: `${startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    };
  } else {
    // Current cycle started on 15th of this month
    const startDate = new Date(year, month, 15);
    const endMonth = month === 11 ? 0 : month + 1;
    const endYear = month === 11 ? year + 1 : year;
    const endDate = new Date(endYear, endMonth, 14);
    return {
      start: startDate,
      end: endDate,
      display: `${startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    };
  }
}

export default async function Page({ searchParams }: Props) {
  const activeTown = searchParams?.town ? String(searchParams.town) : "Nairobi";
  const towns = await fetchTowns();
  const town = towns.includes(activeTown)
    ? activeTown
    : (towns[0] ?? activeTown);
  const [history, latestPrices] = await Promise.all([
    fetchHistory(town),
    fetchLatestPrices(town)
  ]);

  const latest = latestPrices[0] ?? history[0] ?? null;
  const previous = history.length > 1 ? history[1] : null;
  const historyReversed = [...history].reverse();

  const petrolDelta = latest
    ? calculateDelta(latest.super_petrol, previous?.super_petrol ?? null)
    : null;
  const dieselDelta = latest
    ? calculateDelta(latest.diesel, previous?.diesel ?? null)
    : null;
  const keroseneDelta = latest
    ? calculateDelta(latest.kerosene, previous?.kerosene ?? null)
    : null;

  const cycle = getActiveCycle();

  const regionalOverview = [
    { name: "Mombasa", price: 199.99 },
    { name: "Mandera", price: 221.75 }
  ];

  return (
    <div className="min-h-screen bg-kenya.sand px-6 py-8 text-stone-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="relative overflow-hidden rounded-[2rem] border border-kenya.dark/10 bg-white/90 px-6 py-5 shadow-[0_30px_80px_-40px_rgba(0,77,49,0.25)] backdrop-blur-xl">
          <div className="absolute inset-0 pointer-events-none opacity-80">
            <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-kenya.amber/20 blur-3xl float-up" />
            <div className="absolute right-4 top-10 h-24 w-24 rounded-full bg-kenya.dark/10 blur-3xl" />
          </div>
          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_560px_minmax(0,1fr)] lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-kenya.dark via-kenya.forest to-kenya.grass text-white shadow-sm">
                ⛽
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-kenya.red font-semibold">
                  FuelKenya
                </p>
                <h1 className="text-3xl font-black tracking-tight text-kenya.dark sm:text-4xl">
                  The fuel dashboard Kenya trusts.
                </h1>
                <div className="mt-3 text-sm leading-7 text-stone-600">
                  Real-time EPRA pricing for every town, with polished trend
                  insights and local context.
                </div>
              </div>
            </div>

            <div className="w-full">
              <SearchBar activeTown={town} towns={towns} inHeader />
            </div>

            <div className="flex items-center justify-between gap-4 text-sm lg:justify-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-kenya.dark/10 bg-kenya.sand px-3 py-2 text-kenya.dark">
                <span className="h-2 w-2 rounded-full bg-kenya.dark" />
                Live sync
              </span>
              <a
                className="inline-flex items-center gap-1 rounded-full border border-kenya.dark/10 bg-white px-3 py-2 text-kenya.dark transition hover:bg-kenya.sand"
                href="/api/v1/openapi.json"
              >
                API Docs <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-kenya.dark/10 bg-gradient-to-r from-kenya.sand/90 via-white to-kenya.sand/90 p-6">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.95fr] lg:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-kenya.dark/70">
                Live Kenyan fuel index
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-kenya.dark sm:text-4xl">
                The most trusted fuel-price dashboard for every Kenyan town.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
                Real-time EPRA price tracking for Super Petrol, Diesel, and
                Kerosene.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-kenya.dark/10 bg-white px-4 py-2 text-kenya.dark">
                  150+ towns covered
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-kenya.dark/10 bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-[0.35em] text-kenya.dark">
                  Next refresh
                </div>
                <div className="mt-3">
                  <UpdateCountdown />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-kenya.dark/10 bg-white p-5">
                  <div className="text-xs uppercase tracking-[0.35em] text-kenya.dark">
                    Active cycle
                  </div>
                  <div className="mt-3 text-lg font-semibold text-kenya.dark">
                    {cycle.display}
                  </div>
                </div>
                <div className="rounded-3xl border border-kenya.dark/10 bg-white p-5">
                  <div className="text-xs uppercase tracking-[0.35em] text-kenya.dark">
                    Last update
                  </div>
                  <div className="mt-3 text-lg font-semibold text-kenya.dark">
                    Today · 18:00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-12">
          <aside className="md:col-span-4">
            <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
              <div className="text-sm uppercase tracking-[0.35em] text-kenya.dark">
                Context & status
              </div>
              <div className="rounded-3xl border border-kenya.dark/10 bg-kenya.sand p-6">
                <div className="text-xs uppercase tracking-[0.35em] text-kenya.red">
                  Active cycle
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-kenya.dark">
                  {cycle.display}
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Current EPRA pricing period for the latest published national
                  prices.
                </p>
              </div>
              <div className="grid gap-4 text-stone-900">
                <div className="rounded-3xl border border-kenya.dark/10 bg-kenya.sand p-4">
                  <div className="text-xs uppercase tracking-[0.35em] text-kenya.dark">
                    Active town
                  </div>
                  <div className="mt-2 text-lg font-semibold text-kenya.dark">
                    {town}
                  </div>
                </div>
                <div className="rounded-3xl border border-kenya.dark/10 bg-kenya.sand p-4">
                  <div className="text-xs uppercase tracking-[0.35em] text-kenya.dark">
                    Data status
                  </div>
                  <div className="mt-2 text-lg font-semibold text-kenya.dark">
                    Latest valid cycle
                  </div>
                </div>
                <div className="rounded-3xl border border-kenya.dark/10 bg-kenya.sand p-4">
                  <div className="text-xs uppercase tracking-[0.35em] text-kenya.dark">
                    Report status
                  </div>
                  <div className="mt-2 text-sm text-stone-600">
                    Latest market data available
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="md:col-span-8 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <PriceCard
                title="Super Petrol"
                value={latest?.super_petrol ?? 0}
                delta={petrolDelta}
                accent="forest"
              />
              <PriceCard
                title="Diesel"
                value={latest?.diesel ?? 0}
                delta={dieselDelta}
                accent="maasai"
              />
              <PriceCard
                title="Kerosene"
                value={latest?.kerosene ?? 0}
                delta={keroseneDelta}
                accent="obsidian"
              />
            </div>

            <TrendChart history={historyReversed} />
          </section>
        </div>

        <RegionVariance overview={regionalOverview} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "FuelKenya Price Dataset",
            description:
              "Latest EPRA fuel prices for Kenyan towns including Super Petrol, Diesel, and Kerosene.",
            distribution: [
              {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: "https://fuel.co.ke/api/v1/prices/latest"
              }
            ]
          })
        }}
      />
    </div>
  );
}
