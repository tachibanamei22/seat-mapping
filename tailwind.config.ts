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
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border)",
        coral: {
          DEFAULT: "#E85D3A",
          hover:   "#D44E2C",
          light:   "#FBE9E4",
          dark:    "#C14020",
        },
        slate: {
          brand:  "#2C3E50",
          mid:    "#3D5166",
          light:  "#64748B",
          muted:  "#94A3B8",
        },
        sage: {
          DEFAULT: "#6BAE7F",
          hover:   "#4D9765",
          light:   "#E8F5EC",
        },
        warm: {
          bg:     "#F8F7F4",
          canvas: "#EDE8E1",
          border: "#E8E4DF",
          card:   "#FFFFFF",
        },
      },
      fontFamily: {
        jakarta: ["var(--font-jakarta)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
