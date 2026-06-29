import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Plus, Loader2, X, Check, Trash2, Phone, MessageSquare,
  Users, TrendingUp, Target, DollarSign,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Lead {
  id: string
  campaign_id: string | null
  name: string
  phone: string
  source: string
  interest_level: string
  status: string
  notes: string
  estimated_value: number
  follow_up_date: string | null
  created_at: string
}

const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost']
const SOURCES = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Call', 'Walk-in', 'Referral', 'Other']
const INTEREST = ['Hot', 'Warm', 'Cold']

const STATUS_COLOR: Record<string, string> = {
  New: 'bg-gray-100 text-gray-600',
  Contacted: 'bg-blue-50 text-blue-700',
  Interested: 'bg-purple-50 text-purple-700',
  Converted: 'bg-emerald-50 text-emerald-700',
  Lost: 'bg-red-50 text-red-500',
}
const INTEREST_COLOR: Record<string, string> = {
  Hot: 'text-red-500', Warm: 'text-amber-500', Cold: 'text-sky-500',
}

const EMPTY = {
  name: '', phone: '', source: 'WhatsApp', interest_level: 'Warm',
  status: 'New', notes: '', estimated_value: 0, follow_up_date: '', campaign_id: '',
}

const KES = (n: number) => `KES ${n.toLocaleString()}`

export default function Leads() {
  const { user } = useAuth()
  const location = useLocation()
  const preset = (location.state ?? {}) as { campaign_id?: string; campaign_title?: string }
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(!!preset.campaign_id)
  const [draft, setDraft] = useState(() => ({ ...EMPTY, campaign_id: preset.campaign_id ?? '' }))
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!user) return
    Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id, title').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([leadsRes, campRes]) => {
      setLeads((leadsRes.data ?? []) as Lead[])
      setCampaigns((campRes.data ?? []) as { id: string; title: string }[])
      setLoading(false)
    })
  }
  useEffect(load, [user])

  useEffect(() => {
    if (preset.campaign_id) setShowForm(true)
  }, [preset.campaign_id])

  const setStatus = async (lead: Lead, status: string) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status } : l))
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', lead.id)
  }

  const remove = async (lead: Lead) => {
    setLeads(prev => prev.filter(l => l.id !== lead.id))
    await supabase.from('leads').delete().eq('id', lead.id)
  }

  const saveDraft = async () => {
    if (!user || !draft.name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('leads').insert({
      user_id: user.id,
      name: draft.name,
      phone: draft.phone,
      source: draft.source,
      interest_level: draft.interest_level,
      status: draft.status,
      notes: draft.notes,
      estimated_value: Number(draft.estimated_value) || 0,
      follow_up_date: draft.follow_up_date || null,
      campaign_id: draft.campaign_id || null,
    })
    setSaving(false)
    if (!error) { setShowForm(false); setDraft(EMPTY); load() }
  }

  // Performance summary
  const total = leads.length
  const converted = leads.filter(l => l.status === 'Converted')
  const pipelineValue = leads.filter(l => !['Lost', 'Converted'].includes(l.status)).reduce((s, l) => s + (l.estimated_value || 0), 0)
  const wonValue = converted.reduce((s, l) => s + (l.estimated_value || 0), 0)
  const convRate = total ? Math.round((converted.length / total) * 100) : 0

  const filtered = statusFilter === 'all' ? leads : leads.filter(l => l.status === statusFilter)

  const stats = [
    { icon: Users, label: 'Total leads', value: String(total), color: '#7c3aed' },
    { icon: Target, label: 'Conversion rate', value: `${convRate}%`, color: '#2563eb' },
    { icon: TrendingUp, label: 'Open pipeline', value: KES(pipelineValue), color: '#d97706' },
    { icon: DollarSign, label: 'Revenue won', value: KES(wonValue), color: '#059669' },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <span className="section-tag">Lead Tracker</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Your leads & pipeline</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track every enquiry from first contact to sale.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2.5 gap-1.5">
            <Plus size={15} /> Add Lead
          </button>
        </div>

        {/* Performance summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={15} style={{ color: s.color }} />
                <p className="text-[11px] font-semibold text-gray-500">{s.label}</p>
              </div>
              <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(['all', ...STATUSES]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                statusFilter === s ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {s === 'all' ? `All (${leads.length})` : s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-800 mb-1">{leads.length === 0 ? 'No leads yet' : 'No leads in this status'}</p>
            <p className="text-sm text-gray-500 mb-5">Add leads as enquiries come in — from WhatsApp, calls, or walk-ins.</p>
            {leads.length === 0 && (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-5 py-2.5 gap-1.5">
                <Plus size={15} /> Add your first lead
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(lead => (
              <div key={lead.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{lead.name}</p>
                    <span className={`text-[10px] font-bold ${INTEREST_COLOR[lead.interest_level] ?? 'text-gray-400'}`}>● {lead.interest_level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                    {lead.phone && <span>{lead.phone}</span>}
                    {lead.source && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{lead.source}</span>}
                    {lead.estimated_value > 0 && <span className="text-emerald-600 font-semibold">{KES(lead.estimated_value)}</span>}
                    {lead.follow_up_date && <span className="text-amber-600">↻ {lead.follow_up_date}</span>}
                  </div>
                  {lead.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{lead.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lead.phone && (
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '').replace(/^0/, '254')}`} target="_blank" rel="noopener noreferrer"
                      title="WhatsApp" className="w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50">
                      <MessageSquare size={14} />
                    </a>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} title="Call" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Phone size={14} />
                    </a>
                  )}
                  <select value={lead.status} onChange={e => setStatus(lead, e.target.value)}
                    className={`text-[11px] font-semibold rounded-lg px-2 py-1.5 border-0 cursor-pointer ${STATUS_COLOR[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => remove(lead)} title="Delete"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add-lead modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Add lead</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Name *</label>
                  <input className="input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Lead name" /></div>
                <div><label className="label">Phone</label>
                  <input className="input" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="07XX XXX XXX" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Source</label>
                  <select className="input" value={draft.source} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div><label className="label">Interest</label>
                  <select className="input" value={draft.interest_level} onChange={e => setDraft(d => ({ ...d, interest_level: e.target.value }))}>
                    {INTEREST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Status</label>
                  <select className="input" value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div><label className="label">Estimated value (KES)</label>
                  <input className="input" type="number" value={draft.estimated_value} onChange={e => setDraft(d => ({ ...d, estimated_value: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Follow-up date</label>
                  <input className="input" type="date" value={draft.follow_up_date} onChange={e => setDraft(d => ({ ...d, follow_up_date: e.target.value }))} /></div>
                <div><label className="label">From campaign</label>
                  <select className="input" value={draft.campaign_id} onChange={e => setDraft(d => ({ ...d, campaign_id: e.target.value }))}>
                    <option value="">None</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select></div>
              </div>
              <div><label className="label">Notes</label>
                <textarea className="input" rows={2} value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={saveDraft} disabled={!draft.name.trim() || saving} className="btn-primary text-sm px-4 py-2 gap-1.5 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save lead
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}


