import { useState, useRef, useEffect } from 'react'
import { Save, Bell, Shield, User, CreditCard, Check, Zap, Film, Music, AlertCircle, Camera, Loader2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../lib/AuthContext'
import { supabase, uploadAvatar } from '../lib/supabase'

type Tab = 'profile' | 'plan' | 'billing' | 'notifications' | 'security'

const PLANS = [
  { id: 'free', label: 'Free', price: 0, features: ['Concept Studio', 'Campaign copy preview', '1 active project'], color: '#94a3b8' },
  { id: 'starter', label: 'Starter', price: 5000, period: 'one-time', features: ['Everything in Free', '1 video project', 'Campaign copy', 'Asset Library'], color: '#8b5cf6' },
  { id: 'growth', label: 'Growth', price: 30000, period: '/month', features: ['Everything in Starter', '4 video ad scripts/mo', '8 social ideas/mo', 'Priority support', 'Analytics'], color: '#3b82f6', popular: true },
  { id: 'business', label: 'Business', price: 60000, period: '/month', features: ['Everything in Growth', '12 video concepts/mo', 'Full strategy', 'Dedicated account manager', 'Rush delivery'], color: '#10b981' },
]

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
      style={{ background: on ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.1)' }}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function Settings() {
  const { user, refreshProfile } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')

  // Profile tab
  const [name, setName] = useState(user?.name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Security tab
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  const [currentPlan] = useState('growth')
  const [notifs, setNotifs] = useState({
    projectReady: true, revisionDone: true, audioReady: true,
    campaigns: true, billing: true, product: false,
  })
  const [emailMarketing, setEmailMarketing] = useState(true)
  const [emailMarketingSaving, setEmailMarketingSaving] = useState(false)

  // Billing history — real transactions
  const [billing, setBilling] = useState<{ id: string; date: string; desc: string; amount: number; status: string }[]>([])
  const [billingLoading, setBillingLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('email_marketing_opt_out').eq('id', user.id).single()
      .then(({ data }) => { if (data) setEmailMarketing(!data.email_marketing_opt_out) })
  }, [user])

  useEffect(() => {
    if (!user) return
    const CREDIT_KES: Record<number, number> = { 1: 500, 5: 2000, 12: 4000 }
    Promise.all([
      supabase.from('credit_transactions').select('id, amount, description, created_at, payment_status')
        .eq('user_id', user.id).gt('amount', 0).order('created_at', { ascending: false }),
      supabase.from('audio_orders').select('id, title, price_kes, payment_status, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([credits, audio]) => {
      const creditRows = (credits.data ?? []).map(t => ({
        id: t.id,
        date: t.created_at,
        desc: t.description || `${t.amount} campaign credit${t.amount !== 1 ? 's' : ''}`,
        amount: CREDIT_KES[t.amount] ?? t.amount * 500,
        status: t.payment_status === 'paid' ? 'Paid' : t.payment_status === 'failed' ? 'Failed' : 'Pending',
      }))
      const audioRows = (audio.data ?? []).map(o => ({
        id: o.id,
        date: o.created_at,
        desc: o.title || 'Audio order',
        amount: o.price_kes ?? 0,
        status: o.payment_status === 'paid' ? 'Paid' : o.payment_status === 'failed' ? 'Failed' : 'Pending',
      }))
      const merged = [...creditRows, ...audioRows].sort((a, b) => +new Date(b.date) - +new Date(a.date))
      setBilling(merged)
      setBillingLoading(false)
    })
  }, [user])

  const toggleEmailMarketing = async () => {
    const next = !emailMarketing
    setEmailMarketing(next)
    setEmailMarketingSaving(true)
    await supabase.from('profiles').update({ email_marketing_opt_out: !next }).eq('id', user!.id)
    setEmailMarketingSaving(false)
  }

  const toggleN = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }))

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'plan', label: 'Plan & Upgrade' },
    { id: 'billing', label: 'Billing History' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ]

  const Card = ({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) => (
    <div className="card-glow p-6">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200">
        <Icon size={14} className="text-purple-400" />
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  )

  const handleSaveProfile = async () => {
    if (!user) return
    setProfileSaving(true)
    setProfileError('')
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', user.id)
    if (error) {
      setProfileError(error.message)
    } else {
      await refreshProfile()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    }
    setProfileSaving(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) { setProfileError('Image must be under 2 MB'); return }
    setAvatarUploading(true)
    setProfileError('')
    const url = await uploadAvatar(user.id, file)
    if (url) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      setAvatarUrl(url)
      await refreshProfile()
    } else {
      setProfileError('Avatar upload failed. Please try again.')
    }
    setAvatarUploading(false)
  }

  const handlePasswordChange = async () => {
    setPwError('')
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwError(error.message)
    } else {
      setPwSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSaved(false), 3000)
    }
    setPwSaving(false)
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account, plan, and preferences.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-all border-b-2 -mb-px ${
                tab === t.id ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-500 hover:text-gray-600'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Profile */}
        {tab === 'profile' && (
          <div className="space-y-5">
            <Card title="Profile" icon={User}>
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200">
                <div className="relative shrink-0">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-16 h-16 rounded-2xl overflow-hidden group"
                    title="Change profile photo"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-900"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                        {name.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.55)' }}>
                      {avatarUploading
                        ? <Loader2 size={18} className="text-white animate-spin" />
                        : <Camera size={18} className="text-white" />}
                    </div>
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Click photo to change · PNG/JPG/WebP · max 2 MB</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    {user?.role === 'admin' ? 'Admin' : 'Growth Plan'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input className="input opacity-50 cursor-not-allowed" value={user?.email || ''} disabled />
                  <p className="text-xs text-gray-600 mt-1">Email changes require verification — contact support.</p>
                </div>
              </div>
            </Card>
            {profileError && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
                <AlertCircle size={13} /> {profileError}
              </div>
            )}
            <button
              onClick={handleSaveProfile}
              disabled={profileSaving || !name.trim()}
              className="btn-primary w-full py-3 text-sm gap-2 disabled:opacity-50">
              <Save size={15} />
              {profileSaving ? 'Saving...' : profileSaved ? 'Saved ✓' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Plan */}
        {tab === 'plan' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-purple-500/25 bg-purple-500/8 flex items-center gap-3 mb-2">
              <Zap size={15} className="text-purple-400 shrink-0" />
              <p className="text-sm text-purple-300">
                You're on the <strong>Growth Pack</strong> — KES 30,000/month. Renews 1 Jul 2026.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLANS.map(plan => {
                const isCurrent = plan.id === currentPlan
                const icons: Record<string, typeof Zap> = { free: User, starter: Film, growth: Zap, business: Music }
                const Icon = icons[plan.id]
                return (
                  <div key={plan.id} className={`rounded-2xl border p-5 flex flex-col transition-all ${
                    isCurrent ? 'border-purple-500/50 bg-purple-500/8' : 'border-gray-200 bg-white/2 hover:border-gray-300'
                  }`}>
                    {plan.popular && (
                      <span className="self-start mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-900"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>Most Popular</span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${plan.color}20` }}>
                        <Icon size={15} style={{ color: plan.color }} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">{plan.label}</p>
                      {isCurrent && <span className="ml-auto text-[10px] font-bold text-purple-400">Current</span>}
                    </div>
                    <p className="text-xl font-extrabold text-white mb-0.5">
                      {plan.price === 0 ? 'Free' : `KES ${plan.price.toLocaleString()}`}
                      {plan.period && <span className="text-xs font-normal text-gray-500 ml-1">{plan.period}</span>}
                    </p>
                    <div className="my-3 space-y-1.5 flex-1">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                          <Check size={11} style={{ color: plan.color }} /> {f}
                        </div>
                      ))}
                    </div>
                    <button className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                      isCurrent ? 'border border-gray-200 text-gray-500 cursor-not-allowed' : 'btn-primary'
                    }`} disabled={isCurrent}>
                      {isCurrent ? 'Current Plan' : plan.price > 30000 ? 'Upgrade' : plan.price === 0 ? 'Downgrade' : 'Switch'}
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-600 text-center">To change your plan, contact support or use the package request form.</p>
          </div>
        )}

        {/* Billing */}
        {tab === 'billing' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 mb-2">
              <Card title="Payment Method" icon={CreditCard}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                    <span className="text-green-400 font-bold text-xs">M</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">M-Pesa</p>
                    <p className="text-xs text-gray-500">+254 7XX XXX XXX</p>
                  </div>
                  <button className="ml-auto text-xs text-purple-400 hover:text-purple-300">Change</button>
                </div>
              </Card>
              <Card title="This Month" icon={CreditCard}>
                {(() => {
                  const now = new Date()
                  const monthTotal = billing
                    .filter(b => b.status === 'Paid' && new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear())
                    .reduce((s, b) => s + b.amount, 0)
                  return (
                    <>
                      <p className="text-2xl font-extrabold text-white">KES {monthTotal.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Paid this calendar month</p>
                    </>
                  )
                })()}
              </Card>
            </div>

            <div className="card-glow overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Invoice History</h3>
              </div>
              {billingLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={18} className="text-purple-400 animate-spin" />
                </div>
              ) : billing.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No transactions yet. Purchases and orders will appear here.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {billing.map(inv => (
                    <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{inv.desc}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(inv.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 shrink-0">KES {inv.amount.toLocaleString()}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        inv.status === 'Paid' ? 'bg-green-500/15 text-green-400'
                        : inv.status === 'Failed' ? 'bg-red-500/15 text-red-400'
                        : 'bg-amber-500/15 text-amber-400'
                      }`}>{inv.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <Card title="Notification Preferences" icon={Bell}>
            <div className="space-y-5">
              <p className="text-xs text-gray-500 -mt-2 mb-4">Choose what you get notified about — in-app and by email.</p>
              {[
                { key: 'projectReady' as const, label: 'Project ready for review', desc: 'When a creative uploads your video or audio deliverable' },
                { key: 'revisionDone' as const, label: 'Revision completed', desc: 'When iteration 2 is uploaded after your feedback' },
                { key: 'audioReady' as const, label: 'Audio order ready', desc: 'When a jingle, VO, or radio spot is ready to review' },
                { key: 'campaigns' as const, label: 'Campaign updates', desc: 'When your AI campaign copy is generated' },
                { key: 'billing' as const, label: 'Billing & invoices', desc: 'Payment confirmations and invoice ready alerts' },
                { key: 'product' as const, label: 'Platform updates', desc: 'New features and improvements to Nia Media' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <Toggle on={notifs[key]} onToggle={() => toggleN(key)} />
                </div>
              ))}

              <div className="border-t border-gray-200 pt-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Email Marketing</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Tips & promotional emails
                      {emailMarketingSaving && <span className="ml-2 text-[10px] text-gray-500 font-normal">Saving...</span>}
                    </p>
                    <p className="text-xs text-gray-500">Onboarding tips, usage nudges, and platform news. Turn off to opt out.</p>
                  </div>
                  <Toggle on={emailMarketing} onToggle={toggleEmailMarketing} />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="space-y-5">
            <Card title="Change Password" icon={Shield}>
              <div className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" placeholder="Min. 8 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input" placeholder="••••••••"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                {pwError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
                    <AlertCircle size={13} /> {pwError}
                  </div>
                )}
                {pwSaved && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-xs">
                    <Check size={13} /> Password updated successfully.
                  </div>
                )}
                <button
                  onClick={handlePasswordChange}
                  disabled={pwSaving || !newPassword || !confirmPassword}
                  className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50">
                  {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </Card>

            <Card title="Active Sessions" icon={Shield}>
              <div className="space-y-3">
                {[
                  { device: 'Chrome on Windows 11', location: 'Nairobi, Kenya', time: 'Now — Current session', current: true },
                  { device: 'Safari on iPhone 15', location: 'Nairobi, Kenya', time: '2 days ago', current: false },
                ].map(s => (
                  <div key={s.device} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white/2">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{s.device}</p>
                      <p className="text-[11px] text-gray-500">{s.location} · {s.time}</p>
                    </div>
                    {s.current
                      ? <span className="text-[10px] font-bold text-green-400 px-2 py-0.5 rounded-md bg-green-500/15">Active</span>
                      : <button className="text-xs text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                    }
                  </div>
                ))}
              </div>
            </Card>

            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="text-sm font-semibold text-red-400 mb-1">Danger Zone</p>
              <p className="text-xs text-gray-500 mb-3">Deleting your account is permanent and cannot be undone.</p>
              <button className="text-xs font-semibold text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

