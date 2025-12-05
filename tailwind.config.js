/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // include all JS/TS/React files
  ],
  theme: {
    extend: {
      // Custom colors
      colors: {
        primary: "#2563eb", // Blue 600
        secondary: "#4f46e5", // Indigo 600
        background: "#f8fafc", // Slate 50
        surface: "#ffffff", // White
        surfaceHighlight: "#f1f5f9", // Slate 100
        textMain: "#0f172a", // Slate 900
        textMuted: "#64748b", // Slate 500
        border: "#e2e8f0", // Slate 200
      },
      // Custom fonts
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [], // Add Tailwind plugins here if needed
};
