import dynamic from "next/dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import PriceCard from "@/components/PriceCard";
import RegionVariance from "@/components/RegionVariance";
import TownLinks from "@/components/TownLinks";
import {
  fetchHistory,
  fetchLatestPrices,
  fetchTowns,
  slugifyTown,
  type PriceRecord
} from "@/lib/api";
import {
  describeChange,
  formatCycle,
  formatDayMonth,
  formatMonthYear
} from "@/lib/cycle";

const TrendChart = dynamic(() => import("@/components/TrendChart"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6 text-stone-500">
      Loading chart…
    </div>
  )
});

interface Props {
  params: { slug: string };
}

const townFromSlug = (slug: string) =>
  decodeURIComponent(slug).replace(/-/g, " ");

// Towns prerendered at build time. The rest render on first visit and are then
// cached (ISR). Prerendering all 230 would fire ~460 API calls during the
// build and trip the API's per-IP rate limit.
const PRERENDERED_TOWNS = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Machakos",
  "Nyeri",
  "Meru",
  "Kakamega"
];

/** Resolve a URL slug to the canonical town name, or null if unknown. */
function resolveTown(slug: string, towns: string[]) {
  const wanted = townFromSlug(slug).toLowerCase();
  return towns.find((t) => t.toLowerCase() === wanted) ?? null;
}

interface TownPrices {
  /** Price for the current cycle, or null if EPRA left this town out. */
  latest: PriceRecord | null;
  /** What to show: the current price, or the last one EPRA published. */
  shown: PriceRecord | null;
  previous: PriceRecord | null;
  history: PriceRecord[];
  currentCycle: PriceRecord | null;
}

async function fetchTownPrices(town: string): Promise<TownPrices> {
  const [history, allLatest] = await Promise.all([
    fetchHistory(town),
    fetchLatestPrices()
  ]);
  const latest =
    allLatest.find((r) => r.town.toLowerCase() === town.toLowerCase()) ?? null;
  return {
    latest,
    shown: latest ?? history[0] ?? null,
    previous: latest && history.length > 1 ? history[1] : null,
    history,
    currentCycle: allLatest[0] ?? null
  };
}

const FAQ_ITEMS = [
  {
    question: "What is the current price of petrol in [TownName] today?",
    answer:
      "The current EPRA maximum price for Super Petrol in [TownName] is KSh [SuperPrice] per litre. This is the official government-set ceiling price for the current pricing cycle, and no station in [TownName] may legally charge above it."
  },
  {
    question: "What are the current EPRA fuel prices in [TownName]?",
    answer:
      "As of the latest EPRA pricing cycle, the retail price for Super Petrol in [TownName] is KSh [SuperPrice], Diesel is KSh [DieselPrice], and Kerosene is KSh [KerosenePrice]."
  },
  {
    question: "Why does fuel cost more in [TownName] than Mombasa?",
    answer:
      "Fuel prices in inland towns like [TownName] are higher than coastal Mombasa because of the pipeline and road transit costs incurred to transport the petroleum products from the Mombasa port."
  },
  {
    question: "How often do fuel prices change in Kenya?",
    answer:
      "The Energy and Petroleum Regulatory Authority (EPRA) of Kenya updates maximum retail pump limits on the 14th of every month, taking effect at midnight on the 15th."
  },
  {
    question:
      "When will the next EPRA fuel prices be announced for [TownName]?",
    answer:
      "EPRA announces new maximum pump prices on the 14th of every month. The updated prices for [TownName] and all other towns take effect from the 15th. FuelKenya updates automatically as soon as new prices are published."
  },
  {
    question:
      "Do Shell, Total, and Rubis stations in [TownName] charge EPRA prices?",
    answer:
      "Yes. All fuel stations in [TownName], including Shell, TotalEnergies, Rubis, Vivo Energy, and independent dealers, must charge at or below the EPRA maximum pump prices shown here. These are the official government-set price ceilings."
  }
];

// Matches the API's own edge cache window, so review-day prices show up
// within minutes without re-rendering on every visit.
export const revalidate = 300;

