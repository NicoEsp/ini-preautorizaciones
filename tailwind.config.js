/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // INI (producto) — primario violeta
        ini: {
          DEFAULT: '#7637D0',
          light: '#F4EEFB',
          dark: '#5B29A6',
        },
        // Hertz (cliente) — branding amarillo / negro
        hertz: {
          DEFAULT: '#FFD700',
          yellow: '#FFD700',
          black: '#000000',
        },
        // Semánticos de estado
        success: '#16A34A',
        warn: '#F97316',
        danger: '#DC2626',
        muted: '#64748B',
        canvas: '#FAFAFA',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'flash-new': {
          '0%': { backgroundColor: '#FEF9C3' },
          '70%': { backgroundColor: '#FEF9C3' },
          '100%': { backgroundColor: 'transparent' },
        },
        'fade-out-row': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(10px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'flash-new': 'flash-new 3s ease-out forwards',
        'fade-out-row': 'fade-out-row 0.35s ease-in forwards',
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-in': 'modal-in 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
