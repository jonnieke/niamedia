interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-sm', gap: 'gap-2' },
    md: { icon: 34, text: 'text-base', gap: 'gap-2.5' },
    lg: { icon: 44, text: 'text-xl', gap: 'gap-3' },
  }
  const s = sizes[size]

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Logo mark — gradient N with pixel dots */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="brand-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
        </defs>
        {/* N letterform */}
        <path
          d="M8 36V8l20 22V8"
          stroke="url(#brand-grad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="28" y1="8" x2="28" y2="36" stroke="url(#brand-grad)" strokeWidth="5.5" strokeLinecap="round"/>
        {/* Pixel dots */}
        <rect x="33" y="6"  width="3.5" height="3.5" rx="1" fill="#8b5cf6" opacity="0.9"/>
        <rect x="37" y="6"  width="3.5" height="3.5" rx="1" fill="#7c6cf4" opacity="0.7"/>
        <rect x="33" y="10.5" width="3.5" height="3.5" rx="1" fill="#6090f0" opacity="0.6"/>
        <rect x="37" y="10.5" width="3.5" height="3.5" rx="1" fill="#3b82f6" opacity="0.5"/>
        <rect x="37" y="15" width="3.5" height="3.5" rx="1" fill="#3b82f6" opacity="0.3"/>
      </svg>

      {/* Wordmark */}
      <div className={`flex items-baseline gap-0.5 font-bold ${s.text} tracking-tight leading-none`}>
        <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nia</span>
        <span className="text-white"> Media</span>
      </div>
    </div>
  )
}
