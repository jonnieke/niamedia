import { useState, useEffect, useCallback } from 'react'
import { Zap, TrendingUp, Users, Receipt, Check, Loader2, RefreshCw, ChevronRight, Star, Building2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Link, useLocation } from 'react-router-dom'

interface UsageStats {
  creditsRemaining: number
  creditsUsedThisMonth: number
  creditsPurchasedThisMonth: number
  campaignsThisMonth: number
  leadsThisMonth: number
  autoTopup: boolean
  plan: 'free' | 'pro' | 'agency'
}

interface Transaction {
  id: string
  date: string
  desc: string
  amount: number
  credits: number
  status: string
}

const CREDIT_PACKS = [
  { id: '1',  credits: 1,  price: 500,  label: 'Single',  perCredit: 500, badge: null,         highlight: false },
  { id: '5',  credits: 5,  price: 2000, label: 'Growth',  perCredit: 400, badge: 'Save KES 500', highlight: true  },
  { id: '12', credits: 12, price: 4000, label: 'Pro Pack', perCredit: 333, badge: 'Best value', highlight: false },
]

const PLAN_DETAILS = {
  free:   { label: 'Free',   color: '#64748b', bg: '#f1f5f9', desc: 'Pay per campaign' },
  pro:    { label: 'Pro',    color: '#7c3aed', bg: '#ede9fe', desc: 'Power users & SMEs' },
  agency: { label: 'Agency', color: '#2563eb', bg: '#dbeafe', desc: 'Teams & agencies' },
}

