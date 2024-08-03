/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0D75D4",
        secondary: "#C3DCFC",
      },
      fontFamily: {
        rock: ["Rock Salt", "cursive"],
      },
    },
  },
  plugins: [],
};
