import type { Metadata } from "next";
import Link from "next/link";
import { EXPORT_CSV_URL, EXPORT_JSON_URL, fetchExport, type ExportRow } from "@/lib/api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Download Kenya Fuel Price Data (2010–today) | FuelKenya",
  description:
    "Free download of official EPRA and ERC maximum pump prices for Super Petrol, Diesel and Kerosene in every Kenyan town, monthly since December 2010. CSV and JSON, CC BY 4.0.",
  alternates: { canonical: "https://fuelkenya.com/data" },
  openGraph: {
    title: "Download Kenya Fuel Price Data | FuelKenya",
    description:
      "Official EPRA/ERC maximum pump prices for every Kenyan town since 2010. CSV and JSON, CC BY 4.0.",
    url: "https://fuelkenya.com/data",
    type: "website"
  }
};

type YearSummary = { year: string; cycles: number; full: number; major: number; towns: number };

function summarise(rows: ExportRow[]) {
  const cycles = new Map<string, ExportRow>();
  const towns = new Set<string>();
  for (const r of rows) {
    towns.add(r.town);
    if (!cycles.has(r.valid_from)) cycles.set(r.valid_from, r);
  }
  const byYear = new Map<string, YearSummary>();
  for (const [from, r] of cycles) {
    const year = from.slice(0, 4);
    const y = byYear.get(year) ?? { year, cycles: 0, full: 0, major: 0, towns: 0 };
    y.cycles += 1;
    if (r.coverage === "major towns only") y.major += 1;
    else y.full += 1;
    y.towns = Math.max(y.towns, r.towns_in_cycle);
    byYear.set(year, y);
  }
  const sorted = [...cycles.keys()].sort();
  return {
    rows: rows.length,
    cycles: cycles.size,
    towns: towns.size,
    first: sorted[0],
    last: sorted[sorted.length - 1],
    years: [...byYear.values()].sort((a, b) => b.year.localeCompare(a.year))
  };
}

const fmt = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const card =
  "rounded-xl border border-black/[0.08] dark:border-white/[0.07] bg-white dark:bg-white/[0.025] px-6 py-5";

export default async function DataPage() {
  // The downloads must stay reachable even if the stats can't be loaded.
  const payload = await fetchExport().catch(() => null);
  const s = payload ? summarise(payload.data) : null;
  const attribution = payload?.attribution ?? "Source: EPRA/ERC, compiled by FuelKenya (fuelkenya.com)";

  return (
    <div className="min-h-screen page-bg grid-bg bg-[#fafafa] dark:bg-[#080808] px-6 py-8 text-stone-900 dark:text-stone-100 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className={card}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Open data</p>
              <h1 className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
                Kenya fuel price history
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.07] bg-stone-50 dark:bg-white/[0.03] px-4 py-2 text-sm text-stone-600 dark:text-stone-400 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
            >
              Back to live tracker
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-stone-500">
            Official maximum retail pump prices for Super Petrol (PMS), Diesel (AGO) and Kerosene (IK), set
            monthly by EPRA (and until mid-2019 by its predecessor, the Energy Regulatory Commission). Every town, every cycle we
            hold{s ? `, from ${fmt(s.first)} to ${fmt(s.last)}` : ""}. These are the regulator&apos;s published ceilings,
            never estimates.
          </p>

          {s && (<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Price records", s.rows.toLocaleString("en-GB")],
              ["Monthly cycles", String(s.cycles)],
              ["Towns", String(s.towns)],
              ["Updated", fmt(s.last)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-4 py-3">
                <p className="text-xs text-stone-500">{label}</p>
                <p className="font-mono text-xl font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </div>)}

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={EXPORT_CSV_URL}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Download CSV
            </a>
            <a
              href={EXPORT_JSON_URL}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-500/15"
            >
              Download JSON
            </a>
            <a
              href="https://docs.fuelkenya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.07] px-5 py-2.5 text-sm text-stone-600 dark:text-stone-400 transition-colors hover:text-stone-900 dark:hover:text-stone-100"
            >
              Live API docs
            </a>
          </div>
        </div>

        <div className={card}>
          <h2 className="text-lg font-bold">What&apos;s in each row</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
            {[
              ["town", "Town name as listed by EPRA/ERC"],
              ["valid_from, valid_to", "The pricing cycle (normally the 15th to the 14th of the next month)"],
              ["super_petrol, diesel, kerosene", "Maximum retail price in KSh per litre, VAT inclusive"],
              ["towns_in_cycle", "How many towns that cycle covers in our data"],
              ["coverage", "“full official table”, or “major towns only” where only city prices were published"],
              ["source", "Where that cycle's numbers come from"]
            ].map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-mono text-xs text-stone-700 dark:text-stone-300">{k}</dt>
                <dd className="text-stone-500">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {s && (<div className={card}>
          <h2 className="text-lg font-bold">Coverage by year</h2>
          <p className="mt-1 text-sm text-stone-500">
            Some months are missing because no complete official notice survives online. We leave gaps rather
            than fill them with guesses.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-stone-500">
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2 pr-4">Cycles</th>
                  <th className="py-2 pr-4">Full tables</th>
                  <th className="py-2 pr-4">Major towns only</th>
                  <th className="py-2">Most towns in a cycle</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {s.years.map((y) => (
                  <tr key={y.year} className="border-t border-black/[0.05] dark:border-white/[0.05]">
                    <td className="py-2 pr-4 font-semibold">{y.year}</td>
                    <td className="py-2 pr-4">{y.cycles} / 12</td>
                    <td className="py-2 pr-4">{y.full}</td>
                    <td className="py-2 pr-4">{y.major}</td>
                    <td className="py-2">{y.towns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>)}

        <div className={card}>
          <h2 className="text-lg font-bold">Sources, licence and citation</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-stone-500">
            <li>Current cycles: EPRA&apos;s published maximum retail prices (epra.go.ke).</li>
            <li>Mid-2019 to 2024: archived EPRA public notices (Internet Archive), read and checked town by town.</li>
            <li>2010 to mid-2019: Energy Regulatory Commission (ERC) public notices.</li>
            <li>Rows marked “major towns only”: the monthly review as reported by Kenyan news outlets.</li>
            <li>Every cycle is checked for consistency: each town&apos;s markup over Nairobi must agree across fuels.</li>
          </ul>
          <p className="mt-4 text-sm text-stone-500">
            Free to use under{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" className="underline hover:text-stone-800 dark:hover:text-stone-200">
              CC BY 4.0
            </a>
            . Please credit: <span className="font-mono text-xs text-stone-700 dark:text-stone-300">{attribution}</span>
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Spotted an error or have an official notice we&apos;re missing?{" "}
            <a
              href="https://github.com/erickarugu/fuelkenya/issues"
              className="underline hover:text-stone-800 dark:hover:text-stone-200"
            >
              Open an issue on GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
