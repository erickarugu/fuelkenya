"use client";

import { useState } from "react";

const PERIODS = ["3M", "6M", "1Y", "2Y", "5Y", "All"];

export default function EmbedBuilder({ towns }: { towns: string[] }) {
  const [town, setTown] = useState("Nairobi");
  const [period, setPeriod] = useState("All");
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState(false);

  const src = `https://fuelkenya.com/embed?town=${encodeURIComponent(town)}&period=${period}&theme=${theme}`;
  const code = `<iframe src="${src}" width="100%" height="640" style="border:0;border-radius:12px" loading="lazy" title="Kenya fuel prices: ${town}"></iframe>`;

  const select =
    "rounded-full border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] px-3 py-1.5 text-sm";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="eb-town">Town</label>
        <select id="eb-town" className={select} value={town} onChange={(e) => setTown(e.target.value)}>
          {(towns.length ? towns : ["Nairobi"]).map((t) => <option key={t}>{t}</option>)}
        </select>
        <label className="sr-only" htmlFor="eb-period">Period</label>
        <select id="eb-period" className={select} value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <label className="sr-only" htmlFor="eb-theme">Theme</label>
        <select id="eb-theme" className={select} value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div className="mt-3 flex items-start gap-2">
        <code className="block min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-stone-50 dark:bg-black/30 px-3 py-2 font-mono text-xs text-stone-700 dark:text-stone-300">
          {code}
        </code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
          className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <iframe
        key={src}
        src={src.replace("https://fuelkenya.com", "")}
        title="Embed preview"
        className="mt-4 h-[640px] w-full rounded-xl border-0"
        loading="lazy"
      />
    </div>
  );
}
