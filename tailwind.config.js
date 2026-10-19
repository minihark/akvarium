/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        abyss: {
          950: '#040d1a',
          900: '#07162c',
          850: '#0b2140',
          800: '#102c54',
          700: '#1b4379',
        },
      },
    },
  },
  plugins: [],
};
