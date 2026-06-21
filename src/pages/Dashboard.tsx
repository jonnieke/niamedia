import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, MessageSquare, Film, ArrowRight,
  BarChart2, Zap, FileText, TrendingUp,
  Eye, CheckCircle, Music, Package, Shield, Info,
  AlertCircle, Loader2, Sparkles, Clock, Bot,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import NiaAgent from '../components/NiaAgent'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const statusColors: Record<string, string> = {
  queued: '#94a3b8',
  'in-production': '#f59e0b',
  'ready-for-review': '#7c3aed',
  'revision-requested': '#2563eb',
  accepted: '#059669',
  delivered: '#059669',
}

const notifIcon: Record<string, typeof Eye> = {
  info: Info, success: CheckCircle, action: Eye, warning: AlertCircle,
}
const notifColor: Record<string, string> = {
  info: '#2563eb', success: '#059669', action: '#7c3aed', warning: '#f59e0b',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function greeting(name: string) {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${salutation}, ${name.split(' ')[0]}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [showNia, setShowNia] = useState(false)

  const [stats, setStats] = useState({ campaigns: 0, audioOrders: 0, deliveredAssets: 0, activeProjects: 0 })
  const [pipeline, setPipeline] = useState<{ id: string; title: string; type: string; status: string; linkTo?: string }[]>([])
  const [notifs, setNotifs] = useState<{ id: string; title: string; body: string; type: string; read: boolean; action_url?: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('audio_orders').select('id, status', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('projects').select('id, title, type, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('credits').eq('id', user.id).single(),
      supabase.from('video_requests').select('id, title, business_name, status').eq('user_id', user.id).in('status', ['in-production', 'delivered']).order('created_at', { ascending: false }).limit(3),
    ]).then(([{ count: campCount }, { data: audioData, count: audioCount }, { data: projData }, { data: notifData }, { data: creditData }, { data: vrData }]) => {
      const audioOrders = audioData ?? []
      const delivered = audioOrders.filter(a => a.status === 'delivered' || a.status === 'accepted').length
      const active = audioOrders.filter(a => !['delivered', 'accepted'].includes(a.status)).length
      setStats({ campaigns: campCount ?? 0, audioOrders: audioCount ?? 0, deliveredAssets: delivered, activeProjects: active })
      const vidItems = (vrData ?? []).map((v: { id: string; title: string; business_name: string; status: string }) => ({
        id: v.id, title: v.title || v.business_name, type: 'video request', status: v.status, linkTo: '/my-requests',
      }))
      const projItems = (projData ?? []).map((p: { id: string; title: string; type: string; status: string }) => ({ ...p, linkTo: `/projects/${p.id}/review` }))
      setPipeline([...vidItems, ...projItems].slice(0, 6))
      setNotifs(notifData ?? [])
      if (creditData) setCredits(creditData.credits)
      setLoading(false)
    })
  }, [user])

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {})
  }

  const agencyEquivalent = stats.campaigns * 15000 + stats.audioOrders * 25000
  const niaPaid = stats.campaigns * 5000 + stats.audioOrders * 8000
  const saved = agencyEquivalent - niaPaid

  const isNew = !loading && stats.campaigns === 0 && stats.audioOrders === 0
  const unread = notifs.filter(n => !n.read).length

  return (
    <DashboardLayout>
      {showNia && <NiaAgent onClose={() => setShowNia(false)} />}

      {/* ── Greeting header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-0.5">
            {user ? greeting(user.name) : 'Dashboard'} 👋
          </h1>
          <p className="text-sm text-gray-500">
            {isNew ? 'Welcome! Your workspace is ready — start your first campaign.' : `You have ${unread} unread notification${unread !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          {credits !== null && (
            <Link to={credits > 0 ? "/new-campaign" : "/pricing"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors"
              style={{ borderColor: credits > 0 ? '#c4b5fd' : '#fca5a5', background: credits > 0 ? '#ede9fe' : '#fef2f2', color: credits > 0 ? '#6d28d9' : '#dc2626' }}>
              <Zap size={12} />
              {credits} credit{credits !== 1 ? 's' : ''} remaining
            </Link>
          )}
          <button onClick={() => setShowNia(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
            <Bot size={15} /> Chat with Nia
          </button>
          <Link to="/new-campaign" className="btn-primary text-sm px-4 py-2.5 gap-2">
            <Plus size={15} /> New Campaign
          </Link>
        </div>
      </div>

      {/* ── New user onboarding nudge ─────────────────── */}
      {isNew && (
        <div className="mb-7 rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0b001f 0%, #060012 100%)', border: '1px solid rgba(167,139,250,0.25)' }}>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.3)' }}>
              <Sparkles size={22} style={{ color: '#a78bfa' }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white mb-1">Ready to create your first campaign?</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Takes under 2 minutes. Tell us your business, audience, and goal — Nia generates professional ad copy instantly.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap shrink-0">
              <Link to="/new-campaign" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
                Create Campaign <ArrowRight size={13} />
              </Link>
              <Link to="/audio-studio" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)' }}>
                Order Audio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Campaigns Created', value: stats.campaigns, icon: BarChart2, sub: 'All time', color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Audio Orders', value: stats.audioOrders, icon: Music, sub: 'Jingles, VO & Radio', color: '#2563eb', bg: '#dbeafe' },
          { label: 'Delivered Assets', value: stats.deliveredAssets, icon: FileText, sub: 'Ready to download', color: '#059669', bg: '#d1fae5' },
          { label: 'Saved vs Agency', value: saved > 0 ? `KES ${(saved / 1000).toFixed(0)}K` : '—', icon: TrendingUp, sub: 'vs traditional rates', color: '#d97706', bg: '#fef3c7' },
        ].map(({ label, value, icon: Icon, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-purple-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-1">{sub}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mb-0.5 leading-none">
              {loading ? <span className="text-gray-300">—</span> : value}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-2.5">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Quick Actions</h2>

          {[
            { label: 'New Campaign Copy', icon: Plus, to: '/new-campaign', primary: true },
            { label: 'Video Concept', icon: Film, to: '/concept-studio', color: '#2563eb' },
            { label: 'Order Jingle / VO', icon: Music, to: '/audio-studio', color: '#059669' },
            { label: 'Generate Caption', icon: MessageSquare, to: '/new-campaign', color: '#7c3aed' },
            { label: 'WhatsApp Ad Copy', icon: Zap, to: '/new-campaign', color: '#d97706' },
          ].map(({ label, icon: Icon, to, primary, color }) => (
            <Link key={label} to={to}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={primary
                ? { background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#ffffff', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }
                : { background: '#f8f9fa', border: '1px solid #e5e7eb', color: '#374151' }}
              onMouseEnter={e => { if (!primary) e.currentTarget.style.borderColor = '#d1d5db' }}
              onMouseLeave={e => { if (!primary) e.currentTarget.style.borderColor = '#e5e7eb' }}>
              <Icon size={14} style={!primary && color ? { color } : undefined} />
              {label}
              <ArrowRight size={12} className="ml-auto opacity-40" />
            </Link>
          ))}

          {/* Express audio nudge */}
          <div className="mt-2 p-4 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} style={{ color: '#d97706' }} />
              <p className="text-xs font-bold" style={{ color: '#92400e' }}>Need it in 24 hours?</p>
            </div>
            <p className="text-xs text-amber-700 mb-3 leading-relaxed">Order a jingle, voice over, or radio spot with Express — delivered in 24 hours.</p>
            <Link to="/audio-studio"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              <Music size={12} /> Order Audio Express
            </Link>
          </div>
        </div>

        {/* Pipeline + Activity */}
        <div className="lg:col-span-2 space-y-5">

          {/* Production Pipeline */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Production Pipeline</h2>
              <Link to="/projects" className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={18} className="text-purple-500 animate-spin" />
                </div>
              ) : pipeline.length === 0 ? (
                <div className="text-center py-10">
                  <Package size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400 mb-1">No active projects yet</p>
                  <Link to="/audio-studio" className="text-xs text-purple-600 font-medium hover:text-purple-700">Commission your first →</Link>
                </div>
              ) : pipeline.map(p => {
                const color = statusColors[p.status] || '#94a3b8'
                return (
                  <Link key={p.id} to={p.linkTo ?? `/projects/${p.id}/review`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.title}</p>
                      <p className="text-[11px] text-gray-400">{p.type.replace(/-/g, ' ')}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-md font-semibold shrink-0 capitalize"
                      style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>
                      {p.status.replace(/-/g, ' ')}
                    </span>
                    {p.status === 'ready-for-review' && <Eye size={12} className="text-purple-500 shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
                  {unread} new
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={18} className="text-purple-500 animate-spin" />
                </div>
              ) : notifs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-gray-400">Activity will appear here once production begins.</p>
                </div>
              ) : notifs.map(n => {
                const Icon = notifIcon[n.type] ?? Info
                const color = notifColor[n.type] ?? '#7c3aed'
                return (
                  <Link key={n.id} to={n.action_url || '/projects'}
                    onClick={() => { if (!n.read) markRead(n.id) }}
                    className={`flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-purple-50/50' : ''}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#7c3aed' }} />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Asset library teaser ─────────────────────── */}
      <div className="mt-5 bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:border-emerald-200 transition-colors">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#d1fae5', border: '1px solid #a7f3d0' }}>
          <Shield size={18} style={{ color: '#059669' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Asset Library</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats.deliveredAssets > 0
              ? `${stats.deliveredAssets} delivered asset${stats.deliveredAssets !== 1 ? 's' : ''} ready to download — AI-generated, 100% copyright-free.`
              : 'Your delivered assets will appear here after production is complete.'}
          </p>
        </div>
        <Link to="/assets" className="btn-secondary text-xs px-4 py-2 shrink-0">View Library</Link>
      </div>
    </DashboardLayout>
  )
}
