/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0C1B33",
        "navy-mid": "#1A2D4A",
        teal: "#0A8F7F",
        "teal-light": "#12C4AD",
        cream: "#FAFAF7",
        warm: "#F5F3EE",
        sand: "#E8E4DB",
        border: "#E0DDD5",
      },
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Syne", "system-ui", "sans-serif"],
        arabic: ["Noto Kufi Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
};
