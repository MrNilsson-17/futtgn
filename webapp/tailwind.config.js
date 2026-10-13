/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: '#07120d',
          900: '#0c1f16',
          800: '#122c1f',
          700: '#1c3d2a',
        },
        floodlight: '#e8c766',
        gold: '#c99a2e',
        terra: '#b0502f',
        paper: '#f4f1e7',
        mist: '#8aa396',
      },
      fontFamily: {
        display: ['"Oswald"', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 20px 60px -15px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
