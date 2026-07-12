"use client";

import { useEpraCycle } from "@/lib/useEpraCycle";

function urgency(days: number) {
  if (days <= 3)  return { color: "#f87171", rgb: "248,113,113", tip: "Last chance at current rates" };
  if (days <= 7)  return { color: "#fb923c", rgb: "251,146,60",  tip: "Fill up this week if possible"  };
  if (days <= 14) return { color: "#fbbf24", rgb: "251,191,36",  tip: "Worth topping up soon"          };
  return           { color: "#60a5fa", rgb: "96,165,250",  tip: "Prices stable, no rush yet"   };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function UpdateCountdown() {
  const { now, target, cycleStart, countdown, isLive, isReviewDay } = useEpraCycle();

  const totalMs    = target.getTime() - cycleStart.getTime();
  const elapsedMs  = Math.min(Math.max(now.getTime() - cycleStart.getTime(), 0), totalMs);
  const progress   = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;

  const urg = urgency(countdown.days);

  const fmtShort = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" });
  const reviewDate = target.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Nairobi" });

  if (isLive) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-6 py-5">
        <span className="live-dot" />
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">New EPRA prices are live</p>
          <p className="mt-0.5 text-xs text-stone-500">Refresh to see the latest rates</p>
        </div>
      </div>
    );
  }

  if (isReviewDay) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-[var(--surface-1)]">
        <div
          className="h-[2px]"
          style={{ background: "linear-gradient(90deg, rgba(251,191,36,0.8) 0%, rgba(251,191,36,0.15) 40%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse 70% 80% at 0% 50%, rgba(251,191,36,0.5) 0%, transparent 65%)" }}
        />
        <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                EPRA review day
              </span>
            </div>
            <p className="text-lg font-black text-stone-900 dark:text-stone-100">New pump prices expected today</p>
            <p className="mt-0.5 text-xs text-stone-500">Official rates typically publish around 1:00 PM</p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-2.5">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "300ms" }} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Today</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl transition-all duration-700"
      style={{
        background: `radial-gradient(ellipse 70% 80% at 0% 50%, rgba(${urg.rgb},0.06) 0%, transparent 65%), var(--surface-1)`,
        border:     `1px solid rgba(${urg.rgb},0.18)`,
      }}
    >
      {/* top accent line */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, rgba(${urg.rgb},0.7) 0%, rgba(${urg.rgb},0.15) 40%, transparent 70%)` }} />

      <div className="px-6 py-5">
        {/* ── row 1: label + countdown ── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: urg.color }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: urg.color }} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500">EPRA price cycle</span>
            </div>
            <p className="text-lg font-black text-stone-900 dark:text-stone-100">
              {countdown.days > 0
                ? `Prices locked for ${countdown.days} more day${countdown.days !== 1 ? "s" : ""}`
                : "Prices change today"}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">Next review: {reviewDate}</p>
          </div>

          {/* countdown segments */}
          <div className="flex shrink-0 items-end gap-1.5">
            {[
              { v: countdown.days,    l: "days" },
              { v: countdown.hours,   l: "hrs"  },
              { v: countdown.minutes, l: "min"  },
              { v: countdown.seconds, l: "sec"  },
            ].map((seg, i) => (
              <div key={seg.l} className="flex items-end gap-1.5">
                {i > 0 && <span className="mb-4 text-base font-light text-stone-300 dark:text-stone-700">:</span>}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="min-w-[48px] rounded-xl px-2 py-2.5 text-center font-mono text-2xl font-black tabular-nums text-stone-900 dark:text-white"
                    style={{ background: `rgba(${urg.rgb},0.08)`, border: `1px solid rgba(${urg.rgb},0.14)` }}
                  >
                    {pad(seg.v)}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: urg.color, opacity: 0.6 }}>
                    {seg.l}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── row 2: cycle progress bar ── */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-stone-500">Cycle progress</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: `rgba(${urg.rgb},0.12)`, color: urg.color }}
            >
              {urg.tip}
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.05]">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, rgba(${urg.rgb},0.4) 0%, rgba(${urg.rgb},0.85) 100%)`,
              }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full"
              style={{ left: `${progress}%`, background: urg.color, boxShadow: `0 0 6px rgba(${urg.rgb},0.8)` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between text-xs text-stone-500">
            <span>{fmtShort(cycleStart)} · cycle start</span>
            <span>{Math.round(progress)}% complete</span>
            <span>cycle end · {fmtShort(target)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
