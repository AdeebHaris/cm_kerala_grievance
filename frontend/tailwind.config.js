/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        kerala: {
          green: "#1a5c38",
          "green-light": "#2d7a52",
          "green-dark": "#0f3d25",
          gold: "#c9a227",
          "gold-light": "#e5c060",
        },
      },
    },
  },
  plugins: [],
};
