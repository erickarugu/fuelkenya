import dynamicImport from "next/dynamic";
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import RegionVariance from "@/components/RegionVariance";
import SearchBar from "@/components/SearchBar";
import UpdateCountdown from "@/components/UpdateCountdown";
import FuelEstimator from "@/components/FuelEstimator";
import InfoCards from "@/components/InfoCards";
import AnimatedTownSection from "@/components/AnimatedTownSection";
import HeroVisual from "@/components/HeroVisual";
import { fetchHistory, fetchLatestPrices, fetchTowns } from "@/lib/api";

export const dynamic = "force-dynamic";

const POPULAR_TOWNS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika"];

const TrendChart = dynamicImport(() => import("@/components/TrendChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02] text-sm text-stone-500">
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

  let startDate: Date, endDate: Date;

  if (day < 15) {
    const sm = month === 0 ? 11 : month - 1;
    const sy = month === 0 ? year - 1 : year;
    startDate = new Date(sy, sm, 15);
    endDate   = new Date(year, month, 14);
  } else {
    startDate = new Date(year, month, 15);
    const em  = month === 11 ? 0 : month + 1;
    const ey  = month === 11 ? year + 1 : year;
    endDate   = new Date(ey, em, 14);
  }

  const fmt = (d: Date, yr = false) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(yr ? { year: "numeric" } : {}) });

  return { display: `${fmt(startDate)} – ${fmt(endDate, true)}` };
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">{label}</span>
        {sub && (
          <>
            <span className="text-stone-700">·</span>
            <span className="text-xs text-stone-500">{sub}</span>
          </>
        )}
      </div>
      <div className="section-rule" />
    </div>
  );
}

