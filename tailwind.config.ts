import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070b14',
        surface: '#0f172a',
        'surface-border': 'rgba(56, 189, 248, 0.15)',
        accent: '#38bdf8',
        hub: '#f43f5e',
        gold: '#f59e0b',
        cyan: '#00e5ff',
        emerald: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
