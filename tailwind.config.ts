import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        panna: {
          green: {
            50: "#eef8f3",
            100: "#d6eee0",
            200: "#b0dfc4",
            300: "#7ec79f",
            400: "#4ca978",
            500: "#1b7a4b",
            600: "#15633c",
            700: "#124f31",
            800: "#0f442b",
            900: "#0c3823",
            950: "#072316",
          },
          gold: {
            50: "#fdfbf5",
            100: "#faf4e2",
            200: "#f4e6be",
            300: "#ebd394",
            400: "#e0be68",
            500: "#d4af37",
            600: "#c59b27",
            700: "#9f771c",
            800: "#7c5c1b",
            900: "#654a1a",
          },
          cream: {
            50: "#fdfcfb",
            100: "#fbf9f5",
            200: "#f5f0e6",
            300: "#eae2d1",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 10px 15px -3px rgba(12, 56, 35, 0.08), 0 4px 6px -4px rgba(12, 56, 35, 0.04)",
      },
      gridTemplateColumns: {
        "24": "repeat(24, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};

export default config;
