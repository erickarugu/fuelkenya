import { ImageResponse } from "next/og";

export const runtime = "edge";

const apiBase =
  process.env.NEXT_PUBLIC_FUELKENYA_API_URL ?? "https://api.fuelkenya.com/v1";

export default async function OpenGraphImage({
  params
}: {
  params: { slug: string };
}) {
  const town = decodeURIComponent(params.slug).replace(/-/g, " ");

  const [fontData, latest] = await Promise.all([
    fetch(new URL("../../fonts/Inter-Bold.otf", import.meta.url)).then((r) =>
      r.arrayBuffer()
    ),
    fetch(`${apiBase}/prices/latest?town=${encodeURIComponent(town)}`, {
      cache: "no-store"
    })
      .then((r) => r.json())
      .then((d) => d[0] ?? null)
      .catch(() => null),
  ]);

  const fuels = [
    { label: "Super Petrol", value: latest?.super_petrol, color: "#34d399", border: "rgba(52,211,153,0.3)" },
    { label: "Diesel",       value: latest?.diesel,       color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
    { label: "Kerosene",     value: latest?.kerosene,     color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  ];

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 80px",
        background: "#080808",
        fontFamily: "Inter",
      }}
    >
      {/* Top: brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "22px", fontWeight: 700, color: "#34d399" }}>Fuel</span>
        <span style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff" }}>Kenya</span>
        <span style={{ fontSize: "14px", color: "#57534e", marginLeft: "8px" }}>· EPRA price snapshot</span>
      </div>

      {/* Middle: town name */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "16px", color: "#57534e", fontWeight: 700 }}>
          FUEL PRICES IN
        </div>
        <div style={{ fontSize: "72px", fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>
          {town}
        </div>
      </div>

      {/* Bottom: price cards */}
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        {fuels.map((f) => (
          <div
            key={f.label}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              border: `1px solid ${f.border}`,
              borderRadius: "16px",
              padding: "24px",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#78716c", marginBottom: "12px" }}>
              {f.label}
            </div>
            <div style={{ fontSize: "40px", fontWeight: 700, color: f.color }}>
              {f.value != null ? `KSh ${f.value.toFixed(2)}` : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
