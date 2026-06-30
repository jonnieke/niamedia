import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Plus, Loader2, X, Check, Trash2, Phone, MessageSquare,
  Users, TrendingUp, Target, DollarSign, Megaphone,
  LayoutGrid, List, Upload, CheckSquare, Square, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BroadcastModal from '../components/BroadcastModal'

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
const STATUS_BORDER: Record<string, string> = {
  New: 'border-gray-200',
  Contacted: 'border-blue-200',
  Interested: 'border-purple-200',
  Converted: 'border-emerald-200',
  Lost: 'border-red-200',
}
const INTEREST_COLOR: Record<string, string> = {
  Hot: 'text-red-500', Warm: 'text-amber-500', Cold: 'text-sky-500',
}
const STATUS_COL_BG: Record<string, string> = {
  New: 'bg-gray-50',
  Contacted: 'bg-blue-50/40',
  Interested: 'bg-purple-50/40',
  Converted: 'bg-emerald-50/40',
  Lost: 'bg-red-50/40',
}

const EMPTY = {
  name: '', phone: '', source: 'WhatsApp', interest_level: 'Warm',
  status: 'New', notes: '', estimated_value: 0, follow_up_date: '', campaign_id: '',
}

const KES = (n: number) => `KES ${n.toLocaleString()}`

/* ── CSV parser ────────────────────────────────────────────────── */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  }).filter(r => Object.values(r).some(v => v))
}

function guessField(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c]
  }
  return ''
}

/* ── CSV Import Modal ──────────────────────────────────────────── */
interface CsvRow { name: string; phone: string; source: string; status: string; notes: string; estimated_value: string }

