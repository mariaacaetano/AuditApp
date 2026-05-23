/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        burgundy: "#6B0F2B",
        sand: "#D4C5A9",
        taupe: "#A89070",
      },
    },
  },
  plugins: [],
};