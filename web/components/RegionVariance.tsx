import type { PriceRecord } from "@/lib/api";

interface RegionVarianceProps {
  overview: { name: string; price: number }[];
}

export default function RegionVariance({ overview }: RegionVarianceProps) {
  if (overview.length < 2) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="text-sm uppercase tracking-[0.3em] text-stone-500">
          Regional Variance Index
        </div>
        <div className="mt-4 text-sm text-stone-700">
          Regional data is unavailable for this town.
        </div>
      </div>
    );
  }

  const [low, high] = overview;
  const premium = ((high.price - low.price) / low.price) * 100;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="text-sm uppercase tracking-[0.3em] text-kenya.dark">
        Regional Variance Index
      </div>
      <div className="mt-4 grid gap-4 text-sm text-stone-900 sm:grid-cols-3">
        <div className="rounded-2xl border border-kenya.dark/10 bg-kenya.sand p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-kenya.dark">
            Coastal Base
          </div>
          <div className="mt-3 text-xl font-bold">{low.name}</div>
          <div className="mt-1 text-sm text-stone-600">
            KSh {low.price.toFixed(2)}
          </div>
        </div>
        <div className="rounded-3xl border border-kenya.dark/10 bg-kenya.sand p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-kenya.dark">
            Inland High
          </div>
          <div className="mt-3 text-xl font-bold text-kenya.dark">
            {high.name}
          </div>
          <div className="mt-1 text-sm text-stone-600">
            KSh {high.price.toFixed(2)}
          </div>
        </div>
        <div className="rounded-3xl border border-kenya.dark/10 bg-kenya.sand p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-kenya.dark">
            Transit Premium
          </div>
          <div className="mt-3 text-2xl font-black text-kenya.red">
            +{premium.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
