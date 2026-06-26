"use client";

import { useEffect, useState } from "react";

interface TownPrice {
  city:     string;
  petrol:   string;
  diesel:   string;
  kerosene: string;
}

const ROWS = [
  { key: "petrol"   as const, label: "Super Petrol", accent: "#34d399", bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.14)"  },
  { key: "diesel"   as const, label: "Diesel",        accent: "#60a5fa", bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.14)"  },
  { key: "kerosene" as const, label: "Kerosene",      accent: "#fbbf24", bg: "rgba(251,191,36,0.06)",  border: "rgba(251,191,36,0.12)"  },
];

export default function HeroVisual({ towns }: { towns: TownPrice[] }) {
  const [idx, setIdx]     = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (towns.length < 2) return;
    const t = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        setIdx(i => (i + 1) % towns.length);
        setPhase("in");
      }, 200);
    }, 3600);
    return () => clearInterval(t);
  }, [towns.length]);

  const p = towns[idx];
  if (!p) return null;

  const isIn = phase === "in";

  return (
    <div className="relative hidden rounded-2xl p-[1px] lg:block" style={{ overflow: "hidden" }}>

      {/* comet 1 */}
      <div
        className="pointer-events-none absolute"
        style={{
          inset:     "-120%",
          animation: "border-sweep 7s linear infinite",
          background: `conic-gradient(
            from 0deg,
            transparent          0deg,
            transparent          150deg,
            rgba(52,211,153,0.03) 158deg,
            rgba(52,211,153,0.12) 165deg,
            rgba(52,211,153,0.30) 170deg,
            rgba(52,211,153,0.52) 174deg,
            rgba(52,211,153,0.20) 177deg,
            transparent          181deg,
            transparent          360deg
          )`,
        }}
      />

      {/* comet 2 */}
      <div
        className="pointer-events-none absolute"
        style={{
          inset:     "-120%",
          animation: "border-sweep 11s linear infinite reverse",
          background: `conic-gradient(
            from 0deg,
            transparent          0deg,
            transparent          60deg,
            rgba(52,211,153,0.02) 66deg,
            rgba(52,211,153,0.08) 71deg,
            rgba(52,211,153,0.18) 74deg,
            rgba(52,211,153,0.08) 77deg,
            transparent          81deg,
            transparent          360deg
          )`,
        }}
      />

      {/* ── inner card ── */}
      <div
        className="relative overflow-hidden rounded-[15px]"
        style={{ background: "var(--hero-card)" }}
      >
        {/* dot-grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `radial-gradient(circle, var(--hero-dot) 1px, transparent 1px)`, backgroundSize: "20px 20px" }}
        />
        {/* top-right ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 90% 0%, var(--hero-glow) 0%, transparent 52%)` }}
        />

        <div className="relative z-10 p-8">

          {/* header */}
          <div
            style={{
              opacity:    isIn ? 1 : 0,
              transform:  isIn ? "translateY(0)" : "translateY(-6px)",
              transition: isIn
                ? "opacity 0.3s cubic-bezier(0,0,0.2,1), transform 0.3s cubic-bezier(0,0,0.2,1)"
                : "opacity 0.15s ease-in, transform 0.15s ease-in",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-500">
                  Live prices
                </span>
              </div>
              <span className="rounded-full border border-black/[0.08] dark:border-white/[0.07] bg-black/[0.03] dark:bg-white/[0.03] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                EPRA max
              </span>
            </div>

            <p className="text-[2rem] font-black leading-tight tracking-tight text-stone-900 dark:text-white">{p.city}</p>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-600">Maximum pump price · current cycle</p>
          </div>

          {/* divider */}
          <div className="my-6 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

          {/* price rows */}
          <div className="flex flex-col gap-2.5">
            {ROWS.map((row, ri) => (
              <div
                key={row.key}
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "space-between",
                  backgroundColor: row.bg,
                  border:          `1px solid ${row.border}`,
                  borderRadius:    12,
                  padding:         "13px 16px",
                  opacity:         isIn ? 1 : 0,
                  transform:       isIn ? "translateX(0)" : "translateX(10px)",
                  transition:      isIn
                    ? `opacity 0.32s cubic-bezier(0,0,0.2,1) ${ri * 45}ms, transform 0.32s cubic-bezier(0,0,0.2,1) ${ri * 45}ms`
                    : "opacity 0.12s ease-in, transform 0.12s ease-in",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: row.accent, flexShrink: 0, display: "block" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {row.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-medium text-stone-400 dark:text-stone-600">KSh</span>
                  <span
                    style={{ color: row.accent }}
                    className="font-mono text-2xl font-extrabold tabular-nums tracking-tight"
                  >
                    {p[row.key]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* nav dots */}
          <div className="mt-6 flex items-center gap-2">
            {towns.map((t, i) => (
              <button
                key={t.city}
                type="button"
                aria-label={t.city}
                onClick={() => { setIdx(i); setPhase("in"); }}
                className="shrink-0 cursor-pointer border-none p-0"
                style={{
                  display:         "block",
                  width:           i === idx ? 20 : 5,
                  height:          3,
                  borderRadius:    999,
                  backgroundColor: i === idx ? "#00a651" : "var(--border-2)",
                  transition:      "width 0.28s ease",
                }}
              />
            ))}
            <span className="ml-auto text-xs tabular-nums text-stone-400 dark:text-stone-700">
              {idx + 1} / {towns.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
