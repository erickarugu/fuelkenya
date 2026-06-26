"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { PriceRecord } from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface TrendChartProps {
  history: PriceRecord[];
}

const SERIES = [
  { key: "super_petrol" as const, label: "Super Petrol", color: "#10b981", rgb: [16, 185, 129] as [number, number, number] },
  { key: "diesel"       as const, label: "Diesel",       color: "#60a5fa", rgb: [96, 165, 250] as [number, number, number] },
  { key: "kerosene"     as const, label: "Kerosene",     color: "#fbbf24", rgb: [251, 191,  36] as [number, number, number] },
];

const DURATIONS = [
  { label: "3M",  months: 3,    ago: "3 months ago"  },
  { label: "6M",  months: 6,    ago: "6 months ago"  },
  { label: "1Y",  months: 12,   ago: "1 year ago"    },
  { label: "2Y",  months: 24,   ago: "2 years ago"   },
  { label: "5Y",  months: 60,   ago: "5 years ago"   },
  { label: "All", months: null, ago: "earliest data" },
] as const;

type DurLabel = typeof DURATIONS[number]["label"];

function makeGradient(ctx: CanvasRenderingContext2D, r: number, g: number, b: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0,    `rgba(${r},${g},${b},0.20)`);
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.05)`);
  grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  return grad;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const el = document.documentElement;
    setIsDark(el.classList.contains("dark"));
    const obs = new MutationObserver(() => setIsDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function TrendChart({ history }: TrendChartProps) {
  const [hidden,   setHidden]   = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState<DurLabel>("All");
  const isDark = useIsDark();

  const toggle = (key: string) =>
    setHidden(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const filtered = useMemo(() => {
    const dur = DURATIONS.find(d => d.label === duration);
    if (!dur?.months) return history;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - dur.months);
    const f = history.filter(h => new Date(h.valid_from) >= cutoff);
    return f.length > 0 ? f : history;
  }, [history, duration]);

  const labels = filtered.map(item =>
    new Date(item.valid_from).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
  );

  const datasets = SERIES.map(s => ({
    label:                     s.label,
    data:                      hidden.has(s.key) ? filtered.map(() => null) : filtered.map(h => h[s.key]),
    borderColor:               hidden.has(s.key) ? "transparent" : s.color,
    backgroundColor:           hidden.has(s.key)
                                 ? () => "transparent"
                                 : (ctx: any) => makeGradient(ctx.chart.ctx, ...s.rgb, ctx.chart.height ?? 400),
    borderWidth:               hidden.has(s.key) ? 0 : 2,
    fill:                      true,
    tension:                   0.38,
    pointRadius:               0,
    pointHoverRadius:          hidden.has(s.key) ? 0 : 5,
    pointHoverBackgroundColor: s.color,
    pointHoverBorderColor:     isDark ? "#080808" : "#ffffff",
    pointHoverBorderWidth:     2,
    spanGaps:                  true,
  }));

  const latest = filtered[filtered.length - 1];
  const first  = filtered[0];
  const stats = SERIES.map(s => {
    const current = latest?.[s.key] ?? 0;
    const initial = first?.[s.key]  ?? 0;
    const change  = current - initial;
    const pct     = initial > 0 ? (change / initial) * 100 : 0;
    const vals    = filtered.map(h => h[s.key]).filter(Boolean);
    const seriesLo = vals.length ? Math.min(...vals) : 0;
    const seriesHi = vals.length ? Math.max(...vals) : 0;
    return { ...s, current, change, pct, seriesLo, seriesHi };
  });

  const visibleValues = filtered
    .flatMap(h => SERIES.filter(s => !hidden.has(s.key)).map(s => h[s.key]))
    .filter(Boolean);
  const lo = visibleValues.length ? Math.min(...visibleValues).toFixed(2) : "—";
  const hi = visibleValues.length ? Math.max(...visibleValues).toFixed(2) : "—";

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const options = useMemo(() => ({
    responsive:          true,
    maintainAspectRatio: false,
    interaction:         { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? "#101010" : "#ffffff",
        borderColor:     isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        borderWidth:     1,
        titleColor:      "#78716c",
        bodyColor:       isDark ? "#e7e5e4" : "#111827",
        padding:         { top: 12, bottom: 12, left: 16, right: 16 },
        boxPadding:      6,
        cornerRadius:    12,
        titleFont:       { size: 11, family: "Inter, sans-serif" },
        bodyFont:        { size: 12, family: "Inter, sans-serif", weight: "bold" as const },
        itemSort:        (a: any, b: any) => b.parsed.y - a.parsed.y,
        callbacks: {
          title:      (items: any[]) => items[0]?.label ?? "",
          label:      (ctx: any) => {
            if (ctx.parsed.y === null) return undefined;
            return `  ${ctx.dataset.label}  ·  KSh ${ctx.parsed.y.toFixed(2)}`;
          },
          labelColor: (ctx: any) => ({
            backgroundColor: SERIES[ctx.datasetIndex]?.color ?? "#fff",
            borderColor:     "transparent",
            borderRadius:    3,
          }),
        },
      },
    },
    scales: {
      x: {
        grid:   { display: false },
        border: { display: false },
        ticks:  { color: "#78716c", font: { size: 11 }, maxRotation: 0, maxTicksLimit: 8 },
      },
      y: {
        grid:   { color: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)", drawTicks: false },
        border: { display: false },
        ticks:  { color: "#78716c", font: { size: 11 }, padding: 10, callback: (v: any) => `${v}` },
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isDark]);

  const pillBg    = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)";
  const pillText  = isDark ? "#e7e5e4" : "#111827";
  const pillOff   = isDark ? "#57534e" : "#78716c";
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02]">

      {/* ── header ── */}
      <div className="border-b border-black/[0.05] dark:border-white/[0.05] px-4 pb-5 pt-5 sm:px-6">

        {/* row 1: legend + duration filter */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {SERIES.map(s => {
              const off = hidden.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggle(s.key)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200"
                  style={{
                    borderColor:     off ? "rgba(0,0,0,0.06)"   : `${s.color}28`,
                    backgroundColor: off ? "rgba(0,0,0,0.02)"   : `${s.color}12`,
                    color:           off ? "#a8a29e"             : s.color,
                    opacity:         off ? 0.5 : 1,
                  }}
                >
                  <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: off ? "#a8a29e" : s.color }} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* duration pill group */}
          <div className="flex items-center gap-0.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.03] p-1">
            {DURATIONS.map(d => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDuration(d.label)}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums transition-all duration-200"
                style={{
                  background: duration === d.label ? pillBg : "transparent",
                  color:      duration === d.label ? pillText : pillOff,
                  boxShadow:  duration === d.label ? (isDark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.08)") : "none",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* row 2: per-series stat strip */}
        {latest && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map(s => {
              const isUp   = s.change > 0;
              const isDown = s.change < 0;
              const arrow  = isUp ? "▲" : isDown ? "▼" : "—";
              const sign   = isUp ? "+" : "";
              return (
                <div
                  key={s.key}
                  className="rounded-xl px-4 py-3.5 transition-opacity duration-200"
                  style={{
                    backgroundColor: `${s.color}06`,
                    border:          `1px solid ${s.color}14`,
                    opacity:         hidden.has(s.key) ? 0.3 : 1,
                  }}
                >
                  <div className="mb-3 flex items-center gap-1.5">
                    <span className="block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: s.color, opacity: 0.65 }}>
                      {s.label}
                    </span>
                  </div>

                  <div className="mb-4 flex items-baseline gap-1.5">
                    <span className="font-mono text-[1.7rem] font-black leading-none tabular-nums text-stone-900 dark:text-stone-100">
                      {s.current.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-stone-500">KSh / litre</span>
                  </div>

                  <div className="mb-3 h-px" style={{ background: `${s.color}12` }} />

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-stone-500">Low</span>
                        <span className="font-semibold text-stone-600 dark:text-stone-400">{s.seriesLo.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-stone-500">High</span>
                        <span className="font-semibold text-stone-600 dark:text-stone-400">{s.seriesHi.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="font-bold tabular-nums" style={{ color: s.color }}>
                      {arrow} KSh {sign}{s.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* row 3: period meta */}
        {visibleValues.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
            {first && latest && (
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500">Period</span>
                <span className="text-stone-600 dark:text-stone-400">{fmtDate(first.valid_from)} — {fmtDate(latest.valid_from)}</span>
              </div>
            )}
            <div className="hidden h-3 w-px bg-black/[0.07] dark:bg-white/[0.06] sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">Low</span>
              <span className="font-semibold text-stone-600 dark:text-stone-400">KSh {lo}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">High</span>
              <span className="font-semibold text-stone-600 dark:text-stone-400">KSh {hi}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">Data points</span>
              <span className="font-semibold text-stone-600 dark:text-stone-400">{filtered.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── chart ── */}
      <div className="h-[260px] px-3 py-4 sm:h-[360px] sm:px-4 lg:h-[440px]">
        <Line data={{ labels, datasets }} options={options} />
      </div>
    </div>
  );
}
