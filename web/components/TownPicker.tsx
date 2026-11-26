"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TownPickerProps {
  towns: string[];
  value: string;
  onChange: (town: string) => void;
}

/** Searchable town menu styled like the rest of the site (replaces a native select). */
export default function TownPicker({ towns, value, onChange }: TownPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? towns.filter((t) => t.toLowerCase().includes(q)) : towns;
  }, [towns, query]);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, matches.indexOf(value)));
    input.current?.focus();
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (t: string) => {
    setOpen(false);
    setQuery("");
    if (t !== value) onChange(t);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && matches[active]) { e.preventDefault(); pick(matches[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1 text-sm font-semibold text-stone-800 transition-colors hover:border-emerald-500/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-stone-100"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500" aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
        {value}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#111]">
          <input
            ref={input}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKey}
            placeholder="Search towns"
            aria-label="Search towns"
            className="w-full border-b border-black/[0.06] bg-transparent px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 dark:border-white/[0.06] dark:text-stone-100"
          />
          <ul ref={list} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {matches.length === 0 && <li className="px-3 py-2 text-sm text-stone-500">No town found</li>}
            {matches.map((t, i) => (
              <li
                key={t}
                role="option"
                aria-selected={t === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(t)}
                className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm ${
                  i === active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "text-stone-700 dark:text-stone-300"
                }`}
              >
                {t}
                {t === value && <span className="text-emerald-500">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
