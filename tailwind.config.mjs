import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './dashboard.tsx',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#f9fafb',
          200: '#e5e7eb',
          400: '#9ca3af',
          500: '#6b7280',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: [
          ...defaultTheme.fontFamily.sans,
        ],
      },
    },
  },
  plugins: [],
}

export default config
