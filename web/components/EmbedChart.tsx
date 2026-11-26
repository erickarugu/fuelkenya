"use client";

// Rendered by /embed inside other sites' iframes.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { PriceRecord } from "@/lib/api";

const TrendChart = dynamic(() => import("@/components/TrendChart"), { ssr: false });

interface EmbedChartProps {
  towns: string[];
  town: string;
  history: PriceRecord[];
  period: string;
  theme: "light" | "dark";
}

export default function EmbedChart({ towns, town, history, period, theme }: EmbedChartProps) {
  const router = useRouter();

  // The embed follows the theme in its URL, not the visitor's saved site theme.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    return `?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white p-3 text-stone-900 dark:bg-[#080808] dark:text-stone-100">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Price history</span>
          <label htmlFor="embed-town" className="sr-only">Town</label>
          <select
            id="embed-town"
            value={town}
            onChange={(e) => router.replace(setParam("town", e.target.value))}
            className="rounded-full border border-black/[0.1] bg-white px-3 py-1 text-sm font-semibold dark:border-white/[0.1] dark:bg-white/[0.04]"
          >
            {(towns.length ? towns : [town]).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="text-xs text-stone-500">KSh / litre</span>
        </div>
        <a
          href={`https://fuelkenya.com/town/${encodeURIComponent(town.toLowerCase().replace(/\s+/g, "-"))}`}
          target="_blank"
          rel="noopener"
          className="text-xs font-semibold text-stone-500 transition-colors hover:text-emerald-600"
        >
          <span className="text-emerald-500">Fuel</span>Kenya ↗
        </a>
      </div>
      <TrendChart
        key={town}
        history={history}
        initialDuration={period}
        onDurationChange={(d) => window.history.replaceState(null, "", setParam("period", d))}
      />
      <p className="mt-2 px-1 text-[11px] text-stone-500">
        Source: EPRA/ERC maximum pump prices, compiled by FuelKenya (fuelkenya.com)
      </p>
    </div>
  );
}
