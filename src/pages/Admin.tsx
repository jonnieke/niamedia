import { useState, useEffect } from 'react'
import {
  Users, BarChart2, Package, TrendingUp, ShieldCheck,
  Film, Music, Upload, Eye, RefreshCw, CheckCircle, Clock,
  AlertCircle, Loader2, Radio, Mic, Phone, Mail, Inbox,
  Zap, Plus, CreditCard,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'

type AudioStatus = 'queued' | 'in-production' | 'ready-for-review' | 'accepted' | 'delivered'
type ProjectStatus = 'queued' | 'in-production' | 'ready-for-review' | 'revision-requested' | 'accepted' | 'delivered'

interface AudioOrder {
  id: string
  user_id: string
  title: string
  audio_type: string
  package: string
  status: AudioStatus
  rush: boolean
  brief: Record<string, unknown>
  price_kes: number | null
  created_at: string
  profiles?: { name: string; email: string }
}

interface Project {
  id: string
  user_id: string
  title: string
  type: string
  package: string
  status: ProjectStatus
  creator_name: string
  max_iterations: number
  created_at: string
  profiles?: { name: string; email: string }
}

interface Lead {
  id: string
  user_id: string | null
  name: string
  business: string
  phone: string
  email: string
  industry: string
  service: string
  brief: Record<string, unknown>
  timeline: string
  budget: string
  status: string
  created_at: string
}

interface Profile {
  id: string
  name: string
  email: string
  role: string
  credits: number
  created_at: string
}

interface CreditTxn {
  id: string
  user_id: string
  amount: number
  description: string
  payment_status: string
  created_at: string
  profiles?: { name: string; email: string }
}

type VideoRequestStatus = 'new' | 'contacted' | 'in-production' | 'delivered' | 'closed'

interface VideoRequestRow {
  id: string
  user_id: string
  business_name: string
  title: string
  industry: string
  budget_range: string
  delivery_speed: string
  status: VideoRequestStatus
  created_at: string
  script: string
  notes: string
  length?: string
  format?: string
  platform?: string
  language?: string
  music_style?: string
  voiceover?: boolean
  profiles?: { name: string; email: string }
}

async function notifyUser(userId: string, title: string, body: string, type: string, actionUrl?: string) {
  await supabase.from('notifications').insert({ user_id: userId, title, body, type, action_url: actionUrl ?? null })
}

const AUDIO_NOTIFS: Partial<Record<AudioStatus, { title: string; body: (t: string) => string; type: string }>> = {
  'in-production':    { title: 'Production started!',       body: t => `We've started working on "${t}". Expect delivery within the agreed timeline.`,      type: 'info' },
  'ready-for-review': { title: 'Your audio is ready! ðŸ‘‚',   body: t => `"${t}" is ready for your review. Listen and approve or request changes.`,           type: 'action' },
  'accepted':         { title: 'Audio approved âœ“',          body: t => `"${t}" has been accepted and is in your Asset Library.`,                            type: 'success' },
  'delivered':        { title: 'Audio delivered! ðŸŽ‰',        body: t => `"${t}" has been delivered. Download it from your Assets Library.`,                  type: 'success' },
}

const PROJECT_NOTIFS: Partial<Record<ProjectStatus, { title: string; body: (t: string) => string; type: string }>> = {
  'in-production':    { title: 'Production started',         body: t => `”${t}” is now in active production.`,                                                    type: 'info' },
  'ready-for-review': { title: 'Your project is ready',      body: t => `”${t}” is ready for your review. Open it to approve or request changes.`,               type: 'action' },
  'accepted':         { title: 'Project approved',           body: t => `”${t}” has been accepted and added to your Asset Library.`,                             type: 'success' },
  'delivered':        { title: 'Project delivered',          body: t => `”${t}” has been delivered. Check your Assets Library.`,                                 type: 'success' },
}

const VIDEO_REQUEST_NOTIFS: Partial<Record<VideoRequestStatus, { title: string; body: (t: string) => string; type: string }>> = {
  'contacted':      { title: 'Video brief reviewed',          body: t => `We have reviewed “${t}” and will confirm scope and pricing shortly.`,                  type: 'info' },
  'in-production':  { title: 'Video production started',      body: t => `”${t}” is now in active production. We will notify you when it is ready.`,             type: 'info' },
  'delivered':      { title: 'Your video is ready',           body: t => `”${t}” has been delivered. Check your email for the download link.`,                   type: 'success' },
}

const VIDEO_STATUS_COLORS: Record<VideoRequestStatus, { color: string; bg: string }> = {
  new:              { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  contacted:        { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'in-production':  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  delivered:        { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  closed:           { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  queued:               { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  'in-production':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'ready-for-review':   { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  'revision-requested': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  accepted:             { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  delivered:            { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

const AUDIO_TYPE_ICON: Record<string, typeof Music> = {
  jingle: Music, voiceover: Mic, 'radio-spot': Radio,
}

function StatusBadge({ status }: { status: string }) {
  const { color, bg } = STATUS_COLOR[status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  const icons: Record<string, typeof Clock> = {
    queued: Clock, 'in-production': Loader2, 'ready-for-review': Eye,
    'revision-requested': RefreshCw, accepted: CheckCircle, delivered: CheckCircle,
  }
  const Icon = icons[status] ?? Clock
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold"
      style={{ color, background: bg }}>
      <Icon size={10} className={status === 'in-production' ? 'animate-spin' : ''} />
      {status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}

function AudioOrderRow({ order, onStatusChange }: {
  order: AudioOrder
  onStatusChange: (id: string, status: AudioStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const Icon = AUDIO_TYPE_ICON[order.audio_type] ?? Music
  const brief = order.brief as Record<string, string>

  const updateStatus = async (status: AudioStatus) => {
    setUpdating(true)
    await supabase.from('audio_orders').update({ status }).eq('id', order.id)
    const notif = AUDIO_NOTIFS[status]
    if (notif) await notifyUser(order.user_id, notif.title, notif.body(order.title), notif.type, '/audio-studio')
    onStatusChange(order.id, status)
    setUpdating(false)
  }

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)' }}>
          <Icon size={14} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{order.title}</p>
          <p className="text-xs text-gray-500">
            {order.profiles?.name ?? '—'} Â· {order.package}
            {order.rush && <span className="ml-2 text-amber-400 font-semibold">âš¡ Rush</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {order.price_kes && (
            <span className="text-xs font-semibold text-green-400">KES {order.price_kes.toLocaleString()}</span>
          )}
          <StatusBadge status={order.status} />
          <span className="text-xs text-gray-600">
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {/* Brief */}
          <div className="rounded-xl border border-gray-200 bg-white/2 p-4 grid sm:grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Business', value: brief.business },
              { label: 'Voice', value: brief.voice },
              { label: 'Mood', value: brief.mood },
              { label: 'Platforms', value: Array.isArray(brief.platforms) ? (brief.platforms as string[]).join(', ') : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-500 mb-0.5">{label}</p>
                <p className="text-white font-medium">{value || '—'}</p>
              </div>
            ))}
            {brief.message && (
              <div className="sm:col-span-2">
                <p className="text-gray-500 mb-0.5">Key Message</p>
                <p className="text-gray-600 leading-relaxed">{brief.message as string}</p>
              </div>
            )}
          </div>

          {/* Status controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500">Update status:</p>
            {(['queued', 'in-production', 'ready-for-review', 'accepted', 'delivered'] as AudioStatus[]).map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={updating || order.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
                  order.status === s
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                    : 'border-gray-200 text-gray-500 hover:border-purple-500/30 hover:text-purple-300'
                }`}>
                {s.replace(/-/g, ' ')}
              </button>
            ))}
            {updating && <Loader2 size={14} className="text-purple-400 animate-spin" />}
          </div>

          {/* Upload deliverable */}
          {(order.status === 'in-production' || order.status === 'ready-for-review') && (
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-purple-500/40 text-xs text-purple-400 hover:border-purple-500/70 transition-colors cursor-pointer">
              <Upload size={13} /> Upload Deliverable
              <input type="file" accept="audio/*,video/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const path = `orders/${order.id}/${file.name}`
                  const { error } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true })
                  if (!error) {
                    const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
                    await supabase.from('audio_orders').update({ deliverable_url: data.publicUrl, status: 'ready-for-review' }).eq('id', order.id)
                    const notif = AUDIO_NOTIFS['ready-for-review']!
                    await notifyUser(order.user_id, notif.title, notif.body(order.title), notif.type, '/audio-studio')
                    onStatusChange(order.id, 'ready-for-review')
                  }
                }} />
            </label>
          )}
        </div>
      )}
    </div>
  )
}

const LEAD_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  new:         { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  contacted:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'in-progress': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  closed:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
}

function LeadRow({ lead, onStatusChange }: {
  lead: Lead
  onStatusChange: (id: string, status: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const { color, bg } = LEAD_STATUS_COLORS[lead.status] ?? LEAD_STATUS_COLORS.new
  const SERVICE_ICONS: Record<string, typeof Package> = {
    campaign: BarChart2, video: Film, audio: Music, multi: Package,
  }
  const Icon = SERVICE_ICONS[lead.service] ?? Package

  const updateStatus = async (status: string) => {
    setUpdating(true)
    await supabase.from('package_requests').update({ status }).eq('id', lead.id)
    onStatusChange(lead.id, status)
    setUpdating(false)
  }

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
          <Icon size={14} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{lead.name} — {lead.business}</p>
          <p className="text-xs text-gray-500 capitalize">{lead.service.replace('-', ' ')} Â· {lead.industry}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold capitalize"
            style={{ color, background: bg }}>
            {lead.status}
          </span>
          <span className="text-xs text-gray-600">
            {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white/2 p-4 grid sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={11} className="text-gray-500 shrink-0" />
              <a href={`tel:${lead.phone}`} className="hover:text-white transition-colors">{lead.phone}</a>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={11} className="text-gray-500 shrink-0" />
              <a href={`mailto:${lead.email}`} className="hover:text-white transition-colors">{lead.email}</a>
            </div>
            {lead.timeline && (
              <div><p className="text-gray-500 mb-0.5">Timeline</p><p className="text-white font-medium">{lead.timeline}</p></div>
            )}
            {lead.budget && (
              <div><p className="text-gray-500 mb-0.5">Budget</p><p className="text-white font-medium">{lead.budget}</p></div>
            )}
            {!!lead.brief?.extra && (
              <div className="sm:col-span-2">
                <p className="text-gray-500 mb-0.5">Brief</p>
                <p className="text-gray-600 leading-relaxed">{String(lead.brief.extra)}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500">Status:</p>
            {(['new', 'contacted', 'in-progress', 'closed'] as const).map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={updating || lead.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 capitalize ${
                  lead.status === s
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-gray-200 text-gray-500 hover:border-amber-500/30 hover:text-amber-300'
                }`}>{s}</button>
            ))}
            {updating && <Loader2 size={14} className="text-amber-400 animate-spin" />}
          </div>

          <div className="flex gap-2">
            <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all">
              WhatsApp â†'
            </a>
            <a href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:border-white/20 transition-all">
              Email â†'
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectRow({ project, onStatusChange }: {
  project: Project
  onStatusChange: (id: string, status: ProjectStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const isAudio = ['jingle', 'voiceover', 'radio-spot'].includes(project.type)

  const updateStatus = async (status: ProjectStatus) => {
    setUpdating(true)
    await supabase.from('projects').update({ status }).eq('id', project.id)
    const notif = PROJECT_NOTIFS[status]
    if (notif) await notifyUser(project.user_id, notif.title, notif.body(project.title), notif.type, '/projects')
    onStatusChange(project.id, status)
    setUpdating(false)
  }

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)' }}>
          {isAudio ? <Music size={14} className="text-purple-400" /> : <Film size={14} className="text-purple-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{project.title}</p>
          <p className="text-xs text-gray-500">{project.profiles?.name ?? '—'} Â· {project.package}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={project.status} />
          <span className="text-xs text-gray-600">
            {new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500">Update status:</p>
            {(['queued', 'in-production', 'ready-for-review', 'accepted', 'delivered'] as ProjectStatus[]).map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={updating || project.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
                  project.status === s
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                    : 'border-gray-200 text-gray-500 hover:border-purple-500/30 hover:text-purple-300'
                }`}>
                {s.replace(/-/g, ' ')}
              </button>
            ))}
            {updating && <Loader2 size={14} className="text-purple-400 animate-spin" />}
          </div>
        </div>
      )}
    </div>
  )
}

function VideoRequestExpandedRow({ request, onStatusChange }: {
  request: VideoRequestRow
  onStatusChange: (id: string, status: VideoRequestStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (status: VideoRequestStatus) => {
    setUpdating(true)
    await supabase.from('video_requests').update({ status }).eq('id', request.id)
    const notif = VIDEO_REQUEST_NOTIFS[status]
    if (notif) await notifyUser(request.user_id, notif.title, notif.body(request.title), notif.type, '/request-video')
    if (status === "in-production" || status === "delivered" || status === "contacted") {
      supabase.functions.invoke("notify-video-status", {
        body: {
          user_email: request.profiles?.email,
          user_name: request.profiles?.name,
          title: request.title,
          business_name: request.business_name,
          status,
        },
      }).catch(() => {})
    }
    onStatusChange(request.id, status)
    setUpdating(false)
  }

  const { color, bg } = VIDEO_STATUS_COLORS[request.status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(124,58,237,0.12)' }}>
          <Film size={14} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{request.business_name}</p>
          <p className="text-xs text-gray-500 truncate">{request.title} · {request.industry || '—'}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {request.budget_range && <span className="text-xs text-gray-500 hidden sm:inline">{request.budget_range}</span>}
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold"
            style={{ color, background: bg }}>
            {request.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
          <span className="text-xs text-gray-600">
            {new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Client + specs */}
          <div className="rounded-xl border border-gray-200 bg-white/2 p-4 grid sm:grid-cols-3 gap-3 text-xs">
            {request.profiles?.email && (
              <div className="sm:col-span-3 flex items-center gap-2 pb-2 border-b border-white/5">
                <Mail size={11} className="text-gray-500 shrink-0" />
                <a href={`mailto:${request.profiles.email}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                  {request.profiles.name} — {request.profiles.email}
                </a>
              </div>
            )}
            {[
              { label: 'Length', value: request.length },
              { label: 'Format', value: request.format },
              { label: 'Platform', value: request.platform },
              { label: 'Language', value: request.language },
              { label: 'Music', value: request.music_style },
              { label: 'Delivery', value: request.delivery_speed?.replace(/-/g, ' ') },
              { label: 'Voice-Over', value: request.voiceover === true ? 'Yes' : request.voiceover === false ? 'No' : '—' },
              { label: 'Budget', value: request.budget_range },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-500 mb-0.5">{label}</p>
                <p className="text-gray-800 font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>

          {request.script && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Script</p>
              <div className="rounded-xl border border-gray-200 p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {request.script}
              </div>
            </div>
          )}

          {request.notes && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notes</p>
              <p className="text-xs text-gray-600 leading-relaxed">{request.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500">Update status:</p>
            {(['new', 'contacted', 'in-production', 'delivered', 'closed'] as VideoRequestStatus[]).map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={updating || request.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
                  request.status === s
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                    : 'border-gray-200 text-gray-500 hover:border-purple-500/30 hover:text-purple-300'
                }`}>
                {s.replace(/-/g, ' ')}
              </button>
            ))}
            {updating && <Loader2 size={14} className="text-purple-400 animate-spin" />}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const [tab, setTab] = useState(0)
  const [audioOrders, setAudioOrders] = useState<AudioOrder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [creditTxns, setCreditTxns] = useState<CreditTxn[]>([])
  const [videoRequests, setVideoRequests] = useState<VideoRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [grantingCredit, setGrantingCredit] = useState<string | null>(null)
  const [grantAmounts, setGrantAmounts] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([
      supabase.from('audio_orders').select('*, profiles(name, email)').order('created_at', { ascending: false }),
      supabase.from('projects').select('*, profiles(name, email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('package_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('credit_transactions').select('*, profiles(name, email)').eq('payment_status', 'paid').order('created_at', { ascending: false }).limit(100),
    ]).then(([{ data: ao }, { data: pr }, { data: us }, { data: lr }, { data: ct }]) => {
      setAudioOrders((ao ?? []) as AudioOrder[])
      setProjects((pr ?? []) as Project[])
      setUsers((us ?? []) as Profile[])
      setLeads((lr ?? []) as Lead[])
      setCreditTxns((ct ?? []) as CreditTxn[])
      setLoading(false)
    })
    supabase.from('video_requests').select('*, profiles!user_id(name, email)').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVideoRequests(data as VideoRequestRow[]) })
  }, [])

  const updateVideoRequestStatus = async (id: string, status: VideoRequestStatus) => {
    await supabase.from('video_requests').update({ status }).eq('id', id)
    setVideoRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const grantCredit = async (userId: string, amount = 1) => {
    setGrantingCredit(userId)
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: 'Admin grant',
      p_order_id: `admin_${Date.now()}`,
    })
    await notifyUser(userId, 'Credit granted!', `An admin has added ${amount} campaign credit${amount !== 1 ? 's' : ''} to your account.`, 'success', '/new-campaign')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: (u.credits ?? 0) + amount } : u))
    setGrantingCredit(null)
  }

  const handleAudioStatusChange = (id: string, status: AudioStatus) =>
    setAudioOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))

  const handleProjectStatusChange = (id: string, status: ProjectStatus) =>
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))

  const handleLeadStatusChange = (id: string, status: string) =>
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))

  const pendingAudio = audioOrders.filter(o => o.status === 'queued').length
  const pendingProjects = projects.filter(p => p.status === 'queued' || p.status === 'revision-requested').length
  const newLeads = leads.filter(l => l.status === 'new').length
  const newVideoRequests = videoRequests.filter(r => r.status === 'new').length
  const actionNeeded = pendingAudio + pendingProjects + newVideoRequests

  const audioRevenue = audioOrders.reduce((sum, o) => sum + (o.price_kes ?? 0), 0)
  const creditRevenue = creditTxns.filter(t => t.amount > 0).reduce((sum, t) => {
    const pkg: Record<number, number> = { 1: 500, 5: 2000, 12: 4000 }
    return sum + (pkg[t.amount] ?? t.amount * 500)
  }, 0)
  const totalRevenue = audioRevenue + creditRevenue

  const tabs = ['Overview', 'Leads', 'Audio Orders', 'Projects', 'Credits', 'Users', 'Video Requests']

  const stats = [
    { label: 'New Leads', value: newLeads, icon: Inbox, sub: `${leads.length} total`, color: 'text-amber-400' },
    { label: 'Total Users', value: users.length, icon: Users, sub: `${users.filter(u => u.role === 'admin').length} admin`, color: 'text-purple-400' },
    { label: 'Audio Orders', value: audioOrders.length, icon: Package, sub: `${pendingAudio} pending`, color: 'text-blue-400' },
    { label: 'Est. Revenue', value: `KES ${(totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, sub: `Audio + credits`, color: 'text-emerald-400' },
  ]

  return (
    <DashboardLayout>
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin Only</span>
        </div>
        <p className="text-sm text-gray-500">Manage users, audio orders, and production projects.</p>
        <a href="/admin/voices"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all">
          <Mic size={13} /> Voice Clone Studio â†'
        </a>
      </div>

      {/* Action-needed banner */}
      {!loading && actionNeeded > 0 && (
        <div className="mb-5 p-4 rounded-xl border border-amber-500/25 bg-amber-500/8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 font-semibold">
              {actionNeeded} item{actionNeeded !== 1 ? 's' : ''} need your attention
              <span className="font-normal text-amber-400/70 ml-1.5">
                — {pendingAudio > 0 ? `${pendingAudio} audio order${pendingAudio !== 1 ? 's' : ''} queued` : ''}
                {pendingAudio > 0 && pendingProjects > 0 ? ', ' : ''}
                {pendingProjects > 0 ? `${pendingProjects} project${pendingProjects !== 1 ? 's' : ''} pending` : ''}
                {(pendingAudio > 0 || pendingProjects > 0) && newVideoRequests > 0 ? ', ' : ''}
                {newVideoRequests > 0 ? `${newVideoRequests} video request${newVideoRequests !== 1 ? 's' : ''} new` : ''}
              </span>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {pendingAudio > 0 && (
              <button onClick={() => setTab(2)} className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all">
                Audio Orders →
              </button>
            )}
            {pendingProjects > 0 && (
              <button onClick={() => setTab(3)} className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all">
                Projects →
              </button>
            )}
            {newVideoRequests > 0 && (
              <button onClick={() => setTab(6)} className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all">
                Video Requests →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-7 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap ${
              tab === i ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-500 hover:text-gray-600'
            }`}>
            {t}
            {t === 'Leads' && newLeads > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-amber-500 text-white">{newLeads}</span>
            )}
            {t === 'Audio Orders' && pendingAudio > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-purple-500 text-white">{pendingAudio}</span>
            )}
            {t === 'Credits' && creditTxns.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">{creditTxns.length}</span>
            )}
            {t === 'Video Requests' && newVideoRequests > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-purple-500 text-white">{newVideoRequests}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-purple-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview */}
          {tab === 0 && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map(({ label, value, icon: Icon, sub, color }) => (
                  <div key={label} className="card-glow p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <Icon size={16} className={color} />
                      </div>
                      <span className="text-xs text-gray-600">{sub}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-white">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <div className="card-glow overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Latest Audio Orders</h3>
                    <button onClick={() => setTab(2)} className="text-xs text-purple-400 hover:text-purple-300">View all</button>
                  </div>
                  <div className="divide-y divide-white/4">
                    {audioOrders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between px-5 py-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{o.title}</p>
                          <p className="text-[11px] text-gray-500">{o.profiles?.name ?? '—'}</p>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                    ))}
                    {audioOrders.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-600">No orders yet</div>
                    )}
                  </div>
                </div>

                <div className="card-glow overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Recent Users</h3>
                    <button onClick={() => setTab(4)} className="text-xs text-purple-400 hover:text-purple-300">View all</button>
                  </div>
                  <div className="divide-y divide-white/4">
                    {users.slice(0, 5).map(u => (
                      <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shrink-0"
                          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-100 text-gray-500'}`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Leads */}
          {tab === 1 && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {(['new', 'contacted', 'in-progress', 'closed'] as const).map(s => {
                  const count = leads.filter(l => l.status === s).length
                  const { color, bg } = LEAD_STATUS_COLORS[s]
                  return (
                    <div key={s} className="rounded-xl border border-gray-200 bg-white/2 p-3 text-center">
                      <p className="text-xl font-bold" style={{ color }}>{count}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{s}</p>
                    </div>
                  )
                })}
              </div>

              {newLeads > 0 && (
                <div className="mb-4 p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/8 flex items-center gap-3">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300">{newLeads} new lead(s) waiting to be contacted.</p>
                </div>
              )}

              <div className="card-glow">
                {leads.length === 0 ? (
                  <div className="py-16 text-center text-gray-600">
                    <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No package requests yet</p>
                  </div>
                ) : leads.map(l => (
                  <LeadRow key={l.id} lead={l} onStatusChange={handleLeadStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Audio Orders */}
          {tab === 2 && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {(['queued', 'in-production', 'ready-for-review', 'accepted', 'delivered'] as AudioStatus[]).map(s => {
                  const count = audioOrders.filter(o => o.status === s).length
                  const { color, bg } = STATUS_COLOR[s]
                  return (
                    <div key={s} className="rounded-xl border border-gray-200 bg-white/2 p-3 text-center">
                      <p className="text-xl font-bold" style={{ color }}>{count}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.replace(/-/g, ' ')}</p>
                    </div>
                  )
                })}
              </div>

              {pendingAudio > 0 && (
                <div className="mb-4 p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/8 flex items-center gap-3">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300">{pendingAudio} order(s) waiting for production to begin.</p>
                </div>
              )}

              <div className="card-glow">
                {audioOrders.length === 0 ? (
                  <div className="py-16 text-center text-gray-600">
                    <Package size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No audio orders yet</p>
                  </div>
                ) : audioOrders.map(o => (
                  <AudioOrderRow key={o.id} order={o} onStatusChange={handleAudioStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {tab === 3 && (
            <div>
              <div className="card-glow">
                {projects.length === 0 ? (
                  <div className="py-16 text-center text-gray-600">
                    <Film size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No projects yet</p>
                  </div>
                ) : projects.map(p => (
                  <ProjectRow key={p.id} project={p} onStatusChange={handleProjectStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Credits */}
          {tab === 4 && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="card-glow p-5">
                  <p className="text-2xl font-extrabold text-white">{creditTxns.filter(t => t.amount > 0).length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Credit purchases</p>
                </div>
                <div className="card-glow p-5">
                  <p className="text-2xl font-extrabold text-emerald-400">
                    KES {(creditRevenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Credit revenue</p>
                </div>
                <div className="card-glow p-5">
                  <p className="text-2xl font-extrabold text-purple-400">
                    {creditTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Credits sold</p>
                </div>
              </div>

              <div className="card-glow divide-y divide-gray-100">
                {creditTxns.length === 0 ? (
                  <div className="py-16 text-center text-gray-600">
                    <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No credit purchases yet</p>
                  </div>
                ) : creditTxns.map(t => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: t.amount > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)' }}>
                      <Zap size={14} className={t.amount > 0 ? 'text-emerald-400' : 'text-purple-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t.profiles?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{t.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-purple-400'}`}>
                        {t.amount > 0 ? `+${t.amount}` : t.amount} credit{Math.abs(t.amount) !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Requests */}
          {tab === 6 && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                {(['new', 'contacted', 'in-production', 'delivered', 'closed'] as VideoRequestStatus[]).map(s => {
                  const count = videoRequests.filter(r => r.status === s).length
                  const { color } = VIDEO_STATUS_COLORS[s]
                  return (
                    <div key={s} className="rounded-xl border border-gray-200 bg-white/2 p-3 text-center">
                      <p className="text-xl font-bold" style={{ color }}>{count}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.replace(/-/g, ' ')}</p>
                    </div>
                  )
                })}
              </div>

              {newVideoRequests > 0 && (
                <div className="mb-4 p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/8 flex items-center gap-3">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300">{newVideoRequests} new video request{newVideoRequests !== 1 ? 's' : ''} waiting to be contacted.</p>
                </div>
              )}

              <div className="card-glow">
                {videoRequests.length === 0 ? (
                  <div className="py-16 text-center text-gray-600">
                    <Film size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No video requests yet</p>
                  </div>
                ) : videoRequests.map(r => (
                  <VideoRequestExpandedRow
                    key={r.id}
                    request={r}
                    onStatusChange={(id, status) => setVideoRequests(prev => prev.map(x => x.id === id ? { ...x, status } : x))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {tab === 5 && (
            <div className="card-glow divide-y divide-gray-100">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 flex-wrap sm:flex-nowrap">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  {/* Credits balance */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/20 bg-purple-500/8 shrink-0">
                    <Zap size={11} className="text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">{u.credits ?? 0}</span>
                  </div>
                  {/* Grant credits */}
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number" min="1" max="50"
                      value={grantAmounts[u.id] ?? 1}
                      onChange={e => setGrantAmounts(prev => ({ ...prev, [u.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-10 text-center text-xs rounded-md border border-gray-200 py-1 text-gray-700 bg-white"
                    />
                    <button
                      onClick={() => grantCredit(u.id, grantAmounts[u.id] ?? 1)}
                      disabled={grantingCredit === u.id}
                      title="Grant credits"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-emerald-500/30 hover:text-emerald-400 text-xs transition-all disabled:opacity-40">
                      {grantingCredit === u.id ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                      Grant
                    </button>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold shrink-0 ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-100 text-gray-500'}`}>
                    {u.role}
                  </span>
                  <span className="text-xs text-gray-600 shrink-0">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
              {users.length === 0 && (
                <div className="py-16 text-center text-gray-600 text-sm">No users yet</div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

