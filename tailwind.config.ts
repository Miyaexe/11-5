import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0c0d10",
        surface: "#14161c",
        "surface-card": "#1a1d24",
        "surface-border": "#282c37",
        broadcast: {
          red: "#ef4444",
          green: "#22c55e",
          blue: "#3b82f6",
          amber: "#f59e0b",
          cyan: "#06b6d4",
          magenta: "#ec4899",
        },
      },
    },
  },
  plugins: [],
};
export default config;
