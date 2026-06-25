export default function Loading() {
  return (
    <div className="min-h-screen page-bg grid-bg">
      <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-3.5 w-24 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-6 w-14 animate-pulse rounded-full bg-white/[0.04]" />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8 lg:px-12">
        {/* hero */}
        <div className="mb-12 grid gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-4 h-2.5 w-48 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="mb-2 h-14 w-72 animate-pulse rounded-xl bg-white/[0.07]" />
            <div className="mb-8 h-14 w-56 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="mb-2 h-3.5 w-80 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-3.5 w-64 animate-pulse rounded-full bg-white/[0.03]" />
            <div className="mt-5 flex gap-2">
              <div className="h-6 w-28 animate-pulse rounded-full bg-white/[0.04]" />
              <div className="h-6 w-36 animate-pulse rounded-full bg-white/[0.04]" />
              <div className="h-6 w-32 animate-pulse rounded-full bg-white/[0.03]" />
            </div>
          </div>
          <div className="hidden animate-pulse rounded-2xl bg-white/[0.03] lg:block" style={{ minHeight: 180 }} />
        </div>

        {/* search row */}
        <div className="mb-4 flex gap-3">
          <div className="h-12 w-72 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="h-12 w-44 animate-pulse rounded-xl bg-white/[0.03]" />
        </div>
        <div className="mb-12 flex gap-2">
          {[68, 80, 64, 72, 68, 60].map((w, i) => (
            <div key={i} className="h-6 animate-pulse rounded-full bg-white/[0.03]" style={{ width: w }} />
          ))}
        </div>

        {/* section label */}
        <div className="mb-4 h-2 w-20 animate-pulse rounded-full bg-white/[0.04]" />

        {/* price cards */}
        <div className="mb-14 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>

        {/* countdown */}
        <div className="mb-14 h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
      </div>
    </div>
  );
}
