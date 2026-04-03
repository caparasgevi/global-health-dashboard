/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector', 
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E63946',
          orange: '#F4A261',
          cream: '#FDFCF8',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.05em',
      }
    },
  },
  plugins: [],
}