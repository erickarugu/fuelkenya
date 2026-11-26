import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EPRA fuel prices for the month | FuelKenya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API = process.env.NEXT_PUBLIC_FUELKENYA_API_URL ?? "https://api.fuelkenya.com/v1";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type Row = { town: string; super_petrol: number; diesel: number; kerosene: number };
type Cycle = { valid_from: string; valid_to: string };

async function load(month: string) {
  const cycles: Cycle[] = await fetch(`${API}/cycles`, { next: { revalidate: 3600 } }).then((r) => r.json());
  const i = cycles.map((c) => c.valid_from.slice(0, 7)).lastIndexOf(month);
  if (i < 0) return null;
  const cur = cycles[i];
  const prev = cycles[i + 1];
  const get = (c: Cycle) =>
    fetch(`${API}/prices?start_date=${c.valid_from}&end_date=${c.valid_to}&limit=1000`, { next: { revalidate: 3600 } })
      .then((r) => r.json() as Promise<Row[]>);
  const [rows, prevRows] = await Promise.all([get(cur), prev ? get(prev) : Promise.resolve([] as Row[])]);
  const pick = (rs: Row[]) => rs.find((r) => r.town.toLowerCase() === "nairobi") ?? rs[0];
  return { cur, now: pick(rows), before: pick(prevRows) };
}

export default async function Image({ params }: { params: { month: string } }) {
  const fontData = await fetch(new URL("../../fonts/Inter-Bold.woff", import.meta.url)).then((r) => r.arrayBuffer());
  const data = await load(params.month).catch(() => null);
  const [y, m] = params.month.split("-");
  const label = `${MONTHS[Number(m) - 1] ?? ""} ${y}`;

  const items: [string, keyof Row][] = [["Petrol", "super_petrol"], ["Diesel", "diesel"], ["Kerosene", "kerosene"]];

  return new ImageResponse(
    <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 80px", background: "#080808", fontFamily: "Inter" }}>
      <div style={{ display: "flex", fontSize: "28px", color: "#ffffff" }}>
        <span style={{ color: "#34d399" }}>Fuel</span>
        <span>Kenya</span>
        <span style={{ color: "#78716c", marginLeft: "20px" }}>· EPRA review</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: "76px", color: "#ffffff", letterSpacing: "-2px" }}>{`Fuel prices, ${label}`}</div>
        <div style={{ display: "flex", fontSize: "28px", color: "#a8a29e", marginTop: "8px" }}>
          {data?.now ? `${data.now.town} · KSh per litre` : "Every town in Kenya"}
        </div>
      </div>
      <div style={{ display: "flex", gap: "24px" }}>
        {data?.now &&
          items.map(([name, key]) => {
            const v = Number(data.now[key]);
            const b = data.before ? Number(data.before[key]) : undefined;
            const d = b === undefined ? null : Math.round((v - b) * 100) / 100;
            return (
              <div key={name} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 28px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <span style={{ fontSize: "24px", color: "#a8a29e" }}>{name}</span>
                <span style={{ fontSize: "56px", color: "#ffffff" }}>{v.toFixed(2)}</span>
                <span style={{ fontSize: "24px", color: d === null || d === 0 ? "#78716c" : d > 0 ? "#f87171" : "#34d399" }}>
                  {d === null ? " " : d === 0 ? "unchanged" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2)}`}
                </span>
              </div>
            );
          })}
      </div>
    </div>,
    { ...size, fonts: [{ name: "Inter", data: fontData, weight: 700, style: "normal" }] }
  );
}
