/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // brand
        cop: {
          // primary blue family
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // utility accents
        siren: {
          red:    '#dc2626',
          green:  '#16a34a',
          amber:  '#f59e0b',
        },
        ink: {
          900: '#0b1220',
          700: '#1f2937',
          500: '#475569',
        },
        paper: '#fbfaf6',   // warm white for "notebook" panels
        card:  '#ffffff',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        hand: ['"Caveat"', 'cursive'],
        disp: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        file: '0 1px 0 rgba(15, 23, 42, 0.06), 0 8px 20px -10px rgba(30, 64, 175, 0.25)',
        stamp: '0 0 0 2px rgba(220, 38, 38, 0.65) inset',
        pin: '0 4px 0 0 rgba(15, 23, 42, 0.12), 0 6px 14px -6px rgba(15, 23, 42, 0.4)',
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(rgba(30,64,175,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.06) 1px, transparent 1px)',
        'ruled': 'repeating-linear-gradient(0deg, transparent 0 31px, rgba(30,64,175,0.18) 31px 32px)',
        'pinboard': 'radial-gradient(rgba(30,64,175,0.10) 1px, transparent 1.5px)',
      },
      backgroundSize: {
        'grid-32': '32px 32px',
        'pin-12': '12px 12px',
      },
      keyframes: {
        blink: {
          '0%, 60%, 100%': { opacity: 1 },
          '30%': { opacity: 0.2 },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.55)' },
          '100%': { boxShadow: '0 0 0 14px rgba(220, 38, 38, 0)' },
        },
      },
      animation: {
        blink: 'blink 1.4s infinite',
        pulseRing: 'pulseRing 1.8s infinite',
      },
    },
  },
  plugins: [],
};
