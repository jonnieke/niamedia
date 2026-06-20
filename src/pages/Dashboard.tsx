import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, MessageSquare, Film, ArrowRight,
  BarChart2, Zap, FileText, BookOpen, Clock, TrendingUp, Target,
  Eye, RefreshCw, CheckCircle, Music, Package, Shield, Info,
  AlertCircle, Loader2,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const quickActions = [
  { label: 'New Campaign Copy', icon: Plus,          to: '/new-campaign',   gradient: true },
  { label: 'Order Jingle / VO',  icon: Music,         to: '/audio-studio',   accent: '#10b981' },
  { label: 'Video Concept',      icon: Film,          to: '/concept-studio', accent: '#3b82f6' },
  { label: 'Generate Caption',   icon: MessageSquare, to: '/new-campaign' },
  { label: 'WhatsApp Ad Copy',   icon: Zap,           to: '/new-campaign' },
]

const statusColors: Record<string, string> = {
  queued: '#94a3b8', 'in-production': '#f59e0b',
  'ready-for-review': '#8b5cf6', 'revision-requested': '#3b82f6',
  accepted: '#10b981', delivered: '#10b981',
}

const notifIcon: Record<string, typeof Eye> = {
  info: Info, success: CheckCircle, action: Eye, warning: AlertCircle,
}
const notifColor: Record<string, string> = {
  info: '#3b82f6', success: '#10b981', action: '#8b5cf6', warning: '#f59e0b',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Dashboard() {
  const { user } = useAuth()

  const [stats, setStats] = useState({ campaigns: 0, audioOrders: 0, deliveredAssets: 0, activeProjects: 0 })
  const [pipeline, setPipeline] = useState<{ id: string; title: string; type: string; status: string }[]>([])
  const [notifs, setNotifs] = useState<{ id: string; title: string; body: string; type: string; read: boolean; action_url?: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('audio_orders').select('id, status', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('projects').select('id, title, type, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]).then(([{ count: campCount }, { data: audioData, count: audioCount }, { data: projData }, { data: notifData }]) => {
      const audioOrders = (audioData ?? [])
      const delivered = audioOrders.filter(a => a.status === 'delivered' || a.status === 'accepted').length
      const active = audioOrders.filter(a => !['delivered', 'accepted'].includes(a.status)).length
      setStats({
        campaigns: campCount ?? 0,
        audioOrders: audioCount ?? 0,
        deliveredAssets: delivered,
        activeProjects: active,
      })
      setPipeline(projData ?? [])
      setNotifs(notifData ?? [])
      setLoading(false)
    })
  }, [user])

  const statCards = [
    { label: 'Total Campaigns', value: stats.campaigns, icon: BarChart2, change: 'All time', up: true },
    { label: 'Audio Orders', value: stats.audioOrders, icon: Music, change: 'Jingles, VO & Radio', up: true },
    { label: 'Delivered Assets', value: stats.deliveredAssets, icon: FileText, change: 'Ready to download', up: true },
    { label: 'In Production', value: stats.activeProjects, icon: BookOpen, change: 'Active jobs', up: false },
  ]

  return (
    <DashboardLayout>
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {statCards.map(({ label, value, icon: Icon, change, up }) => (
          <div key={label} className="card-glow p-5 hover:border-purple-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Icon size={16} className="text-purple-400" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-400' : 'text-gray-500'}`}>
                {up && <TrendingUp size={11} />}
                {change}
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white mb-0.5">
              {loading ? <span className="text-gray-600">—</span> : value}
            </p>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1">
          <div className="card-glow p-5 h-full">
            <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map(({ label, icon: Icon, to, gradient, accent }: { label: string; icon: typeof Plus; to: string; gradient?: boolean; accent?: string }) => (
                <Link key={label} to={to}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    gradient
                      ? 'text-white'
                      : 'bg-white/5 border border-white/8 text-gray-300 hover:bg-white/8 hover:text-white hover:border-purple-500/30'
                  }`}
                  style={
                    gradient
                      ? { background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 16px rgba(139,92,246,0.3)' }
                      : accent ? { borderColor: `${accent}30`, color: accent } : {}
                  }
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl border border-amber-500/25 bg-amber-500/8">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={12} className="text-amber-400" />
                <p className="text-xs font-bold text-amber-300">Need it in 24 hours?</p>
              </div>
              <p className="text-xs text-gray-500 mb-3">Order a jingle, voice over, or radio spot with our Express option — delivered within 24 hours.</p>
              <Link to="/audio-studio" className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                <Music size={12} /> Order Audio Express
              </Link>
            </div>

            {import.meta.env.VITE_WHATSAPP_NUMBER && (
              <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Hi%20Nia%20Media%2C%20I%27d%20like%20to%20commission%20content`}
                target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-green-500/25 bg-green-500/8 text-sm font-semibold text-green-400 hover:bg-green-500/15 transition-colors">
                <MessageSquare size={15} />
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Right: pipeline + activity stacked */}
        <div className="lg:col-span-2 space-y-5">
          {/* Production Pipeline */}
          <div className="card-glow overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-bold text-white">Production Pipeline</h2>
              <Link to="/projects" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-white/4">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={18} className="text-purple-400 animate-spin" />
                </div>
              ) : pipeline.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <Package size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No active projects yet</p>
                  <Link to="/audio-studio" className="text-xs text-purple-400 mt-1 inline-block">Commission your first →</Link>
                </div>
              ) : pipeline.map(p => {
                const color = statusColors[p.status] || '#94a3b8'
                return (
                  <Link key={p.id} to={`/projects/${p.id}/review`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                    <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{p.title}</p>
                      <p className="text-[11px] text-gray-500">{p.type.replace(/-/g, ' ')}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0"
                      style={{ color, background: `${color}18` }}>
                      {p.status.replace(/-/g, ' ')}
                    </span>
                    {p.status === 'ready-for-review' && <Eye size={12} className="text-purple-400 shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-glow overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-bold text-white">Recent Activity</h2>
              <span className="text-xs text-gray-600">
                {notifs.filter(n => !n.read).length} unread
              </span>
            </div>
            <div className="divide-y divide-white/4">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={18} className="text-purple-400 animate-spin" />
                </div>
              ) : notifs.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                  <p className="text-xs">Activity will appear here once production begins.</p>
                </div>
              ) : notifs.map(n => {
                const Icon = notifIcon[n.type] ?? Info
                const color = notifColor[n.type] ?? '#8b5cf6'
                return (
                  <Link key={n.id} to={n.action_url || '/projects'}
                    className={`flex items-start gap-3 px-5 py-3 hover:bg-white/2 transition-colors ${!n.read ? 'bg-purple-500/3' : ''}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}20` }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${n.read ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                      <p className="text-[10px] text-gray-600 line-clamp-1">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Asset library teaser */}
      <div className="mt-5 p-4 rounded-2xl border border-white/8 bg-white/2 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Shield size={18} className="text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Asset Library</p>
          <p className="text-xs text-gray-500">
            {stats.deliveredAssets > 0
              ? `${stats.deliveredAssets} delivered asset${stats.deliveredAssets !== 1 ? 's' : ''} ready to download — AI-generated, 100% copyright-free.`
              : 'Your delivered assets will appear here after production is complete.'}
          </p>
        </div>
        <Link to="/assets" className="btn-secondary text-xs px-4 py-2 shrink-0">View Library</Link>
      </div>

      {/* Bottom performance stats */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Target, label: 'Avg. CTR This Month', value: '—', sub: 'Analytics coming soon', color: 'text-purple-400' },
          { icon: TrendingUp, label: 'Total Leads Generated', value: '—', sub: 'Tracking not yet connected', color: 'text-blue-400' },
          { icon: RefreshCw, label: 'Active Orders', value: stats.activeProjects, sub: 'In production queue', color: 'text-emerald-400' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-extrabold text-white">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-600">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
