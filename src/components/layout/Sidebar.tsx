import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Plus, FolderOpen, Layers,
  Palette, Settings, ShieldCheck, LogOut, Zap,
  Shield, Gift, X, Video,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import Logo from '../ui/Logo'

interface SidebarProps {
  onClose?: () => void
}

const navItems = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-campaign',    icon: Plus,            label: 'New Campaign', highlight: true },
  { to: '/campaigns',       icon: FolderOpen,      label: 'Campaigns' },
  { to: '/templates',       icon: Layers,          label: 'Templates' },
  { to: '/assets',          icon: Shield,          label: 'Posters' },
  { to: '/request-video',   icon: Video,           label: 'Request Video', badge: 'NEW' },
  { to: '/brand-kit',       icon: Palette,         label: 'Brand Kit' },
  { to: '/referral',        icon: Gift,            label: 'Refer & Earn', badge: 'KES 500' },
  null,
  { to: '/settings',        icon: Settings,        label: 'Settings' },
]

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="h-screen w-60 flex flex-col"
      style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb' }}>

      {/* Logo row */}
      <div className="h-16 flex items-center justify-between px-5 shrink-0"
        style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Logo size="sm" />
        {onClose && (
          <button onClick={onClose}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* New Campaign CTA */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        <NavLink
          to="/new-campaign"
          onClick={onClose}
          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-800 transition-all"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
        >
          <Plus size={16} />
          New Campaign
          <Zap size={13} className="ml-auto opacity-80" />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if (!item) return <div key={i} className="my-2 border-t border-gray-100" />
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
                    ? 'bg-purple-50 text-purple-700 border border-purple-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: '#ede9fe', color: '#7c3aed' }}>{badge}</span>
              )}
            </NavLink>
          )
        })}

        {user?.role === 'admin' && (
          <>
            <div className="my-2 border-t border-gray-100" />
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border border-purple-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl hover:bg-gray-50 cursor-default">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role === 'admin' ? 'Pro Plan' : 'Free Plan'}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

