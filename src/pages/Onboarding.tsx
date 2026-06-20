import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Zap, Film, Music, ChevronLeft, Sparkles, Target, Clock } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const INDUSTRIES = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO', 'Restaurant',
  'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Other',
]

const SERVICES = [
  {
    id: 'campaigns',
    icon: Zap,
    color: '#7c3aed',
    bg: '#ede9fe',
    label: 'Campaign Copy',
    desc: 'AI captions, video scripts, WhatsApp ads — ready in under 60 seconds.',
    cta: 'Create my first campaign',
    to: '/new-campaign',
  },
  {
    id: 'video',
    icon: Film,
    color: '#2563eb',
    bg: '#dbeafe',
    label: 'Video Production',
    desc: 'Human creative + AI tools produce your commercial or brand film.',
    cta: 'Start a video concept',
    to: '/concept-studio',
  },
  {
    id: 'audio',
    icon: Music,
    color: '#059669',
    bg: '#d1fae5',
    label: 'Audio Studio',
    desc: 'Jingles, voice overs, and radio spots — from KES 1,500.',
    cta: 'Order audio',
    to: '/audio-studio',
  },
]

const STEPS = ['Welcome', 'Your Business', 'First Goal']

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [chosenService, setChosenService] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)
  const skip = () => navigate('/dashboard')

  const finish = async () => {
    setSaving(true)
    if (user && businessName) {
      await supabase.from('brand_kits').upsert({
        user_id: user.id,
        business_name: businessName,
      }, { onConflict: 'user_id' })
    }
    localStorage.setItem('onboarded', '1')
    setSaving(false)
    const service = SERVICES.find(s => s.id === chosenService)
    navigate(service?.to ?? '/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f9' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
        <Logo size="sm" />
        <button onClick={skip} className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium">
          Skip for now
        </button>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center justify-center gap-0 pt-8 pb-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step
                  ? 'text-white'
                  : i === step
                  ? 'border-2 border-purple-500 text-purple-600 bg-purple-50'
                  : 'border border-gray-200 text-gray-400 bg-white'
              }`} style={i < step ? { background: 'linear-gradient(135deg, #7c3aed, #2563eb)' } : undefined}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <p className={`text-[10px] mt-1 font-semibold ${
                i === step ? 'text-purple-600' : i < step ? 'text-gray-500' : 'text-gray-400'
              }`}>{s}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-16 mx-1 mb-4 rounded-full transition-all ${i < step ? 'bg-purple-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pt-6 pb-16">
        <div className="w-full max-w-lg">

          {/* ── Step 0: Welcome ───────────────────────── */}
          {step === 0 && (
            <div className="text-center">
              {/* Hero icon */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
                  <Sparkles size={34} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                You're in{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 🎉
              </h1>
              <p className="text-gray-500 mb-8 leading-relaxed max-w-sm mx-auto">
                Set up takes 60 seconds. Then every campaign, script, and brief Nia creates will be personalised to your business.
              </p>

              {/* Feature cards */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: Target, color: '#7c3aed', bg: '#ede9fe', label: 'AI Campaign Copy', desc: 'Ads in 60 seconds' },
                  { icon: Film, color: '#2563eb', bg: '#dbeafe', label: 'Video Production', desc: 'Human + AI films' },
                  { icon: Music, color: '#059669', bg: '#d1fae5', label: 'Audio Studio', desc: 'Jingles & radio' },
                ].map(({ icon: Icon, color, bg, label, desc }) => (
                  <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: bg }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <p className="text-xs font-bold text-gray-900 leading-snug">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Time indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <Clock size={12} className="text-gray-400" />
                <p className="text-xs text-gray-400">Takes about 60 seconds</p>
              </div>

              <button onClick={next} className="btn-primary w-full py-3.5 text-sm gap-2">
                Let's get started <ArrowRight size={15} />
              </button>
              <button onClick={skip} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                I'll set this up later
              </button>
            </div>
          )}

          {/* ── Step 1: Business Basics ───────────────── */}
          {step === 1 && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Tell us about your business</h2>
                <p className="text-gray-500 text-sm">Just the essentials — takes 30 seconds. You can fill in more detail in settings.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="label">Business name *</label>
                  <input
                    className="input w-full text-base"
                    placeholder="e.g. Sunrise Homes, Mama Pima SACCO, Safari Stays…"
                    value={businessName}
                    autoFocus
                    onChange={e => setBusinessName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && businessName.trim() && industry && next()}
                  />
                </div>

                <div>
                  <label className="label">What industry are you in? *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {INDUSTRIES.map(ind => (
                      <button key={ind} type="button" onClick={() => setIndustry(ind)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          industry === ind
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50'
                        }`}>
                        {industry === ind && <Check size={10} className="inline mr-1" />}
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={back} className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={next} disabled={!businessName.trim() || !industry}
                  className="btn-primary flex-1 py-2.5 text-sm gap-2 disabled:opacity-40">
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Choose first service ─────────── */}
          {step === 2 && (
            <div>
              <div className="mb-7">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">What do you want to create first?</h2>
                <p className="text-gray-500 text-sm">You can switch between services anytime from your dashboard.</p>
              </div>

              <div className="space-y-3 mb-8">
                {SERVICES.map(s => {
                  const Icon = s.icon
                  const active = chosenService === s.id
                  return (
                    <button key={s.id} onClick={() => setChosenService(s.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all ${
                        active
                          ? 'border-purple-400 bg-purple-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/40'
                      }`}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                        <Icon size={22} style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        active ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'
                      }`}>
                        {active && <Check size={10} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={back} className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={finish} disabled={!chosenService || saving}
                  className="btn-primary flex-1 py-2.5 text-sm gap-2 disabled:opacity-40">
                  {saving
                    ? 'Setting up…'
                    : <>{SERVICES.find(s => s.id === chosenService)?.cta ?? 'Go to Dashboard'} <ArrowRight size={15} /></>
                  }
                </button>
              </div>
              <button onClick={skip} className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-center">
                Go to dashboard instead
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
