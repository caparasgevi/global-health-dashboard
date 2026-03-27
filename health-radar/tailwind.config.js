/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 'selector' is correct for Tailwind v3.4+, 'class' for older versions
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
        // Poppins: Best for Headings, Buttons, and Nav
        sans: ['Poppins', 'sans-serif'],
        // Montserrat: Best for readable paragraphs
        body: ['Montserrat', 'sans-serif'],
      },
      // Optional: Tighten tracking for Poppins headings to match your logo style
      letterSpacing: {
        tighter: '-0.05em',
      }
    },
  },
  plugins: [],
}