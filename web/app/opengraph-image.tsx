import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FuelKenya | Live EPRA Fuel Prices in Kenya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fontData = await fetch(
    new URL("./fonts/Inter-Bold.otf", import.meta.url)
  ).then((r) => r.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#080808",
        fontFamily: "Inter",
      }}
    >
      {/* Top: brand + live badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          <span style={{ color: "#34d399" }}>Fuel</span>Kenya
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "999px",
            padding: "6px 14px",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "999px",
              background: "#34d399",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#34d399",
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Middle: headline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#ffffff",
          }}
        >
          Kenya Fuel Prices
        </div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "#a8a29e",
            lineHeight: 1.4,
          }}
        >
          Official EPRA maximum pump prices for Super Petrol, Diesel and Kerosene
        </div>
      </div>

      {/* Bottom: fuel chips */}
      <div style={{ display: "flex", gap: "16px" }}>
        {[
          { label: "Super Petrol", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.25)" },
          { label: "Diesel",       color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.25)" },
          { label: "Kerosene",     color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)" },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: f.bg,
              border: `1px solid ${f.border}`,
              borderRadius: "12px",
              padding: "12px 20px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: f.color,
              }}
            />
            <span style={{ fontSize: "16px", fontWeight: 700, color: f.color }}>
              {f.label}
            </span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontSize: "15px",
            color: "#57534e",
            alignSelf: "flex-end",
            paddingBottom: "2px",
          }}
        >
          fuelkenya.com
        </div>
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
