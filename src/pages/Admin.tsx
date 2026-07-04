import { useState, useEffect } from 'react'
import {
  Users, BarChart2, Package, TrendingUp, ShieldCheck,
  Film, Music, Upload, Eye, RefreshCw, CheckCircle, Clock,
  AlertCircle, Loader2, Radio, Mic, Phone, Mail, Inbox,
  Zap, Plus, CreditCard, Search, MessageSquare, Image, Star,
  Trash2, ExternalLink,
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

interface CampaignLead {
  id: string
  user_id: string
  name: string
  phone: string
  source: string
  interest_level: string
  status: string
  notes: string
  estimated_value: number
  follow_up_date: string | null
  created_at: string
  profiles?: { name: string; email: string }
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
  'ready-for-review': { title: 'Your audio is ready! 👂',   body: t => `"${t}" is ready for your review. Listen and approve or request changes.`,           type: 'action' },
  'accepted':         { title: 'Audio approved ✓',          body: t => `"${t}" has been accepted and is in your Asset Library.`,                            type: 'success' },
  'delivered':        { title: 'Audio delivered! 🎉',        body: t => `"${t}" has been delivered. Download it from your Assets Library.`,                  type: 'success' },
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
            {order.profiles?.name ?? '—'} · {order.package}
            {order.rush && <span className="ml-2 text-amber-400 font-semibold">⚡ Rush</span>}
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
          <p className="text-xs text-gray-500 capitalize">{lead.service.replace('-', ' ')} · {lead.industry}</p>
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
              WhatsApp →
            </a>
            <a href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:border-white/20 transition-all">
              Email →
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
          <p className="text-xs text-gray-500">{project.profiles?.name ?? '—'} · {project.package}</p>
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

function CampaignLeadRow({ lead }: { lead: CampaignLead }) {
  const LEAD_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    New: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    Contacted: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    Interested: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    Converted: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    Lost: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  }
  const { color, bg } = LEAD_STATUS_COLORS[lead.status] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
  const SOURCE_ICONS: Record<string, typeof Users> = {
    WhatsApp: MessageSquare, Instagram: Users, Facebook: Users, Call: Phone,
  }
  const Icon = SOURCE_ICONS[lead.source] ?? Users

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-gray-500">
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
          <p className="text-xs text-gray-500">
            {lead.profiles?.name || lead.user_id || '—'} · {lead.source} · {lead.interest_level}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lead.estimated_value > 0 && (
            <span className="text-xs font-semibold text-emerald-600">KES {lead.estimated_value.toLocaleString()}</span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
            style={{ color, background: bg }}>
            {lead.status}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [tab, setTab] = useState(0)
  const [audioOrders, setAudioOrders] = useState<AudioOrder[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([])
  const [leadsSourceFilter, setLeadsSourceFilter] = useState<string | 'all'>('all')
  const [leadsStatusFilter, setLeadsStatusFilter] = useState<string | 'all'>('all')
  const [creditTxns, setCreditTxns] = useState<CreditTxn[]>([])
  const [videoRequests, setVideoRequests] = useState<VideoRequestRow[]>([])
  const [adminCampaigns, setAdminCampaigns] = useState<{ id: string; type: string; created_at: string }[]>([])
  const [videoSearch, setVideoSearch] = useState('')
  const [videoStatusFilter, setVideoStatusFilter] = useState<VideoRequestStatus | 'all'>('all')
  const [quoteRequests, setQuoteRequests] = useState<{
    id: string; created_at: string; business_name: string; contact_name: string | null;
    phone: string; email: string | null; industry: string | null; video_length: string;
    platforms: string[]; what_to_promote: string | null; delivery_speed: string;
    price_min: number; price_max: number; status: string; admin_notes: string | null;
  }[]>([])
  const [portfolioItems, setPortfolioItems] = useState<{
    id: string; title: string; type: string; client_name: string | null;
    industry: string | null; description: string | null; thumbnail_url: string | null;
    video_url: string | null; tags: string[]; featured: boolean;
    sort_order: number; published: boolean; created_at: string;
  }[]>([])
  const [portfolioModal, setPortfolioModal] = useState<{ open: boolean; item: typeof portfolioItems[number] | null }>({ open: false, item: null })
  const [portfolioForm, setPortfolioForm] = useState({ title: '', type: 'video', client_name: '', industry: '', description: '', thumbnail_url: '', video_url: '', tags: '', featured: false, published: true })
  const [portfolioSaving, setPortfolioSaving] = useState(false)

  // Testimonials
  const [testimonials, setTestimonials] = useState<{
    id: string; business_name: string; contact_name: string | null
    industry: string | null; rating: number; body: string
    video_length: string | null; approved: boolean; featured: boolean; created_at: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [grantingCredit, setGrantingCredit] = useState<string | null>(null)
  const [grantAmounts, setGrantAmounts] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([
      supabase.from('audio_orders').select('*, profiles(name, email)').order('created_at', { ascending: false }),
      supabase.from('projects').select('*, profiles(name, email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('package_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*, profiles(name, email)').order('created_at', { ascending: false }),
      supabase.from('credit_transactions').select('*, profiles(name, email)').eq('payment_status', 'paid').order('created_at', { ascending: false }).limit(100),
      supabase.from('campaigns').select('id, type, created_at').order('created_at', { ascending: false }).limit(1000),
    ]).then(([{ data: ao }, { data: pr }, { data: us }, { data: lr }, { data: cl }, { data: ct }, { data: cmp }]) => {
      setAudioOrders((ao ?? []) as AudioOrder[])
      setProjects((pr ?? []) as Project[])
      setUsers((us ?? []) as Profile[])
      setLeads((lr ?? []) as Lead[])
      setCampaignLeads((cl ?? []) as CampaignLead[])
      setCreditTxns((ct ?? []) as CreditTxn[])
      setAdminCampaigns((cmp ?? []) as { id: string; type: string; created_at: string }[])
      setLoading(false)
    })
    supabase.from('video_requests').select('*, profiles!user_id(name, email)').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVideoRequests(data as VideoRequestRow[]) })
    supabase.from('quote_requests').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setQuoteRequests(data as typeof quoteRequests) })
    supabase.from('portfolio_items').select('*').order('sort_order').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPortfolioItems(data as typeof portfolioItems) })
    supabase.from('testimonials').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTestimonials(data as typeof testimonials) })
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

  const newQuotes = quoteRequests.filter(q => q.status === 'new').length
  const tabs = ['Overview', 'Leads', 'Audio Orders', 'Projects', 'Credits', 'Users', 'Video Requests', 'Quote Requests', 'Analytics', 'Portfolio', 'Testimonials']

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
          <Mic size={13} /> Voice Clone Studio →
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
            {newQuotes > 0 && (
              <button onClick={() => setTab(7)} className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all">
                Quote Requests →
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
            {t === 'Quote Requests' && newQuotes > 0 && (
              <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-amber-500 text-white">{newQuotes}</span>
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
            <div className="space-y-6">
              {/* Campaign Leads */}
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-4">Campaign Leads — User Pipeline</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {(['New', 'Contacted', 'Interested', 'Converted', 'Lost'] as const).map(s => {
                    const count = campaignLeads.filter(l => l.status === s).length
                    const colors: Record<string, { color: string; bg: string }> = {
                      New: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                      Contacted: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                      Interested: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
                      Converted: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                      Lost: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                    }
                    const { color, bg } = colors[s]
                    return (
                      <div key={s} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{count}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <div className="flex gap-1">
                    <button onClick={() => setLeadsSourceFilter('all')} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${leadsSourceFilter === 'all' ? 'border-purple-500/50 bg-purple-500/10 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>All sources</button>
                    {['WhatsApp', 'Instagram', 'Facebook', 'Call'].map(s => (
                      <button key={s} onClick={() => setLeadsSourceFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${leadsSourceFilter === s ? 'border-purple-500/50 bg-purple-500/10 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{s}</button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setLeadsStatusFilter('all')} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${leadsStatusFilter === 'all' ? 'border-purple-500/50 bg-purple-500/10 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>All statuses</button>
                    {['New', 'Contacted', 'Interested'].map(s => (
                      <button key={s} onClick={() => setLeadsStatusFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${leadsStatusFilter === s ? 'border-purple-500/50 bg-purple-500/10 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  {campaignLeads.filter(l => (leadsSourceFilter === 'all' || l.source === leadsSourceFilter) && (leadsStatusFilter === 'all' || l.status === leadsStatusFilter)).length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <Users size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No campaign leads yet</p>
                    </div>
                  ) : (
                    campaignLeads.filter(l => (leadsSourceFilter === 'all' || l.source === leadsSourceFilter) && (leadsStatusFilter === 'all' || l.status === leadsStatusFilter)).map(l => (
                      <CampaignLeadRow key={l.id} lead={l} />
                    ))
                  )}
                </div>
              </div>

              {/* Package Requests (Service Leads) */}
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-4">Service Requests — Creative Production Leads</h2>
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
                    <p className="text-sm text-amber-300">{newLeads} new service request(s) waiting to be contacted.</p>
                  </div>
                )}

                <div className="card-glow">
                  {leads.length === 0 ? (
                    <div className="py-16 text-center text-gray-600">
                      <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No service requests yet</p>
                    </div>
                  ) : leads.map(l => (
                    <LeadRow key={l.id} lead={l} onStatusChange={handleLeadStatusChange} />
                  ))}
                </div>
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

              {/* Search + status filter */}
              {videoRequests.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                      className="input pl-9 text-sm w-full"
                      placeholder="Search by business, title, or client..."
                      value={videoSearch}
                      onChange={e => setVideoSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['all', 'new', 'contacted', 'in-production', 'delivered', 'closed'] as const).map(s => (
                      <button key={s} onClick={() => setVideoStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                          videoStatusFilter === s
                            ? 'border-purple-500/50 bg-purple-500/20 text-purple-300'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        {s === 'all' ? 'All' : s.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-glow">
                {(() => {
                  const q = videoSearch.trim().toLowerCase()
                  const filtered = videoRequests.filter(r => {
                    const matchStatus = videoStatusFilter === 'all' || r.status === videoStatusFilter
                    const matchSearch = !q ||
                      r.business_name?.toLowerCase().includes(q) ||
                      r.title?.toLowerCase().includes(q) ||
                      r.profiles?.name?.toLowerCase().includes(q) ||
                      r.profiles?.email?.toLowerCase().includes(q)
                    return matchStatus && matchSearch
                  })
                  if (videoRequests.length === 0) return (
                    <div className="py-16 text-center text-gray-600">
                      <Film size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No video requests yet</p>
                    </div>
                  )
                  if (filtered.length === 0) return (
                    <div className="py-16 text-center text-gray-600">
                      <Search size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No requests match your filters</p>
                      <button onClick={() => { setVideoSearch(''); setVideoStatusFilter('all') }}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1">Clear filters</button>
                    </div>
                  )
                  return filtered.map(r => (
                    <VideoRequestExpandedRow
                      key={r.id}
                      request={r}
                      onStatusChange={(id, status) => setVideoRequests(prev => prev.map(x => x.id === id ? { ...x, status } : x))}
                    />
                  ))
                })()}
              </div>
            </div>
          )}

          {/* Quote Requests */}
          {tab === 7 && (
            <div>
              {newQuotes > 0 && (
                <div className="mb-5 p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/8 flex items-center gap-3">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-300">{newQuotes} new quote request{newQuotes !== 1 ? 's' : ''} waiting for follow-up.</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-5">
                {(['new', 'contacted', 'converted'] as const).map(s => {
                  const count = quoteRequests.filter(q => q.status === s).length
                  const colors: Record<string, string> = { new: '#f59e0b', contacted: '#3b82f6', converted: '#10b981' }
                  return (
                    <div key={s} className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-2xl font-extrabold" style={{ color: colors[s] }}>{count}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{s}</p>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                {quoteRequests.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <Film size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No quote requests yet</p>
                  </div>
                ) : quoteRequests.map(q => (
                  <div key={q.id} className="border-b border-gray-100 last:border-0 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">{q.business_name}</p>
                          {q.contact_name && <span className="text-xs text-gray-500">· {q.contact_name}</span>}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: q.status === 'new' ? 'rgba(245,158,11,0.12)' : q.status === 'contacted' ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                              color: q.status === 'new' ? '#d97706' : q.status === 'contacted' ? '#2563eb' : '#059669',
                            }}>
                            {q.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                          <span>{q.video_length} video</span>
                          <span>{q.platforms.join(', ')}</span>
                          <span className="font-semibold text-gray-700">KES {q.price_min.toLocaleString()} – {q.price_max.toLocaleString()}</span>
                          <span>{q.delivery_speed === 'standard' ? '3–5 days' : q.delivery_speed === '48h' ? '48-hr rush' : '24-hr rush'}</span>
                        </div>
                        {q.what_to_promote && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{q.what_to_promote}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        <div className="flex gap-1.5">
                          <a href={`/proposals?from_quote_id=${q.id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#7c3aed' }}>
                            <Plus size={10} /> Proposal
                          </a>
                          <a href={`https://wa.me/${q.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(`Hi ${q.contact_name || q.business_name}, this is Nia Media. We received your quote request for a ${q.video_length} video commercial. Let me confirm the details and pricing for you.`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all"
                            style={{ background: '#25d366' }}>
                            <MessageSquare size={10} /> WhatsApp
                          </a>
                          <select
                            value={q.status}
                            onChange={async e => {
                              const newStatus = e.target.value
                              await supabase.from('quote_requests').update({ status: newStatus }).eq('id', q.id)
                              setQuoteRequests(prev => prev.map(x => x.id === q.id ? { ...x, status: newStatus } : x))
                            }}
                            className="text-[11px] font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-purple-400">
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="quoted">Quoted</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {q.email && (
                      <p className="text-xs text-gray-400 mt-1">
                        <Mail size={9} className="inline mr-1" />{q.email}
                        {q.phone && <span className="ml-3"><Phone size={9} className="inline mr-1" />{q.phone}</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics */}
          {tab === 8 && (() => {
            const now = new Date()
            const weekMs = 7 * 24 * 60 * 60 * 1000
            const weeks = Array.from({ length: 8 }, (_, i) => {
              const end = new Date(now.getTime() - i * weekMs)
              const start = new Date(end.getTime() - weekMs)
              const label = `W${8 - i}`
              return { label, start, end }
            }).reverse()

            const bucket = (rows: { created_at: string }[]) =>
              weeks.map(w => rows.filter(r => {
                const d = new Date(r.created_at)
                return d >= w.start && d < w.end
              }).length)

            const signupBuckets = bucket(users)
            const campaignBuckets = bucket(adminCampaigns)
            const creditBuckets = bucket(creditTxns)

            const maxSignup = Math.max(...signupBuckets, 1)
            const maxCampaign = Math.max(...campaignBuckets, 1)
            const maxCredit = Math.max(...creditBuckets, 1)

            const totalCredits = creditTxns.reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0)
            const estRevenue = creditTxns.reduce((sum, t) => {
              const pkg: Record<number, number> = { 1: 500, 5: 2000, 12: 4000 }
              return sum + (pkg[t.amount] ?? t.amount * 500)
            }, 0)

            const industryCounts = adminCampaigns.reduce<Record<string, number>>((acc, c) => {
              const k = c.type || 'Other'
              acc[k] = (acc[k] ?? 0) + 1
              return acc
            }, {})
            const topIndustries = Object.entries(industryCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
            const maxInd = topIndustries[0]?.[1] ?? 1

            function MiniChart({ buckets, max, color }: { buckets: number[]; max: number; color: string }) {
              return (
                <div className="flex items-end gap-1.5 h-16 mt-3">
                  {buckets.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm transition-all"
                        style={{ height: `${Math.max(4, (v / max) * 56)}px`, background: color, opacity: v === 0 ? 0.18 : 0.85 }} />
                      <span className="text-[9px] text-gray-400">{weeks[i].label}</span>
                    </div>
                  ))}
                </div>
              )
            }

            return (
              <div className="space-y-6">
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: users.length, sub: `+${signupBuckets[7]} this week`, color: '#8b5cf6' },
                    { label: 'Campaigns Generated', value: adminCampaigns.length, sub: `+${campaignBuckets[7]} this week`, color: '#3b82f6' },
                    { label: 'Credits Sold', value: totalCredits, sub: `${creditTxns.length} transactions`, color: '#10b981' },
                    { label: 'Est. Credit Revenue', value: `KES ${(estRevenue / 1000).toFixed(1)}K`, sub: 'Credits only', color: '#f59e0b' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} className="card-glow p-5">
                      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                      <p className="text-xs mt-1" style={{ color }}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Weekly charts */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="card-glow p-5">
                    <p className="text-xs font-semibold text-gray-500">New Signups / Week</p>
                    <MiniChart buckets={signupBuckets} max={maxSignup} color="#8b5cf6" />
                  </div>
                  <div className="card-glow p-5">
                    <p className="text-xs font-semibold text-gray-500">Campaigns / Week</p>
                    <MiniChart buckets={campaignBuckets} max={maxCampaign} color="#3b82f6" />
                  </div>
                  <div className="card-glow p-5">
                    <p className="text-xs font-semibold text-gray-500">Credits Sold / Week</p>
                    <MiniChart buckets={creditBuckets} max={maxCredit} color="#10b981" />
                  </div>
                </div>

                {/* Top industries */}
                {topIndustries.length > 0 && (
                  <div className="card-glow p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-4">Top Industries by Campaign Volume</p>
                    <div className="space-y-3">
                      {topIndustries.map(([ind, count]) => (
                        <div key={ind} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-36 shrink-0 truncate">{ind}</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${(count / maxInd) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activation rate */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="card-glow p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Campaign Activation Rate</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                      {users.length > 0 ? Math.round((adminCampaigns.length / users.length) * 10) / 10 : 0}
                      <span className="text-sm font-normal text-gray-500 ml-1">campaigns/user</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{adminCampaigns.length} total campaigns · {users.length} users</p>
                  </div>
                  <div className="card-glow p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Paying User Rate</p>
                    <p className="text-2xl font-extrabold text-gray-900">
                      {users.length > 0 ? Math.round((creditTxns.length / users.length) * 100) : 0}
                      <span className="text-sm font-normal text-gray-500 ml-1">%</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{creditTxns.length} purchases · {users.length} users</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Portfolio */}
          {tab === 9 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm text-gray-500 mt-0.5">{portfolioItems.length} items · {portfolioItems.filter(i => i.published).length} published</p>
                </div>
                <button
                  onClick={() => {
                    setPortfolioForm({ title: '', type: 'video', client_name: '', industry: '', description: '', thumbnail_url: '', video_url: '', tags: '', featured: false, published: true })
                    setPortfolioModal({ open: true, item: null })
                  }}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {portfolioItems.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Film size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No portfolio items yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add your first video commercial or promo poster.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioItems.map(item => {
                    const TypeIcon = item.type === 'poster' ? Image : item.type === 'campaign' ? Zap : Film
                    return (
                      <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="aspect-video bg-gray-100 relative flex items-center justify-center"
                          style={{ background: '#0f172a' }}>
                          {item.thumbnail_url
                            ? <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                            : <TypeIcon size={28} className="text-purple-400 opacity-30" />
                          }
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            {item.featured && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#7c3aed' }}>
                                Featured
                              </span>
                            )}
                            {!item.published && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#9ca3af' }}>
                                Hidden
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                              {item.client_name && <p className="text-xs text-gray-400 mt-0.5">{item.client_name}{item.industry ? ` · ${item.industry}` : ''}</p>}
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize shrink-0"
                              style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
                              {item.type}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                setPortfolioForm({
                                  title: item.title, type: item.type,
                                  client_name: item.client_name ?? '', industry: item.industry ?? '',
                                  description: item.description ?? '', thumbnail_url: item.thumbnail_url ?? '',
                                  video_url: item.video_url ?? '', tags: item.tags.join(', '),
                                  featured: item.featured, published: item.published,
                                })
                                setPortfolioModal({ open: true, item })
                              }}
                              className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-all">
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                await supabase.from('portfolio_items').update({ published: !item.published }).eq('id', item.id)
                                setPortfolioItems(prev => prev.map(x => x.id === item.id ? { ...x, published: !x.published } : x))
                              }}
                              className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                              {item.published ? 'Hide' : 'Publish'}
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Delete this portfolio item?')) return
                                await supabase.from('portfolio_items').delete().eq('id', item.id)
                                setPortfolioItems(prev => prev.filter(x => x.id !== item.id))
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {item.video_url && (
                            <a href={item.video_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 mt-2 text-[11px] text-purple-500 hover:underline">
                              <ExternalLink size={10} /> Preview video
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Create / Edit Modal */}
              {portfolioModal.open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-gray-900">{portfolioModal.item ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h2>
                      <button onClick={() => setPortfolioModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                    </div>
                    <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Title *</label>
                        <input value={portfolioForm.title} onChange={e => setPortfolioForm(f => ({ ...f, title: e.target.value }))}
                          className="input-field w-full" placeholder="Onfon Mobile — 30s Product Ad" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['video', 'poster', 'campaign'].map(t => (
                          <button key={t} onClick={() => setPortfolioForm(f => ({ ...f, type: t }))}
                            className="py-2 rounded-lg text-xs font-semibold border capitalize transition-all"
                            style={portfolioForm.type === t
                              ? { background: 'rgba(124,58,237,0.1)', borderColor: '#7c3aed', color: '#7c3aed' }
                              : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}>
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Client Name</label>
                          <input value={portfolioForm.client_name} onChange={e => setPortfolioForm(f => ({ ...f, client_name: e.target.value }))}
                            className="input-field w-full" placeholder="Onfon Mobile" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Industry</label>
                          <input value={portfolioForm.industry} onChange={e => setPortfolioForm(f => ({ ...f, industry: e.target.value }))}
                            className="input-field w-full" placeholder="Fintech" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                        <textarea value={portfolioForm.description} onChange={e => setPortfolioForm(f => ({ ...f, description: e.target.value }))}
                          className="input-field w-full resize-none" rows={2} placeholder="Brief description of the project..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Thumbnail URL</label>
                        <input value={portfolioForm.thumbnail_url} onChange={e => setPortfolioForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                          className="input-field w-full" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Video URL (optional)</label>
                        <input value={portfolioForm.video_url} onChange={e => setPortfolioForm(f => ({ ...f, video_url: e.target.value }))}
                          className="input-field w-full" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Tags (comma-separated)</label>
                        <input value={portfolioForm.tags} onChange={e => setPortfolioForm(f => ({ ...f, tags: e.target.value }))}
                          className="input-field w-full" placeholder="TikTok, 30s, Product Launch" />
                      </div>
                      <div className="flex gap-5 pt-1">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={portfolioForm.featured} onChange={e => setPortfolioForm(f => ({ ...f, featured: e.target.checked }))}
                            className="rounded accent-purple-600" />
                          <Star size={13} className="text-amber-400" /> Featured
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={portfolioForm.published} onChange={e => setPortfolioForm(f => ({ ...f, published: e.target.checked }))}
                            className="rounded accent-purple-600" />
                          Published
                        </label>
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                      <button onClick={() => setPortfolioModal({ open: false, item: null })} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                      <button
                        disabled={portfolioSaving || !portfolioForm.title.trim()}
                        onClick={async () => {
                          setPortfolioSaving(true)
                          const payload = {
                            title: portfolioForm.title.trim(),
                            type: portfolioForm.type,
                            client_name: portfolioForm.client_name.trim() || null,
                            industry: portfolioForm.industry.trim() || null,
                            description: portfolioForm.description.trim() || null,
                            thumbnail_url: portfolioForm.thumbnail_url.trim() || null,
                            video_url: portfolioForm.video_url.trim() || null,
                            tags: portfolioForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                            featured: portfolioForm.featured,
                            published: portfolioForm.published,
                          }
                          if (portfolioModal.item) {
                            await supabase.from('portfolio_items').update(payload).eq('id', portfolioModal.item.id)
                            setPortfolioItems(prev => prev.map(x => x.id === portfolioModal.item!.id ? { ...x, ...payload } : x))
                          } else {
                            const { data } = await supabase.from('portfolio_items').insert(payload).select().single()
                            if (data) setPortfolioItems(prev => [data as typeof portfolioItems[number], ...prev])
                          }
                          setPortfolioSaving(false)
                          setPortfolioModal({ open: false, item: null })
                        }}
                        className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                        {portfolioSaving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : (portfolioModal.item ? 'Update' : 'Add to Portfolio')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Testimonials */}
          {tab === 10 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                  {testimonials.filter(t => !t.approved).length} pending · {testimonials.filter(t => t.approved).length} approved
                </p>
              </div>
              {testimonials.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Star size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No testimonials yet</p>
                  <p className="text-xs text-gray-400 mt-1">Client reviews appear here after they complete a project.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testimonials.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <Star key={n} size={13}
                                  fill={n <= t.rating ? '#f59e0b' : 'none'}
                                  stroke={n <= t.rating ? '#f59e0b' : '#d1d5db'} />
                              ))}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                              {t.approved ? 'Approved' : 'Pending'}
                            </span>
                            {t.featured && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700">Featured</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 italic mb-2">"{t.body}"</p>
                          <div className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">{t.contact_name ?? t.business_name}</span>
                            {t.business_name !== t.contact_name && <span> · {t.business_name}</span>}
                            {t.industry && <span> · {t.industry}</span>}
                            {t.video_length && <span> · {t.video_length}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(t.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              await supabase.from('testimonials').update({ approved: !t.approved }).eq('id', t.id)
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, approved: !x.approved } : x))
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                            style={t.approved
                              ? { borderColor: '#e5e7eb', color: '#6b7280' }
                              : { borderColor: '#6ee7b7', color: '#059669', background: '#f0fdf4' }}>
                            {t.approved ? 'Unapprove' : 'Approve'}
                          </button>
                          <button
                            onClick={async () => {
                              await supabase.from('testimonials').update({ featured: !t.featured }).eq('id', t.id)
                              setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, featured: !x.featured } : x))
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 transition-all">
                            {t.featured ? 'Unfeature' : 'Feature'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this testimonial?')) return
                              await supabase.from('testimonials').delete().eq('id', t.id)
                              setTestimonials(prev => prev.filter(x => x.id !== t.id))
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

