import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Zap, Film, Music, ChevronLeft, Sparkles } from 'lucide-react'
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
    color: '#8b5cf6',
    label: 'Campaign Copy',
    desc: 'AI captions, video scripts, WhatsApp ads — ready in seconds.',
    cta: 'Create my first campaign',
    to: '/new-campaign',
  },
  {
    id: 'video',
    icon: Film,
    color: '#3b82f6',
    label: 'Video Production',
    desc: 'Human creative + AI tools produce your commercial or brand film.',
    cta: 'Start a video concept',
    to: '/concept-studio',
  },
  {
    id: 'audio',
    icon: Music,
    color: '#10b981',
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
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a14' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6">
        <Logo size="sm" />
        <button onClick={skip} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Skip for now
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-0 pt-8 pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-purple-500 text-white' :
                i === step ? 'bg-purple-500/25 text-purple-300 border-2 border-purple-500/60' :
                'bg-white/5 text-gray-600 border border-white/10'
              }`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <p className={`text-[10px] mt-1 font-medium ${i === step ? 'text-purple-300' : 'text-gray-600'}`}>{s}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-16 mx-1 mb-4 transition-all ${i < step ? 'bg-purple-500' : 'bg-white/8'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pt-8 pb-16">
        <div className="w-full max-w-xl">

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}>
                <Sparkles size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-gray-400 mb-8 leading-relaxed max-w-md mx-auto">
                Let's set up your account in 2 quick steps so every campaign, script, and brief is personalised to your business.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { icon: Zap, label: 'Campaign Copy', desc: 'Instant AI ads' },
                  { icon: Film, label: 'Video Production', desc: 'Human + AI films' },
                  { icon: Music, label: 'Audio Studio', desc: 'Jingles & radio' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
                    <Icon size={22} className="text-purple-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white">{label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>

              <button onClick={next} className="btn-primary w-full py-3 text-sm gap-2">
                Let's Go <ArrowRight size={15} />
              </button>
              <button onClick={skip} className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors">
                I'll set this up later
              </button>
            </div>
          )}

          {/* Step 1 — Business basics (simplified) */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Tell us about your business</h2>
              <p className="text-gray-400 text-sm mb-7">Just the essentials — takes 30 seconds. You can fill in more detail in settings.</p>

              <div className="space-y-6">
                <div>
                  <label className="label">Business name *</label>
                  <input
                    className="input w-full text-base"
                    placeholder="e.g. Sunrise Homes, Mama Pima SACCO, Safari Stays..."
                    value={businessName}
                    autoFocus
                    onChange={e => setBusinessName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">What industry are you in? *</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(ind => (
                      <button key={ind} type="button" onClick={() => setIndustry(ind)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          industry === ind
                            ? 'border-purple-500/60 bg-purple-500/20 text-white'
                            : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}>{ind}</button>
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

          {/* Step 2 — Choose first service */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">What do you want to create first?</h2>
              <p className="text-gray-400 text-sm mb-7">You can switch between services anytime from your dashboard.</p>

              <div className="space-y-3 mb-8">
                {SERVICES.map(s => {
                  const Icon = s.icon
                  const active = chosenService === s.id
                  return (
                    <button key={s.id} onClick={() => setChosenService(s.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all ${
                        active ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/8 bg-white/2 hover:border-white/15'
                      }`}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${s.color}20` }}>
                        <Icon size={22} style={{ color: s.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-0.5">{s.label}</p>
                        <p className="text-xs text-gray-400">{s.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        active ? 'border-purple-500 bg-purple-500' : 'border-white/20'
                      }`}>
                        {active && <Check size={11} className="text-white" />}
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
                  {saving ? 'Setting up…' : <>{SERVICES.find(s => s.id === chosenService)?.cta ?? 'Go to Dashboard'} <ArrowRight size={15} /></>}
                </button>
              </div>
              <button onClick={skip} className="mt-4 w-full text-xs text-gray-600 hover:text-gray-400 transition-colors text-center">
                Go to dashboard instead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
