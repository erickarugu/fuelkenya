"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PRICES = [
  { city: "Nairobi",  petrol: "214.03", diesel: "199.73", kerosene: "196.53" },
  { city: "Mombasa",  petrol: "208.24", diesel: "194.53", kerosene: "191.20" },
  { city: "Kisumu",   petrol: "213.69", diesel: "199.20", kerosene: "196.10" },
  { city: "Nakuru",   petrol: "212.92", diesel: "198.54", kerosene: "195.40" },
  { city: "Eldoret",  petrol: "212.50", diesel: "198.12", kerosene: "194.85" },
];

export default function HeroVisual() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % PRICES.length);
        setVisible(true);
      }, 300);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const p = PRICES[idx];

  return (
    <div className="relative hidden h-[380px] w-full items-end justify-center overflow-hidden lg:flex">
      {/* ambient glow behind image */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(0,166,81,0.10) 0%, transparent 65%)" }}
      />

      {/* floating price overlay — top-left of image area */}
      <div
        className="absolute left-4 top-6 z-10 rounded-xl border border-white/[0.1] px-3.5 py-3"
        style={{
          backgroundColor: "rgba(10,10,10,0.88)",
          backdropFilter: "blur(10px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          minWidth: 148,
        }}
      >
        {/* city pill */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{p.city}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Petrol</span>
            <span className="font-mono text-sm font-bold tabular-nums text-emerald-300">KSh {p.petrol}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Diesel</span>
            <span className="font-mono text-sm font-bold tabular-nums text-blue-300">KSh {p.diesel}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">Kerosene</span>
            <span className="font-mono text-sm font-bold tabular-nums text-amber-300">KSh {p.kerosene}</span>
          </div>
        </div>
        {/* city indicator dots */}
        <div className="mt-2.5 flex items-center gap-1.5">
          {PRICES.map((_, i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: i === idx ? 14 : 4,
                height: 3,
                borderRadius: 999,
                backgroundColor: i === idx ? "#00a651" : "rgba(255,255,255,0.12)",
                transition: "width 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* the station image */}
      <Image
        src="/petrol-station.png"
        alt="Petrol station illustration"
        width={480}
        height={340}
        className="relative z-0 h-[340px] w-auto object-contain object-bottom drop-shadow-2xl"
        priority
      />
    </div>
  );
}
