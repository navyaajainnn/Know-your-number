export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        paper2: 'rgb(var(--paper2) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        inkmute: 'rgb(var(--inkmute) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        oxide: 'rgb(var(--oxide) / <alpha-value>)',
        oxidedark: 'rgb(var(--oxidedark) / <alpha-value>)',
        indigo: 'rgb(var(--indigo) / <alpha-value>)',
        indigolight: 'rgb(var(--indigolight) / <alpha-value>)',
        safe: 'rgb(var(--safe) / <alpha-value>)',
        safelight: 'rgb(var(--safelight) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        warnlight: 'rgb(var(--warnlight) / <alpha-value>)',
      },
      // fontFamily block unchanged
    },
  },
  plugins: [],
}