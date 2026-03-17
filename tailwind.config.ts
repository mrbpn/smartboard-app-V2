import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        ink: {
          50:  "#f0f0ee",
          100: "#d8d7d3",
          200: "#b0afa8",
          300: "#88877e",
          400: "#605f58",
          500: "#383730",
          600: "#2a2923",
          700: "#1e1d18",
          800: "#141410",
          900: "#0a0a08",
        },
        chalk: {
          DEFAULT: "#f5f2eb",
          warm:    "#ede8dd",
          cool:    "#eef0f5",
        },
        sage: {
          50:  "#eef4f0",
          100: "#cde2d4",
          200: "#9ec9ae",
          300: "#6faf87",
          400: "#3d9460",
          500: "#1e7a42",
          600: "#175f33",
          700: "#114626",
          800: "#0b2e19",
          900: "#05170d",
        },
        amber: {
          50:  "#fdf6e8",
          100: "#fae5b3",
          200: "#f5cc6b",
          300: "#f0b224",
          400: "#d49510",
          500: "#a87509",
          600: "#7d5807",
          700: "#533b04",
          800: "#2a1e02",
          900: "#150f01",
        },
        coral: {
          50:  "#fdf0ee",
          100: "#f9d0c9",
          200: "#f3a195",
          300: "#ec7160",
          400: "#e44229",
          500: "#c12e17",
          600: "#962311",
          700: "#6c180c",
          800: "#420e07",
          900: "#1a0503",
        },
      },
      animation: {
        "fade-up":    "fadeUp 0.5s ease forwards",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "slide-left": "slideLeft 0.3s ease forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "spin-slow":  "spin 8s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideLeft: {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
