import { ReactNode, useState, useRef, useEffect } from 'react'
import { Bell, Plus, CheckCheck, Eye, CheckCircle, Info, AlertCircle, Zap, Menu } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import BuyCreditsModal from '../BuyCreditsModal'

interface DBNotification {
  id: string
  title: string
  body: string
  type: string
  read: boolean
  action_url?: string
  created_at: string
}

const NOTIF_ICON: Record<string, typeof Bell> = {
  info: Info,
  success: CheckCircle,
  action: Eye,
  warning: AlertCircle,
}

const NOTIF_COLOR: Record<string, string> = {
  info: '#2563eb',
  success: '#059669',
  action: '#7c3aed',
  warning: '#d97706',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function NotifPanel({ userId, onClose, onRead }: { userId: string; onClose: () => void; onRead: () => void }) {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState<DBNotification[]>([])
  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotifs(data) })
  }, [userId])

  const markAll = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    onRead()
  }

  const markOne = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
    onRead()
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl z-50 overflow-hidden"
      style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900">Notifications</p>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-gray-900"
              style={{ background: '#7c3aed' }}>{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 transition-colors">
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
        {notifs.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-500">No notifications yet</div>
        ) : notifs.map(n => {
          const Icon = NOTIF_ICON[n.type] ?? Info
          const color = NOTIF_COLOR[n.type] ?? '#7c3aed'
          return (
            <button key={n.id} onClick={() => { markOne(n.id); onClose(); if (n.action_url) navigate(n.action_url) }}
              className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-purple-50/60' : ''}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${color}18` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold mb-0.5 ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />}
            </button>
          )
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 text-center">
        <Link to="/projects" onClick={onClose} className="text-xs text-purple-600 hover:text-purple-700 transition-colors">
          View all activity
        </Link>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [credits, setCredits] = useState<number | null>(null)
  const [showBuyCredits, setShowBuyCredits] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('credits') === 'added') {
      supabase.from('profiles').select('credits').eq('id', user?.id ?? '').single()
        .then(({ data }) => { if (data) setCredits(data.credits) })
    }
  }, [location.search, user?.id])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('credits').eq('id', user.id).single()
      .then(({ data }) => { if (data) setCredits(data.credits) })

    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => { if (count != null) setUnreadCount(count) })

    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => { setUnreadCount(c => c + 1) })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}

      <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed top-0 left-0 h-screen z-40 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          sm:translate-x-0
        `}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main */}
        <div className="flex-1 sm:ml-60 flex flex-col overflow-hidden min-w-0">

          {/* Header */}
          <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 gap-3"
            style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shrink-0">
                <Menu size={17} />
              </button>
              <div className="hidden sm:block min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">
                  Welcome back, {user?.name?.split(' ')[0]}
                </p>
                <p className="text-xs text-gray-500">Let's create high-converting ads that grow your business.</p>
              </div>
              <p className="sm:hidden text-sm font-bold text-gray-900 truncate">
                {user?.name?.split(' ')[0]}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/new-campaign" className="hidden sm:flex btn-primary text-sm px-4 py-2 items-center gap-1.5">
                <Plus size={15} /> New Campaign
              </Link>

              {/* Credits badge */}
              <button onClick={() => setShowBuyCredits(true)}
                title="Campaign credits — click to buy more"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  credits === 0
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-purple-200 bg-purple-50 text-purple-700'
                }`}>
                <Zap size={11} />
                <span>{credits === null ? '...' : credits}</span>
                <span className="hidden sm:inline">{credits === 1 ? ' credit' : ' credits'}</span>
              </button>

              {/* Bell */}
              <div ref={bellRef} className="relative">
                <button onClick={() => setShowNotifs(v => !v)}
                  className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                      style={{ background: '#7c3aed' }}>{unreadCount}</span>
                  )}
                </button>
                {showNotifs && user && (
                  <NotifPanel
                    userId={user.id}
                    onClose={() => setShowNotifs(false)}
                    onRead={() => setUnreadCount(0)}
                  />
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-900"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name?.split(' ')[0]} {user?.name?.split(' ')[1]?.charAt(0)}.</p>
                  <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Pro Plan' : 'Free Plan'}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
              {children}
            </div>
          </main>
        </div>

        {/* WhatsApp float */}
        {import.meta.env.VITE_WHATSAPP_NUMBER && (
          <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Hi%20Nia%20Media%2C%20I%20need%20help%20commissioning%20content`}
            target="_blank" rel="noopener noreferrer"
            title="Chat with us on WhatsApp"
            className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
            style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)', width: 48, height: 48 }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}
      </div>
    </>
  )
}

