import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        // Bump xs from 12px → 13px so it stays legible on dark backgrounds
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
      },
      colors: {
        // Brighter stone scale for legibility on #080808 background
        stone: {
          400: "#c0bbb7",
          500: "#aaa49f",
          600: "#908a86",
        },
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