function UsageMeter({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">{value} / {max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Billing() {
  const { user } = useAuth()
  const location = useLocation()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [buyError, setBuyError] = useState('')
  const [togglingAutoTopup, setTogglingAutoTopup] = useState(false)

  const loadAll = useCallback(async () => {
    if (!user) return
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [profileRes, campaignsRes, leadsRes, txRes, audioRes] = await Promise.all([
      supabase.from('profiles').select('credits, subscription_plan, auto_topup').eq('id', user.id).single(),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
      supabase.from('credit_transactions').select('id, amount, description, created_at, payment_status').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('audio_orders').select('id, title, price_kes, payment_status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    const profile = profileRes.data
    const allTx = txRes.data ?? []

    const creditsUsedThisMonth = allTx
      .filter(t => t.amount < 0 && t.created_at >= monthStart)
      .reduce((s, t) => s + Math.abs(t.amount), 0)
    const creditsPurchasedThisMonth = allTx
      .filter(t => t.amount > 0 && t.created_at >= monthStart && t.payment_status === 'paid')
      .reduce((s, t) => s + t.amount, 0)

    setStats({
      creditsRemaining: profile?.credits ?? 0,
      creditsUsedThisMonth,
      creditsPurchasedThisMonth,
      campaignsThisMonth: campaignsRes.count ?? 0,
      leadsThisMonth: leadsRes.count ?? 0,
      autoTopup: profile?.auto_topup ?? false,
      plan: (profile?.subscription_plan ?? 'free') as 'free' | 'pro' | 'agency',
    })

    // Merge credit + audio transactions
    const CREDIT_KES: Record<number, number> = { 1: 500, 5: 2000, 12: 4000 }
    const creditTx: Transaction[] = allTx.filter(t => t.amount > 0).map(t => ({
      id: t.id,
      date: t.created_at,
      desc: t.description || `${t.amount} campaign credit${t.amount !== 1 ? 's' : ''}`,
      amount: CREDIT_KES[t.amount] ?? t.amount * 500,
      credits: t.amount,
      status: t.payment_status === 'paid' ? 'Paid' : t.payment_status === 'failed' ? 'Failed' : 'Pending',
    }))
    const audioTx: Transaction[] = (audioRes.data ?? []).map(o => ({
      id: o.id,
      date: o.created_at,
      desc: o.title || 'Audio order',
      amount: o.price_kes ?? 0,
      credits: 0,
      status: o.payment_status === 'paid' ? 'Paid' : o.payment_status === 'failed' ? 'Failed' : 'Pending',
    }))
    const merged = [...creditTx, ...audioTx].sort((a, b) => +new Date(b.date) - +new Date(a.date))
    setTransactions(merged)
    setTxLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) return
    loadAll()
  }, [user, loadAll])

  // Reload stats when PesaPal redirects back with ?credits=added
  useEffect(() => {
    if (new URLSearchParams(location.search).get('credits') === 'added') loadAll()
  }, [location.search, loadAll])

  const buyCredits = async (pack: typeof CREDIT_PACKS[0]) => {
    if (!user || buying) return
    setBuying(pack.id)
    setBuyError('')
    try {
      const { data, error } = await supabase.functions.invoke('buy-credits', {
        body: {
          pkg: pack.id,
          callbackUrl: `${window.location.origin}/billing?credits=added`,
          email: user.email,
          firstName: user.name?.split(' ')[0] ?? '',
          lastName: user.name?.split(' ')[1] ?? '',
        },
      })
      if (error || !data?.redirectUrl) throw new Error(data?.error ?? error?.message ?? 'Checkout failed')
      window.location.href = data.redirectUrl
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Something went wrong')
      setBuying(null)
    }
  }

  const toggleAutoTopup = async () => {
    if (!user || !stats) return
    setTogglingAutoTopup(true)
    const next = !stats.autoTopup
    await supabase.from('profiles').update({ auto_topup: next }).eq('id', user.id)
    setStats(s => s ? { ...s, autoTopup: next } : s)
    setTogglingAutoTopup(false)
  }

  const plan = stats ? PLAN_DETAILS[stats.plan] : PLAN_DETAILS.free

  return (
    <DashboardLayout>
      <div className="max-w-4xl">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-sm text-gray-500 mt-1">Track your credits, campaigns, and payment history.</p>
        </div>

        {/* Top row: Plan card + Usage stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">

          {/* Plan badge */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: plan.bg }}>
                {stats?.plan === 'agency' ? <Building2 size={15} style={{ color: plan.color }} />
                  : stats?.plan === 'pro' ? <Star size={15} style={{ color: plan.color }} />
                  : <Zap size={15} style={{ color: plan.color }} />}
              </div>
              <div>
                <p className="text-xs text-gray-500">Current plan</p>
                <p className="text-sm font-bold text-gray-900">{plan.label}</p>
              </div>
            </div>

            {stats ? (
              <>
                <div className="text-3xl font-extrabold text-gray-900 flex items-end gap-1.5">
                  {stats.creditsRemaining}
                  <span className="text-sm font-medium text-gray-400 mb-0.5">
                    credit{stats.creditsRemaining !== 1 ? 's' : ''} left
                  </span>
                </div>
                <UsageMeter
                  label="Credits used this month"
                  value={stats.creditsUsedThisMonth}
                  max={stats.creditsUsedThisMonth + stats.creditsRemaining || 1}
                  color={plan.color}
                />
              </>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Campaigns this month */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500">
              <TrendingUp size={14} />
              <span className="text-xs font-medium">Campaigns — this month</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {stats?.campaignsThisMonth ?? <span className="text-gray-300">—</span>}
            </p>
            <Link to="/campaigns" className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-auto">
              View all campaigns <ChevronRight size={11} />
            </Link>
          </div>

          {/* Leads this month */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-500">
              <Users size={14} />
              <span className="text-xs font-medium">Leads — this month</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {stats?.leadsThisMonth ?? <span className="text-gray-300">—</span>}
            </p>
            <Link to="/leads" className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-auto">
              View all leads <ChevronRight size={11} />
            </Link>
          </div>
        </div>

        {/* Buy credits */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Buy Campaign Credits</h2>
              <p className="text-xs text-gray-500 mt-0.5">Each credit generates a full campaign — WhatsApp copy, captions, poster, video script, and landing page.</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
              M-Pesa · Card
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {CREDIT_PACKS.map(pack => (
              <button key={pack.id} onClick={() => buyCredits(pack)} disabled={!!buying}
                className={`text-left rounded-xl border p-4 transition-all relative overflow-hidden disabled:opacity-60 ${
                  pack.highlight
                    ? 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}>
                {pack.badge && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: pack.highlight ? '#ede9fe' : '#d1fae5',
                      color: pack.highlight ? '#7c3aed' : '#065f46',
                    }}>
                    {pack.badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black mb-3"
                  style={{
                    background: pack.highlight ? '#7c3aed' : '#f3f4f6',
                    color: pack.highlight ? '#fff' : '#374151',
                  }}>
                  {pack.credits}
                </div>
                <p className="text-sm font-bold text-gray-900">{pack.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">KES {pack.perCredit.toLocaleString()} / campaign</p>
                <p className="text-base font-extrabold text-gray-900 mt-2">
                  KES {pack.price.toLocaleString()}
                  {buying === pack.id && <Loader2 size={13} className="animate-spin inline ml-2 text-purple-500" />}
                </p>
              </button>
            ))}
          </div>

          {buyError && <p className="text-xs text-red-500 mt-3 text-center">{buyError}</p>}

          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-gray-100">
            {[
              'Video scripts, captions, WhatsApp, poster & landing page per credit',
              'Credits never expire — use them whenever you need',
              'Refine any section after generation at no extra charge',
            ].map(f => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check size={11} className="text-emerald-500 shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* Auto top-up */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Auto top-up</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  When your balance hits 0, automatically purchase the Growth pack (5 credits for KES 2,000) so you never miss a campaign.
                </p>
              </div>
            </div>
            <button
              onClick={toggleAutoTopup}
              disabled={togglingAutoTopup || !stats}
              className="relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors disabled:opacity-50"
              style={{ background: stats?.autoTopup ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : '#e5e7eb' }}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${stats?.autoTopup ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {stats?.autoTopup && (
            <p className="text-[11px] text-purple-600 mt-3 ml-12">
              Auto top-up is on — your M-Pesa/card will be charged when your balance reaches zero.
            </p>
          )}
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Receipt size={14} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Payment History</h2>
          </div>

          {txLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={18} className="animate-spin text-purple-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No transactions yet.</p>
              <p className="text-xs text-gray-400 mt-1">Credit purchases and audio orders appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    {tx.credits > 0 ? <Zap size={13} className="text-purple-600" /> : <Receipt size={13} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tx.desc}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {tx.credits > 0 && <span className="ml-2 text-purple-500 font-medium">+{tx.credits} credit{tx.credits !== 1 ? 's' : ''}</span>}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">KES {tx.amount.toLocaleString()}</p>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    tx.status === 'Paid' ? 'bg-green-50 text-green-600 border border-green-200'
                    : tx.status === 'Failed' ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>{tx.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
