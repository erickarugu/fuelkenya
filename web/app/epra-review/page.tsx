import type { Metadata } from "next";
import Link from "next/link";
import AlertSignup from "@/components/AlertSignup";
import { fetchCycles, reviewSlug } from "@/lib/api";
import { monthLabel, shortDate } from "@/lib/review";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "EPRA Monthly Fuel Price Reviews, 2010 to Today | FuelKenya",
  description:
    "Every EPRA (and earlier ERC) monthly pump price review in Kenya: what petrol, diesel and kerosene cost in each town, cycle by cycle, since December 2010.",
  alternates: { canonical: "https://fuelkenya.com/epra-review" }
};

const card =
  "rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] px-6 py-5";

export default async function EpraReviewIndex() {
  // Stay up (just without the list) if the API is briefly unreachable.
  const cycles = await fetchCycles().catch(() => []);
  const months = new Map<string, { from: string; towns: number }>();
  for (const c of [...cycles].reverse()) {
    const slug = reviewSlug(c.valid_from);
    if (!months.has(slug)) months.set(slug, { from: c.valid_from, towns: c.towns });
  }
  const byYear = new Map<string, string[]>();
  for (const slug of [...months.keys()].sort().reverse()) {
    const y = slug.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), slug]);
  }
  const latest = cycles[0];

  return (
    <div className="min-h-screen page-bg grid-bg bg-[#fafafa] dark:bg-[#080808] px-6 py-8 text-stone-900 dark:text-stone-100 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className={card}>
          <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Monthly reviews</p>
          <h1 className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">EPRA fuel price reviews</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-500">
            EPRA sets maximum pump prices on the 14th of every month, valid from the 15th. Each page shows that
            month&apos;s prices for every town we hold and how they changed.
            {latest && (
              <>
                {" "}Latest:{" "}
                <Link className="underline" href={`/epra-review/${reviewSlug(latest.valid_from)}`}>
                  {monthLabel(reviewSlug(latest.valid_from))}
                </Link>{" "}
                ({shortDate(latest.valid_from)} to {shortDate(latest.valid_to)}).
              </>
            )}
          </p>
        </div>

        <AlertSignup source="epra-review-index" />

        <div className={card}>
          <div className="flex flex-col gap-5">
            {[...byYear].map(([year, slugs]) => (
              <div key={year}>
                <h2 className="text-lg font-bold">{year}</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {slugs.map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/epra-review/${slug}`}
                        className="inline-block rounded-full border border-black/[0.08] dark:border-white/[0.07] px-3 py-1 text-sm text-stone-600 dark:text-stone-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {monthLabel(slug).split(" ")[0]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
