import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Copy, Check, CheckCircle2, Clock, XCircle,
  Loader2, MessageSquare, ExternalLink, Trash2, FileText, Zap,
  Bell, TrendingUp, AlertTriangle,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Proposal {
  id: string
  token: string
  created_at: string
  quote_request_id: string | null
  business_name: string
  contact_name: string | null
  phone: string
  email: string | null
  industry: string | null
  video_length: string
  platforms: string[]
  what_to_promote: string | null
  delivery_speed: string
  include_poster: boolean
  include_subtitles: boolean
  final_price: number
  deposit_percent: number
  deposit_amount: number
  deliverables: string[]
  timeline_days: number
  valid_until: string | null
  status: string
  admin_notes: string | null
  paid_at: string | null
  reminder_sent_at: string | null
  reminder_count: number
}

interface QuoteSnap {
  id: string
  business_name: string
  contact_name: string | null
  phone: string
  email: string | null
  industry: string | null
  video_length: string
  platforms: string[]
  what_to_promote: string | null
  delivery_speed: string
  include_poster: boolean
  include_subtitles: boolean
  price_min: number
  price_max: number
}

const STATUSES = ['all', 'sent', 'accepted', 'paid', 'declined', 'expired'] as const
type StatusFilter = typeof STATUSES[number]

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  sent:     { label: 'Sent',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: Clock },
  accepted: { label: 'Accepted', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: CheckCircle2 },
  paid:     { label: 'Paid',     color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  declined: { label: 'Declined', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: XCircle },
  expired:  { label: 'Expired',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: XCircle },
}

const LENGTHS = ['15s', '30s', '60s', '90s', '3 min+']
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'WhatsApp', 'TV']
const SPEEDS = [
  { id: 'standard', label: '3–5 days (Standard)' },
  { id: '48h',      label: '48-hour Rush (+25%)' },
  { id: '24h',      label: '24-hour Rush (+50%)' },
]

