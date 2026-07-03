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
  let latest = null;

  try {
    const res = await fetch(
      `${apiBase}/prices/latest?town=${encodeURIComponent(town)}`,
      { cache: "no-store" }
    );
    const result = await res.json();
    latest = result[0] ?? null;
  } catch (error) {
    latest = null;
  }

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        background: "#FAFAF9",
        color: "#121212",
        fontFamily: "Inter, sans-serif"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase"
            }}
          >
            FuelKenya
          </div>
          <div style={{ marginTop: "18px", fontSize: "60px", fontWeight: 900 }}>
            {town}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "18px", color: "#4B5563" }}>
            Live fuel pricing
          </div>
          <div
            style={{ marginTop: "12px", fontSize: "18px", color: "#4B5563" }}
          >
            EPRA price snapshot
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "20px",
          marginTop: "40px"
        }}
      >
        {["Super Petrol", "Diesel", "Kerosene"].map((label, index) => {
          const value = latest
            ? label === "Super Petrol"
              ? latest.super_petrol
              : label === "Diesel"
                ? latest.diesel
                : latest.kerosene
            : 0;
          const accent =
            label === "Super Petrol"
              ? "#004D31"
              : label === "Diesel"
                ? "#9B1B22"
                : "#121212";
          return (
            <div
              key={label}
              style={{
                borderLeft: `8px solid ${accent}`,
                padding: "28px 24px",
                borderRadius: "24px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div
                style={{ fontSize: "18px", fontWeight: 700, color: "#4B5563" }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: "18px",
                  fontSize: "42px",
                  fontWeight: 900,
                  color: "#121212"
                }}
              >
                KSh {value.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
