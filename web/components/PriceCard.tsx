interface PriceCardProps {
  title: string;
  value: number;
  delta: number | null;
  accent: "forest" | "maasai" | "obsidian";
}

const badgeStyles = {
  up: "bg-rose-50 text-rose-700 border border-rose-100/70 rounded-full px-3 py-1 text-xs font-semibold",
  down: "bg-emerald-50 text-emerald-700 border border-emerald-100/70 rounded-full px-3 py-1 text-xs font-semibold",
  neutral:
    "bg-zinc-100 text-stone-700 border border-zinc-200 rounded-full px-3 py-1 text-xs font-semibold"
};

const accentBorder = {
  forest: "border-l-4 border-kenya.dark",
  maasai: "border-l-4 border-kenya.red",
  obsidian: "border-l-4 border-zinc-900"
};

export default function PriceCard({
  title,
  value,
  delta,
  accent
}: PriceCardProps) {
  const direction = delta === null ? "neutral" : delta < 0 ? "down" : "up";
  const badgeLabel =
    delta === null
      ? "—"
      : `${direction === "down" ? "↓" : "↑"} KSh ${Math.abs(delta).toFixed(2)}`;

  return (
    <div
      className={`rounded-[1.75rem] border border-zinc-200 bg-white/90 p-6 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(0,77,49,0.24)] ${accentBorder[accent]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs uppercase tracking-[0.35em] text-stone-500 font-semibold">
          {title}
        </div>
        <div className={badgeStyles[direction]}>{badgeLabel}</div>
      </div>

      <div className="mt-6">
        <div className="text-5xl font-black tracking-tight font-mono text-stone-900">
          KSh {value.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
