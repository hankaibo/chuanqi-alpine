/** @type {import('tailwindcss').Config} */
module.exports = {
  // corePlugins: {
  //   preflight: false,
  // },
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      height: {
        18: '4.5rem',
      },
      translate: {
        18: '4.5rem',
      },
      colors: {
        primary: '#4eb0b3',
      },
      animation: {
        'spin-2': 'spin 2s linear infinite',
        'spin-3': 'spin 3s linear infinite',
        'spin-1': 'spin 1.5s linear infinite',
      },
      screens: {
        '3xl': '1792px',
        // => @media (min-width: 1920px) { ... }
      },
    },
    backgroundPosition: {
      'right-2': 'right 8px center',
    },
  },
  plugins: [],
};
