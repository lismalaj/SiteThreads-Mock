import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 24px 72px rgba(15, 23, 42, 0.14), 0 8px 24px rgba(15, 23, 42, 0.08)',
        float: '0 10px 30px rgba(15, 23, 42, 0.12), 0 3px 10px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        ink: '#1C1C1E',
        muted: '#6C6C70',
        line: 'rgba(60, 60, 67, 0.12)',
        card: 'rgba(255,255,255,0.78)',
        panel: 'rgba(249,249,251,0.82)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'sans-serif'],
      },
      animation: {
        pulseSoft: 'pulseSoft 2.4s ease-out infinite',
        fadeUp: 'fadeUp 220ms ease-out both',
      },
      keyframes: {
        pulseSoft: {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0.22' },
          '70%': { transform: 'translate(-50%, -50%) scale(2.7)', opacity: '0' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
