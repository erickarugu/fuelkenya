"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  activeTown: string;
  towns: string[];
}

export default function SearchBar({ activeTown, towns }: SearchBarProps) {
  const [query, setQuery] = useState(activeTown);
  const [open,  setOpen]  = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => { setQuery(activeTown); }, [activeTown]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return towns.slice(0, 8);
    return towns.filter(t => t.toLowerCase().includes(q)).slice(0, 8);
  }, [query, towns]);

  const navigateToTown = (town: string) => {
    setQuery(town);
    setOpen(false);
    startTransition(() => {
      router.push(town ? `?town=${encodeURIComponent(town)}` : "/");
    });
  };

  const handleEnter = () => {
    const q = query.trim().toLowerCase();
    const match = towns.find(t => t.toLowerCase() === q)
                ?? towns.find(t => t.toLowerCase().startsWith(q));
    navigateToTown(match ?? activeTown);
  };

  return (
    <div className="relative w-full max-w-xs">
      <div className="relative">
        {/* search icon or spinner */}
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          {isPending ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/15 border-t-stone-300" />
          ) : (
            <svg
              className="text-stone-400"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </div>

        <input
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleEnter(); } }}
          className={`w-full rounded-xl border border-white/[0.1] bg-white/[0.05] pl-10 pr-4 py-3 text-sm font-medium text-stone-100 placeholder:text-stone-500 outline-none transition-all duration-200 focus:border-white/25 focus:bg-white/[0.08] focus:ring-1 focus:ring-white/[0.06] ${isPending ? "opacity-50" : ""}`}
          placeholder="Search any town…"
          aria-label="Search town"
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 z-[200] mt-1.5 max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-white/[0.16] shadow-[0_20px_60px_rgba(0,0,0,1)]"
          style={{ backgroundColor: "#222", isolation: "isolate" }}
        >
          {suggestions.map(t => (
            <button
              key={t}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => navigateToTown(t)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white/[0.08] ${
                t === activeTown ? "bg-white/[0.06] text-emerald-300" : "text-stone-300"
              }`}
            >
              <svg
                width="11" height="11" viewBox="0 0 24 24"
                fill={t === activeTown ? "#34d399" : "rgba(255,255,255,0.25)"}
                className="shrink-0"
                aria-hidden="true"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>{t}</span>
              {t === activeTown && (
                <span className="ml-auto text-[10px] text-emerald-500">current</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
