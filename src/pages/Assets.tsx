import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Film, Music, Mic, Radio, Download, Eye, Search,
  Shield, Calendar, Package, Filter, Loader2,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type AssetFilter = 'all' | 'video' | 'audio'

interface Asset {
  id: string
  title: string
  type: string
  package: string
  deliverable_url?: string
  deliverable_thumb?: string
  created_at: string
  source: 'audio' | 'project'
}

const TYPE_META: Record<string, { icon: typeof Film; label: string; category: AssetFilter }> = {
  'video-commercial': { icon: Film,  label: 'Video Commercial', category: 'video' },
  'brand-film':       { icon: Film,  label: 'Brand Film',       category: 'video' },
  documentary:        { icon: Film,  label: 'Documentary',      category: 'video' },
  jingle:             { icon: Music, label: 'Jingle',           category: 'audio' },
  voiceover:          { icon: Mic,   label: 'Voice Over',       category: 'audio' },
  'radio-spot':       { icon: Radio, label: 'Radio Spot',       category: 'audio' },
}

function AssetCard({ asset, onPreview }: { asset: Asset; onPreview: () => void }) {
  const meta = TYPE_META[asset.type]
  const Icon = meta?.icon ?? Film
  const isVideo = meta?.category === 'video'

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden hover:border-purple-500/30 transition-all group">
      <div className="relative h-40 bg-white/5 overflow-hidden">
        {asset.deliverable_thumb ? (
          <img src={asset.deliverable_thumb} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={40} className="text-white/15" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a1460]" />

        <button onClick={onPreview}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.85)', backdropFilter: 'blur(8px)' }}>
            <Eye size={18} className="text-white" />
          </div>
        </button>

        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
            style={{ background: isVideo ? 'rgba(139,92,246,0.7)' : 'rgba(245,158,11,0.7)', backdropFilter: 'blur(4px)' }}>
            {meta?.label ?? asset.type}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }}>
            <Shield size={11} className="text-green-400" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-white font-semibold text-sm mb-0.5 line-clamp-1">{asset.title}</p>
        <p className="text-xs text-gray-500 mb-3">{asset.package}</p>

        <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-4">
          <Calendar size={11} />
          Delivered {new Date(asset.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <div className="flex gap-2">
          <button onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:border-purple-500/40 hover:text-purple-300 transition-all">
            <Eye size={12} /> Preview
          </button>
          {asset.deliverable_url ? (
            <a href={asset.deliverable_url} download
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
              <Download size={12} /> Download
            </a>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/6 text-xs text-gray-600 cursor-not-allowed">
              Pending
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-green-500">
          <Shield size={10} />
          Full rights transferred · AI-generated
        </div>
      </div>
    </div>
  )
}

function PreviewModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const isVideo = ['video-commercial', 'brand-film', 'documentary'].includes(asset.type)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: '#12121e' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <p className="text-sm font-bold text-white">{asset.title}</p>
            <p className="text-xs text-gray-500">{asset.package}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        {isVideo && asset.deliverable_url ? (
          <video src={asset.deliverable_url} poster={asset.deliverable_thumb} controls className="w-full aspect-video bg-black" />
        ) : asset.deliverable_thumb ? (
          <div className="flex items-center justify-center p-8 gap-6">
            <img src={asset.deliverable_thumb} alt="" className="w-32 h-32 rounded-2xl object-cover" />
            <div>
              <p className="text-white font-semibold mb-1">{asset.title}</p>
              <p className="text-sm text-gray-400">{asset.package}</p>
              <p className="text-xs text-gray-600 mt-2">Audio — download to listen</p>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No preview available yet</div>
        )}

        <div className="px-5 py-4 border-t border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Shield size={12} /> Full rights transferred upon delivery
          </div>
          {asset.deliverable_url && (
            <a href={asset.deliverable_url} download
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Download size={13} /> Download
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Assets() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AssetFilter>('all')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Asset | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('audio_orders').select('id, title, audio_type, package, deliverable_url, created_at')
        .eq('user_id', user.id).in('status', ['accepted', 'delivered']),
      supabase.from('projects').select('id, title, type, package, deliverable_url, deliverable_thumb, created_at')
        .eq('user_id', user.id).in('status', ['accepted', 'delivered']),
    ]).then(([{ data: audio }, { data: projects }]) => {
      const mapped: Asset[] = [
        ...(audio ?? []).map(a => ({
          id: a.id, title: a.title, type: a.audio_type,
          package: a.package, deliverable_url: a.deliverable_url ?? undefined,
          created_at: a.created_at, source: 'audio' as const,
        })),
        ...(projects ?? []).map(p => ({
          id: p.id, title: p.title, type: p.type,
          package: p.package, deliverable_url: p.deliverable_url ?? undefined,
          deliverable_thumb: p.deliverable_thumb ?? undefined,
          created_at: p.created_at, source: 'project' as const,
        })),
      ]
      mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setAssets(mapped)
      setLoading(false)
    })
  }, [user])

  const filtered = assets
    .filter(a => filter === 'all' || TYPE_META[a.type]?.category === filter)
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()))

  const videoCount = assets.filter(a => TYPE_META[a.type]?.category === 'video').length
  const audioCount = assets.filter(a => TYPE_META[a.type]?.category === 'audio').length

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <span className="section-tag mb-2 inline-block">Asset Library</span>
            <h1 className="text-2xl font-bold text-white">Your Delivered Assets</h1>
            <p className="text-gray-400 text-sm mt-0.5">All content you own — download anytime, use anywhere.</p>
          </div>
          <button onClick={() => navigate('/concept-studio')} className="btn-primary text-sm px-4 py-2">
            + New Project
          </button>
        </div>

        <div className="mb-6 p-4 rounded-xl border border-green-500/20 bg-green-500/5 flex items-center gap-3">
          <Shield size={16} className="text-green-400 shrink-0" />
          <p className="text-xs text-green-300">
            All assets are <strong>100% AI-generated</strong> with <strong>zero third-party copyright</strong>.
            Full exclusive rights transferred to your account on delivery. Certificate of AI Origin auto-issued for each asset.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input w-full pl-9 py-2 text-sm" placeholder="Search assets..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(['all', 'video', 'audio'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize flex items-center gap-1.5 ${
                  filter === f ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-white/8 text-gray-400 hover:border-white/15'
                }`}>
                {f === 'video' && <Film size={11} />}
                {f === 'audio' && <Music size={11} />}
                {f === 'all' && <Filter size={11} />}
                {f === 'all' ? `All (${assets.length})` : f === 'video' ? `Video (${videoCount})` : `Audio (${audioCount})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-purple-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500 mb-1">
              {assets.length === 0 ? 'No delivered assets yet.' : 'No assets match your search.'}
            </p>
            {assets.length === 0 && (
              <>
                <p className="text-xs text-gray-600 mb-4">Assets appear here once your order is accepted and delivered.</p>
                <button onClick={() => navigate('/audio-studio')} className="btn-primary text-sm px-5 py-2">
                  Order Your First Audio
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(a => (
              <AssetCard key={a.id} asset={a} onPreview={() => setPreview(a)} />
            ))}
          </div>
        )}
      </div>

      {preview && <PreviewModal asset={preview} onClose={() => setPreview(null)} />}
    </DashboardLayout>
  )
}
