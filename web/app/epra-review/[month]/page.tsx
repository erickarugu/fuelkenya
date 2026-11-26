import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AlertSignup from "@/components/AlertSignup";
import {
  fetchCyclePrices,
  fetchCycles,
  reviewSlug,
  slugifyTown,
  type Cycle,
  type PriceRecord
} from "@/lib/api";
import {
  MONTH_SLUG_RE,
  byTown,
  change,
  describeChange,
  ksh,
  monthLabel,
  shortDate
} from "@/lib/review";

export const revalidate = 300;

type Params = { month: string };

const KEY_TOWNS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

const card =
  "rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] px-6 py-5";

async function loadMonth(month: string) {
  if (!MONTH_SLUG_RE.test(month)) return null;
  const cycles = await fetchCycles();
  // Newest first. Usually one cycle per month; some months had a mid-month revision.
  const inMonth = cycles.filter((c) => reviewSlug(c.valid_from) === month).reverse();
  if (inMonth.length === 0) return null;
  const first = inMonth[0];
  const firstIdx = cycles.findIndex((c) => c.valid_from === first.valid_from);
  const previous: Cycle | undefined = cycles[firstIdx + 1];
  const newer = cycles.filter((c) => c.valid_from > inMonth[inMonth.length - 1].valid_from);
  const next = newer.length ? newer[newer.length - 1] : undefined;
  const [periods, prevRows] = await Promise.all([
    Promise.all(inMonth.map(async (c) => ({ cycle: c, rows: await fetchCyclePrices(c) }))),
    previous ? fetchCyclePrices(previous) : Promise.resolve([] as PriceRecord[])
  ]);
  return { periods, previous, prevRows, next, isLatest: cycles[0].valid_from === inMonth[inMonth.length - 1].valid_from };
}

