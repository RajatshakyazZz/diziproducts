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
          purple: "#06b6d4",
          "purple-light": "#22d3ee",
          "purple-dark": "#0891b2",
          "purple-soft": "#ecfeff",
          pink: "#0e7490",
          green: "#059669",
          "green-soft": "#ecfdf5",
          line: "#e2e8f0",
          card: "#ffffff",
        },
        cyan: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
          950: "#083344",
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
        btn: "0 10px 24px rgba(6, 182, 212, 0.28)",
        cyan: "0 10px 25px -5px rgba(6, 182, 212, 0.35)",
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
