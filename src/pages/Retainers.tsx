import { useState, useEffect } from 'react'
import {
  Plus, RefreshCw, TrendingUp, Users, Pause, Play,
  XCircle, Loader2, X, Edit2, Bell, MessageSquare,
  CalendarDays, CheckCircle, AlertTriangle,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'

type RetainerStatus = 'active' | 'paused' | 'cancelled'

interface Retainer {
  id: string
  token: string
  business_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  industry: string | null
  monthly_videos: number
  monthly_posters: number
  campaign_credits: number
  monthly_price: number
  currency: string
  start_date: string
  next_billing_date: string
  billing_day: number
  status: RetainerStatus
  notes: string | null
  months_billed: number
  total_billed: number
  last_billed_at: string | null
  created_at: string
}

const STATUS_META = {
  active:    { label: 'Active',    color: '#059669', bg: '#ecfdf5', icon: CheckCircle },
  paused:    { label: 'Paused',    color: '#d97706', bg: '#fffbeb', icon: Pause },
  cancelled: { label: 'Cancelled', color: '#9ca3af', bg: '#f3f4f6', icon: XCircle },
}

function fmt(n: number) { return `KES ${n.toLocaleString('en-KE')}` }

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

interface RetainerForm {
  business_name: string
  contact_name: string
  phone: string
  email: string
  industry: string
  monthly_videos: number
  monthly_posters: number
  campaign_credits: number
  monthly_price: number
  billing_day: number
  start_date: string
  notes: string
  status: RetainerStatus
}

const EMPTY_FORM: RetainerForm = {
  business_name: '', contact_name: '', phone: '', email: '',
  industry: '', monthly_videos: 1, monthly_posters: 0, campaign_credits: 0,
  monthly_price: 15000, billing_day: 1, start_date: new Date().toISOString().split('T')[0],
  notes: '', status: 'active',
}

export default function Retainers() {
  const [retainers, setRetainers] = useState<Retainer[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'active' | 'paused' | 'cancelled'>('active')
  const [modal, setModal] = useState<{ open: boolean; item: Retainer | null }>({ open: false, item: null })
  const [form, setForm] = useState<RetainerForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [billing, setBilling] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('retainers')
      .select('*')
      .order('next_billing_date', { ascending: true })
    if (data) setRetainers(data as Retainer[])
    setLoading(false)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setModal({ open: true, item: null })
  }

  function openEdit(r: Retainer) {
    setForm({
      business_name: r.business_name,
      contact_name: r.contact_name ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
      industry: r.industry ?? '',
      monthly_videos: r.monthly_videos,
      monthly_posters: r.monthly_posters,
      campaign_credits: r.campaign_credits,
      monthly_price: r.monthly_price,
      billing_day: r.billing_day,
      start_date: r.start_date,
      notes: r.notes ?? '',
      status: r.status as RetainerStatus,
    })
    setModal({ open: true, item: r })
  }

  async function save() {
    setSaving(true)
    const nextBilling = new Date(form.start_date)
    nextBilling.setDate(form.billing_day)
    if (nextBilling < new Date()) nextBilling.setMonth(nextBilling.getMonth() + 1)

    const payload = {
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      industry: form.industry.trim() || null,
      monthly_videos: form.monthly_videos,
      monthly_posters: form.monthly_posters,
      campaign_credits: form.campaign_credits,
      monthly_price: form.monthly_price,
      billing_day: form.billing_day,
      start_date: form.start_date,
      next_billing_date: nextBilling.toISOString().split('T')[0],
      status: form.status,
      notes: form.notes.trim() || null,
    }

    if (modal.item) {
      await supabase.from('retainers').update(payload).eq('id', modal.item.id)
      setRetainers(prev => prev.map(r => r.id === modal.item!.id ? { ...r, ...payload } : r))
    } else {
      const { data } = await supabase.from('retainers').insert(payload).select().single()
      if (data) setRetainers(prev => [data as Retainer, ...prev])
    }
    setSaving(false)
    setModal({ open: false, item: null })
  }

  async function setStatus(id: string, status: Retainer['status']) {
    await supabase.from('retainers').update({ status }).eq('id', id)
    setRetainers(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  async function billNow(r: Retainer) {
    setBilling(r.id)

    // Create a proposal for this month's retainer
    const deliverables = [
      r.monthly_videos > 0 && `${r.monthly_videos} video commercial${r.monthly_videos > 1 ? 's' : ''}`,
      r.monthly_posters > 0 && `${r.monthly_posters} promo poster${r.monthly_posters > 1 ? 's' : ''}`,
      r.campaign_credits > 0 && `${r.campaign_credits} AI campaign credit${r.campaign_credits > 1 ? 's' : ''}`,
      '1 round of revisions per deliverable',
    ].filter(Boolean) as string[]

    const month = new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    const { data: proposal } = await supabase.from('proposals').insert({
      business_name: r.business_name,
      contact_name: r.contact_name,
      phone: r.phone ?? '',
      email: r.email,
      industry: r.industry,
      video_length: `${r.monthly_videos}× monthly`,
      platforms: [],
      what_to_promote: `Monthly retainer — ${month}`,
      delivery_speed: 'standard',
      include_poster: r.monthly_posters > 0,
      include_subtitles: false,
      final_price: r.monthly_price,
      deposit_percent: 100,
      deposit_amount: r.monthly_price,
      deliverables,
      timeline_days: 28,
      valid_until: validUntil.toISOString().split('T')[0],
      status: 'sent',
      admin_notes: `Auto-generated monthly retainer billing — ${month}`,
    }).select().single()

    if (proposal) {
      // Advance next billing date
      const next = new Date(r.next_billing_date)
      next.setMonth(next.getMonth() + 1)
      await supabase.from('retainers').update({
        last_billed_at: new Date().toISOString(),
        months_billed: r.months_billed + 1,
        total_billed: r.total_billed + r.monthly_price,
        next_billing_date: next.toISOString().split('T')[0],
      }).eq('id', r.id)
      setRetainers(prev => prev.map(x => x.id === r.id ? {
        ...x, last_billed_at: new Date().toISOString(),
        months_billed: x.months_billed + 1,
        total_billed: x.total_billed + x.monthly_price,
        next_billing_date: next.toISOString().split('T')[0],
      } : x))

      // Notify client if email present
      if (r.email) {
        supabase.functions.invoke('send-client-email', {
          body: {
            type: 'proposal_sent',
            to: r.email,
            name: r.contact_name,
            businessName: r.business_name,
            proposalToken: (proposal as { token: string }).token,
            finalPrice: r.monthly_price,
            depositAmount: r.monthly_price,
          },
        })
      }

      // In-app notification
      supabase.rpc('notify_admins', {
        p_type: 'success',
        p_title: `Retainer billed — ${r.business_name}`,
        p_body: `${fmt(r.monthly_price)} proposal created for ${month}. Proposal link sent.`,
        p_action_url: '/proposals',
      })
    }

    setBilling(null)
  }

  const filtered = tab === 'all' ? retainers : retainers.filter(r => r.status === tab)
  const active = retainers.filter(r => r.status === 'active')
  const mrr = active.reduce((s, r) => s + r.monthly_price, 0)
  const arr = mrr * 12
  const dueSoon = active.filter(r => daysUntil(r.next_billing_date) <= 7).length

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Retainers</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monthly content packages and recurring billing.</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={14} /> New Retainer
          </button>
        </div>

        {/* MRR stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Monthly Recurring', value: fmt(mrr), icon: TrendingUp, color: '#7c3aed' },
            { label: 'Annual Run Rate', value: `KES ${(arr / 1000).toFixed(0)}K`, icon: TrendingUp, color: '#2563eb' },
            { label: 'Active Clients', value: active.length, icon: Users, color: '#059669' },
            { label: 'Due This Week', value: dueSoon, icon: Bell, color: dueSoon > 0 ? '#d97706' : '#9ca3af' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.color}15` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900 leading-none">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['active', 'all', 'paused', 'cancelled'] as const).map(t => {
            const count = t === 'all' ? retainers.length : retainers.filter(r => r.status === t).length
            return (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                style={tab === t
                  ? { background: '#7c3aed', color: '#fff' }
                  : { background: '#f3f4f6', color: '#374151' }}>
                {t} ({count})
              </button>
            )
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin text-purple-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <RefreshCw size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No retainers yet</p>
            <p className="text-xs text-gray-400 mt-1">Set up monthly packages for repeat clients.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const meta = STATUS_META[r.status]
              const StatusIcon = meta.icon
              const days = daysUntil(r.next_billing_date)
              const billingUrgent = r.status === 'active' && days <= 3
              const billingNear = r.status === 'active' && days <= 7 && days > 3

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{r.business_name}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: meta.bg, color: meta.color }}>
                          <StatusIcon size={10} /> {meta.label}
                        </span>
                        {billingUrgent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600">
                            <AlertTriangle size={10} /> Due {days === 0 ? 'today' : `in ${days}d`}
                          </span>
                        )}
                        {billingNear && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700">
                            <CalendarDays size={10} /> Due in {days}d
                          </span>
                        )}
                      </div>

                      {/* Package summary */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {r.monthly_videos > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700">
                            {r.monthly_videos}× video{r.monthly_videos > 1 ? 's' : ''}
                          </span>
                        )}
                        {r.monthly_posters > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">
                            {r.monthly_posters}× poster{r.monthly_posters > 1 ? 's' : ''}
                          </span>
                        )}
                        {r.campaign_credits > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700">
                            {r.campaign_credits}× credits
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold text-gray-900 bg-gray-100">
                          {fmt(r.monthly_price)}/mo
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        {r.contact_name && <span>{r.contact_name}</span>}
                        {r.phone && <span>{r.phone}</span>}
                        <span>Started {new Date(r.start_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {r.months_billed > 0 && <span>{r.months_billed} month{r.months_billed !== 1 ? 's' : ''} billed · {fmt(r.total_billed)} total</span>}
                        {r.status === 'active' && (
                          <span className={billingUrgent ? 'text-red-500 font-semibold' : billingNear ? 'text-amber-600 font-semibold' : ''}>
                            Next billing: {new Date(r.next_billing_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      {r.status === 'active' && (
                        <button
                          onClick={() => billNow(r)}
                          disabled={billing === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                          {billing === r.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <RefreshCw size={12} />}
                          Bill Now
                        </button>
                      )}

                      {r.phone && r.status === 'active' && (
                        <a href={`https://wa.me/${r.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(`Hi ${r.contact_name || r.business_name}, your monthly Nia Media content package is due. Please confirm delivery requirements for this month.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                          style={{ background: '#25d366' }}>
                          <MessageSquare size={12} /> WhatsApp
                        </a>
                      )}

                      <button onClick={() => openEdit(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                        <Edit2 size={12} /> Edit
                      </button>

                      {r.status === 'active' && (
                        <button onClick={() => setStatus(r.id, 'paused')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all">
                          <Pause size={12} /> Pause
                        </button>
                      )}
                      {r.status === 'paused' && (
                        <button onClick={() => setStatus(r.id, 'active')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition-all">
                          <Play size={12} /> Resume
                        </button>
                      )}
                      {r.status !== 'cancelled' && (
                        <button onClick={() => { if (window.confirm('Cancel this retainer?')) setStatus(r.id, 'cancelled') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                          <XCircle size={12} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {r.notes && (
                    <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-100 pt-2">{r.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">{modal.item ? 'Edit Retainer' : 'New Retainer'}</h2>
              <button onClick={() => setModal({ open: false, item: null })}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Business Name *</label>
                  <input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                    className="input-field w-full" placeholder="Onfon Mobile Ltd" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Name</label>
                  <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                    className="input-field w-full" placeholder="James Kariuki" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="input-field w-full" placeholder="+254 7xx xxx xxx" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field w-full" placeholder="james@client.co.ke" />
                </div>
              </div>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Monthly Package</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Videos/mo</label>
                  <input type="number" min={0} value={form.monthly_videos}
                    onChange={e => setForm(f => ({ ...f, monthly_videos: +e.target.value }))}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Posters/mo</label>
                  <input type="number" min={0} value={form.monthly_posters}
                    onChange={e => setForm(f => ({ ...f, monthly_posters: +e.target.value }))}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Credits/mo</label>
                  <input type="number" min={0} value={form.campaign_credits}
                    onChange={e => setForm(f => ({ ...f, campaign_credits: +e.target.value }))}
                    className="input-field w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Monthly Price (KES)</label>
                  <input type="number" value={form.monthly_price}
                    onChange={e => setForm(f => ({ ...f, monthly_price: +e.target.value }))}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Billing Day (1–28)</label>
                  <input type="number" min={1} max={28} value={form.billing_day}
                    onChange={e => setForm(f => ({ ...f, billing_day: +e.target.value }))}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as RetainerStatus }))}
                    className="input-field w-full">
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes (internal)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="input-field w-full resize-none"
                  placeholder="Scope details, special requirements, renewal terms..." />
              </div>

              <div className="rounded-xl p-3 text-xs text-gray-600"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <strong>Bill Now</strong> creates a proposal for the current month and advances the next billing date by one month. The client receives a payment link automatically.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal({ open: false, item: null })} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button disabled={saving || !form.business_name.trim()} onClick={save}
                className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : (modal.item ? 'Update' : 'Create Retainer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
