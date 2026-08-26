/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Lato", "sans-serif"],
        lobster: ["Lobster", "cursive"],
        display: ["Lobster", "cursive"],
      },
      colors: {
        green: { DEFAULT: "#2C3B2D", dark: "#1A2A1B", light: "#3D5C3E" },
        cream: { DEFAULT: "#FAF8F4", warm: "#FFF8F0" },
        border: "#E8E2D9",
        muted: "#6B6B6B",
        faint: "#9B9B9B",
      },
    },
  },
  plugins: [],
};
