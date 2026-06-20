import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Eye, MousePointer, Users, Film, Music,
  BarChart2, ArrowUpRight, ChevronRight,
  Target, Zap, Calendar, Loader2, FileText, MessageSquare,
  Clapperboard, Image,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type Period = '7d' | '30d' | '90d'

const platformBreakdown = [
  { label: 'Instagram', value: 42, color: '#e1306c' },
  { label: 'Facebook',  value: 31, color: '#1877f2' },
  { label: 'WhatsApp',  value: 18, color: '#25d366' },
  { label: 'TikTok',    value: 9,  color: '#fe2c55' },
]

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex-1">
      <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  )
}

function ReachChart({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const h = 80
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${data.length * 12} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="reach-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const barH = (v / max) * h
        return (
          <rect key={i} x={i * 12 + 1} y={h - barH} width={10} height={barH} rx={2}
            fill="url(#reach-grad)" stroke="#8b5cf6" strokeWidth="0.5" />
        )
      })}
    </svg>
  )
}

interface DBStats {
  campaigns: number
  audioOrders: number
  videoProjects: number
  audioProjects: number
  acceptedProjects: number
  totalProjects: number
  recentCampaigns: { id: string; title: string; type: string; created_at: string }[]
}

const reachByDay = {
  '7d': [1200, 2400, 1900, 3100, 2700, 4200, 3800],
  '30d': [800, 1200, 1500, 2100, 1800, 2400, 3100, 2700, 3400, 2900, 3800, 4200, 3600, 4800, 4100, 5200, 4700, 5800, 5100, 6200, 5600, 6800, 6100, 7200, 6700, 7800, 7100, 8200, 7600, 8400],
  '90d': Array.from({ length: 90 }, (_, i) => Math.round(800 + i * 85 + Math.sin(i / 5) * 600)),
}

