"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { PriceRecord } from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface TrendChartProps {
  history: PriceRecord[];
}

const SERIES = [
  { key: "super_petrol" as const, label: "Super Petrol", color: "#10b981", rgb: [16,  185, 129] },
  { key: "diesel"       as const, label: "Diesel",       color: "#60a5fa", rgb: [96,  165, 250] },
  { key: "kerosene"     as const, label: "Kerosene",     color: "#fbbf24", rgb: [251, 191,  36] },
];

function makeGradient(ctx: CanvasRenderingContext2D, r: number, g: number, b: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, 340);
  grad.addColorStop(0,   `rgba(${r},${g},${b},0.18)`);
  grad.addColorStop(0.6, `rgba(${r},${g},${b},0.04)`);
  grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  return grad;
}

export default function TrendChart({ history }: TrendChartProps) {
  const labels = history.map(item =>
    new Date(item.valid_from).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })
  );

  const datasets = SERIES.map(s => ({
    label: s.label,
    data: history.map(item => item[s.key]),
    borderColor: s.color,
    backgroundColor: (ctx: any) => makeGradient(ctx.chart.ctx, ...s.rgb as [number,number,number]),
    borderWidth: 2,
    fill: true,
    tension: 0.38,
    pointRadius: 0,
    pointHoverRadius: 6,
    pointHoverBackgroundColor: s.color,
    pointHoverBorderColor: "#080808",
    pointHoverBorderWidth: 2,
  }));

  // compute range stats for the subtitle
  const allValues = history.flatMap(h => [h.super_petrol, h.diesel, h.kerosene]).filter(Boolean);
  const lo  = allValues.length ? Math.min(...allValues).toFixed(2) : "—";
  const hi  = allValues.length ? Math.max(...allValues).toFixed(2) : "—";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#161616",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#78716c",
        bodyColor: "#f5f5f4",
        padding: 14,
        boxPadding: 6,
        cornerRadius: 10,
        titleFont:   { size: 11, family: "Inter, sans-serif" },
        bodyFont:    { size: 13, family: "Inter, sans-serif", weight: "bold" as const },
        callbacks: {
          label: (ctx: any) => `  ${ctx.dataset.label}   KSh ${ctx.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid:   { display: false },
        border: { display: false },
        ticks:  { color: "#57534e", font: { size: 11 }, maxRotation: 0, maxTicksLimit: 8 }
      },
      y: {
        grid:   { color: "rgba(255,255,255,0.035)", drawTicks: false },
        border: { display: false },
        ticks: {
          color: "#57534e",
          font:  { size: 11 },
          padding: 8,
          callback: (v: any) => `${v}`
        }
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      {/* header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.05] px-6 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* legend pills */}
        <div className="flex flex-wrap items-center gap-2">
          {SERIES.map(s => (
            <div
              key={s.key}
              className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1"
            >
              <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs font-medium text-stone-400">{s.label}</span>
            </div>
          ))}
        </div>
        {/* range stat */}
        {allValues.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span>Range</span>
            <span className="font-semibold text-stone-400">KSh {lo} – {hi}</span>
          </div>
        )}
      </div>

      {/* chart */}
      <div className="h-[340px] px-4 py-5">
        <Line data={{ labels, datasets }} options={options} />
      </div>
    </div>
  );
}
