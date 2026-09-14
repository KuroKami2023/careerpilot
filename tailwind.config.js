/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep ink-green — primary identity (900 is the signature ink)
        brand: {
          50: '#f2f5f1',
          100: '#e1e9df',
          200: '#c3d4c1',
          300: '#9ab797',
          400: '#6f9472',
          500: '#527856',
          600: '#3f6145',
          700: '#344e39',
          800: '#263b2c',
          900: '#1a2e22',
          950: '#0f1e15',
        },
        // Amber / gold accent
        gold: {
          50: '#fbf7ec',
          100: '#f5eacc',
          200: '#ead198',
          300: '#ddb45e',
          400: '#d19938',
          500: '#b48327',
          600: '#95681f',
          700: '#78531e',
          800: '#65451e',
          900: '#563b1d',
        },
        // Warm paper surfaces
        paper: {
          DEFAULT: '#faf8f4',
          deep: '#f3eee4',
          card: '#fffdf9',
        },
        ink: {
          DEFAULT: '#1a2e22',
          soft: '#2c3f33',
          muted: '#5c6f62',
        },
      },
      fontFamily: {
        display: ['Georgia', "'Times New Roman'", 'serif'],
      },
      letterSpacing: {
        editorial: '0.14em',
      },
      boxShadow: {
        paper: '0 1px 2px rgba(26, 46, 34, 0.05), 0 8px 24px -12px rgba(26, 46, 34, 0.18)',
        lift: '0 2px 4px rgba(26, 46, 34, 0.06), 0 16px 32px -16px rgba(26, 46, 34, 0.28)',
      },
    },
  },
  plugins: [],
};
