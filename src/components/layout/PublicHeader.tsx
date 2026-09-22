import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Sparkles } from 'lucide-react'
import Logo from '../ui/Logo'
import { PRIMARY_VIDEO_CTA, SECONDARY_NIA_CTA } from '../../lib/cta'
import { openNiaAssistant } from '../GlobalNiaAssistant'

const navItems = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Services', href: '/#services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Test Your Brand', href: '/test-brand', badge: 'AI' },
  { label: 'Market Survey', href: '/survey' },
]

export default function PublicHeader({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)

  const handleAnchor = (href: string) => {
    setOpen(false)
    if (!href.startsWith('#')) return
    setTimeout(() => {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      style={{
        background: dark ? 'rgba(7, 5, 13, 0.85)' : '#ffffff',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: dark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e5e7eb',
        boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/" onClick={() => setOpen(false)}>
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            item.href.startsWith('#') ? (
              <button
                key={item.label}
                onClick={() => handleAnchor(item.href)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  dark
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all inline-flex items-center gap-1.5 ${
                  dark
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{item.label}</span>
                {'badge' in item && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-gradient-to-r from-purple-500 to-indigo-500 text-white tracking-wider shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className={`text-sm font-semibold transition-colors px-3 py-2 ${
              dark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Login
          </Link>
          <Link
            to={SECONDARY_NIA_CTA.href}
            onClick={(e) => {
              e.preventDefault()
              openNiaAssistant()
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
            style={{
              background: dark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124,58,237,0.08)',
              border: dark ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(124,58,237,0.2)',
              color: dark ? '#c084fc' : '#7c3aed',
            }}
          >
            <Sparkles size={13} /> {SECONDARY_NIA_CTA.label}
          </Link>
          <Link to={PRIMARY_VIDEO_CTA.href} className="btn-primary px-5 py-2 text-sm">
            {PRIMARY_VIDEO_CTA.label}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            dark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div
          className={`md:hidden border-t px-6 pb-5 pt-3 transition-colors ${
            dark ? 'bg-[#0c0914] border-white/10' : 'bg-white border-gray-100'
          }`}
        >
          {navItems.map(item => (
            item.href.startsWith('#') ? (
              <button
                key={item.label}
                onClick={() => handleAnchor(item.href)}
                className={`w-full text-left py-3 text-sm font-medium border-b last:border-0 ${
                  dark
                    ? 'text-white/80 hover:text-white border-white/10'
                    : 'text-gray-700 hover:text-gray-900 border-gray-100'
                }`}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.href}
                className={`py-3 text-sm font-medium border-b last:border-0 flex items-center justify-between ${
                  dark
                    ? 'text-white/80 hover:text-white border-white/10'
                    : 'text-gray-700 hover:text-gray-900 border-gray-100'
                }`}
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                {'badge' in item && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-gradient-to-r from-purple-500 to-indigo-500 text-white tracking-wider shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          ))}
          <div className={`mt-4 pt-4 border-t space-y-2 ${dark ? 'border-white/10' : 'border-gray-100'}`}>
            <Link
              to={SECONDARY_NIA_CTA.href}
              onClick={(e) => {
                e.preventDefault()
                setOpen(false)
                openNiaAssistant()
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold cursor-pointer"
              style={{
                background: dark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124,58,237,0.08)',
                border: dark ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(124,58,237,0.2)',
                color: dark ? '#c084fc' : '#7c3aed',
              }}
            >
              <Sparkles size={13} /> {SECONDARY_NIA_CTA.label}
            </Link>
            <Link to={PRIMARY_VIDEO_CTA.href} className="btn-primary flex-1 text-center text-sm" onClick={() => setOpen(false)}>
              {PRIMARY_VIDEO_CTA.label}
            </Link>
            <Link
              to="/login"
              className={`flex-1 text-center text-sm py-2 rounded-lg font-semibold border ${
                dark ? 'border-white/20 text-white hover:bg-white/5' : 'btn-secondary'
              }`}
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
