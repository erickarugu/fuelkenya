"use client";

import { useEffect, useMemo, useState } from "react";

function getNairobiParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  return {
    year: Number(values.year),
    month: Number(values.month) - 1,
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function getNextUpdateTime(now: Date) {
  const parts = getNairobiParts(now);
  const year =
    parts.month === 11 && parts.day > 14 ? parts.year + 1 : parts.year;
  const month =
    parts.day > 14 ? (parts.month === 11 ? 0 : parts.month + 1) : parts.month;

  return new Date(Date.UTC(year, month, 14, 10, 0, 0));
}

function getCountdown(target: Date, now: Date) {
  const remaining = Math.max(target.getTime() - now.getTime(), 0);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return { days, hours, minutes };
}

function isSameNairobiDate(a: Date, b: Date) {
  const first = getNairobiParts(a);
  const second = getNairobiParts(b);
  return (
    first.year === second.year &&
    first.month === second.month &&
    first.day === second.day
  );
}

export default function UpdateCountdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const target = useMemo(() => getNextUpdateTime(now), [now]);
  const countdown = useMemo(() => getCountdown(target, now), [target, now]);
  const today = useMemo(() => isSameNairobiDate(now, target), [now, target]);
  const updateLive = today && now.getTime() >= target.getTime();

  return (
    <div className="rounded-[1.75rem] border border-kenya.dark/10 bg-white/80 p-4 text-sm text-stone-700 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-kenya.red font-semibold">
            Price refresh
          </p>
          <p className="mt-1 text-base font-semibold text-kenya.dark">
            {updateLive
              ? "Today is the day — new prices are arriving at 1:00 PM EAT."
              : `Next update: 14th ${target.toLocaleString("en-GB", {
                  month: "long",
                  timeZone: "Africa/Nairobi"
                })} • 1:00 PM EAT`}
          </p>
        </div>

        {!updateLive ? (
          <div className="grid grid-cols-3 gap-3 text-center font-semibold text-kenya.dark sm:w-auto">
            <div className="rounded-3xl bg-kenya.sand px-3 py-2">
              <div className="text-2xl">
                {String(countdown.days).padStart(2, "0")}
              </div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
                Days
              </div>
            </div>
            <div className="rounded-3xl bg-kenya.sand px-3 py-2">
              <div className="text-2xl">
                {String(countdown.hours).padStart(2, "0")}
              </div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
                Hours
              </div>
            </div>
            <div className="rounded-3xl bg-kenya.sand px-3 py-2">
              <div className="text-2xl">
                {String(countdown.minutes).padStart(2, "0")}
              </div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-stone-500">
                Mins
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-kenya.amber/10 px-4 py-2 text-sm font-semibold text-kenya.red">
            Stay ready — prices land today at 1pm. Refresh for the latest.
          </div>
        )}
      </div>
    </div>
  );
}
