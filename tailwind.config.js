/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#004d40',
          secondary: '#00695c',
          accent: '#26a69a',
        },
        surface: {
          DEFAULT: '#ffffff',
          dim: '#f5f7f9',
        },
        text: {
          main: '#1a1a1b',
          muted: '#4b5563',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
