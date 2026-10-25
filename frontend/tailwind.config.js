/** @type {import('tailwindcss').Config} */
// Палитра и тени — из прототипа
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#EF3124', dark: '#D0261A', soft: '#FDEDEB', ring: '#F8B4AE' },
        ink: { DEFAULT: '#0F172A', muted: '#64748B', soft: '#94A3B8' },
        line: '#E8ECF1',
        canvas: '#F6F7F9',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)',
      },
    },
  },
  plugins: [],
}
