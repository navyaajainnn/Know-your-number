/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F2EA',
        paper2: '#EFE8D9',
        ink: '#211C17',
        inkmute: '#6F675C',
        line: '#D9CFBC',
        oxide: '#A23B2E',
        oxidedark: '#7E2E23',
        indigo: '#3B4A6B',
        indigolight: '#EAEDF3',
        safe: '#4B6C4E',
        safelight: '#E7EEE4',
        warn: '#B8862B',
        warnlight: '#F5ECD8',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