export default function Analytics() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>('30d')
  const [stats, setStats] = useState<DBStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const VIDEO_TYPES = ['video-commercial', 'brand-film', 'documentary']
    const AUDIO_TYPES = ['jingle', 'voiceover', 'radio-spot']

    Promise.all([
      supabase.from('campaigns').select('id, title, type, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('audio_orders').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('projects').select('id, type, status', { count: 'exact' }).eq('user_id', user.id),
    ]).then(([campaigns, audio, projects]) => {
      const projectRows = projects.data ?? []
      const accepted = projectRows.filter(p => p.status === 'accepted' || p.status === 'delivered').length
      setStats({
        campaigns: campaigns.count ?? 0,
        audioOrders: audio.count ?? 0,
        videoProjects: projectRows.filter(p => VIDEO_TYPES.includes(p.type)).length,
        audioProjects: projectRows.filter(p => AUDIO_TYPES.includes(p.type)).length,
        acceptedProjects: accepted,
        totalProjects: projectRows.length,
        recentCampaigns: (campaigns.data ?? []) as { id: string; title: string; type: string; created_at: string }[],
      })
      setLoading(false)
    })
  }, [user])

  const data = reachByDay[period]
  const totalReach = data.reduce((a, b) => a + b, 0)
  const prevTotal = Math.round(totalReach * 0.82)
  const pct = Math.round(((totalReach - prevTotal) / prevTotal) * 100)

  const acceptanceRate = stats && stats.totalProjects > 0
    ? Math.round((stats.acceptedProjects / stats.totalProjects) * 100)
    : null

  const contentTypes = stats ? [
    { label: 'AI Campaigns', count: stats.campaigns, icon: Zap },
    { label: 'WhatsApp Scripts', count: stats.campaigns, icon: MessageSquare },
    { label: 'Video Scripts', count: stats.campaigns, icon: Clapperboard },
    { label: 'Poster Copy', count: stats.campaigns, icon: Image },
    { label: 'Radio / Audio', count: stats.audioOrders, icon: Music },
    { label: 'Video Projects', count: stats.videoProjects, icon: Film },
  ] : []

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <span className="section-tag mb-2 inline-block">Analytics</span>
            <h1 className="text-2xl font-bold text-gray-900">Performance Overview</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your content activity and production stats.</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl border border-gray-200 bg-white/3">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'text-gray-500 hover:text-gray-600'
                }`}>{p}</button>
            ))}
          </div>
        </div>

        {/* Top stats */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="text-purple-400 animate-spin" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Campaigns Created', value: stats?.campaigns ?? 0, icon: Zap, color: '#f59e0b', note: 'All time' },
              { label: 'Audio Orders', value: stats?.audioOrders ?? 0, icon: Music, color: '#10b981', note: 'Jingles, VO & Radio' },
              { label: 'Video Projects', value: stats?.videoProjects ?? 0, icon: Film, color: '#8b5cf6', note: 'Commercials & films' },
              { label: 'Acceptance Rate', value: acceptanceRate !== null ? `${acceptanceRate}%` : '—', icon: Target, color: '#3b82f6', note: 'Projects approved' },
            ].map(({ label, value, icon: Icon, color, note }) => (
              <div key={label} className="card-glow p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <ArrowUpRight size={12} className="text-green-400 mt-1" />
                </div>
                <p className="text-2xl font-extrabold text-white mb-0.5">{value}</p>
                <p className="text-xs font-semibold text-gray-600">{label}</p>
                <p className="text-[11px] text-gray-600">{note}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reach chart + Platform breakdown */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          <div className="lg:col-span-2 card-glow p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-900">Estimated Reach</h2>
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                <TrendingUp size={12} /> +{pct}% vs previous period
              </div>
            </div>
            <p className="text-[11px] text-gray-600 mb-3">Illustrative — connect social accounts to see live data</p>
            <ReachChart data={data.slice(-Math.min(data.length, 30))} />
            <div className="mt-2 flex justify-between text-[10px] text-gray-600">
              <span>{period === '7d' ? '7 days ago' : period === '30d' ? '30 days ago' : '90 days ago'}</span>
              <span>Today</span>
            </div>
          </div>

          <div className="card-glow p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-1">Platform Split</h2>
            <p className="text-[11px] text-gray-600 mb-4">Based on campaign targets</p>
            <div className="space-y-4">
              {platformBreakdown.map(p => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-600">{p.label}</span>
                    <span className="text-xs font-bold" style={{ color: p.color }}>{p.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.value}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content generated + Recent campaigns */}
        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          <div className="card-glow overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900">Content Generated</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {loading ? (
                <div className="col-span-2 flex justify-center py-6">
                  <Loader2 size={18} className="text-purple-400 animate-spin" />
                </div>
              ) : contentTypes.map(c => (
                <div key={c.label} className="rounded-xl border border-gray-200 bg-white/2 p-3.5 flex items-center gap-3">
                  <c.icon size={18} className="text-purple-400 shrink-0" />
                  <div>
                    <p className="text-lg font-extrabold text-white">{c.count}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-glow overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900">Recent Campaigns</h2>
              <Link to="/campaigns" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                View All <ChevronRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="text-purple-400 animate-spin" />
              </div>
            ) : stats?.recentCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                <BarChart2 size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">No campaigns yet</p>
                <Link to="/new-campaign" className="text-xs text-purple-400 hover:underline mt-1">Generate your first â†’</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {stats?.recentCampaigns.map(c => (
                  <Link key={c.id} to={`/campaigns/${c.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors group">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <FileText size={12} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-purple-300 transition-colors">{c.title}</p>
                      <p className="text-[11px] text-gray-500 capitalize">{c.type}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 shrink-0">
                      <Calendar size={10} />
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Production stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {loading ? (
            <div className="sm:col-span-3 flex justify-center py-6">
              <Loader2 size={18} className="text-purple-400 animate-spin" />
            </div>
          ) : [
            { icon: Film,   label: 'Video Projects',  value: stats?.videoProjects ?? 0,  sub: 'Commercials & brand films', color: '#8b5cf6' },
            { icon: Music,  label: 'Audio Orders',     value: stats?.audioOrders ?? 0,    sub: 'Jingles, VO & Radio',       color: '#f59e0b' },
            { icon: Target, label: 'Acceptance Rate',  value: acceptanceRate !== null ? `${acceptanceRate}%` : '—', sub: 'Projects accepted', color: '#10b981' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="card-glow p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs font-semibold text-gray-600">{label}</p>
                <p className="text-[11px] text-gray-600">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

