import dynamic from "next/dynamic";
import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import PriceCard from "@/components/PriceCard";
import RegionVariance from "@/components/RegionVariance";
import { fetchHistory, fetchLatestPrices, fetchTowns } from "@/lib/api";

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

const slugifyTown = (town: string) => town.toLowerCase().replace(/\s+/g, "-");
const townFromSlug = (slug: string) =>
  decodeURIComponent(slug).replace(/-/g, " ");

const FAQ_ITEMS = [
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
  }
];

export const revalidate = 3600;

async function fetchTownData(town: string) {
  const [history, latestPrices] = await Promise.all([
    fetchHistory(town),
    fetchLatestPrices(town)
  ]);
  return { history, latestPrices };
}

export async function generateStaticParams() {
  try {
    const towns = await fetchTowns();
    return towns.map((town) => ({ slug: slugifyTown(town) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const town = townFromSlug(params.slug);
  const latestPrices = await fetchLatestPrices(town);
  const current = latestPrices[0];
  const title = `${town} Fuel Prices Today | EPRA Petrol & Diesel Price`;
  const description = current
    ? `EPRA fuel prices in ${town}: Super Petrol KSh ${current.super_petrol.toFixed(2)}/L, Diesel KSh ${current.diesel.toFixed(2)}/L, Kerosene KSh ${current.kerosene.toFixed(2)}/L. Updated monthly.`
    : `Check the latest EPRA fuel prices for ${town}, Kenya — Super Petrol, Diesel, and Kerosene updated every pricing cycle.`;
  const canonicalUrl = `https://fuelkenya.com/town/${params.slug}`;
  const ogImageUrl = `https://fuelkenya.com/town/${encodeURIComponent(params.slug)}/opengraph-image`;

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
      `${town} fuel cost per litre`
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
  const town = decodeURIComponent(params.slug).replace(/-/g, " ");
  const towns = await fetchTowns();
  const { history, latestPrices } = await fetchTownData(town);
  const latest = latestPrices[0] ?? null;
  const previous = history.length > 1 ? history[1] : null;
  const petrolDelta = latest
    ? Number(
        (
          latest.super_petrol - (previous?.super_petrol ?? latest.super_petrol)
        ).toFixed(2)
      )
    : null;
  const dieselDelta = latest
    ? Number((latest.diesel - (previous?.diesel ?? latest.diesel)).toFixed(2))
    : null;
  const keroseneDelta = latest
    ? Number(
        (latest.kerosene - (previous?.kerosene ?? latest.kerosene)).toFixed(2)
      )
    : null;
  const faqItems = buildFAQ(town, latest);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${town} Fuel Prices Today`,
      url: `https://fuelkenya.com/town/${params.slug}`,
      description: `Official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene in ${town}, Kenya.`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "FuelKenya", item: "https://fuelkenya.com" },
          { "@type": "ListItem", position: 2, name: `${town} Fuel Prices`, item: `https://fuelkenya.com/town/${params.slug}` }
        ]
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(item => ({
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
            <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.07] bg-stone-50 dark:bg-white/[0.03] px-4 py-2 text-sm text-stone-600 dark:text-stone-400">
              Latest EPRA cycle data
            </span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
            <SearchBar activeTown={town} towns={towns} />
          </div>
          <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
            <div className="text-sm uppercase tracking-[0.3em] text-stone-500">
              Town snapshot
            </div>
            <div className="mt-6 space-y-4 text-sm text-stone-600 dark:text-stone-400">
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100">
                  Current cycle
                </div>
                <div className="mt-1">15 Jun – 14 Jul 2026</div>
              </div>
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100">Active town</div>
                <div className="mt-1">{town}</div>
              </div>
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100">Last update</div>
                <div className="mt-1">{latest?.valid_from ?? "—"}</div>
              </div>
            </div>
          </div>
        </div>

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

        <TrendChart history={history} />

        <RegionVariance
          overview={[
            { name: "Mombasa", super_petrol: 199.99, diesel: 185.50, kerosene: 155.00 },
            { name: "Mandera", super_petrol: 221.75, diesel: 205.30, kerosene: 170.00 }
          ]}
        />

        <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
          <div className="text-sm uppercase tracking-[0.3em] text-stone-500">
            Frequently asked questions
          </div>
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
