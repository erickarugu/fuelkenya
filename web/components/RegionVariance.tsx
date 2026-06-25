interface RegionVarianceProps {
  overview:   { name: string; price: number }[];
  activeTown?: string;
}

// Interpolate colour: green (#00a651) → amber (#f59e0b) → red (#bb0027)
function rankColor(rank: number, total: number): string {
  const t = total <= 1 ? 0 : rank / (total - 1);
  if (t <= 0.5) {
    const s = t * 2;
    return `rgb(${Math.round(0 + 245 * s)},${Math.round(166 + (158 - 166) * s)},${Math.round(81 + (11 - 81) * s)})`;
  }
  const s = (t - 0.5) * 2;
  return `rgb(${Math.round(245 + (187 - 245) * s)},${Math.round(158 * (1 - s))},${Math.round(11 + (39 - 11) * s)})`;
}

export default function RegionVariance({ overview, activeTown }: RegionVarianceProps) {
  if (overview.length < 2) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <p className="text-sm text-stone-600">Town comparison data unavailable.</p>
      </div>
    );
  }

  const sorted   = [...overview].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0].price;
  const priciest = sorted[sorted.length - 1].price;
  const range    = priciest - cheapest || 1;
  const spread   = (priciest - cheapest).toFixed(2);
  const variance = ((priciest - cheapest) / cheapest * 100).toFixed(1);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">

      {/* rows */}
      {sorted.map((town, rank) => {
        const isActive   = town.name === activeTown;
        const isCheapest = rank === 0;
        const isMostExp  = rank === sorted.length - 1;
        const color      = rankColor(rank, sorted.length);
        // bar: minimum 8% so even the cheapest shows something, max fills proportionally
        const barW = 8 + ((town.price - cheapest) / range) * 88;

        return (
          <div
            key={town.name}
            className={`flex items-center gap-4 border-b border-white/[0.04] px-5 py-3.5 last:border-0 ${isActive ? "bg-white/[0.025]" : ""}`}
          >
            {/* rank */}
            <span className="w-5 shrink-0 text-center text-xs font-black tabular-nums text-stone-600">
              {rank + 1}
            </span>

            {/* town name + badges */}
            <div className="w-28 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-stone-300"}`}>
                  {town.name}
                </span>
                {isActive && (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-500">
                    you
                  </span>
                )}
              </div>
              {isCheapest && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600">
                  cheapest
                </span>
              )}
              {isMostExp && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-red-700">
                  priciest
                </span>
              )}
            </div>

            {/* bar */}
            <div className="flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barW}%`, backgroundColor: color }}
                />
              </div>
            </div>

            {/* price */}
            <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums" style={{ color }}>
              {town.price.toFixed(2)}
            </span>
          </div>
        );
      })}

      {/* footer stats */}
      <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-600">Spread</span>
          <span className="text-xs font-semibold text-stone-400">KSh {spread}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-600">Variance</span>
          <span className="text-xs font-semibold text-stone-400">{variance}%</span>
        </div>
        <span className="text-xs text-stone-600">{sorted.length} cities · Super Petrol</span>
      </div>
    </div>
  );
}
