/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Clash Display"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
        'body': ['"Satoshi"', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f0f0f5',
          100: '#e0e0eb',
          200: '#c1c1d6',
          300: '#9292b8',
          400: '#636399',
          500: '#44446e',
          600: '#333352',
          700: '#222236',
          800: '#16161f',
          900: '#0d0d14',
          950: '#080810',
        },
        acid: {
          DEFAULT: '#b5ff47',
          dark: '#8acc30',
        },
        coral: {
          DEFAULT: '#ff6b6b',
          dark: '#cc4444',
        },
        sky: {
          electric: '#47c8ff',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'slide-in': 'slideIn 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}