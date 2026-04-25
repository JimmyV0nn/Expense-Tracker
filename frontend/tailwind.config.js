/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dde8ff",
          500: "#4f6df5",
          600: "#3a55d8",
          700: "#2d43ad",
        },
      },
    },
  },
  plugins: [],
};
