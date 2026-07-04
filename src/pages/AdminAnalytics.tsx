import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, RefreshCw, Loader2, ArrowLeft, Zap, Film, Mic, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'

const KES = (n: number) => `KES ${n.toLocaleString('en-KE')}`
const fmtK = (n: number) => n >= 1000 ? `KES ${(n / 1000).toFixed(1)}K` : KES(n)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function last6Months() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS[d.getMonth()] }
  })
}

interface Proposal { final_price: number; deposit_amount: number; paid_at: string | null; status: string; created_at: string; business_name: string }
interface Retainer { monthly_price: number; total_billed: number; months_billed: number; status: string; last_billed_at: string | null; business_name: string }
interface AudioOrder { total: number; paid_at: string | null; status: string }
interface CreditTxn { amount: number; payment_status: string; created_at: string }
interface Intake { created_at: string; status: string }

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-28 mt-3">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-gray-500 font-semibold">{d.value > 0 ? fmtK(d.value) : ''}</span>
          <div className="w-full rounded-t-lg transition-all duration-500"
            style={{ height: `${Math.max(4, (d.value / max) * 72)}px`, background: color, opacity: d.value === 0 ? 0.15 : 0.9 }} />
          <span className="text-[10px] text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 leading-tight mt-0.5">{value}</p>
        <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>
      </div>
    </div>
  )
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900">{count} <span className="font-normal text-gray-400">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [retainers, setRetainers] = useState<Retainer[]>([])
  const [audioOrders, setAudioOrders] = useState<AudioOrder[]>([])
  const [creditTxns, setCreditTxns] = useState<CreditTxn[]>([])
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('proposals').select('final_price,deposit_amount,paid_at,status,created_at,business_name').order('created_at', { ascending: false }),
      supabase.from('retainers').select('monthly_price,total_billed,months_billed,status,last_billed_at,business_name').order('total_billed', { ascending: false }),
      supabase.from('audio_orders').select('total,paid_at,status'),
      supabase.from('credit_transactions').select('amount,payment_status,created_at').eq('payment_status', 'paid'),
      supabase.from('client_intakes').select('created_at,status'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([p, r, ao, ct, ci, us]) => {
      setProposals((p.data ?? []) as Proposal[])
      setRetainers((r.data ?? []) as Retainer[])
      setAudioOrders((ao.data ?? []) as AudioOrder[])
      setCreditTxns((ct.data ?? []) as CreditTxn[])
      setIntakes((ci.data ?? []) as Intake[])
      setUserCount(us.count ?? 0)
      setLoading(false)
    })
  }, [])

  const months = last6Months()

  // Revenue calculations
  const paidProposals = proposals.filter(p => p.paid_at || p.status === 'paid')
  const proposalRevenue = paidProposals.reduce((s, p) => s + (p.deposit_amount ?? 0), 0)
  const audioRevenue = audioOrders.filter(o => o.paid_at || o.status === 'paid').reduce((s, o) => s + (o.total ?? 0), 0)
  const creditRevenue = creditTxns.reduce((s, t) => {
    const pkg: Record<number, number> = { 1: 500, 5: 2000, 12: 4000 }
    return s + (pkg[t.amount] ?? t.amount * 500)
  }, 0)
  const activeRetainers = retainers.filter(r => r.status === 'active')
  const mrr = activeRetainers.reduce((s, r) => s + r.monthly_price, 0)
  const retainerRevenue = retainers.reduce((s, r) => s + r.total_billed, 0)
  const totalRevenue = proposalRevenue + audioRevenue + creditRevenue + retainerRevenue

  // Monthly proposal revenue trend
  const monthlyRevenue = months.map(m => ({
    label: m.label,
    value: paidProposals
      .filter(p => p.paid_at && monthKey(p.paid_at) === m.key)
      .reduce((s, p) => s + (p.deposit_amount ?? 0), 0) +
    audioOrders
      .filter(o => o.paid_at && monthKey(o.paid_at) === m.key)
      .reduce((s, o) => s + (o.total ?? 0), 0) +
    creditTxns
      .filter(t => monthKey(t.created_at) === m.key)
      .reduce((s, t) => {
        const pkg: Record<number, number> = { 1: 500, 5: 2000, 12: 4000 }
        return s + (pkg[t.amount] ?? t.amount * 500)
      }, 0),
  }))

  // Intake trend by month
  const monthlyIntakes = months.map(m => ({
    label: m.label,
    value: intakes.filter(i => monthKey(i.created_at) === m.key).length,
  }))

  // Proposal funnel
  const pTotal = proposals.length
  const pSent = proposals.filter(p => ['sent', 'accepted', 'paid', 'declined', 'expired'].includes(p.status)).length
  const pAccepted = proposals.filter(p => ['accepted', 'paid'].includes(p.status)).length
  const pPaid = proposals.filter(p => p.status === 'paid' || p.paid_at).length

  // Service mix
  const serviceMix = [
    { label: 'Video Proposals', value: proposalRevenue, color: '#7c3aed', icon: Film },
    { label: 'Retainers', value: retainerRevenue, color: '#2563eb', icon: RefreshCw },
    { label: 'Audio Orders', value: audioRevenue, color: '#059669', icon: Mic },
    { label: 'Credits', value: creditRevenue, color: '#d97706', icon: Zap },
  ].filter(s => s.value > 0).sort((a, b) => b.value - a.value)
  const maxMix = serviceMix[0]?.value ?? 1

  // Top clients by proposal revenue
  const clientRevMap: Record<string, number> = {}
  paidProposals.forEach(p => {
    clientRevMap[p.business_name] = (clientRevMap[p.business_name] ?? 0) + (p.deposit_amount ?? 0)
  })
  retainers.filter(r => r.total_billed > 0).forEach(r => {
    clientRevMap[r.business_name] = (clientRevMap[r.business_name] ?? 0) + r.total_billed
  })
  const topClients = Object.entries(clientRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={22} className="animate-spin text-purple-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-purple-600" /> Revenue Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Financial overview across all revenue streams.</p>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Revenue" value={fmtK(totalRevenue)} sub={`All streams · all time`} icon={DollarSign} color="#7c3aed" />
          <StatCard label="Monthly Recurring" value={fmtK(mrr)} sub={`${activeRetainers.length} active retainer${activeRetainers.length !== 1 ? 's' : ''}`} icon={RefreshCw} color="#2563eb" />
          <StatCard label="Annual Run Rate" value={fmtK(mrr * 12)} sub="Based on active retainers" icon={TrendingUp} color="#059669" />
          <StatCard label="Total Clients" value={userCount} sub={`${topClients.length} paying client${topClients.length !== 1 ? 's' : ''}`} icon={Users} color="#d97706" />
        </div>

        {/* Monthly Revenue Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Revenue Trend — Last 6 Months</p>
            <BarChart data={monthlyRevenue} color="#7c3aed" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Intakes — Last 6 Months</p>
            <BarChart data={monthlyIntakes} color="#2563eb" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Proposal Funnel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Proposal Funnel</p>
            <FunnelBar label="Total Proposals" count={pTotal} total={pTotal} color="#e5e7eb" />
            <FunnelBar label="Sent to Client" count={pSent} total={pTotal} color="#8b5cf6" />
            <FunnelBar label="Accepted" count={pAccepted} total={pTotal} color="#3b82f6" />
            <FunnelBar label="Deposit Paid" count={pPaid} total={pTotal} color="#10b981" />
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Close rate: <strong className="text-gray-900">{pTotal > 0 ? Math.round((pPaid / pTotal) * 100) : 0}%</strong></p>
              <p className="text-xs text-gray-500">Avg deal: <strong className="text-gray-900">{pPaid > 0 ? fmtK(Math.round(proposalRevenue / pPaid)) : '—'}</strong></p>
            </div>
          </div>

          {/* Service Mix */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Revenue by Service</p>
            {serviceMix.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No revenue data yet</p>
            ) : (
              <div className="space-y-3">
                {serviceMix.map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <s.icon size={12} style={{ color: s.color }} />
                        <span className="text-xs font-semibold text-gray-600">{s.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{fmtK(s.value)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((s.value / maxMix) * 100)}%`, background: s.color }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 text-right">{totalRevenue > 0 ? Math.round((s.value / totalRevenue) * 100) : 0}% of total</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Retainer MRR breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Retainer MRR</p>
            {activeRetainers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No active retainers</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {activeRetainers.slice(0, 6).map(r => (
                    <div key={r.business_name} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 truncate flex-1">{r.business_name}</span>
                      <span className="text-xs font-bold text-gray-900 shrink-0 ml-2">{fmtK(r.monthly_price)}</span>
                    </div>
                  ))}
                  {activeRetainers.length > 6 && (
                    <p className="text-[11px] text-gray-400">+{activeRetainers.length - 6} more</p>
                  )}
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">MRR</span>
                    <span className="font-bold text-purple-700">{fmtK(mrr)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ARR</span>
                    <span className="font-bold text-gray-900">{fmtK(mrr * 12)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total Billed</span>
                    <span className="font-bold text-gray-900">{fmtK(retainerRevenue)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Top Clients by Revenue</p>
          {topClients.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No revenue data yet</p>
          ) : (
            <div className="space-y-2">
              {topClients.map(([name, rev], i) => {
                const pct = Math.round((rev / topClients[0][1]) * 100)
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-gray-700 truncate">{name}</span>
                        <span className="text-xs font-bold text-gray-900 shrink-0 ml-2">{fmtK(rev)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: i === 0 ? 'linear-gradient(90deg,#7c3aed,#2563eb)' : '#e5e7eb' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
