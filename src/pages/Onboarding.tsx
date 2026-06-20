import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Zap, Film, Music, ChevronLeft, Sparkles } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const INDUSTRIES = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech', 'Restaurant',
  'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Other',
]

const TONES = ['Professional', 'Friendly', 'Bold', 'Luxury', 'Youthful', 'Direct Sales']

const COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#f97316',
]

const SERVICES = [
  {
    id: 'campaigns',
    icon: Zap,
    color: '#8b5cf6',
    label: 'Campaign Copy',
    desc: 'AI-generated captions, scripts, WhatsApp ads, and more — instantly.',
    cta: 'Create my first campaign',
    to: '/new-campaign',
  },
  {
    id: 'video',
    icon: Film,
    color: '#3b82f6',
    label: 'Video Production',
    desc: 'A human creative + AI tools produce your commercial, brand film, or doc.',
    cta: 'Start a video concept',
    to: '/concept-studio',
  },
  {
    id: 'audio',
    icon: Music,
    color: '#10b981',
    label: 'Audio Studio',
    desc: 'Jingles, voice overs, and radio spots — standalone, separately billed.',
    cta: 'Order audio',
    to: '/audio-studio',
  },
]

const STEPS = ['Welcome', 'Your Brand', 'First Service', 'All Set!']

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [brand, setBrand] = useState({
    name: '', industry: '', tone: '', color: '#8b5cf6', tagline: '',
  })
  const [chosenService, setChosenService] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const saveBrandKit = async () => {
    if (!user || !brand.name) return
    await supabase.from('brand_kits').upsert({
      user_id: user.id,
      business_name: brand.name,
      tagline: brand.tagline,
      preferred_tone: brand.tone,
      primary_color: brand.color,
    }, { onConflict: 'user_id' })
  }

  const finish = async () => {
    setSaving(true)
    await saveBrandKit()
    setSaving(false)
    const service = SERVICES.find(s => s.id === chosenService)
    navigate(service?.to ?? '/dashboard')
  }

  const skip = () => navigate('/dashboard')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a14' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6">
        <Logo size="sm" />
        <button onClick={skip} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Skip setup
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
              <h1 className="text-3xl font-bold text-white mb-3">Welcome to Nia Media</h1>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Africa's AI-powered creative platform. Let's set up your account in under 2 minutes so we can personalise every campaign, script, and audio brief to your brand.
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
                Get Started <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Step 1 — Brand basics */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Tell us about your brand</h2>
              <p className="text-gray-400 text-sm mb-7">This personalises every piece of content we create for you.</p>

              <div className="space-y-5">
                <div>
                  <label className="label">Business Name *</label>
                  <input className="input w-full text-base" placeholder="e.g. Sunrise Homes" value={brand.name}
                    onChange={e => setBrand(b => ({ ...b, name: e.target.value }))} />
                </div>

                <div>
                  <label className="label">Tagline (optional)</label>
                  <input className="input w-full" placeholder="e.g. Where Your Story Begins"
                    value={brand.tagline} onChange={e => setBrand(b => ({ ...b, tagline: e.target.value }))} />
                </div>

                <div>
                  <label className="label">Industry *</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(ind => (
                      <button key={ind} type="button" onClick={() => setBrand(b => ({ ...b, industry: ind }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          brand.industry === ind
                            ? 'border-purple-500/60 bg-purple-500/20 text-white'
                            : 'border-white/10 text-gray-400 hover:border-white/20'
                        }`}>{ind}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Brand Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <button key={t} type="button" onClick={() => setBrand(b => ({ ...b, tone: t }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          brand.tone === t
                            ? 'border-purple-500/60 bg-purple-500/20 text-white'
                            : 'border-white/10 text-gray-400 hover:border-white/20'
                        }`}>{t}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Brand Colour</label>
                  <div className="flex gap-3 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setBrand(b => ({ ...b, color: c }))}
                        className="w-9 h-9 rounded-xl transition-all"
                        style={{
                          background: c,
                          boxShadow: brand.color === c ? `0 0 0 3px rgba(255,255,255,0.3), 0 0 0 5px ${c}60` : 'none',
                          transform: brand.color === c ? 'scale(1.15)' : 'scale(1)',
                        }} />
                    ))}
                    <input type="color" value={brand.color} onChange={e => setBrand(b => ({ ...b, color: e.target.value }))}
                      className="w-9 h-9 rounded-xl border border-white/20 bg-transparent cursor-pointer" title="Custom colour" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={back} className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={next} disabled={!brand.name || !brand.industry}
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
              <p className="text-gray-400 text-sm mb-7">You can switch between services anytime — this just sets your starting point.</p>

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
                <button onClick={next} disabled={!chosenService}
                  className="btn-primary flex-1 py-2.5 text-sm gap-2 disabled:opacity-40">
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — All set */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 40px rgba(139,92,246,0.3)' }}>
                <Check size={34} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {brand.name ? `${brand.name} is ready!` : "You're all set!"}
              </h2>
              <p className="text-gray-400 mb-3 leading-relaxed">
                Your brand profile is saved. We'll use it to personalise every campaign, script, and audio brief automatically.
              </p>
              {brand.tagline && (
                <p className="text-sm text-purple-300 italic mb-8">"{brand.tagline}"</p>
              )}

              {/* Mini brand card */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5 mb-8 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: `linear-gradient(135deg, ${brand.color}, ${brand.color}99)` }}>
                    {brand.name.charAt(0) || 'B'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{brand.name}</p>
                    <p className="text-xs text-gray-500">{brand.industry} · {brand.tone}</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <div className="w-5 h-5 rounded-lg" style={{ background: brand.color }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  {chosenService && (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gray-400">
                      Starting with: {SERVICES.find(s => s.id === chosenService)?.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={finish} disabled={saving} className="btn-primary w-full py-3 text-sm gap-2 disabled:opacity-60">
                  {saving ? 'Saving…' : <>{SERVICES.find(s => s.id === chosenService)?.cta ?? 'Go to Dashboard'} <ArrowRight size={15} /></>}
                </button>
                <button onClick={skip} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  Go to Dashboard instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
