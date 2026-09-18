import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Sparkles } from 'lucide-react'
import Logo from '../ui/Logo'
import { PRIMARY_VIDEO_CTA, SECONDARY_NIA_CTA } from '../../lib/cta'

const navItems = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Services', href: '/#services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Market Survey', href: '/survey' },
]

export default function PublicHeader() {
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
    <header className="fixed top-0 left-0 right-0 z-50"
      style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/" onClick={() => setOpen(false)}>
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            item.href.startsWith('#') ? (
              <button key={item.label} onClick={() => handleAnchor(item.href)}
                className="px-3.5 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-all">
                {item.label}
              </button>
            ) : (
              <Link key={item.label} to={item.href}
                className="px-3.5 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-all">
                {item.label}
              </Link>
            )
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-semibold transition-colors px-3 py-2">
            Login
          </Link>
          <Link to={SECONDARY_NIA_CTA.href}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed' }}>
            <Sparkles size={13} /> {SECONDARY_NIA_CTA.label}
          </Link>
          <Link to={PRIMARY_VIDEO_CTA.href} className="btn-primary px-5 py-2 text-sm">
            {PRIMARY_VIDEO_CTA.label}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button aria-label="Toggle navigation" aria-expanded={open} className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 pb-5 pt-3">
          {navItems.map(item => (
            item.href.startsWith('#') ? (
              <button key={item.label} onClick={() => handleAnchor(item.href)}
                className="w-full text-left py-3 text-sm text-gray-700 hover:text-gray-900 font-medium border-b border-gray-100 last:border-0">
                {item.label}
              </button>
            ) : (
              <Link key={item.label} to={item.href}
                className="block py-3 text-sm text-gray-700 hover:text-gray-900 font-medium border-b border-gray-100 last:border-0"
                onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            )
          ))}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <Link to={SECONDARY_NIA_CTA.href} onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed' }}>
              <Sparkles size={13} /> {SECONDARY_NIA_CTA.label}
            </Link>
            <Link to={PRIMARY_VIDEO_CTA.href} className="btn-primary flex-1 text-center text-sm" onClick={() => setOpen(false)}>{PRIMARY_VIDEO_CTA.label}</Link>
            <Link to="/login" className="btn-secondary flex-1 text-center text-sm" onClick={() => setOpen(false)}>Login</Link>
          </div>
        </div>
      )}
    </header>
  )
}