function CsvImportModal({ campaigns, onClose, onImported }: {
  campaigns: { id: string; title: string }[]
  onClose: () => void
  onImported: () => void
}) {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      const mapped: CsvRow[] = parsed.map(r => ({
        name: guessField(r, ['name', 'full name', 'fullname', 'customer', 'contact']),
        phone: guessField(r, ['phone', 'mobile', 'number', 'tel', 'whatsapp']),
        source: guessField(r, ['source', 'channel', 'platform']) || 'Other',
        status: guessField(r, ['status', 'stage']) || 'New',
        notes: guessField(r, ['notes', 'note', 'comment', 'details']),
        estimated_value: guessField(r, ['value', 'amount', 'estimated value', 'deal value', 'kes']),
      }))
      const valid = mapped.filter(r => r.name.trim())
      if (!valid.length) setError('No valid rows found. Make sure the CSV has a "name" column.')
      else { setRows(valid); setError('') }
    }
    reader.readAsText(f)
  }

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (!text.includes(',')) return
    const parsed = parseCSV(text)
    const mapped: CsvRow[] = parsed.map(r => ({
      name: guessField(r, ['name', 'full name', 'fullname', 'customer', 'contact']),
      phone: guessField(r, ['phone', 'mobile', 'number', 'tel', 'whatsapp']),
      source: guessField(r, ['source', 'channel', 'platform']) || 'Other',
      status: guessField(r, ['status', 'stage']) || 'New',
      notes: guessField(r, ['notes', 'note', 'comment', 'details']),
      estimated_value: guessField(r, ['value', 'amount', 'estimated value', 'deal value', 'kes']),
    }))
    const valid = mapped.filter(r => r.name.trim())
    if (valid.length) { setRows(valid); setError('') }
  }

  const doImport = async () => {
    if (!user || !rows.length) return
    setImporting(true)
    const inserts = rows.map(r => ({
      user_id: user.id,
      name: r.name,
      phone: r.phone || null,
      source: SOURCES.includes(r.source) ? r.source : 'Other',
      interest_level: 'Warm',
      status: STATUSES.includes(r.status) ? r.status : 'New',
      notes: r.notes || null,
      estimated_value: Number(r.estimated_value.replace(/[^\d.]/g, '')) || 0,
      campaign_id: campaignId || null,
    }))
    const { error: e } = await supabase.from('leads').insert(inserts)
    setImporting(false)
    if (e) setError(e.message)
    else { setDone(true); setTimeout(() => { onImported(); onClose() }, 1500) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900">Import from CSV</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload a spreadsheet or paste CSV data</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <Check size={32} className="mx-auto mb-3 text-emerald-500" />
            <p className="font-semibold text-gray-900">{rows.length} leads imported!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="label">Upload CSV file</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                  <Upload size={20} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload a .csv file</p>
                  <p className="text-xs text-gray-400 mt-1">Columns: name, phone, source, status, notes, value</p>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="px-2 text-xs text-gray-400 bg-white">or paste CSV</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              </div>

              <div className="pt-2">
                <textarea
                  className="input text-xs font-mono"
                  rows={4}
                  placeholder={"name,phone,source,status\nJohn Kamau,0712345678,WhatsApp,New\nMary Wanjiku,0798765432,Instagram,Interested"}
                  onChange={handlePaste}
                />
              </div>

              {rows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{rows.length} leads ready to import</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {rows.slice(0, 8).map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <span className="font-medium text-gray-900 min-w-0 truncate">{r.name}</span>
                        {r.phone && <span className="text-gray-400 shrink-0">{r.phone}</span>}
                        {r.source && <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 shrink-0">{r.source}</span>}
                      </div>
                    ))}
                    {rows.length > 8 && (
                      <p className="text-xs text-gray-400 text-center py-1">+{rows.length - 8} more</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Assign to campaign (optional)</label>
                <select className="input" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
                  <option value="">No campaign</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={doImport} disabled={!rows.length || importing}
                className="btn-primary text-sm px-4 py-2 gap-1.5 disabled:opacity-50">
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Import {rows.length > 0 ? rows.length : ''} leads
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main Leads page ───────────────────────────────────────────── */
export default function Leads() {
  const { user } = useAuth()
  const location = useLocation()
  const preset = (location.state ?? {}) as { campaign_id?: string; campaign_title?: string }

  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [showForm, setShowForm] = useState(!!preset.campaign_id)
  const [draft, setDraft] = useState(() => ({ ...EMPTY, campaign_id: preset.campaign_id ?? '' }))
  const [saving, setSaving] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkWorking, setBulkWorking] = useState(false)

  // Drag-and-drop for kanban
  const [dragLead, setDragLead] = useState<Lead | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

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
    setSelectedIds(prev => { const n = new Set(prev); n.delete(lead.id); return n })
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

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(l => l.id)))
  }
  const bulkUpdateStatus = async () => {
    if (!bulkStatus || !selectedIds.size) return
    setBulkWorking(true)
    const ids = [...selectedIds]
    setLeads(prev => prev.map(l => selectedIds.has(l.id) ? { ...l, status: bulkStatus } : l))
    await supabase.from('leads').update({ status: bulkStatus }).in('id', ids)
    setSelectedIds(new Set())
    setBulkStatus('')
    setBulkWorking(false)
  }
  const bulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} leads?`)) return
    setBulkWorking(true)
    const ids = [...selectedIds]
    setLeads(prev => prev.filter(l => !selectedIds.has(l.id)))
    await supabase.from('leads').delete().in('id', ids)
    setSelectedIds(new Set())
    setBulkWorking(false)
  }

  // Stats
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

  // ── Lead card (shared between list and kanban) ────────────────
  const LeadCard = ({ lead, compact = false }: { lead: Lead; compact?: boolean }) => (
    <div
      draggable={view === 'kanban'}
      onDragStart={() => setDragLead(lead)}
      onDragEnd={() => setDragLead(null)}
      className={`rounded-xl border bg-white transition-all ${
        compact ? 'p-3' : 'p-4 flex items-center gap-4 flex-wrap'
      } ${STATUS_BORDER[lead.status] ?? 'border-gray-200'} ${
        dragLead?.id === lead.id ? 'opacity-50' : ''
      } ${selectedIds.has(lead.id) ? 'ring-2 ring-purple-400' : ''}`}>
      {compact ? (
        // Kanban compact card
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <button onClick={() => toggleSelect(lead.id)} className="shrink-0 text-gray-300 hover:text-purple-500">
                {selectedIds.has(lead.id) ? <CheckSquare size={13} className="text-purple-500" /> : <Square size={13} />}
              </button>
              <p className="font-semibold text-gray-900 text-sm truncate">{lead.name}</p>
            </div>
            <span className={`text-[9px] font-bold shrink-0 ${INTEREST_COLOR[lead.interest_level] ?? 'text-gray-400'}`}>●{lead.interest_level}</span>
          </div>
          {lead.estimated_value > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mb-1.5">{KES(lead.estimated_value)}</p>
          )}
          <div className="flex items-center gap-1 flex-wrap">
            {lead.source && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{lead.source}</span>}
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, '').replace(/^0/, '254')}`}
                target="_blank" rel="noopener noreferrer"
                className="w-6 h-6 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50"
                onClick={e => e.stopPropagation()}>
                <MessageSquare size={11} />
              </a>
            )}
            <button onClick={() => remove(lead)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ) : (
        // List row
        <>
          <button onClick={() => toggleSelect(lead.id)} className="shrink-0 text-gray-300 hover:text-purple-500">
            {selectedIds.has(lead.id) ? <CheckSquare size={15} className="text-purple-500" /> : <Square size={15} />}
          </button>
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
        </>
      )}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <span className="section-tag">Lead Tracker</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Your leads & pipeline</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track every enquiry from first contact to sale.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {leads.some(l => l.phone) && (
              <button onClick={() => setShowBroadcast(true)} className="btn-secondary text-sm px-4 py-2.5 gap-1.5">
                <Megaphone size={15} /> Broadcast
              </button>
            )}
            <button onClick={() => setShowCsvImport(true)} className="btn-secondary text-sm px-4 py-2.5 gap-1.5">
              <Upload size={15} /> Import CSV
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2.5 gap-1.5">
              <Plus size={15} /> Add Lead
            </button>
          </div>
        </div>

        {/* Stats */}
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

        {/* Toolbar row */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {/* Status filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
            {(['all', ...STATUSES]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                  statusFilter === s ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {s === 'all' ? `All (${leads.length})` : `${s} (${leads.filter(l => l.status === s).length})`}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <List size={13} /> List
            </button>
            <button onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${view === 'kanban' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <LayoutGrid size={13} /> Kanban
            </button>
          </div>
        </div>

        {/* Bulk action toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex-wrap">
            <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
            <span className="text-sm font-semibold text-purple-700">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                <option value="">Move to status…</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {bulkStatus && (
                <button onClick={bulkUpdateStatus} disabled={bulkWorking}
                  className="btn-primary text-xs px-3 py-1.5 gap-1 disabled:opacity-50">
                  {bulkWorking ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  Apply
                </button>
              )}
              <button onClick={bulkDelete} disabled={bulkWorking}
                className="text-xs border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1">
                <Trash2 size={11} /> Delete all
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-purple-500" /></div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-800 mb-1">No leads yet</p>
            <p className="text-sm text-gray-500 mb-5">Add leads as enquiries come in — from WhatsApp, calls, or walk-ins.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowCsvImport(true)} className="btn-secondary text-sm px-5 py-2.5 gap-1.5">
                <Upload size={15} /> Import CSV
              </button>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-5 py-2.5 gap-1.5">
                <Plus size={15} /> Add your first lead
              </button>
            </div>
          </div>
        ) : view === 'list' ? (
          // ── List view ───────────────────────────────────────────
          <div className="space-y-2.5">
            {/* Select all row */}
            {filtered.length > 0 && (
              <div className="flex items-center gap-2 px-1 pb-1">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-purple-500 flex items-center gap-1.5 text-xs">
                  {selectedIds.size === filtered.length && filtered.length > 0
                    ? <CheckSquare size={13} className="text-purple-500" />
                    : <Square size={13} />}
                  {selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
                </button>
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-500">No leads with status "{statusFilter}"</p>
              </div>
            ) : (
              filtered.map(lead => <LeadCard key={lead.id} lead={lead} />)
            )}
          </div>
        ) : (
          // ── Kanban view ──────────────────────────────────────────
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
            {STATUSES.map(col => {
              const colLeads = leads.filter(l => l.status === col)
              const isOver = dragOverCol === col
              return (
                <div
                  key={col}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col) }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => {
                    if (dragLead && dragLead.status !== col) setStatus(dragLead, col)
                    setDragOverCol(null)
                    setDragLead(null)
                  }}
                  className={`flex-shrink-0 w-56 rounded-2xl transition-all ${STATUS_COL_BG[col]} ${
                    isOver ? 'ring-2 ring-purple-400 ring-offset-2' : ''
                  }`}
                  style={{ minHeight: 400 }}>
                  {/* Column header */}
                  <div className={`px-3 py-2.5 rounded-t-2xl flex items-center justify-between ${STATUS_COLOR[col] ?? 'bg-gray-100 text-gray-600'}`}>
                    <span className="text-xs font-bold">{col}</span>
                    <span className="text-[10px] font-bold opacity-70">{colLeads.length}</span>
                  </div>
                  {/* Cards */}
                  <div className="p-2 space-y-2">
                    {colLeads.map(lead => <LeadCard key={lead.id} lead={lead} compact />)}
                    {colLeads.length === 0 && (
                      <div className={`text-center py-6 text-xs text-gray-400 rounded-xl border-2 border-dashed ${
                        isOver ? 'border-purple-300 text-purple-400' : 'border-gray-200'
                      }`}>
                        {isOver ? 'Drop here' : 'No leads'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showBroadcast && (
        <BroadcastModal leads={leads} campaigns={campaigns} onClose={() => setShowBroadcast(false)} />
      )}

      {showCsvImport && (
        <CsvImportModal campaigns={campaigns} onClose={() => setShowCsvImport(false)} onImported={load} />
      )}

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
                  <input className="input" type="date" value={draft.follow_up_date ?? ''} onChange={e => setDraft(d => ({ ...d, follow_up_date: e.target.value }))} /></div>
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
