"use client";

import { useState } from "react";

interface TownRow {
  name:         string;
  super_petrol: number;
  diesel:       number;
  kerosene:     number;
}

interface RegionVarianceProps {
  overview:    TownRow[];
  activeTown?: string;
}

const FUELS = [
  { key: "super_petrol" as const, label: "Petrol",   color: "#10b981", rgb: "16,185,129"  },
  { key: "diesel"       as const, label: "Diesel",   color: "#60a5fa", rgb: "96,165,250"  },
  { key: "kerosene"     as const, label: "Kerosene", color: "#fbbf24", rgb: "251,191,36"  },
];

export default function RegionVariance({ overview, activeTown }: RegionVarianceProps) {
  const [fuelKey, setFuelKey] = useState<typeof FUELS[number]["key"]>("super_petrol");

  if (overview.length < 2) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <p className="text-sm text-stone-600">Town comparison data unavailable.</p>
      </div>
    );
  }

  const fuel    = FUELS.find(f => f.key === fuelKey)!;
  const sorted  = [...overview].sort((a, b) => a[fuelKey] - b[fuelKey]);
  const base    = sorted[0][fuelKey];           // cheapest = baseline
  const ceiling = sorted[sorted.length - 1][fuelKey];
  const spread  = (ceiling - base).toFixed(2);
  const pct     = ((ceiling - base) / base * 100).toFixed(1);

  const activeRow = sorted.find(t => t.name === activeTown);
  const activePrice = activeRow?.[fuelKey];
  const activeDelta = activePrice != null ? activePrice - base : null;

  return (
    <div
      className="overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        border:     `1px solid rgba(${fuel.rgb},0.12)`,
        background: "rgba(255,255,255,0.015)",
      }}
    >

      {/* ── tabs ── */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          {FUELS.map(f => {
            const on = fuelKey === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFuelKey(f.key)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200"
                style={{
                  background:  on ? `rgba(${f.rgb},0.12)` : "transparent",
                  border:      `1px solid ${on ? `rgba(${f.rgb},0.28)` : "transparent"}`,
                  color:       on ? f.color : "#78716c",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* savings callout for active town */}
        {activeDelta != null && activeDelta > 0 && (
          <div
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:flex"
            style={{ background: `rgba(${fuel.rgb},0.07)`, border: `1px solid rgba(${fuel.rgb},0.14)` }}
          >
            <span className="text-stone-500">{activeTown} pays</span>
            <span className="font-bold" style={{ color: fuel.color }}>KSh {activeDelta.toFixed(2)} more</span>
            <span className="text-stone-500">than cheapest</span>
          </div>
        )}
        {activeDelta === 0 && (
          <div
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:flex"
            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.14)" }}
          >
            <span className="font-bold text-emerald-400">{activeTown} has the best price</span>
          </div>
        )}
      </div>

      {/* ── rows ── */}
      {sorted.map((town, rank) => {
        const price    = town[fuelKey];
        const delta    = price - base;           // how much more than cheapest
        const isActive = town.name === activeTown;
        const isBest   = rank === 0;
        const isWorst  = rank === sorted.length - 1;

        // Bar: absolute price as fraction of ceiling — shows all cities are actually close
        const barFill = (price / ceiling) * 100;

        return (
          <div
            key={town.name}
            className="group flex items-center gap-4 border-b border-white/[0.04] px-5 py-3.5 last:border-0 transition-colors duration-150"
            style={{ background: isActive ? `rgba(${fuel.rgb},0.04)` : undefined }}
          >
            {/* rank */}
            <span className="w-4 shrink-0 text-center text-xs font-black tabular-nums text-stone-600">
              {rank + 1}
            </span>

            {/* town name */}
            <div className="w-24 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-stone-300"}`}>
                  {town.name}
                </span>
                {isActive && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-xs font-black uppercase tracking-wide"
                    style={{ background: `rgba(${fuel.rgb},0.14)`, color: fuel.color }}
                  >
                    you
                  </span>
                )}
              </div>
              {isBest && (
                <span className="text-xs font-semibold text-stone-500">Cheapest</span>
              )}
            </div>

            {/* bar — absolute price width, single accent color */}
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:      `${barFill}%`,
                    background: isBest
                      ? fuel.color
                      : `rgba(${fuel.rgb},0.55)`,
                  }}
                />
              </div>
            </div>

            {/* price */}
            <div className="w-24 shrink-0 text-right">
              <span className="text-xs font-medium text-stone-500">KSh </span>
              <span className="text-sm font-bold tabular-nums text-stone-200">{price.toFixed(2)}</span>
            </div>

            {/* delta from cheapest */}
            <div className="w-20 shrink-0 text-right">
              {isBest ? (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: `rgba(${fuel.rgb},0.12)`, color: fuel.color }}
                >
                  best
                </span>
              ) : (
                <span className="text-xs font-semibold tabular-nums text-stone-500">
                  +KSh {delta.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* ── footer ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-y-1 px-5 py-3.5 text-xs"
        style={{ borderTop: `1px solid rgba(${fuel.rgb},0.07)` }}
      >
        <div className="flex items-center gap-1.5 text-stone-600">
          <span>{sorted.length} cities · {fuel.label}</span>
          <span className="text-stone-700">·</span>
          <span>current cycle</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-600">Spread</span>
            <span className="font-semibold text-stone-400">KSh {spread}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-600">Variance</span>
            <span className="font-semibold text-stone-400">{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
