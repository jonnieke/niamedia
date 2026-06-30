import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Users, Zap, DollarSign, Target,
  ArrowUpRight, ChevronRight, Loader2, FileText, Calendar,
  BarChart2, CheckCircle, Clock, XCircle, PhoneCall,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type Period = '7d' | '30d' | '90d'
const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 }

const STATUS_META: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  New:        { color: '#64748b', icon: Clock,        label: 'New' },
  Contacted:  { color: '#2563eb', icon: PhoneCall,    label: 'Contacted' },
  Interested: { color: '#7c3aed', icon: TrendingUp,   label: 'Interested' },
  Converted:  { color: '#059669', icon: CheckCircle,  label: 'Converted' },
  Lost:       { color: '#ef4444', icon: XCircle,      label: 'Lost' },
}

interface Campaign { id: string; title: string; created_at: string; metadata: Record<string, unknown> }
interface Lead { id: string; campaign_id: string | null; status: string; estimated_value: number; created_at: string; source: string }

function buildDailySeries(dates: string[], days: number): number[] {
  const series = new Array(days).fill(0)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  for (const iso of dates) {
    const d = new Date(iso); d.setHours(0, 0, 0, 0)
    const idx = Math.floor((todayStart.getTime() - d.getTime()) / 86400000)
    if (idx >= 0 && idx < days) series[days - 1 - idx]++
  }
  return series
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const h = 40; const w = data.length * 8
  const points = data.map((v, i) => `${i * 8 + 4},${h - (v / max) * (h - 4) - 2}`).join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const h = 70
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${data.length * 12} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const barH = Math.max((v / max) * h, v > 0 ? 3 : 0)
        return <rect key={i} x={i * 12 + 1} y={h - barH} width={10} height={barH} rx={2} fill="url(#bar-grad)" />
      })}
    </svg>
  )
}

function FunnelBar({ label, count, total, color, icon: Icon }: { label: string; count: number; total: number; color: string; icon: typeof Clock }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="font-bold text-gray-900">{count}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <span className="text-xs text-gray-400 shrink-0 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  )
}

const KES = (n: number) => `KES ${n.toLocaleString()}`

