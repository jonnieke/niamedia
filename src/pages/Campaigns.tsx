import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Clock, Megaphone, Loader2, Search, Trash2,
  Zap, ExternalLink, Filter,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Campaign {
  id: string
  title: string
  type: string
  content: string | null
  metadata: Record<string, string | string[]>
  created_at: string
}

const INDUSTRY_COLORS: Record<string, string> = {
  'Real Estate':          '#8b5cf6',
  'Hospitality':          '#3b82f6',
  'Education':            '#10b981',
  'Fintech':              '#f59e0b',
  'Restaurant':           '#ef4444',
  'Retail':               '#ec4899',
  'Health':               '#06b6d4',
  'Events':               '#a855f7',
  'Professional Services':'#6366f1',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${Math.max(1, m)}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Campaigns() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('campaigns')
      .select('id, title, type, content, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCampaigns((data ?? []) as Campaign[])
        setLoading(false)
      })
  }, [user])

  const industries = useMemo(() => {
    const set = new Set(campaigns.map(c => c.type).filter(Boolean))
    return Array.from(set).sort()
  }, [campaigns])

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const meta = c.metadata as Record<string, string>
      const matchSearch = !search ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        meta?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.type?.toLowerCase().includes(search.toLowerCase())
      const matchIndustry = filterIndustry === 'all' || c.type === filterIndustry
      return matchSearch && matchIndustry
    })
  }, [campaigns, search, filterIndustry])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await supabase.from('campaigns').delete().eq('id', id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
    setConfirmDelete(null)
  }

  return (
    <DashboardLayout>
      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 p-6"
            style={{ background: '#ffffff' }}>
            <p className="text-sm font-bold text-gray-900 mb-2">Delete this campaign?</p>
            <p className="text-xs text-gray-500 mb-5">This can't be undone. The campaign will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 btn-secondary text-sm py-2">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)}
                disabled={!!deleting}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {deleting === confirmDelete ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
        <Link to="/new-campaign" className="btn-primary text-sm gap-1.5 px-4 py-2">
          <Plus size={15} /> New Campaign
        </Link>
      </div>

      {/* Search + filter */}
      {campaigns.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              className="input pl-9 text-sm w-full"
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {industries.length > 1 && (
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select
                className="input pl-8 pr-8 text-sm appearance-none cursor-pointer"
                value={filterIndustry}
                onChange={e => setFilterIndustry(e.target.value)}>
                <option value="all">All industries</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="text-purple-400 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card-glow flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Megaphone size={28} className="text-purple-400" />
          </div>
          <p className="text-white font-semibold mb-1">No campaigns yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            Generate your first AI-powered campaign — video scripts, captions, WhatsApp copy, and more.
          </p>
          <Link to="/new-campaign" className="btn-primary text-sm px-6 py-2.5 gap-1.5">
            <Zap size={14} /> Create First Campaign
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glow flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-500 text-sm mb-2">No campaigns match your search</p>
          <button onClick={() => { setSearch(''); setFilterIndustry('all') }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const meta = c.metadata as Record<string, string | string[]>
            const platforms = Array.isArray(meta?.platforms) ? (meta.platforms as string[]) : []
            const color = INDUSTRY_COLORS[c.type] ?? '#8b5cf6'
            const objective = meta?.objective as string | undefined
            const tone = meta?.tone as string | undefined

            return (
              <div key={c.id}
                className="rounded-2xl border border-gray-200 overflow-hidden flex flex-col transition-all hover:border-purple-500/25 group"
                style={{ background: 'rgba(255,255,255,0.02)' }}>

                {/* Colour bar */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Title + industry */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{c.title}</p>
                      {meta?.business_name && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{meta.business_name as string}</p>
                      )}
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                      {c.type}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {objective && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] text-gray-500 bg-gray-50 border border-gray-200">
                        {objective}
                      </span>
                    )}
                    {tone && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] text-gray-500 bg-gray-50 border border-gray-200 capitalize">
                        {tone}
                      </span>
                    )}
                  </div>

                  {/* Platforms */}
                  {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {platforms.slice(0, 4).map(p => (
                        <span key={p} className="px-2 py-0.5 text-[10px] rounded-md text-gray-600 border border-gray-200">
                          {p}
                        </span>
                      ))}
                      {platforms.length > 4 && (
                        <span className="px-2 py-0.5 text-[10px] rounded-md text-gray-700">
                          +{platforms.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Clock size={10} />
                      {timeAgo(c.created_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => navigate(`/campaigns/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                        <ExternalLink size={11} /> Open
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}

