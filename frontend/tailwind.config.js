/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Texte et surfaces sombres : bleu nuit, sobre et institutionnel
        ink: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
          soft: "#334155",
        },
        // Fonds clairs
        paper: {
          DEFAULT: "#FFFFFF",
          dim: "#F6F7F9",
        },
        // Couleur de marque unique
        brand: {
          DEFAULT: "#1D4ED8",
          dark: "#1E40AF",
          light: "#DBE6FE",
          50: "#EFF4FF",
        },
        line: "#E4E7EC",
        success: {
          DEFAULT: "#15803D",
          dark: "#166534",
          light: "#DCFCE7",
        },
        danger: {
          DEFAULT: "#DC2626",
          dark: "#B91C1C",
          light: "#FEE2E2",
        },
        info: {
          DEFAULT: "#0369A1",
          dark: "#075985",
          light: "#E0F2FE",
        },
        warning: {
          DEFAULT: "#B45309",
          dark: "#92400E",
          light: "#FEF3C7",
        },
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.05)",
        raised: "0 1px 3px rgba(16,24,40,0.08), 0 8px 24px -6px rgba(16,24,40,0.12)",
        pop: "0 12px 32px -8px rgba(16,24,40,0.22), 0 2px 6px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};
