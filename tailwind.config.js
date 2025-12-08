/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#4f46e5",
        background: "#f8fafc",
        surface: "#ffffff",
        surfaceHighlight: "#f1f5f9",
        textMain: "#0f172a",
        textMuted: "#64748b",
        border: "#e2e8f0",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