export default async function Page({ searchParams }: Props) {
  const activeTown = searchParams?.town ? String(searchParams.town) : "Nairobi";
  const towns = await fetchTowns();
  const town  = towns.includes(activeTown) ? activeTown : (towns[0] ?? activeTown);

  const [history, latestPrices] = await Promise.all([
    fetchHistory(town),
    fetchLatestPrices(town)
  ]);

  const latest  = latestPrices[0] ?? history[0] ?? null;
  const prev    = history.length > 1 ? history[1] : null;
  const histAsc = [...history].reverse();

  const petrolDelta   = latest ? calculateDelta(latest.super_petrol, prev?.super_petrol ?? null) : null;
  const dieselDelta   = latest ? calculateDelta(latest.diesel,       prev?.diesel       ?? null) : null;
  const keroseneDelta = latest ? calculateDelta(latest.kerosene,     prev?.kerosene     ?? null) : null;

  // Sparklines: last 8 price points per fuel type
  const sparklinePetrol   = histAsc.map(h => h.super_petrol).slice(-8);
  const sparklineDiesel   = histAsc.map(h => h.diesel).slice(-8);
  const sparklineKerosene = histAsc.map(h => h.kerosene).slice(-8);

  const cycle = getActiveCycle();

  const regionalOverview = [
    { name: "Mombasa",  price: 208.24 },
    { name: "Eldoret",  price: 212.50 },
    { name: "Nakuru",   price: 212.92 },
    { name: "Kisumu",   price: 213.69 },
    { name: "Nairobi",  price: 214.03 },
    { name: "Mandera",  price: 221.75 },
  ];

  return (
    <div className="min-h-screen page-bg grid-bg">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-base">
              ⛽
            </div>
            <span className="text-sm font-bold tracking-tight text-stone-100">FuelKenya</span>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.09] px-2.5 py-1">
              <span className="live-dot" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live</span>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-xs sm:flex">
            <span className="font-medium text-stone-500">EPRA · Max pump prices</span>
            <span className="text-stone-700">·</span>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2.5 py-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#a8a29e" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="font-semibold text-stone-300">{town}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-12">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <div className="mb-10 fade-up">
          <div className="grid lg:grid-cols-[1fr_420px] lg:items-center lg:gap-6">
            <div>
              <h1 className="mb-3 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
                Kenya Fuel
                <br />
                <span className="font-light text-stone-400">Price Tracker</span>
              </h1>
              <p className="mb-5 max-w-lg text-sm leading-relaxed text-stone-400">
                Official EPRA maximum pump prices across all towns in Kenya, updated every cycle on the 14th.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-medium text-stone-400">
                  {towns.length} towns
                </span>
                <span className="text-stone-700">·</span>
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs font-medium text-stone-400">
                  Petrol · Diesel · Kerosene
                </span>
                <span className="text-stone-700">·</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-xs font-medium text-emerald-400">
                  {cycle.display}
                </span>
              </div>
            </div>
            <HeroVisual />
          </div>
        </div>

        {/* ── Search + quick links ────────────────────────────────────────────── */}
        <div className="relative z-[100] mb-12 fade-up delay-1">
          <div className="mb-3">
            <SearchBar key={town} activeTown={town} towns={towns} />
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TOWNS.filter(t => towns.includes(t)).map(t => (
              <Link
                key={t}
                href={`?town=${encodeURIComponent(t)}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  t === town
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/[0.07] bg-white/[0.02] text-stone-500 hover:border-white/15 hover:bg-white/[0.04] hover:text-stone-300"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Live prices ── animated on town change ──────────────────────────── */}
        <div className="mb-14 fade-up delay-2">
          <SectionHeader label="Live prices" sub={town} />
          <AnimatedTownSection town={town}>
            <div className="grid gap-4 lg:grid-cols-3">
              <PriceCard
                title="Super Petrol"
                value={latest?.super_petrol ?? 0}
                delta={petrolDelta}
                accent="forest"
                sparkline={sparklinePetrol}
              />
              <PriceCard
                title="Diesel"
                value={latest?.diesel ?? 0}
                delta={dieselDelta}
                accent="maasai"
                sparkline={sparklineDiesel}
              />
              <PriceCard
                title="Kerosene"
                value={latest?.kerosene ?? 0}
                delta={keroseneDelta}
                accent="obsidian"
                sparkline={sparklineKerosene}
              />
            </div>
          </AnimatedTownSection>
        </div>

        {/* ── Countdown ──────────────────────────────────────────────────────── */}
        <div className="mb-14 fade-up delay-3">
          <UpdateCountdown />
        </div>

        {/* ── Chart ──────────────────────────────────────────────────────────── */}
        <div className="mb-14 fade-up delay-3">
          <SectionHeader label="Price history" sub={`${town} · KSh / litre`} />
          <TrendChart history={histAsc} />
        </div>

        {/* ── Town comparison ────────────────────────────────────────────────── */}
        <div className="mb-14 fade-up delay-4">
          <SectionHeader label="Town comparison" sub="Current cycle · Super Petrol" />
          <RegionVariance overview={regionalOverview} activeTown={town} />
        </div>

        {/* ── Cost estimator ─────────────────────────────────────────────────── */}
        <div className="mb-14 fade-up delay-5">
          <SectionHeader label="Fuel cost estimator" sub={town} />
          <FuelEstimator
            petrolPrice={latest?.super_petrol ?? 0}
            dieselPrice={latest?.diesel       ?? 0}
            kerosenePrice={latest?.kerosene   ?? 0}
            town={town}
          />
        </div>

        {/* ── Info cards ─────────────────────────────────────────────────────── */}
        <div className="mb-14 fade-up delay-5">
          <SectionHeader label="About fuel pricing in Kenya" />
          <InfoCards />
        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="max-w-md text-xs text-stone-500">
            Data sourced from the Energy & Petroleum Regulatory Authority (EPRA) of Kenya.
            Maximum pump prices are set monthly on the 14th.
          </p>
          <p className="text-xs text-stone-600">FuelKenya © 2026</p>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "FuelKenya Price Dataset",
            description: "Latest EPRA fuel prices for Kenyan towns including Super Petrol, Diesel, and Kerosene.",
            distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: "https://fuel.co.ke/api/v1/prices/latest" }]
          })
        }}
      />
    </div>
  );
}
