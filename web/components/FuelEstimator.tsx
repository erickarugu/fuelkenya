"use client";

import { useMemo, useState } from "react";

function PetrolIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M2 22h14" /><path d="M6 7h6" /><path d="M6 11h6" />
      <path d="M15 6h1a2 2 0 0 1 2 2v3.5a1.5 1.5 0 0 0 3 0V8l-3-3" />
    </svg>
  );
}
function DieselIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
    </svg>
  );
}
function KeroIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6l3 7H6L9 2z" />
      <path d="M12 9v13" /><path d="M7.5 16h9" /><path d="M9 22h6" />
    </svg>
  );
}

const FUELS = [
  { key: "super_petrol" as const, label: "Super Petrol", color: "#10b981", rgb: "16,185,129",  Icon: PetrolIcon },
  { key: "diesel"       as const, label: "Diesel",       color: "#60a5fa", rgb: "96,165,250",  Icon: DieselIcon },
];

type FuelKey = typeof FUELS[number]["key"];

interface Props {
  petrolPrice: number;
  dieselPrice: number;
  town:        string;
}

export default function FuelEstimator({ petrolPrice, dieselPrice, town }: Props) {
  const [fuelKey,     setFuelKey]     = useState<FuelKey>("super_petrol");
  const [distance,    setDistance]    = useState("");
  const [consumption, setConsumption] = useState("12");
  const [roundTrip,   setRoundTrip]   = useState(false);

  const priceMap: Record<FuelKey, number> = {
    super_petrol: petrolPrice,
    diesel:       dieselPrice,
  };

  const price        = priceMap[fuelKey];
  const dist         = parseFloat(distance)    || 0;
  const cons         = parseFloat(consumption) || 0;
  const effectiveDist = dist * (roundTrip ? 2 : 1);

  const { litres, cost, per100 } = useMemo(() => {
    if (!dist || !cons || !price) return { litres: 0, cost: 0, per100: 0 };
    const litres = effectiveDist / cons;
    const cost   = litres * price;
    const per100 = (100 / cons) * price;
    return { litres, cost, per100 };
  }, [dist, cons, price, effectiveDist]);

  const hasResult  = dist > 0 && cons > 0 && price > 0;
  const fuel       = FUELS.find(f => f.key === fuelKey)!;

  return (
    <div
      className="overflow-hidden rounded-2xl transition-all duration-500"
      style={{
        background:  `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(${fuel.rgb},0.06) 0%, transparent 70%), rgba(255,255,255,0.015)`,
        border:      `1px solid rgba(${fuel.rgb},0.16)`,
      }}
    >

      {/* ── Fuel type selector ── */}
      <div className="p-6 pb-5">
        <p className="mb-3.5 text-xs font-bold uppercase tracking-widest text-stone-500">Fuel type</p>
        <div className="grid grid-cols-2 gap-3">
          {FUELS.map(f => {
            const pv     = priceMap[f.key];
            const active = fuelKey === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFuelKey(f.key)}
                className="relative flex flex-col items-start rounded-xl p-3.5 text-left transition-all duration-200"
                style={{
                  background:  active ? `rgba(${f.rgb},0.10)` : "rgba(255,255,255,0.03)",
                  border:      `1px solid ${active ? `rgba(${f.rgb},0.28)` : "rgba(255,255,255,0.07)"}`,
                  boxShadow:   active ? `0 0 28px rgba(${f.rgb},0.10)` : "none",
                }}
              >
                {/* icon row */}
                <div className="mb-3 flex w-full items-center justify-between">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `rgba(${f.rgb},0.12)`, color: f.color }}
                  >
                    <f.Icon size={16} />
                  </div>
                  {active && (
                    <div
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: f.color }}
                    >
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold leading-snug" style={{ color: active ? f.color : "#a8a29e" }}>
                  {f.label}
                </span>
                <span className="mt-0.5 font-mono text-xs tabular-nums text-stone-500">
                  KSh {pv ? pv.toFixed(2) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Inputs ── */}
      <div className="grid gap-4 px-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-500">
            Distance
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 pr-12 text-base font-semibold text-stone-100 placeholder:text-stone-700 outline-none transition-all duration-200"
              style={{ ["--tw-ring-color" as any]: fuel.color }}
              onFocus={e  => { e.currentTarget.style.borderColor = `rgba(${fuel.rgb},0.35)`; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onBlur={e   => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">km</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-500">
            Fuel consumption
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={consumption}
              onChange={e => setConsumption(e.target.value)}
              placeholder="12"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 pr-16 text-base font-semibold text-stone-100 placeholder:text-stone-700 outline-none transition-all duration-200"
              onFocus={e => { e.currentTarget.style.borderColor = `rgba(${fuel.rgb},0.35)`; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">km/l</span>
          </div>
        </div>
      </div>

      {/* ── Round-trip toggle ── */}
      <div className="px-6 pt-4">
        <button
          type="button"
          onClick={() => setRoundTrip(rt => !rt)}
          className="group flex items-center gap-2.5"
        >
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200"
            style={{
              borderColor: roundTrip ? fuel.color : "rgba(255,255,255,0.18)",
              background:  roundTrip ? fuel.color : "transparent",
            }}
          >
            {roundTrip && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-stone-400 transition-colors group-hover:text-stone-200">
            Include return journey
          </span>
          {roundTrip && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: `rgba(${fuel.rgb},0.12)`, color: fuel.color }}
            >
              ×2
            </span>
          )}
        </button>
      </div>

      {/* ── Result panel ── */}
      <div className="p-6">
        {hasResult ? (
          <div
            className="overflow-hidden rounded-xl transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, rgba(${fuel.rgb},0.10) 0%, rgba(${fuel.rgb},0.03) 100%)`,
              border:     `1px solid rgba(${fuel.rgb},0.22)`,
            }}
          >
            {/* top accent line */}
            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${fuel.color} 0%, transparent 70%)` }} />

            <div className="p-5">
              {/* main stats */}
              <div className="mb-4 grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                    Estimated cost
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-medium text-stone-400">KSh</span>
                    <span
                      className="text-[2.6rem] font-black leading-none tabular-nums"
                      style={{ color: fuel.color }}
                    >
                      {cost.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {roundTrip && (
                    <div className="mt-1.5 text-xs text-stone-500">
                      KSh {(cost / 2).toLocaleString("en-KE", { maximumFractionDigits: 2 })} each way
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                    Fuel needed
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[2.6rem] font-black leading-none tabular-nums text-white">
                      {litres.toFixed(1)}
                    </span>
                    <span className="text-sm font-medium text-stone-400">L</span>
                  </div>
                  {roundTrip && (
                    <div className="mt-1.5 text-xs text-stone-500">
                      {(litres / 2).toFixed(1)} L each way
                    </div>
                  )}
                </div>
              </div>

              {/* cost-per-100km stat bar */}
              <div
                className="flex items-center justify-between rounded-lg px-4 py-2.5"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="block h-1.5 w-1.5 rounded-full" style={{ background: fuel.color }} />
                  <span className="text-xs text-stone-500">Cost per 100 km</span>
                </div>
                <span className="font-mono text-sm font-bold text-stone-300">KSh {per100.toFixed(2)}</span>
              </div>

              {/* footnote */}
              <div className="mt-3 text-xs leading-relaxed text-stone-600">
                {fuel.label} · {town} · KSh {price.toFixed(2)} / litre
                {roundTrip ? " · Round trip" : ""}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10"
            style={{ borderColor: `rgba(${fuel.rgb},0.14)` }}
          >
            <div
              className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `rgba(${fuel.rgb},0.08)`, color: fuel.color }}
            >
              <fuel.Icon size={24} />
            </div>
            <p className="text-sm font-medium text-stone-400">Enter a distance to get started</p>
            <p className="mt-1 text-xs text-stone-600">We&apos;ll calculate cost and litres needed</p>
          </div>
        )}
      </div>
    </div>
  );
}
