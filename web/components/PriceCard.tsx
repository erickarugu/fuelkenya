interface PriceCardProps {
  title: string;
  value: number;
  delta: number | null;
  accent: "forest" | "maasai" | "azure" | "obsidian";
  sparkline?: number[];
}

function PetrolIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M2 22h14" />
      <path d="M6 7h6" /><path d="M6 11h6" />
      <path d="M15 6h1a2 2 0 0 1 2 2v3.5a1.5 1.5 0 0 0 3 0V8l-3-3" />
    </svg>
  );
}

function DieselIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
    </svg>
  );
}

function LanternIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6l3 7H6L9 2z" />
      <path d="M12 9v13" /><path d="M7.5 16h9" /><path d="M9 22h6" />
    </svg>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 72, H = 24;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 3) - 1.5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastX = W;
  const lastY = H - ((data[data.length - 1] - min) / range) * (H - 3) - 1.5;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} opacity="0.8" />
    </svg>
  );
}

const ACCENT = {
  forest: {
    bar:       "from-emerald-400 via-emerald-500 to-green-600",
    glow:      "from-emerald-500/[0.12]",
    iconBg:    "bg-emerald-500/[0.08] border-emerald-500/20",
    iconText:  "text-emerald-600 dark:text-emerald-300",
    border:    "border-emerald-500/[0.18]",
    hover:     "hover:border-emerald-500/40 hover:shadow-[0_8px_48px_rgba(0,166,81,0.14)]",
    spark:     "#34d399",
    deltaDown: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    deltaUp:   "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20",
  },
  maasai: {
    bar:       "from-red-400 via-red-500 to-rose-600",
    glow:      "from-red-500/[0.10]",
    iconBg:    "bg-red-500/[0.08] border-red-500/20",
    iconText:  "text-red-600 dark:text-red-300",
    border:    "border-red-500/[0.18]",
    hover:     "hover:border-red-500/40 hover:shadow-[0_8px_48px_rgba(187,0,39,0.14)]",
    spark:     "#f87171",
    deltaDown: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    deltaUp:   "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20",
  },
  azure: {
    bar:       "from-blue-400 via-blue-500 to-blue-600",
    glow:      "from-blue-500/[0.10]",
    iconBg:    "bg-blue-500/[0.08] border-blue-500/20",
    iconText:  "text-blue-600 dark:text-blue-300",
    border:    "border-blue-500/[0.18]",
    hover:     "hover:border-blue-500/40 hover:shadow-[0_8px_48px_rgba(96,165,250,0.14)]",
    spark:     "#60a5fa",
    deltaDown: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    deltaUp:   "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20",
  },
  obsidian: {
    bar:       "from-amber-300 via-amber-400 to-amber-600",
    glow:      "from-amber-500/[0.09]",
    iconBg:    "bg-amber-500/[0.08] border-amber-500/20",
    iconText:  "text-amber-600 dark:text-amber-300",
    border:    "border-amber-500/[0.18]",
    hover:     "hover:border-amber-500/40 hover:shadow-[0_8px_48px_rgba(245,158,11,0.14)]",
    spark:     "#fbbf24",
    deltaDown: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
    deltaUp:   "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20",
  }
} as const;

export default function PriceCard({ title, value, delta, accent, sparkline }: PriceCardProps) {
  const c = ACCENT[accent];
  const Icon = accent === "forest" ? PetrolIcon : accent === "azure" ? DieselIcon : LanternIcon;

  const dir = delta === null ? "neutral" : delta < 0 ? "down" : delta > 0 ? "up" : "flat";

  const pct = (() => {
    if (!delta || !value) return null;
    const prev = value - delta;
    if (prev <= 0) return null;
    return Math.abs((delta / prev) * 100).toFixed(1);
  })();

  const badgeClass =
    dir === "down" ? c.deltaDown :
    dir === "up"   ? c.deltaUp   :
    "text-stone-500 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.09] dark:border-white/[0.08]";

  const badgeLabel =
    dir === "down" ? `▼ KSh ${Math.abs(delta!).toFixed(2)}` :
    dir === "up"   ? `▲ KSh ${Math.abs(delta!).toFixed(2)}` :
    dir === "flat" ? "No change" : "—";

  return (
    <div className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-black/[0.02] dark:bg-white/[0.025] shadow-xl transition-all duration-300 ${c.hover}`}>
      {/* accent bar */}
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${c.bar}`} />
      {/* top glow */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b ${c.glow} to-transparent`} />

      <div className="relative p-6">
        {/* row 1: icon + delta */}
        <div className="mb-5 flex items-start justify-between gap-2">
          <div className={`inline-flex items-center justify-center rounded-xl border p-2.5 transition-transform duration-300 group-hover:scale-110 ${c.iconBg} ${c.iconText}`}>
            <Icon />
          </div>

          {delta !== null && (
            <div className="flex flex-col items-end gap-1 pt-0.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${badgeClass}`}>
                {badgeLabel}
              </span>
              {pct && (
                <span className={`text-xs font-medium tabular-nums ${dir === "down" ? "text-emerald-600" : "text-red-600"}`}>
                  {pct}% vs last cycle
                </span>
              )}
            </div>
          )}
        </div>

        {/* label */}
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-stone-600 dark:text-stone-400">{title}</p>

        {/* price */}
        <div className="mb-5 flex items-baseline gap-1.5">
          <span className="text-base font-medium text-stone-500">KSh</span>
          <span className="font-display text-5xl font-bold leading-none tracking-tight text-stone-900 dark:text-white tabular-nums">
            {value > 0 ? value.toFixed(2) : "—"}
          </span>
        </div>

        {/* sparkline + per litre */}
        <div className="flex items-end justify-between">
          <span className="text-xs text-stone-400 dark:text-stone-600">per litre</span>
          {sparkline && sparkline.length >= 2 && (
            <Sparkline data={sparkline} color={c.spark} />
          )}
        </div>
      </div>
    </div>
  );
}
