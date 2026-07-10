import dynamicImport from "next/dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import RegionVariance from "@/components/RegionVariance";
import SearchBar from "@/components/SearchBar";
import UpdateCountdown from "@/components/UpdateCountdown";
import FuelEstimator from "@/components/FuelEstimator";
import InfoCards from "@/components/InfoCards";
import AnimatedTownSection from "@/components/AnimatedTownSection";
import HeroVisual from "@/components/HeroVisual";
import ThemeToggle from "@/components/ThemeToggle";
import { fetchHistory, fetchLatestPrices, fetchTowns } from "@/lib/api";

export const dynamic = "force-dynamic";

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Petrol Price in Kenya Today ${currentYear} | EPRA Fuel Prices Per Litre`,
  description:
    `Kenya petrol price today per litre — official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene across all towns in Kenya. Updated every cycle on the 14th.`,
  keywords: [
    "EPRA fuel prices Kenya today",
    "petrol price today Kenya",
    "diesel price Kenya today",
    "kerosene price Kenya",
    "fuel prices Kenya",
    `EPRA maximum pump prices ${currentYear}`,
    `fuel prices Kenya ${currentYear}`,
    `new fuel prices Kenya ${currentYear}`,
    "super petrol price Kenya",
    "fuel tracker Kenya",
    "Kenya petrol cost per litre",
    "Nairobi fuel prices",
    "Mombasa fuel prices",
    "Kisumu fuel prices",
    "EPRA price update Kenya",
    "cheapest petrol Kenya",
    "fuel prices Kenya tomorrow",
    "next EPRA fuel prices Kenya",
    "Shell fuel prices Kenya today",
    "Total fuel prices Kenya",
    "Rubis fuel prices Kenya",
    "Vivo Energy fuel prices Kenya",
    "EPRA petrol price today Kenya",
    "latest fuel prices Kenya"
  ],
  alternates: {
    canonical: "https://fuelkenya.com"
  },
  openGraph: {
    title: `Petrol Price in Kenya Today ${currentYear} | EPRA Fuel Prices Per Litre`,
    description:
      `Kenya petrol price today per litre — EPRA fuel prices for Super Petrol, Diesel, and Kerosene across all towns. Updated every pricing cycle on the 14th.`,
    url: "https://fuelkenya.com",
    type: "website"
  },
  twitter: {
    title: `Petrol Price in Kenya Today ${currentYear} | EPRA Fuel Prices Per Litre`,
    description:
      `Kenya petrol price today per litre — EPRA fuel prices for Super Petrol, Diesel, and Kerosene across all towns. Updated every pricing cycle on the 14th.`
  }
};

const POPULAR_TOWNS = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika"
];

const TrendChart = dynamicImport(() => import("@/components/TrendChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-black/[0.08] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] text-sm text-stone-500">
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
    endDate = new Date(year, month, 14);
  } else {
    startDate = new Date(year, month, 15);
    const em = month === 11 ? 0 : month + 1;
    const ey = month === 11 ? year + 1 : year;
    endDate = new Date(ey, em, 14);
  }

  const fmt = (d: Date, yr = false) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...(yr ? { year: "numeric" } : {})
    });

  return { display: `${fmt(startDate)} – ${fmt(endDate, true)}` };
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-600 dark:text-stone-400">
          {label}
        </span>
        {sub && (
          <>
            <span className="text-stone-300 dark:text-stone-700">·</span>
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
  const town = towns.includes(activeTown)
    ? activeTown
    : (towns[0] ?? activeTown);

  const [history, latestPrices, allLatestPrices] = await Promise.all([
    fetchHistory(town),
    fetchLatestPrices(town),
    fetchLatestPrices()
  ]);

  const latest = latestPrices[0] ?? history[0] ?? null;
  const prev = history.length > 1 ? history[1] : null;
  const histAsc = [...history].reverse();

  const petrolDelta = latest
    ? calculateDelta(latest.super_petrol, prev?.super_petrol ?? null)
    : null;
  const dieselDelta = latest
    ? calculateDelta(latest.diesel, prev?.diesel ?? null)
    : null;
  const keroseneDelta = latest
    ? calculateDelta(latest.kerosene, prev?.kerosene ?? null)
    : null;

  // Sparklines: last 8 price points per fuel type
  const sparklinePetrol = histAsc.map((h) => h.super_petrol).slice(-8);
  const sparklineDiesel = histAsc.map((h) => h.diesel).slice(-8);
  const sparklineKerosene = histAsc.map((h) => h.kerosene).slice(-8);

  const cycle = getActiveCycle();

  const REGIONAL_TOWNS = [
    "Mombasa",
    "Eldoret",
    "Nakuru",
    "Kisumu",
    "Nairobi",
    "Mandera"
  ];
  const regionalOverview = allLatestPrices
    .filter((r) => REGIONAL_TOWNS.includes(r.town))
    .map((r) => ({ name: r.town, super_petrol: r.super_petrol, diesel: r.diesel, kerosene: r.kerosene }));

  const heroTowns = allLatestPrices
    .filter((r) => REGIONAL_TOWNS.includes(r.town))
    .slice(0, 5)
    .map((r) => ({
      city: r.town,
      petrol: r.super_petrol.toFixed(2),
      diesel: r.diesel.toFixed(2),
      kerosene: r.kerosene.toFixed(2)
    }));

  return (
    <div className="relative min-h-screen page-bg grid-bg">
      {/* ── Fixed shield watermark ─────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/kenya-shield.png"
          alt=""
          className="h-[70vh] max-h-[700px] w-auto select-none object-contain opacity-[0.025] dark:opacity-[0.018]"
          style={{ filter: "grayscale(1)" }}
        />
      </div>
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-black/[0.08] dark:border-white/[0.07] bg-white/90 dark:bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/kenya-fuel-logo.png" alt="FuelKenya" className="h-8 w-8 shrink-0 rounded-lg" />
            <span className="font-[family-name:var(--font-space-grotesk)] text-[1.05rem] font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-300 bg-clip-text text-transparent">Fuel</span><span className="text-stone-900 dark:text-white">Kenya</span>
            </span>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.09] px-2.5 py-1">
              <span className="live-dot" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Live
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden font-medium text-stone-500 dark:text-stone-500 sm:inline">
              EPRA · Max pump prices
            </span>
            <span className="hidden text-stone-300 dark:text-stone-700 sm:inline">·</span>
            <div className="hidden items-center gap-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.07] bg-black/[0.04] dark:bg-white/[0.04] px-2.5 py-1 sm:flex">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-stone-400 dark:text-stone-500"
                aria-hidden="true"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="font-semibold text-stone-700 dark:text-stone-300">{town}</span>
            </div>
            <span className="hidden text-stone-300 dark:text-stone-700 sm:inline">·</span>
            <a
              href="https://docs.fuelkenya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-medium text-stone-500 transition-colors hover:text-stone-800 dark:hover:text-stone-300 sm:inline"
            >
              Docs
            </a>
            <a
              href="https://github.com/erickarugu/fuelkenya"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-stone-400 dark:text-stone-600 transition-colors hover:text-stone-700 dark:hover:text-stone-400 sm:inline-flex"
              aria-label="GitHub"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="fade-up py-20 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_440px] lg:gap-16">
            {/* left */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500">
                  Updated every cycle · {cycle.display}
                </span>
              </div>

              <h1 className="mb-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-stone-900 dark:text-white sm:text-6xl">
                Kenya Petrol Price
                <br />
                <span className="font-light text-stone-500 dark:text-stone-400">Today Per Litre</span>
              </h1>

              <p className="mb-8 max-w-md text-base leading-relaxed text-stone-600 dark:text-stone-400">
                Official EPRA maximum pump prices per litre across all {towns.length}{" "}
                towns in Kenya — Super Petrol, Diesel, and Kerosene.
              </p>

              <div className="relative z-[100]">
                <div className="mb-3">
                  <SearchBar key={town} activeTown={town} towns={towns} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TOWNS.filter((t) => towns.includes(t)).map((t) => (
                    <Link
                      key={t}
                      href={`?town=${encodeURIComponent(t)}`}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                        t === town
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-black/[0.08] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] text-stone-500 hover:border-black/[0.14] dark:hover:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-stone-700 dark:hover:text-stone-300"
                      }`}
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* right */}
            <HeroVisual towns={heroTowns} />
          </div>
        </div>

        {/* ── Live prices ── animated on town change ──────────────────────────── */}
        <div className="mb-14 fade-up delay-1">
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
                accent="azure"
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
          <SectionHeader
            label="Town comparison"
            sub="Current cycle"
          />
          <RegionVariance overview={regionalOverview} activeTown={town} />
        </div>

        {/* ── Cost estimator ─────────────────────────────────────────────────── */}
        <div className="mb-14 fade-up delay-5">
          <SectionHeader label="Fuel cost estimator" sub={town} />
          <FuelEstimator
            petrolPrice={latest?.super_petrol ?? 0}
            dieselPrice={latest?.diesel ?? 0}
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
      <footer className="border-t border-black/[0.07] dark:border-white/[0.06] px-6 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm text-stone-500">
            Data sourced from the{" "}
            <a
              href="https://www.epra.go.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-stone-700 dark:hover:text-stone-400"
            >
              Energy & Petroleum Regulatory Authority (EPRA)
            </a>{" "}
            of Kenya. Maximum pump prices are set monthly on the 14th.
          </p>
          <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-600">
            <a
              href="https://docs.fuelkenya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-stone-700 dark:hover:text-stone-400"
            >
              API Docs
            </a>
            <a
              href="https://github.com/erickarugu/fuelkenya"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-stone-700 dark:hover:text-stone-400"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
            <span className="text-stone-400 dark:text-stone-700">FuelKenya © 2026</span>
            <ThemeToggle />
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "FuelKenya",
              url: "https://fuelkenya.com",
              description:
                "Live EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene across all towns in Kenya.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://fuelkenya.com/?town={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What are the current EPRA fuel prices in Kenya?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "EPRA (Energy and Petroleum Regulatory Authority) publishes maximum pump prices on the 14th of every month. FuelKenya displays the latest official prices for Super Petrol, Diesel, and Kerosene across all towns in Kenya."
                  }
                },
                {
                  "@type": "Question",
                  name: "How often do EPRA fuel prices change in Kenya?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "EPRA updates maximum retail fuel prices on the 14th of every month. The new prices take effect at midnight on the 15th and remain in force until the 14th of the following month."
                  }
                },
                {
                  "@type": "Question",
                  name: "Why are fuel prices different across Kenyan towns?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "EPRA sets town-specific pump prices based on pipeline and road transport costs from Mombasa port. Coastal towns like Mombasa pay the lowest prices, while inland and remote towns like Mandera pay the highest due to longer distribution distances."
                  }
                },
                {
                  "@type": "Question",
                  name: "What is the cheapest town for fuel in Kenya?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Mombasa consistently has the lowest fuel prices in Kenya because it is the entry point for petroleum products imported through the port. Prices rise with distance from Mombasa along the pipeline and road network."
                  }
                },
                {
                  "@type": "Question",
                  name: "When will EPRA announce the next fuel prices in Kenya?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "EPRA announces the next month's maximum pump prices on the 14th of every month, with the new prices taking effect from the 15th. FuelKenya shows a live countdown to the next price update so you always know when new prices are coming."
                  }
                },
                {
                  "@type": "Question",
                  name: "Do Shell, Total, and Rubis stations follow EPRA fuel prices?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. All fuel stations in Kenya — including Shell, TotalEnergies, Rubis (formerly KenolKobil), Vivo Energy, and independent dealers — are required by law to sell at or below the EPRA maximum pump prices. FuelKenya tracks these official EPRA ceiling prices that apply at every station nationwide."
                  }
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "Dataset",
              name: "Kenya EPRA Fuel Price Dataset",
              description:
                "Official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene across all towns in Kenya, updated every pricing cycle.",
              url: "https://fuelkenya.com",
              license: "https://creativecommons.org/licenses/by/4.0/",
              isAccessibleForFree: true,
              creator: {
                "@type": "Organization",
                name: "FuelKenya",
                url: "https://fuelkenya.com"
              },
              provider: {
                "@type": "Organization",
                name: "Energy and Petroleum Regulatory Authority (EPRA)",
                url: "https://www.epra.go.ke"
              },
              distribution: [
                {
                  "@type": "DataDownload",
                  encodingFormat: "application/json",
                  contentUrl: "https://api.fuelkenya.com/v1/prices/latest"
                }
              ]
            }
          ])
        }}
      />
    </div>
  );
}
