import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/admin/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rb: {
          bg: "#f8fafc",
          text: "#0f172a",
          muted: "#64748b",
          purple: "#0284c7",
          "purple-light": "#38bdf8",
          "purple-dark": "#0369a1",
          "purple-soft": "#f0f9ff",
          pink: "#0284c7",
          green: "#059669",
          "green-soft": "#ecfdf5",
          line: "#e2e8f0",
          card: "#ffffff",
        },
        cyan: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        navy: {
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 32px rgba(15, 23, 42, 0.06)",
        soft: "0 6px 20px rgba(15, 23, 42, 0.04)",
        btn: "0 10px 24px rgba(2, 132, 199, 0.28)",
        cyan: "0 10px 25px -5px rgba(2, 132, 199, 0.35)",
        sky: "0 10px 25px -5px rgba(2, 132, 199, 0.35)",
        dock: "0 -10px 30px rgba(15, 23, 42, 0.08)",
      },
      animation: {
        marquee: "marquee 35s linear infinite",
        "marquee-reverse": "marquee-reverse 35s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
