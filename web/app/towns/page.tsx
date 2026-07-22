import type { Metadata } from "next";
import Link from "next/link";
import { fetchTowns } from "@/lib/api";

export const revalidate = 86400;

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
  title: `All Towns | EPRA Fuel Prices in Kenya ${currentYear}`,
  description:
    `Browse EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene in every town across Kenya. Pick a town to see its current fuel prices and price history.`,
  alternates: {
    canonical: "https://fuelkenya.com/towns"
  },
  openGraph: {
    title: `All Towns | EPRA Fuel Prices in Kenya ${currentYear}`,
    description:
      "Browse EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene in every town across Kenya.",
    url: "https://fuelkenya.com/towns",
    type: "website"
  }
};

const slugifyTown = (town: string) => town.toLowerCase().replace(/\s+/g, "-");

export default async function TownsIndexPage() {
  const towns = await fetchTowns();

  const groups = new Map<string, string[]>();
  for (const town of towns) {
    const letter = town.charAt(0).toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(town);
  }
  const sortedLetters = [...groups.keys()].sort();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#080808] px-6 py-8 text-stone-900 dark:text-stone-100 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-stone-500">
                Fuel prices by town
              </p>
              <h1 className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
                All Towns in Kenya
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.07] bg-stone-50 dark:bg-white/[0.03] px-4 py-2 text-sm text-stone-600 dark:text-stone-400 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
            >
              Back to live tracker
            </Link>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-500">
            Official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene
            across all {towns.length} towns in Kenya. Pick a town below to see its
            current price, price history, and comparison with nearby towns.
          </p>
        </div>

        <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] p-6">
          <div className="mb-6 flex flex-wrap gap-2">
            {sortedLetters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.07] text-xs font-bold text-stone-600 dark:text-stone-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {letter}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-8">
            {sortedLetters.map((letter) => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-6">
                <div className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  {letter}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                  {groups.get(letter)!.map((town) => (
                    <Link
                      key={town}
                      href={`/town/${slugifyTown(town)}`}
                      className="truncate rounded-lg px-2 py-1.5 text-sm text-stone-600 dark:text-stone-400 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {town}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
