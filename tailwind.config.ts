import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '390px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1440px',
    },
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        'card-top': 'var(--bg-card-top)',
        'card-bottom': 'var(--bg-card-bottom)',
        digit: 'var(--text-digit)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        subtle: 'var(--border-subtle)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        brand: 'var(--brand-blue)',
        themeDark: {
          bg: '#000000',
          surface: '#0c0c0c',
          cardTop: '#111111',
          cardBottom: '#101010',
          digit: '#ebebeb',
        },
        themeLight: {
          bg: '#f5f5f7',
          surface: '#ffffff',
          cardTop: '#eaeaee',
          cardBottom: '#e4e4e9',
          digit: '#18181b',
        },
        themeMidnight: {
          bg: '#040711',
          surface: '#0a101f',
          cardTop: '#0d1526',
          cardBottom: '#0b1222',
          digit: '#e2e8f0',
        },
        themeSand: {
          bg: '#f2ece1',
          surface: '#faf6ee',
          cardTop: '#e7dfd0',
          cardBottom: '#e1d8c7',
          digit: '#26211b',
        },
      },
      fontFamily: {
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        flip: 'var(--flip-radius, 28px)',
        panel: '16px',
        pill: '9999px',
      },
      maxWidth: {
        container: '980px',
      },
    },
  },
  plugins: [],
} satisfies Config;
