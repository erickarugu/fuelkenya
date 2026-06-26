"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function applyTheme(theme: Theme) {
  if (theme === "system") {
    document.documentElement.classList.toggle(
      "dark",
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  } else {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

const SEGMENTS: { key: Theme; Icon: () => JSX.Element; label: string }[] = [
  { key: "dark",   Icon: MoonIcon,   label: "Dark"   },
  { key: "light",  Icon: SunIcon,    label: "Light"  },
  { key: "system", Icon: SystemIcon, label: "System" },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem("fk-theme") as Theme | null) ?? "dark";
    setTheme(stored);

    // Keep system mode in sync when OS preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (localStorage.getItem("fk-theme") === "system") applyTheme("system");
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const select = (next: Theme) => {
    localStorage.setItem("fk-theme", next);
    setTheme(next);
    applyTheme(next);
  };

  if (theme === null) return <div className="h-7 w-[84px]" />;

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] p-0.5"
      role="group"
      aria-label="Theme"
    >
      {SEGMENTS.map(({ key, Icon, label }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => select(key)}
            title={label}
            aria-label={`${label} mode`}
            aria-pressed={active}
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150 ${
              active
                ? "bg-white dark:bg-white/[0.12] shadow-sm text-stone-800 dark:text-stone-100"
                : "text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400"
            }`}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
