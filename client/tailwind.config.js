/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark mode palette
        "navy":       "#0F1923",
        "navy-mid":   "#162032",
        "navy-light": "#1E2F42",
        "divider":    "#2E3D52",
        "accent":     "#38BDF8",
        "accent-dk":  "#0EA5E9",
        "slate":      "#CBD5E1",
        "muted":      "#64748B",
        "pass":       "#22C55E",
        "fail":       "#EF4444",
        "warn":       "#F59E0B",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
