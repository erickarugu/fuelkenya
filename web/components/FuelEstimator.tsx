"use client";

import { useMemo, useState } from "react";

const FUELS = [
  { key: "super_petrol" as const, label: "Super Petrol", short: "Petrol",  accent: "emerald" },
  { key: "diesel"       as const, label: "Diesel",       short: "Diesel",  accent: "blue"    },
  { key: "kerosene"     as const, label: "Kerosene",     short: "Kero",    accent: "amber"   }
];

type FuelKey = typeof FUELS[number]["key"];

interface Props {
  petrolPrice:   number;
  dieselPrice:   number;
  kerosenePrice: number;
  town: string;
}

const TAB_ACTIVE: Record<string, string> = {
  emerald: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  blue:    "border-blue-500/40    bg-blue-500/15    text-blue-300",
  amber:   "border-amber-500/40   bg-amber-500/15   text-amber-300"
};

export default function FuelEstimator({ petrolPrice, dieselPrice, kerosenePrice, town }: Props) {
  const [fuelKey,     setFuelKey]     = useState<FuelKey>("super_petrol");
  const [distance,    setDistance]    = useState("");
  const [consumption, setConsumption] = useState("");
  const [roundTrip,   setRoundTrip]   = useState(false);

  const priceMap: Record<FuelKey, number> = {
    super_petrol: petrolPrice,
    diesel:       dieselPrice,
    kerosene:     kerosenePrice
  };

  const price        = priceMap[fuelKey];
  const dist         = parseFloat(distance)    || 0;
  const cons         = parseFloat(consumption) || 0;
  const effectiveDist = dist * (roundTrip ? 2 : 1);

  const { litres, cost } = useMemo(() => {
    if (!dist || !cons || !price) return { litres: 0, cost: 0 };
    const litres = effectiveDist / cons;
    return { litres, cost: litres * price };
  }, [dist, cons, price, effectiveDist]);

  const hasResult  = dist > 0 && cons > 0 && price > 0;
  const activeFuel = FUELS.find(f => f.key === fuelKey)!;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">

      {/* Fuel type selector */}
      <div className="mb-6">
        <p className="mb-3 text-xs uppercase tracking-widest text-stone-400">Fuel type</p>
        <div className="flex gap-2 flex-wrap">
          {FUELS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFuelKey(f.key)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                fuelKey === f.key
                  ? TAB_ACTIVE[f.accent]
                  : "border-white/[0.08] bg-white/[0.03] text-stone-400 hover:text-stone-200 hover:border-white/15"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-stone-400">Distance</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-12 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-500">km</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-stone-400">
            Fuel consumption
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={consumption}
              onChange={e => setConsumption(e.target.value)}
              placeholder="12"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-16 text-sm text-stone-100 placeholder:text-stone-600 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-500">km/l</span>
          </div>
        </div>
      </div>

      {/* Round-trip toggle */}
      <button
        type="button"
        onClick={() => setRoundTrip(rt => !rt)}
        className="mb-6 flex items-center gap-2.5 group"
      >
        <div
          className={`flex h-4 w-4 items-center justify-center rounded border transition-all duration-200 ${
            roundTrip ? "border-emerald-500 bg-emerald-500" : "border-white/25 bg-transparent"
          }`}
        >
          {roundTrip && (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-xs text-stone-400 group-hover:text-stone-200 transition-colors">Include return journey</span>
      </button>

      {/* Result */}
      {hasResult ? (
        <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-5">
          <div className="mb-4 grid grid-cols-2 gap-6">
            <div>
              <div className="mb-1.5 text-xs uppercase tracking-widest text-stone-400">Fuel needed</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-white">{litres.toFixed(1)}</span>
                <span className="text-sm text-stone-400">L</span>
              </div>
              {roundTrip && (
                <div className="mt-1 text-xs text-stone-500">
                  {(litres / 2).toFixed(1)} L each way
                </div>
              )}
            </div>
            <div>
              <div className="mb-1.5 text-xs uppercase tracking-widest text-stone-400">Estimated cost</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm text-stone-400">KSh</span>
                <span className="text-3xl font-bold tabular-nums text-white">
                  {cost.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-3 text-xs text-stone-500">
            {activeFuel.label} in {town} · KSh {price.toFixed(2)} / litre
            {roundTrip ? " · Round trip" : ""}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center">
          <div className="text-xs text-stone-500">Enter distance and consumption to calculate your fuel cost</div>
        </div>
      )}
    </div>
  );
}
