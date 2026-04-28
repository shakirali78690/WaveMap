/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface palette — tuned for long work sessions in dark mode.
        ink: {
          950: '#05070B',
          900: '#0A0D14',
          850: '#0D111A',
          800: '#111624',
          750: '#161C2C',
          700: '#1C2335',
          600: '#262E44',
          500: '#323B55',
        },
        frost: {
          50: '#F4F7FB',
          100: '#E6ECF4',
          200: '#C6D1E2',
          300: '#9DAFCA',
          400: '#6F84A6',
          500: '#4A5D7F',
        },
        // Tactical accent — cyan primary, amber warn, rose alert, emerald ok, violet pose.
        accent: {
          cyan: '#38E3FF',
          cyanDim: '#1FA4BB',
          amber: '#FFB547',
          rose: '#FF5D7A',
          emerald: '#32D8A0',
          violet: '#A78BFA',
          sand: '#E8D5A3',
        },
        confidence: {
          high: '#32D8A0',
          mid: '#FFB547',
          low: '#FF5D7A',
          lost: '#6F84A6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        xs: ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['14px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['19px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.015em' }],
      },
      spacing: {
        'sidebar': '232px',
        'sidebar-collapsed': '64px',
        'topbar': '52px',
        'drawer': '340px',
        'timeline': '180px',
      },
      borderRadius: {
        'xs': '3px',
        'sm': '5px',
        'md': '7px',
        'lg': '10px',
        'xl': '14px',
      },
      boxShadow: {
        'panel': '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 0 0 1px rgba(255,255,255,0.04), 0 20px 40px -20px rgba(0,0,0,0.6)',
        'raise': '0 0 0 1px rgba(255,255,255,0.06), 0 12px 24px -12px rgba(0,0,0,0.8)',
        'glow-cyan': '0 0 0 1px rgba(56,227,255,0.35), 0 0 24px -6px rgba(56,227,255,0.45)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(1.6)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scanline: {
          '0%': { backgroundPositionY: '0%' },
          '100%': { backgroundPositionY: '100%' },
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 1.8s ease-in-out infinite',
        'sweep': 'sweep 2.4s linear infinite',
        'scanline': 'scanline 6s linear infinite',
      },
      backgroundImage: {
        'grid-fine': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-fine': '24px 24px',
      },
    },
  },
  plugins: [],
};
