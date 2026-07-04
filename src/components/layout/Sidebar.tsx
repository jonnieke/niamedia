import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Plus, FolderOpen, Palette, Settings,
  ShieldCheck, LogOut, Zap, X, Video, Lightbulb,
  Receipt, Users, Gift, CalendarDays, UserPlus,
  MessageSquare, Link2, FileText, Film, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import Logo from '../ui/Logo'

interface SidebarProps {
  onClose?: () => void
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-campaign', icon: Plus, label: 'New Campaign', highlight: true },
  { to: '/ideas', icon: Lightbulb, label: 'Ideas Bank' },
  { to: '/campaigns', icon: FolderOpen, label: 'Campaigns' },
  { to: '/brand-kit', icon: Palette, label: 'Brand Kit' },
  { to: '/requests', icon: Video, label: 'Requests' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/inbox', icon: MessageSquare, label: 'WhatsApp Inbox' },
  { to: '/portals', icon: Link2, label: 'Client Portals' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/video-pipeline', icon: Film, label: 'Video Pipeline' },
  { to: '/roi-tracker', icon: TrendingUp, label: 'ROI Tracker' },
  { to: '/team', icon: UserPlus, label: 'Team' },
  { to: '/referral', icon: Gift, label: 'Refer & Earn' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  null,
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [newLeadsCount, setNewLeadsCount] = useState(0)
  const [unreadWa, setUnreadWa] = useState(0)
  const [planLabel, setPlanLabel] = useState('Free Plan')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('subscription_plan').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.subscription_plan) {
          const labels: Record<string, string> = { free: 'Free Plan', pro: 'Pro Plan', agency: 'Agency Plan' }
          setPlanLabel(labels[data.subscription_plan] ?? 'Free Plan')
        }
      })
  }, [user])

  useEffect(() => {
    if (!user) return
    const fetchCount = () => {
      supabase.from('leads').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('status', 'New')
        .then(({ count }) => setNewLeadsCount(count ?? 0))
    }
    fetchCount()
    // Realtime: increment badge when a new lead arrives
    const channel = supabase.channel(`leads-badge-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` },
        () => setNewLeadsCount(n => n + 1))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // WhatsApp unread count
  useEffect(() => {
    if (!user) return
    const fetch = () => {
      supabase.from('whatsapp_conversations').select('unread_count').eq('user_id', user.id)
        .then(({ data }) => setUnreadWa((data ?? []).reduce((s, c) => s + (c.unread_count ?? 0), 0)))
    }
    fetch()
    const ch = supabase.channel(`wa-badge-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations', filter: `user_id=eq.${user.id}` },
        fetch)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  // Clear badge when visiting /leads or /inbox
  useEffect(() => {
    if (location.pathname === '/leads') setNewLeadsCount(0)
    if (location.pathname === '/inbox') setUnreadWa(0)
  }, [location.pathname])

  return (
    <aside className="h-screen w-60 flex flex-col" style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb' }}>
      <div className="h-16 flex items-center justify-between px-5 shrink-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Logo size="sm" />
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

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

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if (!item) return <div key={i} className="my-2 border-t border-gray-100" />
          if (item.highlight) return null
          const { to, icon: Icon, label } = item as { to: string; icon: typeof LayoutDashboard; label: string; highlight?: boolean }
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
              {label === 'Leads' && newLeadsCount > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white min-w-[18px] text-center"
                  style={{ background: '#7c3aed' }}>
                  {newLeadsCount > 99 ? '99+' : newLeadsCount}
                </span>
              )}
              {label === 'WhatsApp Inbox' && unreadWa > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white min-w-[18px] text-center"
                  style={{ background: '#25d366' }}>
                  {unreadWa > 99 ? '99+' : unreadWa}
                </span>
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

      <div className="p-3 shrink-0" style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl hover:bg-gray-50 cursor-default">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role === 'admin' ? 'Admin' : planLabel}</p>
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