export async function generateStaticParams() {
  return PRERENDERED_TOWNS.map((town) => ({ slug: slugifyTown(town) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const towns = await fetchTowns();
  const town = resolveTown(params.slug, towns);
  // Calling notFound() here, before streaming starts, is what makes the
  // response a real 404. From the page body alone, the root loading.tsx has
  // already sent a 200, which Google treats as a soft 404.
  if (!town) notFound();

  const { latest, shown, previous, currentCycle } = await fetchTownPrices(town);
  const cycleMonth = currentCycle
    ? formatMonthYear(currentCycle.valid_from)
    : String(new Date().getFullYear());
  const title = `${town} Fuel Prices Today: Petrol & Diesel | EPRA ${cycleMonth}`;

  // Lead with what changed and what else the page offers. Listing all three
  // prices in the snippet answered the search on Google, so nobody clicked.
  let description: string;
  if (latest) {
    description =
      `Petrol in ${town} is ${describeChange(latest.super_petrol, previous?.super_petrol ?? null)} ` +
      `per litre until ${formatDayMonth(latest.valid_to)}. See diesel and kerosene, ` +
      `how ${town} compares with the cheapest town, and a year of price history.`;
  } else if (shown) {
    description =
      `EPRA did not list ${town} in the current pricing cycle. See the last published ` +
      `${town} fuel prices (${formatCycle(shown.valid_from, shown.valid_to)}) and prices in nearby towns.`;
  } else {
    description = `EPRA maximum pump prices for Super Petrol, Diesel and Kerosene in ${town}, Kenya, updated every pricing cycle.`;
  }
  const year = new Date().getFullYear();
  const slug = slugifyTown(town);
  const canonicalUrl = `https://fuelkenya.com/town/${slug}`;
  const ogImageUrl = `https://fuelkenya.com/town/${encodeURIComponent(slug)}/opengraph-image`;

  return {
    title,
    description,
    keywords: [
      `fuel prices ${town} Kenya`,
      `petrol price ${town}`,
      `diesel price ${town}`,
      `EPRA fuel prices ${town}`,
      `${town} pump prices`,
      `super petrol price ${town} today`,
      "EPRA Kenya fuel prices",
      "Kenya fuel prices today",
      `${town} fuel cost per litre`,
      `fuel prices ${town} Kenya ${year}`,
      `Shell fuel prices ${town}`,
      `Total fuel prices ${town}`,
      `next fuel prices ${town}`,
      `${town} EPRA prices ${year}`
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "FuelKenya",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `EPRA fuel prices in ${town}, Kenya`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl]
    }
  };
}

function buildFAQ(
  town: string,
  current: { super_petrol: number; diesel: number; kerosene: number } | null
) {
  return FAQ_ITEMS.map((item) => {
    const question = item.question.replace(/\[TownName\]/g, town);
    const answer = item.answer
      .replace(/\[TownName\]/g, town)
      .replace(
        /\[SuperPrice\]/g,
        current ? current.super_petrol.toFixed(2) : "—"
      )
      .replace(/\[DieselPrice\]/g, current ? current.diesel.toFixed(2) : "—")
      .replace(
        /\[KerosenePrice\]/g,
        current ? current.kerosene.toFixed(2) : "—"
      );
    return { question, answer };
  });
}

export default async function TownPage({ params }: Props) {
  const towns = await fetchTowns();
  const town = resolveTown(params.slug, towns);
  if (!town) notFound();

  const [{ latest, shown, previous, history }, allLatest] = await Promise.all([
    fetchTownPrices(town),
    fetchLatestPrices()
  ]);
  const delta = (pick: (r: PriceRecord) => number) =>
    latest && previous ? Number((pick(latest) - pick(previous)).toFixed(2)) : null;
  const petrolDelta = delta((r) => r.super_petrol);
  const dieselDelta = delta((r) => r.diesel);
  const keroseneDelta = delta((r) => r.kerosene);
  // Only state a "current price" in the FAQ when this cycle has one.
  const faqItems = buildFAQ(town, latest);

  // Live comparison: cheapest and dearest towns this cycle, Nairobi as the
  // reference most people know, and this town.
  const byPetrol = [...allLatest].sort((a, b) => a.super_petrol - b.super_petrol);
  const comparisonNames = new Set(
    [byPetrol[0]?.town, byPetrol[byPetrol.length - 1]?.town, "Nairobi", latest?.town].filter(
      (t): t is string => Boolean(t)
    )
  );
  const comparison = allLatest
    .filter((r) => comparisonNames.has(r.town))
    .map((r) => ({
      name: r.town,
      super_petrol: r.super_petrol,
      diesel: r.diesel,
      kerosene: r.kerosene
    }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${town} Fuel Prices Today`,
      url: `https://fuelkenya.com/town/${slugifyTown(town)}`,
      description: `Official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene in ${town}, Kenya.`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "FuelKenya",
            item: "https://fuelkenya.com"
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${town} Fuel Prices`,
            item: `https://fuelkenya.com/town/${slugifyTown(town)}`
          }
        ]
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#080808] px-6 py-8 text-stone-900 dark:text-stone-100 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-stone-500">
                Town fuel status
              </p>
              <h1 className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
                {town} Fuel Prices
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/towns"
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.07] bg-stone-50 dark:bg-white/[0.03] px-4 py-2 text-sm text-stone-600 dark:text-stone-400 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
              >
                All towns
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.07] bg-stone-50 dark:bg-white/[0.03] px-4 py-2 text-sm text-stone-600 dark:text-stone-400">
                Latest EPRA cycle data
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
            <SearchBar activeTown={town} towns={towns} />
          </div>
          <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
            <h2 className="text-sm font-normal uppercase tracking-[0.3em] text-stone-500">
              Town snapshot
            </h2>
            <div className="mt-6 space-y-4 text-sm text-stone-600 dark:text-stone-400">
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  {latest ? "Current cycle" : "Last cycle with a price"}
                </div>
                <div className="mt-1">
                  {shown ? formatCycle(shown.valid_from, shown.valid_to) : "—"}
                </div>
              </div>
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  Active town
                </div>
                <div className="mt-1">{town}</div>
              </div>
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  Prices took effect
                </div>
                <div className="mt-1">{shown ? formatDayMonth(shown.valid_from) : "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {!latest && shown && (
          <div
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-900 dark:text-amber-200"
          >
            EPRA did not publish a price for {town} in the current pricing cycle. The prices
            below are the last ones EPRA published for {town}, for{" "}
            {formatCycle(shown.valid_from, shown.valid_to)}.
          </div>
        )}

        <h2 className="sr-only">{town} fuel prices per litre</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <PriceCard
            title="Super Petrol"
            value={shown?.super_petrol ?? 0}
            delta={petrolDelta}
            accent="forest"
          />
          <PriceCard
            title="Diesel"
            value={shown?.diesel ?? 0}
            delta={dieselDelta}
            accent="maasai"
          />
          <PriceCard
            title="Kerosene"
            value={shown?.kerosene ?? 0}
            delta={keroseneDelta}
            accent="obsidian"
          />
        </div>

        <h2 className="sr-only">{town} price history</h2>
        <TrendChart history={history} />

        <h2 className="sr-only">How {town} compares with other towns</h2>
        <RegionVariance overview={comparison} activeTown={latest?.town} />

        <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
          <h2 className="text-sm font-normal uppercase tracking-[0.3em] text-stone-500">
            Fuel prices in other towns
          </h2>
          <div className="mt-4">
            <TownLinks towns={towns} currentTown={town} />
          </div>
        </div>

        <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
          <h2 className="text-sm font-normal uppercase tracking-[0.3em] text-stone-500">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-5 text-sm text-stone-600 dark:text-stone-400">
            {faqItems.map((item) => (
              <div key={item.question}>
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  {item.question}
                </div>
                <p className="mt-2 leading-7">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </div>
  );
}