function headline(rows: PriceRecord[], prev: Map<string, PriceRecord>) {
  const nairobi = rows.find((r) => r.town.toLowerCase() === "nairobi") ?? rows[0];
  if (!nairobi) return null;
  const before = prev.get(nairobi.town.toLowerCase());
  return {
    town: nairobi.town,
    petrol: nairobi.super_petrol,
    diesel: nairobi.diesel,
    kerosene: nairobi.kerosene,
    dPetrol: change(nairobi.super_petrol, before?.super_petrol),
    dDiesel: change(nairobi.diesel, before?.diesel),
    dKerosene: change(nairobi.kerosene, before?.kerosene)
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { month } = await params;
  const data = await loadMonth(month).catch(() => null);
  if (!data) return { title: "EPRA review not found | FuelKenya", robots: { index: false } };
  const label = monthLabel(month);
  const { cycle, rows } = data.periods[0];
  const h = headline(rows, byTown(data.prevRows));
  const summary = h
    ? `Petrol in ${h.town} is ${describeChange(h.dPetrol)} at ${ksh(h.petrol)}, diesel ${describeChange(h.dDiesel)} at ${ksh(h.diesel)}.`
    : "";
  const title = `EPRA Fuel Prices ${label}: ${rows.length} Towns | FuelKenya`;
  const description = `EPRA maximum pump prices from ${shortDate(cycle.valid_from)} to ${shortDate(cycle.valid_to)}. ${summary} See every town and what changed.`;
  const url = `https://fuelkenya.com/epra-review/${month}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" }
  };
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-stone-400">—</span>;
  if (value === 0) return <span className="text-stone-500">0.00</span>;
  return (
    <span className={value > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
      {value > 0 ? "+" : "−"}
      {Math.abs(value).toFixed(2)}
    </span>
  );
}

export default async function EpraReviewPage({ params }: { params: Promise<Params> }) {
  const { month } = await params;
  const data = await loadMonth(month);
  if (!data) notFound();

  const label = monthLabel(month);
  const prev = byTown(data.prevRows);
  const main = data.periods[0];
  const h = headline(main.rows, prev);
  const sorted = [...main.rows].sort((a, b) => a.super_petrol - b.super_petrol);
  const cheapest = sorted[0];
  const dearest = sorted[sorted.length - 1];
  const keyRows = KEY_TOWNS.map((t) => main.rows.find((r) => r.town.toLowerCase() === t.toLowerCase())).filter(
    (r): r is PriceRecord => Boolean(r)
  );
  const allRows = [...main.rows].sort((a, b) => a.town.localeCompare(b.town));
  const partial = main.rows.length <= 5;

  const pageUrl = `https://fuelkenya.com/epra-review/${month}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `EPRA fuel prices for ${label}`,
      datePublished: `${main.cycle.valid_from}T00:00:00+03:00`,
      dateModified: `${main.cycle.valid_from}T00:00:00+03:00`,
      image: `${pageUrl}/opengraph-image`,
      author: { "@type": "Organization", name: "FuelKenya", url: "https://fuelkenya.com" },
      publisher: { "@type": "Organization", name: "FuelKenya", url: "https://fuelkenya.com" },
      mainEntityOfPage: pageUrl
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "FuelKenya", item: "https://fuelkenya.com" },
        { "@type": "ListItem", position: 2, name: "EPRA reviews", item: "https://fuelkenya.com/epra-review" },
        { "@type": "ListItem", position: 3, name: label, item: pageUrl }
      ]
    }
  ];

  return (
    <div className="min-h-screen page-bg grid-bg bg-[#fafafa] dark:bg-[#080808] px-6 py-8 text-stone-900 dark:text-stone-100 sm:px-10 lg:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className={card}>
          <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
            <Link href="/" className="hover:text-stone-800 dark:hover:text-stone-200">FuelKenya</Link>
            {" / "}
            <Link href="/epra-review" className="hover:text-stone-800 dark:hover:text-stone-200">EPRA reviews</Link>
            {" / "}
            <span>{label}</span>
          </nav>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900 dark:text-white">
            EPRA fuel prices, {label}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Valid {shortDate(main.cycle.valid_from)} to {shortDate(main.cycle.valid_to)}
            {data.isLatest ? " · current prices" : ""}
          </p>
          {h && (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-stone-700 dark:text-stone-300">
              In {h.town}, Super Petrol is <b>{describeChange(h.dPetrol)}</b> at <b>{ksh(h.petrol)}</b> per litre,
              Diesel is <b>{describeChange(h.dDiesel)}</b> at <b>{ksh(h.diesel)}</b> and Kerosene is{" "}
              <b>{describeChange(h.dKerosene)}</b> at <b>{ksh(h.kerosene)}</b>
              {data.previous ? `, compared with the cycle that started ${shortDate(data.previous.valid_from)}` : ""}.
              {!partial && cheapest && dearest && (
                <>
                  {" "}Petrol is cheapest in <Link className="underline" href={`/town/${slugifyTown(cheapest.town)}`}>{cheapest.town}</Link>{" "}
                  ({ksh(cheapest.super_petrol)}) and dearest in{" "}
                  <Link className="underline" href={`/town/${slugifyTown(dearest.town)}`}>{dearest.town}</Link> ({ksh(dearest.super_petrol)}).
                </>
              )}
            </p>
          )}
          {data.periods.length > 1 && (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
              Prices were revised during this month. This page shows the first set; the revised prices applied from{" "}
              {data.periods.slice(1).map((p) => shortDate(p.cycle.valid_from)).join(", ")}.
            </p>
          )}
        </div>

        {keyRows.length > 0 && (
          <div className={card}>
            <h2 className="text-lg font-bold">Major towns</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {keyRows.map((r) => {
                const b = prev.get(r.town.toLowerCase());
                return (
                  <Link
                    key={r.town}
                    href={`/town/${slugifyTown(r.town)}`}
                    className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-4 py-3 transition-colors hover:border-emerald-500/40"
                  >
                    <p className="font-semibold">{r.town}</p>
                    <dl className="mt-1 grid grid-cols-[1fr_auto_auto] gap-x-3 font-mono text-sm tabular-nums">
                      {(
                        [
                          ["Petrol", r.super_petrol, b?.super_petrol],
                          ["Diesel", r.diesel, b?.diesel],
                          ["Kerosene", r.kerosene, b?.kerosene]
                        ] as const
                      ).map(([k, v, before]) => (
                        <div key={k} className="contents">
                          <dt className="font-sans text-stone-500">{k}</dt>
                          <dd>{v.toFixed(2)}</dd>
                          <dd className="text-right"><Delta value={change(v, before)} /></dd>
                        </div>
                      ))}
                    </dl>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <AlertSignup source="epra-review" />

        <div className={card}>
          <h2 className="text-lg font-bold">{partial ? "Published prices" : `All ${allRows.length} towns`}</h2>
          {partial && (
            <p className="mt-1 text-sm text-stone-500">
              Only major-town prices survive for this cycle, as reported in Kenyan news coverage of the review.
            </p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-stone-500">
                  <th className="py-2 pr-4">Town</th>
                  <th className="py-2 pr-4">Petrol</th>
                  <th className="py-2 pr-4">Diesel</th>
                  <th className="py-2 pr-4">Kerosene</th>
                  <th className="py-2">Petrol change</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {allRows.map((r) => (
                  <tr key={r.town} className="border-t border-black/[0.05] dark:border-white/[0.05]">
                    <td className="py-2 pr-4 font-sans">
                      <Link href={`/town/${slugifyTown(r.town)}`} className="hover:underline">{r.town}</Link>
                    </td>
                    <td className="py-2 pr-4">{r.super_petrol.toFixed(2)}</td>
                    <td className="py-2 pr-4">{r.diesel.toFixed(2)}</td>
                    <td className="py-2 pr-4">{r.kerosene.toFixed(2)}</td>
                    <td className="py-2"><Delta value={change(r.super_petrol, prev.get(r.town.toLowerCase())?.super_petrol)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Maximum retail prices in KSh per litre, VAT inclusive, as set by EPRA
            {main.cycle.valid_from < "2019-07-01" ? " (then the Energy Regulatory Commission)" : ""}.{" "}
            <Link href="/data" className="underline">Download the full history</Link>.
          </p>
        </div>

        <nav className="flex flex-wrap justify-between gap-3 text-sm">
          {data.previous ? (
            <Link href={`/epra-review/${reviewSlug(data.previous.valid_from)}`} className="underline">
              ← {monthLabel(reviewSlug(data.previous.valid_from))}
            </Link>
          ) : <span />}
          <Link href="/epra-review" className="underline">All reviews</Link>
          {data.next ? (
            <Link href={`/epra-review/${reviewSlug(data.next.valid_from)}`} className="underline">
              {monthLabel(reviewSlug(data.next.valid_from))} →
            </Link>
          ) : <span />}
        </nav>
      </div>
    </div>
  );
}
