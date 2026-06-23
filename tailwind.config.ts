import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fbf8',
          100: '#d4f1e8',
          600: '#0F6E56',
          700: '#0a5244',
        },
        secondary: {
          500: '#1D9E75',
          600: '#18845f',
        },
        background: '#F8FAFC',
      },
    },
  },
  plugins: [],
}

export default config
