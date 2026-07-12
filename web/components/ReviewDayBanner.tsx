"use client";

import { useEpraCycle } from "@/lib/useEpraCycle";

export default function ReviewDayBanner() {
  const { isLive, isReviewDay } = useEpraCycle();

  if (isLive || !isReviewDay) return null;

  return (
    <div className="relative overflow-hidden border-b border-amber-400/50 bg-amber-200/90 dark:bg-amber-500/25 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2.5 px-6 py-2.5 sm:px-8">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <p className="text-center text-sm font-bold text-amber-900 dark:text-amber-50">
          EPRA review day: new pump prices expected today, typically published around 1:00 PM
        </p>
      </div>
    </div>
  );
}