function defaultDeliverables(spec: Partial<Proposal> | Partial<QuoteSnap>, finalPrice: number): string[] {
  const d: string[] = [
    `Full ${spec.video_length ?? ''} video commercial (final cut, MP4)`,
    'Professional script & voiceover',
    'Licensed background music',
    '1 round of free revisions',
    'Files optimized for all selected platforms',
  ]
  if ((spec as Proposal).include_poster ?? (spec as QuoteSnap).include_poster) d.push('1 promo poster (social + print sizes)')
  if ((spec as Proposal).include_subtitles ?? (spec as QuoteSnap).include_subtitles) d.push('Subtitle / caption file (.SRT)')
  if (finalPrice >= 15000) d.push('2 rounds of free revisions (upgraded)')
  return d
}

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`
}

function validUntilDefault() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

interface ModalState {
  open: boolean
  quote: QuoteSnap | null
  editing: Proposal | null
}

function CreateModal({
  quote, editing, onClose, onCreated,
}: {
  quote: QuoteSnap | null
  editing: Proposal | null
  onClose: () => void
  onCreated: (p: Proposal) => void
}) {
  const { user } = useAuth()
  const src = editing ?? quote

  const [businessName, setBusinessName] = useState(src?.business_name ?? '')
  const [contactName, setContactName] = useState(src?.contact_name ?? '')
  const [phone, setPhone] = useState(src?.phone ?? '')
  const [email, setEmail] = useState(src?.email ?? '')
  const [videoLength, setVideoLength] = useState(src?.video_length ?? '30s')
  const [platforms, setPlatforms] = useState<string[]>(src?.platforms ?? [])
  const [whatToPromote, setWhatToPromote] = useState(src?.what_to_promote ?? '')
  const [deliverySpeed, setDeliverySpeed] = useState(src?.delivery_speed ?? 'standard')
  const [includePoster, setIncludePoster] = useState(src ? (src as Proposal).include_poster ?? (src as QuoteSnap).include_poster ?? true : true)
  const [includeSubtitles, setIncludeSubtitles] = useState(src ? (src as Proposal).include_subtitles ?? (src as QuoteSnap).include_subtitles ?? false : false)
  const [finalPrice, setFinalPrice] = useState(
    editing?.final_price ?? (quote ? Math.round((quote.price_min + quote.price_max) / 2) : 8000)
  )
  const [depositPercent, setDepositPercent] = useState(editing?.deposit_percent ?? 50)
  const [timelineDays, setTimelineDays] = useState(editing?.timeline_days ?? 7)
  const [validUntil, setValidUntil] = useState(editing?.valid_until ?? validUntilDefault())
  const [adminNotes, setAdminNotes] = useState(editing?.admin_notes ?? '')
  const [deliverables, setDeliverables] = useState<string[]>(
    editing?.deliverables.length ? editing.deliverables
      : defaultDeliverables({ video_length: videoLength, include_poster: includePoster, include_subtitles: includeSubtitles } as Partial<Proposal>, finalPrice)
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const depositAmount = Math.round(finalPrice * depositPercent / 100)

  const togglePlatform = (p: string) =>
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const refreshDeliverables = () =>
    setDeliverables(defaultDeliverables({ video_length: videoLength, include_poster: includePoster, include_subtitles: includeSubtitles } as Partial<Proposal>, finalPrice))

  const handleSubmit = async () => {
    if (!businessName.trim() || !phone.trim()) { setErr('Business name and phone are required.'); return }
    setSaving(true)
    setErr('')
    const payload = {
      quote_request_id: editing?.quote_request_id ?? quote?.id ?? null,
      business_name: businessName.trim(),
      contact_name: contactName.trim() || null,
      phone: phone.trim(),
      email: email.trim() || null,
      video_length: videoLength,
      platforms,
      what_to_promote: whatToPromote.trim() || null,
      delivery_speed: deliverySpeed,
      include_poster: includePoster,
      include_subtitles: includeSubtitles,
      final_price: finalPrice,
      deposit_percent: depositPercent,
      deposit_amount: depositAmount,
      deliverables,
      timeline_days: timelineDays,
      valid_until: validUntil || null,
      status: 'sent',
      admin_notes: adminNotes.trim() || null,
      created_by: user?.id ?? null,
    }

    if (editing) {
      const { error } = await supabase.from('proposals').update(payload).eq('id', editing.id)
      if (error) { setErr(error.message); setSaving(false); return }
      onCreated({ ...editing, ...payload } as Proposal)
    } else {
      const { data, error } = await supabase.from('proposals').insert(payload).select().single()
      if (error || !data) { setErr(error?.message ?? 'Failed to create proposal'); setSaving(false); return }
      const created = data as Proposal
      onCreated(created)
      // Email client if they have an email address
      if (created.email) {
        supabase.functions.invoke('send-client-email', {
          body: {
            type: 'proposal_sent',
            to: created.email,
            name: created.contact_name,
            businessName: created.business_name,
            proposalToken: created.token,
            finalPrice: created.final_price,
            depositAmount: created.deposit_amount,
            videoLength: created.video_length,
          },
        })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{editing ? 'Edit Proposal' : 'Create Proposal'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Client */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Business Name *</label>
              <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                className="input-field w-full" placeholder="Acme Ltd" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)}
                className="input-field w-full" placeholder="Jane Wanjiru" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="input-field w-full" placeholder="0712 345 678" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                className="input-field w-full" placeholder="jane@acme.co.ke" />
            </div>
          </div>

          {/* Video Spec */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Video Length</label>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map(l => (
                <button key={l} onClick={() => setVideoLength(l)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={videoLength === l
                    ? { background: 'rgba(124,58,237,0.1)', borderColor: '#7c3aed', color: '#7c3aed' }
                    : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={platforms.includes(p)
                    ? { background: 'rgba(124,58,237,0.1)', borderColor: '#7c3aed', color: '#7c3aed' }
                    : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Delivery Speed</label>
            <select value={deliverySpeed} onChange={e => setDeliverySpeed(e.target.value)}
              className="input-field w-full">
              {SPEEDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={includePoster} onChange={e => setIncludePoster(e.target.checked)}
                className="rounded accent-purple-600" />
              Include Promo Poster
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={includeSubtitles} onChange={e => setIncludeSubtitles(e.target.checked)}
                className="rounded accent-purple-600" />
              Include Subtitles
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">What to Promote</label>
            <textarea value={whatToPromote} onChange={e => setWhatToPromote(e.target.value)}
              className="input-field w-full resize-none" rows={2}
              placeholder="Brief description of the product or service..." />
          </div>

          {/* Pricing */}
          <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Final Price (KES)</label>
              <input type="number" value={finalPrice} onChange={e => setFinalPrice(Number(e.target.value))}
                className="input-field w-full" min={0} step={500} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Deposit %</label>
              <input type="number" value={depositPercent} onChange={e => setDepositPercent(Number(e.target.value))}
                className="input-field w-full" min={10} max={100} step={5} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Deposit Amount</label>
              <div className="input-field bg-gray-100 text-gray-600 font-semibold">{fmt(depositAmount)}</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Timeline (business days)</label>
              <input type="number" value={timelineDays} onChange={e => setTimelineDays(Number(e.target.value))}
                className="input-field w-full" min={1} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                className="input-field w-full" />
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500">Deliverables</label>
              <button onClick={refreshDeliverables} className="text-[11px] text-purple-600 hover:underline">
                Reset to defaults
              </button>
            </div>
            <div className="space-y-1.5">
              {deliverables.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input value={d} onChange={e => setDeliverables(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                    className="input-field flex-1 text-sm" />
                  <button onClick={() => setDeliverables(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => setDeliverables(prev => [...prev, ''])}
                className="text-xs text-purple-600 hover:underline mt-1">+ Add item</button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Notes (internal)</label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
              className="input-field w-full resize-none" rows={2}
              placeholder="Notes visible only to your team..." />
          </div>

          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5 py-2 text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (editing ? 'Update Proposal' : 'Create & Send Link')}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: Clock }
  const Icon = meta.icon
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
      style={{ color: meta.color, background: meta.bg }}>
      <Icon size={10} />
      {meta.label}
    </span>
  )
}

export default function Proposals() {
  const [searchParams] = useSearchParams()
  const fromQuoteId = searchParams.get('from_quote_id')

  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [modal, setModal] = useState<ModalState>({ open: false, quote: null, editing: null })
  const [copied, setCopied] = useState<string | null>(null)
  const [prefillQuote, setPrefillQuote] = useState<QuoteSnap | null>(null)
  const [reminding, setReminding] = useState<string | null>(null)
  const [expiring, setExpiring] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('proposals').select('*').order('created_at', { ascending: false })
    if (data) setProposals(data as Proposal[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Pre-fill modal from quote_request if URL param present
  useEffect(() => {
    if (!fromQuoteId) return
    supabase.from('quote_requests').select('*').eq('id', fromQuoteId).single()
      .then(({ data }) => {
        if (data) {
          setPrefillQuote(data as QuoteSnap)
          setModal({ open: true, quote: data as QuoteSnap, editing: null })
        }
      })
  }, [fromQuoteId])

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/proposal/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)

  const isExpired = (p: Proposal) =>
    p.valid_until ? new Date(p.valid_until) < new Date() : false

  const sendReminder = async (p: Proposal) => {
    if (!p.email) {
      // Fallback: open WhatsApp
      const wa = `https://wa.me/${p.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(`Hi ${p.contact_name || p.business_name}, just checking in on your Nia Media proposal — it's still available: ${window.location.origin}/proposal/${p.token}`)}`
      window.open(wa, '_blank')
      return
    }
    setReminding(p.id)
    await supabase.functions.invoke('send-client-email', {
      body: {
        type: 'proposal_reminder',
        to: p.email,
        name: p.contact_name,
        businessName: p.business_name,
        proposalToken: p.token,
        validUntil: p.valid_until,
      },
    })
    const now = new Date().toISOString()
    await supabase.from('proposals').update({
      reminder_sent_at: now,
      reminder_count: (p.reminder_count ?? 0) + 1,
    }).eq('id', p.id)
    setProposals(prev => prev.map(x => x.id === p.id
      ? { ...x, reminder_sent_at: now, reminder_count: (x.reminder_count ?? 0) + 1 }
      : x))
    setReminding(null)
  }

  const expireOverdue = async () => {
    const overdue = proposals.filter(p => p.status === 'sent' && isExpired(p))
    if (overdue.length === 0) return
    if (!window.confirm(`Mark ${overdue.length} overdue proposal${overdue.length > 1 ? 's' : ''} as expired?`)) return
    setExpiring(true)
    await Promise.all(overdue.map(p =>
      supabase.from('proposals').update({ status: 'expired' }).eq('id', p.id)
    ))
    setProposals(prev => prev.map(p =>
      overdue.some(o => o.id === p.id) ? { ...p, status: 'expired' } : p
    ))
    setExpiring(false)
  }

  const markPaid = async (id: string) => {
    await supabase.from('proposals').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', paid_at: new Date().toISOString() } : p))
  }

  const generateBrief = async (p: Proposal) => {
    const { data: existing } = await supabase
      .from('video_briefs').select('token').eq('proposal_id', p.id).maybeSingle()
    if (existing?.token) { window.open(`/brief/${existing.token}`, '_blank'); return }

    const { data: brief, error } = await supabase.from('video_briefs').insert({
      proposal_id: p.id,
      business_name: p.business_name,
      video_length: p.video_length,
      platforms: p.platforms,
      what_to_promote: p.what_to_promote,
      delivery_speed: p.delivery_speed,
      status: 'generating',
    }).select().single()

    if (error || !brief) return
    window.open(`/brief/${brief.token}`, '_blank')
    supabase.functions.invoke('generate-video-brief', { body: { briefId: brief.id } })
  }

  const deleteProposal = async (id: string) => {
    if (!window.confirm('Delete this proposal?')) return
    await supabase.from('proposals').delete().eq('id', id)
    setProposals(prev => prev.filter(p => p.id !== id))
  }

  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === filter)

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? proposals.length : proposals.filter(p => p.status === s).length
    return acc
  }, {} as Record<string, number>)

  // Pipeline funnel metrics
  const totalSent = proposals.filter(p => ['sent','accepted','paid','declined','expired'].includes(p.status)).length
  const totalAccepted = proposals.filter(p => ['accepted','paid'].includes(p.status)).length
  const totalPaid = proposals.filter(p => p.status === 'paid').length
  const totalRevenue = proposals.filter(p => p.status === 'paid').reduce((s, p) => s + (p.final_price ?? 0), 0)
  const overdueCount = proposals.filter(p => p.status === 'sent' && isExpired(p)).length
  const toRate = (n: number, d: number) => d === 0 ? '—' : `${Math.round((n / d) * 100)}%`

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send video production proposals and collect deposits.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {overdueCount > 0 && (
            <button onClick={expireOverdue} disabled={expiring}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50">
              {expiring ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
              Expire {overdueCount} overdue
            </button>
          )}
          <button
            onClick={() => setModal({ open: true, quote: prefillQuote, editing: null })}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={15} /> New Proposal
          </button>
        </div>
      </div>

      {/* Pipeline funnel */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Sent', value: totalSent, sub: 'total proposals', icon: FileText, color: '#3b82f6' },
            { label: 'Accepted', value: totalAccepted, sub: `${toRate(totalAccepted, totalSent)} conversion`, icon: CheckCircle2, color: '#f59e0b' },
            { label: 'Paid', value: totalPaid, sub: `${toRate(totalPaid, totalAccepted)} close rate`, icon: TrendingUp, color: '#10b981' },
            { label: 'Revenue', value: `KES ${(totalRevenue / 1000).toFixed(0)}K`, sub: 'from paid proposals', icon: TrendingUp, color: '#7c3aed' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}15` }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-gray-900 leading-none">{stat.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{stat.label} · {stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 overflow-x-auto">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 -mb-px capitalize whitespace-nowrap transition-all ${
              filter === s ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {s} {counts[s] > 0 && <span className="ml-1 text-gray-400">({counts[s]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-purple-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No proposals yet</p>
          <button onClick={() => setModal({ open: true, quote: null, editing: null })}
            className="mt-3 text-sm text-purple-600 hover:underline">Create your first proposal →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-gray-900">{p.business_name}</h3>
                    {p.contact_name && <span className="text-xs text-gray-400">· {p.contact_name}</span>}
                    <StatusBadge status={p.status} />
                    {p.status === 'sent' && (() => {
                      const age = daysSince(p.created_at)
                      const expired = isExpired(p)
                      const color = expired ? '#ef4444' : age >= 5 ? '#d97706' : age >= 3 ? '#f59e0b' : '#6b7280'
                      return (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: `${color}18`, color }}>
                          {expired ? 'EXPIRED' : `${age}d ago`}
                        </span>
                      )
                    })()}
                    {p.reminder_count > 0 && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Bell size={9} /> {p.reminder_count} reminder{p.reminder_count > 1 ? 's' : ''} sent
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                    <span>{p.video_length} video</span>
                    {p.platforms.length > 0 && <span>{p.platforms.join(', ')}</span>}
                    <span className="font-semibold text-gray-700">
                      {fmt(p.final_price)} — deposit {fmt(p.deposit_amount)} ({p.deposit_percent}%)
                    </span>
                    <span>{p.timeline_days} days</span>
                  </div>
                  {p.valid_until && (
                    <p className={`text-[11px] ${p.status === 'sent' && isExpired(p) ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                      {p.status === 'sent' && isExpired(p) ? '⚠ Expired · ' : 'Valid until '}
                      {new Date(p.valid_until).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {p.paid_at && (
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      Paid {new Date(p.paid_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => copyLink(p.token)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-all">
                    {copied === p.token ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy Link</>}
                  </button>

                  <a href={`/proposal/${p.token}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                    <ExternalLink size={11} /> Preview
                  </a>

                  <a href={`https://wa.me/${p.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(`Hi ${p.contact_name || p.business_name}, your Nia Media proposal is ready. View and confirm here: ${window.location.origin}/proposal/${p.token}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: '#25d366' }}>
                    <MessageSquare size={11} /> Send via WhatsApp
                  </a>

                  {p.status === 'sent' && (
                    <button
                      onClick={() => sendReminder(p)}
                      disabled={reminding === p.id}
                      title={p.email ? 'Send follow-up email' : 'Open WhatsApp follow-up'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all disabled:opacity-50">
                      {reminding === p.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Bell size={11} />}
                      {p.email ? 'Send Reminder' : 'WhatsApp Reminder'}
                    </button>
                  )}

                  {p.status !== 'paid' && (
                    <button onClick={() => markPaid(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-all">
                      <CheckCircle2 size={11} /> Mark Paid
                    </button>
                  )}

                  {(p.status === 'accepted' || p.status === 'paid') && (
                    <button onClick={() => generateBrief(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#7c3aed' }}>
                      <Zap size={11} /> AI Brief
                    </button>
                  )}

                  <button onClick={() => setModal({ open: true, quote: null, editing: p })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:text-gray-700 transition-all">
                    Edit
                  </button>

                  <button onClick={() => deleteProposal(p.id)}
                    className="px-2 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {p.admin_notes && (
                <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-100 pt-2">
                  Note: {p.admin_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <CreateModal
          quote={modal.quote}
          editing={modal.editing}
          onClose={() => setModal({ open: false, quote: null, editing: null })}
          onCreated={p => {
            setProposals(prev => {
              const idx = prev.findIndex(x => x.id === p.id)
              return idx >= 0 ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]
            })
            setModal({ open: false, quote: null, editing: null })
          }}
        />
      )}
    </DashboardLayout>
  )
}