export default function Analytics() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>('30d')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('campaigns').select('id, title, created_at, metadata').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('leads').select('id, campaign_id, status, estimated_value, created_at, source').eq('user_id', user.id),
    ]).then(([campRes, leadsRes]) => {
      setCampaigns((campRes.data ?? []) as Campaign[])
      setLeads((leadsRes.data ?? []) as Lead[])
      setLoading(false)
    })
  }, [user])

  const days = PERIOD_DAYS[period]
  const cutoff = new Date(Date.now() - days * 86400000).toISOString()

  const periodCampaigns = campaigns.filter(c => c.created_at >= cutoff)
  const periodLeads = leads.filter(l => l.created_at >= cutoff)

  const campaignDates = periodCampaigns.map(c => c.created_at)
  const leadDates = periodLeads.map(l => l.created_at)
  const campaignSeries = buildDailySeries(campaignDates, days)
  const leadSeries = buildDailySeries(leadDates, days)

  // Lead funnel counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { New: 0, Contacted: 0, Interested: 0, Converted: 0, Lost: 0 }
    leads.forEach(l => { if (l.status in counts) counts[l.status]++ })
    return counts
  }, [leads])

  const totalLeads = leads.length
  const convertedLeads = leads.filter(l => l.status === 'Converted')
  const convRate = totalLeads > 0 ? Math.round((convertedLeads.length / totalLeads) * 100) : 0
  const pipelineValue = leads.filter(l => !['Lost', 'Converted'].includes(l.status)).reduce((s, l) => s + (l.estimated_value || 0), 0)
  const wonValue = convertedLeads.reduce((s, l) => s + (l.estimated_value || 0), 0)

  // Per-campaign performance
  const campaignPerf = useMemo(() => {
    return campaigns.slice(0, 10).map(c => {
      const campLeads = leads.filter(l => l.campaign_id === c.id)
      const converted = campLeads.filter(l => l.status === 'Converted').length
      const rate = campLeads.length > 0 ? Math.round((converted / campLeads.length) * 100) : 0
      const revenue = campLeads.filter(l => l.status === 'Converted').reduce((s, l) => s + (l.estimated_value || 0), 0)
      const tone = (c.metadata as Record<string, unknown>)?.tone as string | undefined
      return { ...c, leads: campLeads.length, converted, rate, revenue, tone }
    }).sort((a, b) => b.leads - a.leads)
  }, [campaigns, leads])

  // Lead source breakdown
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    leads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [leads])

  const maxSource = sourceBreakdown[0]?.[1] ?? 1

  // Period delta
  const prevCutoff = new Date(Date.now() - days * 2 * 86400000).toISOString()
  const prevPeriodLeads = leads.filter(l => l.created_at >= prevCutoff && l.created_at < cutoff).length
  const leadDelta = prevPeriodLeads > 0 ? Math.round(((periodLeads.length - prevPeriodLeads) / prevPeriodLeads) * 100) : null

  const topStats = [
    { label: 'Campaigns', value: campaigns.length, sub: `${periodCampaigns.length} this period`, icon: Zap, color: '#7c3aed', data: campaignSeries },
    { label: 'Total Leads', value: totalLeads, sub: leadDelta !== null ? `${leadDelta >= 0 ? '+' : ''}${leadDelta}% vs prev period` : `${periodLeads.length} this period`, icon: Users, color: '#2563eb', data: leadSeries },
    { label: 'Conversion Rate', value: `${convRate}%`, sub: `${convertedLeads.length} of ${totalLeads} leads`, icon: Target, color: '#059669', data: null },
    { label: 'Revenue Pipeline', value: KES(pipelineValue), sub: `${KES(wonValue)} won`, icon: DollarSign, color: '#d97706', data: null },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time performance across campaigns and leads.</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl border border-gray-200 bg-white">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-gray-500 hover:text-gray-700'
                }`}>{p}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-purple-400" /></div>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {topStats.map(s => (
                <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                      <s.icon size={15} style={{ color: s.color }} />
                    </div>
                    {s.data && <ArrowUpRight size={12} className="text-green-500 mt-1" />}
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 mb-0.5">{s.value}</p>
                  <p className="text-xs font-semibold text-gray-600">{s.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
                  {s.data && (
                    <div className="mt-2 -mx-1">
                      <SparkLine data={s.data.slice(-20)} color={s.color} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Campaign activity + Lead funnel */}
            <div className="grid lg:grid-cols-5 gap-5 mb-6">
              {/* Campaign / Lead activity chart */}
              <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Activity — last {days} days</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{periodCampaigns.length} campaigns · {periodLeads.length} leads</p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide mb-1">Leads</p>
                  <BarChart data={leadSeries.slice(-Math.min(days, 30))} color="#7c3aed" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1">Campaigns</p>
                  <BarChart data={campaignSeries.slice(-Math.min(days, 30))} color="#2563eb" />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                  <span>{period === '7d' ? '7 days ago' : period === '30d' ? '30 days ago' : '90 days ago'}</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Lead funnel */}
              <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Lead Funnel</h2>
                <p className="text-xs text-gray-400 mb-4">All time · {totalLeads} total leads</p>
                {totalLeads === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users size={24} className="text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">No leads yet — share a campaign to start capturing them.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(STATUS_META).map(([status, meta]) => (
                      <FunnelBar key={status} label={meta.label} count={statusCounts[status] ?? 0} total={totalLeads} color={meta.color} icon={meta.icon} />
                    ))}
                  </div>
                )}
                {totalLeads > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs">
                    <span className="text-gray-500">Conversion rate</span>
                    <span className="font-bold text-emerald-600">{convRate}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign performance table + Lead sources */}
            <div className="grid lg:grid-cols-5 gap-5 mb-6">
              {/* Campaign performance */}
              <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">Campaign Performance</h2>
                  <Link to="/campaigns" className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    All campaigns <ChevronRight size={11} />
                  </Link>
                </div>
                {campaignPerf.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                    <BarChart2 size={24} className="text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">No campaigns yet.</p>
                    <Link to="/new-campaign" className="text-xs text-purple-600 hover:text-purple-700 mt-1">Create your first →</Link>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-4 px-5 py-2 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      <span className="col-span-2">Campaign</span>
                      <span className="text-center">Leads</span>
                      <span className="text-right">Conv. Rate</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {campaignPerf.map(c => (
                        <Link key={c.id} to={`/campaigns/${c.id}`}
                          className="grid grid-cols-4 items-center px-5 py-3 hover:bg-gray-50 transition-colors group">
                          <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <FileText size={12} className="text-purple-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">{c.title}</p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Calendar size={9} />
                                {new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                                {c.tone && <span className="ml-1 px-1 py-0.5 rounded bg-purple-50 text-purple-500">{c.tone}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <span className={`text-sm font-bold ${c.leads > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{c.leads}</span>
                          </div>
                          <div className="text-right">
                            {c.leads > 0 ? (
                              <span className={`text-sm font-bold ${c.rate >= 50 ? 'text-emerald-600' : c.rate >= 20 ? 'text-amber-500' : 'text-gray-500'}`}>
                                {c.rate}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lead sources + Revenue */}
              <div className="lg:col-span-2 space-y-4">
                {/* Revenue card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-3">Revenue</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[11px] text-gray-500">Open pipeline</p>
                        <p className="text-lg font-extrabold text-gray-900">{KES(pipelineValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500">Won</p>
                        <p className="text-lg font-extrabold text-emerald-600">{KES(wonValue)}</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      {(pipelineValue + wonValue) > 0 && (
                        <div className="h-full rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${(wonValue / (pipelineValue + wonValue)) * 100}%` }} />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">
                      {(pipelineValue + wonValue) > 0
                        ? `${Math.round((wonValue / (pipelineValue + wonValue)) * 100)}% closed`
                        : 'Add estimated values to leads to track revenue'
                      }
                    </p>
                  </div>
                </div>

                {/* Lead sources */}
                {sourceBreakdown.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-3">Lead Sources</h2>
                    <div className="space-y-2.5">
                      {sourceBreakdown.map(([source, count]) => (
                        <div key={source}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{source}</span>
                            <span className="font-bold text-gray-900">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${(count / maxSource) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
