import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from '../ui/Logo'

const navItems = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Services', href: '#services' },
  { label: 'Live Demo', href: '#demo' },
  { label: 'Pricing', href: '/pricing' },
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/6"
      style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/" onClick={() => setOpen(false)}>
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            item.href.startsWith('#') ? (
              <button key={item.label} onClick={() => handleAnchor(item.href)}
                className="px-3.5 py-2 text-sm text-gray-400 hover:text-white font-medium rounded-lg hover:bg-white/5 transition-all">
                {item.label}
              </button>
            ) : (
              <Link key={item.label} to={item.href}
                className="px-3.5 py-2 text-sm text-gray-400 hover:text-white font-medium rounded-lg hover:bg-white/5 transition-all">
                {item.label}
              </Link>
            )
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white font-semibold transition-colors px-3 py-2">
            Login
          </Link>
          <Link to="/register" className="btn-primary px-5 py-2 text-sm">
            Get Started Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t border-white/6 bg-ink-900 px-6 pb-5 pt-3">
          {navItems.map(item => (
            item.href.startsWith('#') ? (
              <button key={item.label} onClick={() => handleAnchor(item.href)}
                className="w-full text-left py-3 text-sm text-gray-300 hover:text-white font-medium border-b border-white/5 last:border-0">
                {item.label}
              </button>
            ) : (
              <Link key={item.label} to={item.href}
                className="block py-3 text-sm text-gray-300 hover:text-white font-medium border-b border-white/5 last:border-0"
                onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            )
          ))}
          <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
            <Link to="/login" className="btn-secondary flex-1 text-center text-sm" onClick={() => setOpen(false)}>Login</Link>
            <Link to="/register" className="btn-primary flex-1 text-center text-sm" onClick={() => setOpen(false)}>Get Started</Link>
          </div>
        </div>
      )}
    </header>
  )
}
