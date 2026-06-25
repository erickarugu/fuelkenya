import { useRouter } from "next/router";
import type { DocsThemeConfig } from "nextra-theme-docs";
import { useConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: (
    <span
      style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
    >
      <span style={{ fontSize: 20 }}>⛽</span>
      <span>FuelKenya</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#6b7280",
          letterSpacing: "0.06em",
          textTransform: "uppercase"
        }}
      >
        API Docs
      </span>
    </span>
  ),
  project: {
    link: "https://github.com/erickarugu/fuelkenya"
  },
  docsRepositoryBase: "https://github.com/erickarugu/fuelkenya/tree/main/docs",
  navbar: {
    extraContent: (
      <a
        href="https://fuelkenya.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#6b7280",
          textDecoration: "none",
          whiteSpace: "nowrap"
        }}
      >
        <span>Live tracker</span>
      </a>
    )
  },
  footer: {
    text: (
      <span>
        FuelKenya API Documentation ·{" "}
        <a
          href="https://fuelkenya.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Live price tracker
        </a>{" "}
        · Data sourced from{" "}
        <a
          href="https://www.epra.go.ke"
          target="_blank"
          rel="noopener noreferrer"
        >
          EPRA
        </a>
      </span>
    )
  },
  head: function useHead() {
    const { title, frontMatter } = useConfig();
    const { route } = useRouter();
    const pageTitle =
      title && route !== "/"
        ? `${title} – FuelKenya API`
        : "FuelKenya API Docs | EPRA Fuel Prices for Kenya";
    const description =
      (frontMatter.description as string | undefined) ||
      "FuelKenya REST API — programmatic access to official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene across all towns in Kenya.";
    const canonical =
      route === "/" ? "https://docs.fuelkenya.com" : `https://docs.fuelkenya.com${route}`;
    const ogImage = "https://fuelkenya.com/petrol-station.png";
    return (
      <>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="EPRA fuel prices API Kenya, Kenya fuel price REST API, petrol prices API, diesel prices Kenya API, fuel data API, EPRA API, Kenya fuel tracker developer, FuelKenya API, super petrol price API Kenya"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href={canonical} />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="FuelKenya API Docs" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_KE" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="FuelKenya API — EPRA Fuel Prices Kenya" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </>
    );
  },
  navigation: true,
  toc: {
    backToTop: true
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true
  },
  editLink: {
    text: "Edit this page on GitHub"
  },
  feedback: {
    content: "Question? Give us feedback →",
    labels: "feedback"
  },
  primaryHue: 142,
  primarySaturation: 70
};

export default config;
