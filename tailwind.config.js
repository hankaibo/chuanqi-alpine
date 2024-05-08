/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      animation: {
        "spin-2": "spin 2s linear infinite",
        "spin-3": "spin 3s linear infinite",
        "spin-1": "spin 1.5s linear infinite",
      },
      screens: {
        "3xl": "1792px",
        // => @media (min-width: 1920px) { ... }
      },
    },
    backgroundPosition:{
      'right-2': 'right 8px center'
    }
  },
  plugins: [],
};
