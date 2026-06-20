import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Plus, FolderOpen, Layers, Package,
  Palette, Settings, ShieldCheck, LogOut, BarChart2, Zap, Sparkles,
  Film, Music, Shield, Gift, X,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import Logo from '../ui/Logo'

interface SidebarProps {
  onClose?: () => void
}

const navItems = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-campaign',    icon: Plus,            label: 'New Campaign', highlight: true },
  { to: '/concept-studio',  icon: Sparkles,        label: 'Concept Studio', badge: 'FREE' },
  { to: '/projects',        icon: Film,            label: 'My Projects' },
  { to: '/audio-studio',    icon: Music,           label: 'Audio Studio' },
  { to: '/assets',          icon: Shield,          label: 'Asset Library' },
  { to: '/analytics',       icon: BarChart2,       label: 'Analytics' },
  { to: '/campaigns',       icon: FolderOpen,      label: 'Campaigns' },
  { to: '/templates',       icon: Layers,          label: 'Templates' },
  { to: '/package-request', icon: Package,         label: 'Package Requests' },
  { to: '/brand-kit',       icon: Palette,         label: 'Brand Kit' },
  { to: '/referral',        icon: Gift,            label: 'Refer & Earn', badge: 'KES 500' },
  null,
  { to: '/settings',        icon: Settings,        label: 'Settings' },
]

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="h-screen w-60 flex flex-col border-r border-white/6"
      style={{ background: 'rgba(10,10,20,0.98)' }}>

      {/* Logo row — close btn on mobile */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/6 shrink-0">
        <Logo size="sm" />
        {onClose && (
          <button onClick={onClose}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* New Campaign CTA */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        <NavLink
          to="/new-campaign"
          onClick={onClose}
          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 16px rgba(139,92,246,0.3)' }}
        >
          <Plus size={16} />
          New Campaign
          <Zap size={13} className="ml-auto opacity-70" />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if (!item) return <div key={i} className="my-2 border-t border-white/5" />
          if (item.highlight) return null
          const { to, icon: Icon, label, badge } = item as typeof item & { badge?: string }
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: 'rgba(139,92,246,0.25)', color: '#a78bfa' }}>{badge}</span>
              )}
            </NavLink>
          )
        })}

        {user?.role === 'admin' && (
          <>
            <div className="my-2 border-t border-white/5" />
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <ShieldCheck size={16} />
              Admin
            </NavLink>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/6 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl hover:bg-white/5 cursor-default">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role === 'admin' ? 'Pro Plan' : 'Free Plan'}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
