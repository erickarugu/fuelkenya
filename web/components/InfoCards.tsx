"use client";

const CARDS = [
  {
    num: "01",
    title: "What is EPRA?",
    body: "Kenya's Energy & Petroleum Regulatory Authority sets the maximum pump price every month by reviewing global crude oil prices, the KES/USD exchange rate, and supply chain costs. No station may legally charge above the EPRA ceiling.",
    color: {
      bar:         "linear-gradient(90deg, #00a651, #34d399 50%, transparent)",
      iconBg:      "rgba(16,185,129,0.08)",
      iconBorder:  "rgba(16,185,129,0.18)",
      iconColor:   "#34d399",
      num:         "#34d399",
      cardBorder:  "rgba(16,185,129,0.10)",
      hoverBorder: "rgba(16,185,129,0.25)",
      glow:        "rgba(0,166,81,0.06)",
    },
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V8l9-6 9 6v14" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "How the cycle works",
    body: "Prices are published on the 14th and take effect from the 15th. Each cycle runs for 30 days. Stations that charge above the EPRA maximum are in violation and can be reported to the authority.",
    color: {
      bar:         "linear-gradient(90deg, #3b82f6, #60a5fa 50%, transparent)",
      iconBg:      "rgba(96,165,250,0.08)",
      iconBorder:  "rgba(96,165,250,0.18)",
      iconColor:   "#60a5fa",
      num:         "#60a5fa",
      cardBorder:  "rgba(96,165,250,0.10)",
      hoverBorder: "rgba(96,165,250,0.25)",
      glow:        "rgba(59,130,246,0.06)",
    },
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Which fuel for what?",
    body: "Super Petrol powers passenger cars, motorcycles, and tuk-tuks. Diesel runs trucks, buses, matatus, and generators. Kerosene (IK) is used in cooking stoves and lamps — primarily in rural off-grid households.",
    color: {
      bar:         "linear-gradient(90deg, #d97706, #fbbf24 50%, transparent)",
      iconBg:      "rgba(251,191,36,0.07)",
      iconBorder:  "rgba(251,191,36,0.16)",
      iconColor:   "#fbbf24",
      num:         "#fbbf24",
      cardBorder:  "rgba(251,191,36,0.09)",
      hoverBorder: "rgba(251,191,36,0.22)",
      glow:        "rgba(217,119,6,0.06)",
    },
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
        <path d="M2 22h14" />
        <path d="M6 7h6" /><path d="M6 11h6" />
        <path d="M15 6h1a2 2 0 0 1 2 2v3.5a1.5 1.5 0 0 0 3 0V8l-3-3" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Tips to spend less",
    body: "Fill up in the first week of a new cycle when prices are freshest. Keep tyres at the correct pressure and replace your air filter — these alone improve fuel economy by 5–10%. Use the estimator on this page to budget before you travel.",
    color: {
      bar:         "linear-gradient(90deg, #7c3aed, #a78bfa 50%, transparent)",
      iconBg:      "rgba(167,139,250,0.08)",
      iconBorder:  "rgba(167,139,250,0.18)",
      iconColor:   "#a78bfa",
      num:         "#a78bfa",
      cardBorder:  "rgba(167,139,250,0.10)",
      hoverBorder: "rgba(167,139,250,0.25)",
      glow:        "rgba(124,58,237,0.06)",
    },
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 18H9l-.7-3C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z" />
        <line x1="9" y1="21" x2="15" y2="21" />
        <line x1="9" y1="18" x2="15" y2="18" />
      </svg>
    ),
  },
];

export default function InfoCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const { color } = card;
        return (
          <div
            key={card.num}
            className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
            style={{
              background:  "var(--surface-1)",
              border:      `1px solid ${color.cardBorder}`,
              boxShadow:   "none",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border     = `1px solid ${color.hoverBorder}`;
              el.style.boxShadow  = `0 8px 40px ${color.glow}`;
              el.style.background = "var(--surface-2)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border     = `1px solid ${color.cardBorder}`;
              el.style.boxShadow  = "none";
              el.style.background = "var(--surface-1)";
            }}
          >
            {/* top accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl" style={{ background: color.bar }} />

            <div className="mb-5 flex items-start justify-between">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: color.iconBg,
                  border:          `1px solid ${color.iconBorder}`,
                  color:           color.iconColor,
                }}
              >
                <card.Icon />
              </div>
              <span
                className="font-mono text-xs font-bold tabular-nums"
                style={{ color: color.num, opacity: 0.5 }}
              >
                {card.num}
              </span>
            </div>

            <p className="mb-2.5 text-sm font-bold leading-snug text-stone-800 dark:text-stone-100">
              {card.title}
            </p>

            <p className="text-sm leading-relaxed text-stone-500">
              {card.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
