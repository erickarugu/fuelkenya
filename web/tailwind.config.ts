import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        base: "#FAFAF9",
        obsidian: "#121212",
        forest: "#004D31",
        maasai: "#9B1B22",
        bead: "#E4E4E7",
        kenya: {
          dark: "#004D31",
          red: "#9B1B22",
          amber: "#F0A500",
          sand: "#F8E8D2",
          grass: "#128046"
        }
      },
      boxShadow: {
        subtle: "none"
      }
    }
  },
  plugins: []
};

export default config;
