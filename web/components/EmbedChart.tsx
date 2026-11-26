"use client";

// Rendered by /embed inside other sites' iframes.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import TownPicker from "@/components/TownPicker";
import type { PriceRecord } from "@/lib/api";

const TrendChart = dynamic(() => import("@/components/TrendChart"), { ssr: false });

interface EmbedChartProps {
  towns: string[];
  town: string;
  history: PriceRecord[];
  period: string;
  theme: "light" | "dark";
}

const withParam = (key: string, value: string) => {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value);
  return `?${params.toString()}`;
};

export default function EmbedChart({ towns, town, history, period, theme: initialTheme }: EmbedChartProps) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);

  // The embed follows its own theme, not the visitor's saved site theme.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const flipTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.history.replaceState(null, "", withParam("theme", next));
  };

  return (
    <div className="min-h-screen bg-[#f7f7f6] text-stone-900 dark:bg-[#0c0c0c] dark:text-stone-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.05] px-4 py-3 dark:border-white/[0.05] sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">Price history</span>
          <TownPicker
            towns={towns.length ? towns : [town]}
            value={town}
            onChange={(t) => router.replace(withParam("town", t))}
          />
          <span className="hidden text-xs text-stone-500 sm:inline">KSh / litre</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={flipTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.08] text-stone-500 transition-colors hover:text-stone-800 dark:border-white/[0.08] dark:hover:text-stone-200"
          >
            {theme === "dark" ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
          <a
            href={`https://fuelkenya.com/town/${encodeURIComponent(town.toLowerCase().replace(/\s+/g, "-"))}`}
            target="_blank"
            rel="noopener"
            className="text-xs font-bold text-stone-800 transition-opacity hover:opacity-80 dark:text-stone-100"
          >
            <span className="text-emerald-500">Fuel</span>Kenya ↗
          </a>
        </div>
      </div>
      <TrendChart
        key={town}
        embedded
        history={history}
        initialDuration={period}
        onDurationChange={(d) => window.history.replaceState(null, "", withParam("period", d))}
      />
      <p className="border-t border-black/[0.05] px-4 py-2 text-[11px] text-stone-500 dark:border-white/[0.05] sm:px-6">
        Source: EPRA/ERC maximum pump prices, compiled by FuelKenya
      </p>
    </div>
  );
}
