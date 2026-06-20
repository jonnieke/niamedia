/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50:  '#f0f0ff',
          100: '#e0e0f8',
          200: '#c2c2f0',
          300: '#9999d8',
          400: '#6666b8',
          500: '#444488',
          600: '#2e2e68',
          700: '#1e1e48',
          800: '#12121e',
          900: '#0a0a14',
          950: '#06060e',
        },
        card: '#0f0f1c',
        border: '#1e1e34',
        purple: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        blue: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
        'brand-gradient-v': 'linear-gradient(180deg, #8b5cf6 0%, #3b82f6 100%)',
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.25) 0%, transparent 70%)',
        'card-glow': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)',
        'purple-glow': 'radial-gradient(circle at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'brand': '0 0 40px rgba(139,92,246,0.25)',
        'card': '0 1px 3px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2)',
        'purple': '0 0 20px rgba(139,92,246,0.4)',
        'glow-sm': '0 0 12px rgba(139,92,246,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
