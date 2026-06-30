import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart2, TrendingUp, Users, DollarSign, Target, Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ReportStats {
  weekCampaigns: number
  weekLeads: number
  weekConverted: number
  weekLost: number
  totalLeads: number
  totalConverted: number
  convRate: number
  pipelineValue: number
  wonValue: number
  topSource: string
  periodStart: string
  periodEnd: string
}

interface Report {
  id: string
  report_token: string
  period_start: string
  period_end: string
  stats: ReportStats
  narrative: string
  created_at: string
}

const KES = (n: number) => `KES ${(n ?? 0).toLocaleString()}`

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ReportView() {
  const { token } = useParams<{ token: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    supabase
      .from('weekly_reports')
      .select('*')
      .eq('report_token', token)
      .single()
      .then(({ data, error: e }) => {
        if (e || !data) setError('Report not found or link has expired.')
        else setReport(data as Report)
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={22} className="animate-spin text-purple-500" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <BarChart2 size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-800">{error || 'Report not found'}</p>
          <Link to="/" className="text-purple-600 text-sm mt-3 inline-block hover:underline">← Go to Nia Media</Link>
        </div>
      </div>
    )
  }

  const s = report.stats

  const metrics = [
    { icon: Users, label: 'New leads this week', value: String(s.weekLeads), color: '#7c3aed' },
    { icon: Target, label: 'Converted this week', value: String(s.weekConverted), color: '#2563eb' },
    { icon: TrendingUp, label: 'Overall conversion', value: `${s.convRate}%`, color: '#059669' },
    { icon: DollarSign, label: 'Revenue won (all time)', value: KES(s.wonValue), color: '#d97706' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header — hidden on print */}
      <div className="print:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={15} /> Back to Nia Media
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Brand header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nia Media</p>
            <p className="font-bold text-gray-900">Weekly Performance Report</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            {fmt(report.period_start)} — {fmt(report.period_end)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Generated {fmt(report.created_at)}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {metrics.map(m => (
            <div key={m.label} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <m.icon size={14} style={{ color: m.color }} />
                <p className="text-[11px] font-semibold text-gray-500">{m.label}</p>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Week highlights</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Campaigns created</span>
              <span className="font-semibold text-gray-900">{s.weekCampaigns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Leads lost</span>
              <span className="font-semibold text-gray-900">{s.weekLost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Top lead source</span>
              <span className="font-semibold text-gray-900">{s.topSource}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total leads (all time)</span>
              <span className="font-semibold text-gray-900">{s.totalLeads}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-500">Open pipeline value</span>
              <span className="font-semibold text-emerald-600">{KES(s.pipelineValue)}</span>
            </div>
          </div>
        </div>

        {/* AI narrative */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 mb-8">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Nia's Analysis</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{report.narrative}</p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">Powered by</p>
          <a href="https://niamedia.co.ke" className="text-sm font-bold text-purple-600 hover:underline print:no-underline">
            Nia Media — AI Marketing for East Africa
          </a>
        </div>
      </div>
    </div>
  )
}
