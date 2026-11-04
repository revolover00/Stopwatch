/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /**
       * Semantic colors only. Every value is an RGB channel triplet defined as a
       * CSS variable in `src/index.css`, so themes swap without touching classes.
       */
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--c-accent-ink) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        /* Type scale */
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
        caption: ['0.75rem', { lineHeight: '1.1rem' }],
        small: ['0.8125rem', { lineHeight: '1.25rem' }],
        body: ['0.9375rem', { lineHeight: '1.6rem' }],
        lead: ['1.0625rem', { lineHeight: '1.7rem' }],
        title: ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        hero: ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        display: ['clamp(2.75rem, 13vw, 6.5rem)', { lineHeight: '0.92', letterSpacing: '-0.045em' }],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgb(var(--c-ink) / 0.04) inset, 0 24px 60px -32px rgb(0 0 0 / 0.55)',
        button: '0 1px 0 0 rgb(255 255 255 / 0.12) inset, 0 10px 24px -14px rgb(var(--c-accent) / 0.75)',
        ring: '0 0 0 1px rgb(var(--c-line))',
      },
      maxWidth: {
        page: '64rem',
        prose: '42rem',
      },
      spacing: {
        4.5: '1.125rem',
        18: '4.5rem',
      },
      transitionTimingFunction: {
        instrument: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(0.82)' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'rise-in': 'rise-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
