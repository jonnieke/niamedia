import { useState, useEffect } from 'react'
import { Plus, X, TrendingUp, TrendingDown, Target, DollarSign, Users, MousePointer } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface CampaignResult {
  id: string
  campaign_id: string | null
  platform: string
  spend: number
  impressions: number
  clicks: number
  leads: number
  conversions: number
  revenue: number
  notes: string
  date_from: string
  date_to: string
  created_at: string
  campaign_title?: string
}

interface Campaign { id: string; business_name: string }

function fmt(n: number, prefix = 'KES ') {
  if (n >= 1000) return `${prefix}${(n / 1000).toFixed(1)}k`
  return `${prefix}${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
}

function pct(n: number) { return n > 0 ? `${n.toFixed(1)}%` : '0%' }

function MetricCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral'
  icon: typeof TrendingUp; color: string
}) {
  return (
    <div className="card-glow p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={15} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
            {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : null}
          </div>
        )}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs font-medium mt-1" style={{ color }}>{sub}</p>}
    </div>
  )
}

export default function ROITracker() {
  const { user } = useAuth()
  const [results, setResults] = useState<CampaignResult[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    campaign_id: '', platform: 'All Platforms',
    spend: '', impressions: '', clicks: '', leads: '', conversions: '', revenue: '',
    date_from: '', date_to: '', notes: '',
  })

  const load = async () => {
    if (!user) return
    setLoading(true)
    const [{ data: res }, { data: camps }] = await Promise.all([
      supabase.from('campaign_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id,business_name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ])
    const campMap: Record<string, string> = {}
    ;(camps ?? []).forEach((c: Campaign) => { campMap[c.id] = c.business_name })
    setResults((res ?? []).map((r: CampaignResult) => ({ ...r, campaign_title: r.campaign_id ? campMap[r.campaign_id] : undefined })))
    setCampaigns((camps ?? []) as Campaign[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const save = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('campaign_results').insert({
      user_id: user.id,
      campaign_id: form.campaign_id || null,
      platform: form.platform,
      spend: Number(form.spend) || 0,
      impressions: Number(form.impressions) || 0,
      clicks: Number(form.clicks) || 0,
      leads: Number(form.leads) || 0,
      conversions: Number(form.conversions) || 0,
      revenue: Number(form.revenue) || 0,
      date_from: form.date_from || null,
      date_to: form.date_to || null,
      notes: form.notes,
    })
    if (!error) { setShowModal(false); load() }
    setSaving(false)
  }

  // Aggregate totals
  const totals = results.reduce((acc, r) => ({
    spend: acc.spend + r.spend,
    impressions: acc.impressions + r.impressions,
    clicks: acc.clicks + r.clicks,
    leads: acc.leads + r.leads,
    conversions: acc.conversions + r.conversions,
    revenue: acc.revenue + r.revenue,
  }), { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 })

  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0
  const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const convRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0

  const PLATFORMS = ['All Platforms', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'WhatsApp', 'LinkedIn', 'Google Ads']

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="section-tag">Analytics</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Campaign ROI</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm gap-2">
            <Plus size={15} /> Log Results
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Total spend" value={fmt(totals.spend)} icon={DollarSign} color="#7c3aed" />
          <MetricCard label="Leads generated" value={totals.leads.toLocaleString()} sub={cpl > 0 ? `${fmt(cpl)} / lead` : undefined} icon={Users} color="#2563eb" />
          <MetricCard label="Conversions" value={totals.conversions.toLocaleString()} sub={convRate > 0 ? `${pct(convRate)} conv. rate` : undefined} icon={Target} color="#db2777" />
          <MetricCard
            label="ROI"
            value={roi !== 0 ? `${roi > 0 ? '+' : ''}${roi.toFixed(0)}%` : '—'}
            sub={totals.revenue > 0 ? `${fmt(totals.revenue)} revenue` : undefined}
            trend={roi > 0 ? 'up' : roi < 0 ? 'down' : 'neutral'}
            icon={TrendingUp}
            color={roi >= 0 ? '#059669' : '#dc2626'}
          />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-glow p-5 flex items-center gap-4">
            <MousePointer size={18} className="text-gray-400" />
            <div>
              <p className="text-lg font-bold text-gray-900">{totals.impressions.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Impressions · <span className="font-medium text-gray-600">{pct(ctr)} CTR</span></p>
            </div>
          </div>
          <div className="card-glow p-5 flex items-center gap-4">
            <MousePointer size={18} className="text-gray-400" />
            <div>
              <p className="text-lg font-bold text-gray-900">{totals.clicks.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Clicks · <span className="font-medium text-gray-600">{fmt(totals.spend / Math.max(totals.clicks, 1))} CPC</span></p>
            </div>
          </div>
        </div>

        {/* Results table */}
        <div className="card-glow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading results…</div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-3">No campaign results logged yet</p>
              <p className="text-xs text-gray-300 mb-4 max-w-xs mx-auto">After running a campaign, log your spend, leads, and conversions here to track ROI.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary text-sm gap-2"><Plus size={14} /> Log first result</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Campaign', 'Platform', 'Spend', 'Leads', 'Conversions', 'Revenue', 'ROI'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => {
                    const rROI = r.spend > 0 ? ((r.revenue - r.spend) / r.spend) * 100 : null
                    const cpl = r.leads > 0 ? r.spend / r.leads : null
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{r.campaign_title ?? '—'}</p>
                          {r.date_from && <p className="text-xs text-gray-400">{new Date(r.date_from).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} – {r.date_to ? new Date(r.date_to).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '…'}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">{r.platform}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">{r.spend > 0 ? fmt(r.spend) : '—'}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{r.leads}</p>
                          {cpl && <p className="text-xs text-gray-400">{fmt(cpl)} / lead</p>}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">{r.conversions}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{r.revenue > 0 ? fmt(r.revenue) : '—'}</td>
                        <td className="px-5 py-4">
                          {rROI !== null ? (
                            <span className={`text-sm font-bold ${rROI >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {rROI >= 0 ? '+' : ''}{rROI.toFixed(0)}%
                            </span>
                          ) : <span className="text-gray-300 text-sm">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Results Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Log Campaign Results</h2>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Campaign</label>
                  <select className="input" value={form.campaign_id} onChange={e => setForm(f => ({ ...f, campaign_id: e.target.value }))}>
                    <option value="">— Select campaign (optional) —</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Platform</label>
                  <select className="input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date from</label>
                  <input className="input" type="date" value={form.date_from} onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Date to</label>
                  <input className="input" type="date" value={form.date_to} onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))} />
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Performance numbers</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: 'spend', label: 'Ad spend (KES)' },
                  { field: 'impressions', label: 'Impressions' },
                  { field: 'clicks', label: 'Clicks' },
                  { field: 'leads', label: 'Leads' },
                  { field: 'conversions', label: 'Conversions' },
                  { field: 'revenue', label: 'Revenue (KES)' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input className="input" type="number" placeholder="0"
                      value={(form as Record<string, string>)[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="What worked? What didn't? Key observations." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-40">
                {saving ? 'Saving…' : 'Log Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
