"use client";

import { useEffect, useMemo, useState } from "react";

export function getNairobiParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
    hour12: false
  }).formatToParts(date);
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    year: Number(v.year), month: Number(v.month) - 1,
    day: Number(v.day),   hour: Number(v.hour),
    minute: Number(v.minute), second: Number(v.second)
  };
}

function getNextUpdateTime(now: Date): Date {
  const p = getNairobiParts(now);
  const year  = p.month === 11 && p.day > 14 ? p.year + 1 : p.year;
  const month = p.day > 14 ? (p.month === 11 ? 0 : p.month + 1) : p.month;
  return new Date(Date.UTC(year, month, 14, 10, 0, 0));
}

function getCycleStart(target: Date): Date {
  const p    = getNairobiParts(target);
  const year  = p.month === 0 ? p.year - 1 : p.year;
  const month = p.month === 0 ? 11 : p.month - 1;
  return new Date(Date.UTC(year, month, 15, 0, 0, 0));
}

function getCountdown(target: Date, now: Date) {
  const ms      = Math.max(target.getTime() - now.getTime(), 0);
  const days    = Math.floor(ms / 86_400_000);
  const hours   = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000)  / 60_000);
  const seconds = Math.floor((ms % 60_000)     / 1_000);
  return { days, hours, minutes, seconds };
}

export function useEpraCycle(latestValidFrom?: string | null) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const target     = useMemo(() => getNextUpdateTime(now), [now]);
  const cycleStart = useMemo(() => getCycleStart(target),  [target]);
  const countdown  = useMemo(() => getCountdown(target, now), [target, now]);

  // The clock reaching the target time only means EPRA has *announced* new
  // prices — it doesn't mean they've been uploaded to FuelKenya yet. Only
  // trust "live" once the displayed price record itself is from the new
  // cycle, so the site never claims new rates before they're actually in.
  const clockPastTarget = now.getTime() >= target.getTime();
  const dataIsFromNewCycle = latestValidFrom
    ? new Date(latestValidFrom).getTime() >= target.getTime()
    : false;
  const isLive = clockPastTarget && dataIsFromNewCycle;
  const isReviewDay = getNairobiParts(now).day === 14 && !isLive;

  return { now, target, cycleStart, countdown, isLive, isReviewDay };
}
