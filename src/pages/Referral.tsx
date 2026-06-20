import { useState, useEffect } from 'react'
import { Copy, Check, Gift, Users, Zap, ArrowRight, Star, Share2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const TIERS = [
  { refs: 1, reward: 'KES 500 credit',    desc: 'Applied to your next invoice',       color: '#8b5cf6', icon: Zap },
  { refs: 3, reward: 'KES 2,000 credit',  desc: 'For 3 successful referrals',          color: '#3b82f6', icon: Star },
  { refs: 5, reward: '1 Month Free',       desc: 'Growth Pack subscription â€” free',    color: '#10b981', icon: Gift },
]

interface Referral {
  id: string
  referee_email: string
  status: 'pending' | 'active' | 'rewarded'
  credit_kes: number
  created_at: string
}

export default function Referral() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  const referralCode = user ? `NIA-${user.id.slice(0, 6).toUpperCase()}` : 'NIA-XXXXXX'
  const referralUrl = `https://niamedia.co.ke/join?ref=${referralCode}`

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('referrals')
      .select('id, referee_email, status, credit_kes, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReferrals((data as Referral[]) ?? [])
        setLoading(false)
      })
  }, [user])

  const activeRefs = referrals.filter(r => r.status === 'active' || r.status === 'rewarded').length
  const totalCredit = referrals.reduce((s, r) => s + r.credit_kes, 0)
  const nextTier = TIERS.find(t => t.refs > activeRefs) ?? TIERS[TIERS.length - 1]
  const refsToNext = Math.max(0, nextTier.refs - activeRefs)

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <span className="section-tag mb-2 inline-block">Referral Program</span>
          <h1 className="text-2xl font-bold text-gray-900">Refer & Earn</h1>
          <p className="text-sm text-gray-500 mt-1">Invite other Kenyan businesses. Earn platform credits every time someone joins and subscribes.</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Friends Referred', value: referrals.length, sub: `${activeRefs} active`, color: '#8b5cf6' },
            { label: 'Credits Earned', value: totalCredit > 0 ? `KES ${totalCredit.toLocaleString()}` : 'â€”', sub: 'Applied to invoices', color: '#10b981' },
            { label: 'Next Reward', value: nextTier.reward, sub: `${refsToNext} more referral${refsToNext !== 1 ? 's' : ''}`, color: '#f59e0b' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="card-glow p-5">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Referral link card */}
        <div className="card-glow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <Share2 size={14} className="text-purple-400" />
            <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Your Referral Link</p>
          </div>

          <p className="text-sm text-gray-500 mb-5">
            Share your unique link or code. When someone signs up and starts a paid subscription, you both get rewarded.
          </p>

          {/* Code */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white/3">
              <span className="font-mono text-sm font-bold text-gray-900 tracking-widest">{referralCode}</span>
              <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy code</>}
              </button>
            </div>
          </div>

          {/* Full link */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white/3 min-w-0">
              <span className="text-xs text-gray-500 truncate mr-3">{referralUrl}</span>
              <button onClick={copyLink} className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors shrink-0">
                {copiedLink ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy link</>}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex gap-3">
            <a href={`https://wa.me/?text=Join%20Nia%20Media%20-%20Africa's%20AI-powered%20creative%20platform%20for%20businesses.%20Use%20my%20code%20${referralCode}%20to%20get%20started%3A%20${encodeURIComponent(referralUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-semibold hover:bg-green-500/15 transition-colors">
              <Share2 size={14} /> Share on WhatsApp
            </a>
            <button onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:border-white/20 hover:text-white transition-colors">
              <Copy size={14} /> Copy Link
            </button>
          </div>
        </div>

        {/* Reward tiers */}
        <div className="card-glow p-6 mb-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200">
            <Gift size={14} className="text-purple-400" />
            <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Reward Tiers</p>
          </div>

          <div className="space-y-3">
            {TIERS.map((tier, i) => {
              const Icon = tier.icon
              const achieved = activeRefs >= tier.refs
              const isCurrent = !achieved && (i === 0 || activeRefs >= TIERS[i - 1].refs)
              return (
                <div key={tier.refs}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    achieved ? 'border-green-500/30 bg-green-500/6' :
                    isCurrent ? 'border-purple-500/30 bg-purple-500/8' :
                    'border-gray-200 bg-white/2'
                  }`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: achieved ? 'rgba(16,185,129,0.2)' : `${tier.color}20` }}>
                    {achieved
                      ? <Check size={18} className="text-green-400" />
                      : <Icon size={18} style={{ color: tier.color }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{tier.reward}</p>
                      {achieved && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">Unlocked</span>}
                      {isCurrent && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">Next goal</span>}
                    </div>
                    <p className="text-xs text-gray-500">{tier.refs} successful referral{tier.refs !== 1 ? 's' : ''} â€” {tier.desc}</p>
                  </div>
                  {isCurrent && (
                    <div className="w-24 shrink-0">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(activeRefs / tier.refs) * 100}%`, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}99)` }} />
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1 text-right">{activeRefs}/{tier.refs}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-600 mt-4">Credits are applied automatically to your next invoice. Rewards stack â€” reach all 3 tiers to earn everything.</p>
        </div>

        {/* Referral table */}
        <div className="card-glow overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users size={14} className="text-purple-400" />
            <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">People You've Referred</p>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={32} className="mx-auto mb-3 text-gray-700" />
              <p className="text-sm text-gray-500">No referrals yet. Share your link to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    {r.referee_email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.referee_email}</p>
                    <p className="text-xs text-gray-500">Joined {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    r.status !== 'pending' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>{r.status === 'active' ? 'Active' : r.status === 'rewarded' ? 'Rewarded' : 'Pending'}</span>
                  {r.credit_kes > 0 && (
                    <p className="text-xs font-bold text-green-400 shrink-0">+KES {r.credit_kes.toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3.5 border-t border-gray-200 bg-white/1 flex items-center justify-between">
            <p className="text-xs text-gray-500">Total earned: <strong className="text-green-400">KES {totalCredit.toLocaleString()}</strong></p>
            <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
              View credit history <ArrowRight size={11} />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center mt-5">
          Credits apply to active subscribers only. Referrals must complete a paid plan within 30 days of signing up. Platform credit has no cash value.
        </p>
      </div>
    </DashboardLayout>
  )
}

