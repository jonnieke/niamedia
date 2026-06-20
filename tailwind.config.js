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
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        card: '#ffffff',
        border: '#e5e7eb',
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
        'brand': '0 4px 16px rgba(124,58,237,0.2)',
        'card': '0 1px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(124,58,237,0.15)',
        'purple': '0 4px 16px rgba(124,58,237,0.25)',
        'glow-sm': '0 2px 8px rgba(124,58,237,0.2)',
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
