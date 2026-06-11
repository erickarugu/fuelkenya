"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  activeTown: string;
  towns: string[];
  inHeader?: boolean;
}

export default function SearchBar({
  activeTown,
  towns,
  inHeader = false
}: SearchBarProps) {
  const [query, setQuery] = useState(activeTown);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return towns.slice(0, 6);
    }
    return towns
      .filter((town) => town.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [query, towns]);

  const navigateToTown = (town: string) => {
    const url = town ? `?town=${encodeURIComponent(town)}` : "/";
    router.push(url);
  };

  return (
    <div className="relative w-full">
      {!inHeader && (
        <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-stone-500">
          Search town
        </label>
      )}
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            navigateToTown(query || activeTown);
          }
        }}
        className={
          inHeader
            ? "w-full rounded-full border border-kenya.dark/20 bg-white px-5 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-kenya.dark/80 focus:ring-2 focus:ring-kenya.dark/10"
            : "w-full rounded-xl border border-kenya.dark/20 bg-white px-4 py-4 text-lg text-stone-900 outline-none transition focus:border-kenya.dark/80 focus:ring-2 focus:ring-kenya.dark/10"
        }
        placeholder={
          inHeader
            ? "Search a town like Nairobi or Mombasa"
            : "Type a town like Nairobi or Mombasa"
        }
        aria-label="Search town"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-xl border border-kenya.dark/20 bg-white">
          {suggestions.map((town) => (
            <button
              key={town}
              type="button"
              onClick={() => navigateToTown(town)}
              className="w-full px-4 py-3 text-left text-sm text-stone-900 transition hover:bg-kenya.sand"
            >
              {town}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
