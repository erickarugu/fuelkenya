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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface TrendChartProps {
  history: PriceRecord[];
}

const palette = {
  petrol: "#004D31",
  diesel: "#9B1B22",
  kerosene: "#121212"
};

function gradientFor(ctx: CanvasRenderingContext2D, color: string) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  return gradient;
}

export default function TrendChart({ history }: TrendChartProps) {
  const labels = history.map((item) => item.valid_from);
  const superSeries = history.map((item) => item.super_petrol);
  const dieselSeries = history.map((item) => item.diesel);
  const keroseneSeries = history.map((item) => item.kerosene);

  const data = {
    labels,
    datasets: [
      {
        label: "Super Petrol",
        data: superSeries,
        borderColor: palette.petrol,
        backgroundColor: (context: any) =>
          gradientFor(context.chart.ctx, "rgba(0,77,49,0.16)"),
        borderWidth: 2,
        fill: true,
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: palette.petrol,
        pointHoverBorderColor: palette.petrol
      },
      {
        label: "Diesel",
        data: dieselSeries,
        borderColor: palette.diesel,
        backgroundColor: (context: any) =>
          gradientFor(context.chart.ctx, "rgba(155,27,34,0.16)"),
        borderWidth: 2,
        fill: true,
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: palette.diesel,
        pointHoverBorderColor: palette.diesel
      },
      {
        label: "Kerosene",
        data: keroseneSeries,
        borderColor: palette.kerosene,
        backgroundColor: (context: any) =>
          gradientFor(context.chart.ctx, "rgba(18,18,18,0.12)"),
        borderWidth: 1.5,
        fill: true,
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: palette.kerosene,
        pointHoverBorderColor: palette.kerosene
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#f8fafc"
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#121212" }
      },
      y: {
        grid: { color: "#F4F4F5" },
        ticks: { color: "#121212" }
      }
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-zinc-200 bg-white/90 p-6 backdrop-blur-xl shadow-[0_24px_80px_-40px_rgba(0,77,49,0.22)]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-kenya.dark">
            Price trend
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Recent price movement for the current fuel cycle.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-stone-700">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-kenya.dark" />
            Petrol
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-kenya.red" />
            Diesel
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-black" />
            Kerosene
          </div>
        </div>
      </div>
      <div className="h-[360px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
