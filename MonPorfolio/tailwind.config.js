/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eef6fc',
          100: '#d9ecf9',
          200: '#b3d9f3',
          300: '#7ebfe9',
          400: '#4a9edd',
          500: '#1f83cf',
          600: '#0A66C2',
          700: '#0854a0',
          800: '#073f7d',
          900: '#062f5e',
          950: '#041d3d',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffeed5',
          200: '#ffd8aa',
          300: '#ffbb74',
          400: '#ff9838',
          500: '#ff7900', // Orange Brand
          600: '#f16e00', // Accessible Orange
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          brand: '#ff7900',
          hover: '#f16e00',
        },
        brand: {
          black: '#000000',
          dark: '#121212',
          charcoal: '#222222',
          gray: '#666666',
          lightgray: '#f4f4f4',
          border: '#e5e7eb',
        },
        functional: {
          success: '#32c832',
          danger: '#cd3c14',
          warning: '#fc0',
          info: '#527edb',
        }
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Menlo', 'Monaco', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        'orange-glow': '0 0 15px rgba(255, 121, 0, 0.35)',
        'orange-sm': '0 2px 8px rgba(255, 121, 0, 0.2)',
        'subtle': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
