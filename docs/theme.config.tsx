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
    link: "https://github.com/fuelkenya/fuelkenya"
  },
  docsRepositoryBase: "https://github.com/fuelkenya/fuelkenya/tree/main/docs",
  footer: {
    text: (
      <span>
        FuelKenya API Documentation · Data sourced from{" "}
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
    const { title } = useConfig();
    const { route } = useRouter();
    const pageTitle =
      title && route !== "/"
        ? `${title} – FuelKenya API`
        : "FuelKenya API Docs";
    return (
      <>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="FuelKenya REST API documentation — EPRA fuel prices across Kenya."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
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
