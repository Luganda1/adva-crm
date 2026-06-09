/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: '#E8711A', dark: '#C75E10', light: '#FDF0E6' } },
      fontFamily: { heading: ['Montserrat', 'sans-serif'], body: ['Open Sans', 'sans-serif'] },
    },
  },
  plugins: [],
}
