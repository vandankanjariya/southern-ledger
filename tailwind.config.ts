import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        panel: '#ffffff',
        sidebar: '#101828',
        line: '#e5e7eb',
        brand: {
          50: '#eefdf8',
          100: '#d6f8ed',
          500: '#16a085',
          600: '#0f8b73',
          700: '#0b6f5c',
        },
      },
      boxShadow: {
        card: '0 18px 50px rgba(15, 23, 42, 0.07)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
