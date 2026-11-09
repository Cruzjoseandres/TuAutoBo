/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          gray: '#86868b',
          'light-bg': '#f5f5f7',
          'dark-bg': '#000000',
          'card-light': 'rgba(255, 255, 255, 0.85)',
          'card-dark': 'rgba(28, 28, 30, 0.75)',
          border: 'rgba(210, 210, 215, 0.6)',
          'border-dark': 'rgba(255, 255, 255, 0.12)',
          green: '#34c759',
          orange: '#ff9500',
          red: '#ff3b30',
        },
      },
      fontFamily: {
        sf: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'apple-card': '0 8px 30px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'apple-float': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        'apple-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'apple-xl': '18px',
        'apple-2xl': '24px',
        'apple-3xl': '32px',
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'apple-fluid': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

