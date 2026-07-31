/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1E1B2E",
          light: "#2A2640",
          soft: "#3A3459",
        },
        paper: {
          DEFAULT: "#F6F3EC",
          dim: "#EDE8DB",
        },
        brass: {
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
          light: "#DDD6FE",
        },
        stamp: {
          DEFAULT: "#9C3B2E",
          light: "#C05A46",
        },
        slate: {
          950: "#161B22",
        },
        success: {
          DEFAULT: "#16A34A",
          dark: "#15803D",
          light: "#DCFCE7",
        },
        danger: {
          DEFAULT: "#E11D48",
          dark: "#BE123C",
          light: "#FFE4E8",
        },
        info: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#DBEAFE",
        },
        warning: {
          DEFAULT: "#D97706",
          dark: "#B45309",
          light: "#FEF3C7",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,27,46,0.08), 0 8px 24px -8px rgba(30,27,46,0.22)",
        seal: "0 0 0 3px rgba(139,92,246,0.25)",
      },
      backgroundImage: {
        ledger:
          "repeating-linear-gradient(to bottom, transparent, transparent 39px, rgba(30,27,46,0.05) 40px)",
      },
    },
  },
  plugins: [],
};
