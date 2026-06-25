"use client";

import { useEffect, useMemo, useState } from "react";

function getNairobiParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
    hour12: false
  }).formatToParts(date);
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    year:   Number(v.year),
    month:  Number(v.month) - 1,
    day:    Number(v.day),
    hour:   Number(v.hour),
    minute: Number(v.minute),
    second: Number(v.second)
  };
}

function getNextUpdateTime(now: Date) {
  const p = getNairobiParts(now);
  const year  = p.month === 11 && p.day > 14 ? p.year + 1 : p.year;
  const month = p.day > 14 ? (p.month === 11 ? 0 : p.month + 1) : p.month;
  return new Date(Date.UTC(year, month, 14, 10, 0, 0));
}

function getCountdown(target: Date, now: Date) {
  const ms      = Math.max(target.getTime() - now.getTime(), 0);
  const days    = Math.floor(ms / 86_400_000);
  const hours   = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000)  / 60_000);
  const seconds = Math.floor((ms % 60_000)     / 1_000);
  return { days, hours, minutes, seconds };
}

function isSameNairobiDate(a: Date, b: Date) {
  const p1 = getNairobiParts(a);
  const p2 = getNairobiParts(b);
  return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
}

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="number-box min-w-[52px] text-center py-3 px-2 text-2xl font-bold tabular-nums text-white leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">{label}</div>
    </div>
  );
}

export default function UpdateCountdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const target    = useMemo(() => getNextUpdateTime(now), [now]);
  const countdown = useMemo(() => getCountdown(target, now), [target, now]);
  const today     = useMemo(() => isSameNairobiDate(now, target), [now, target]);
  const isLive    = today && now.getTime() >= target.getTime();

  if (isLive) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-6 py-5">
        <span className="live-dot" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">New prices are live</p>
          <p className="mt-0.5 text-xs text-emerald-600">Refresh to see the latest EPRA rates</p>
        </div>
      </div>
    );
  }

  const monthName = target.toLocaleString("en-GB", {
    month: "long",
    timeZone: "Africa/Nairobi"
  });

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-5">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-lg">
            🗓
          </div>
          <div>
            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              Next EPRA review
            </div>
            <div className="text-sm font-semibold text-stone-200">
              14th {monthName}
              <span className="ml-2 text-xs font-normal text-stone-500">· 1:00 PM EAT</span>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 sm:ml-auto">
          <Segment value={countdown.days}    label="days" />
          <div className="pb-5 text-xl text-stone-600">:</div>
          <Segment value={countdown.hours}   label="hrs"  />
          <div className="pb-5 text-xl text-stone-600">:</div>
          <Segment value={countdown.minutes} label="min"  />
          <div className="pb-5 text-xl text-stone-600">:</div>
          <Segment value={countdown.seconds} label="sec"  />
        </div>
      </div>
    </div>
  );
}
