import { useState, useEffect, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Zap, Film, Music, Layers, ArrowRight, Check } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import PublicHeader from '../components/layout/PublicHeader'

const INDUSTRIES = ['Real Estate', 'Hospitality', 'Education', 'Fintech', 'Restaurant', 'Travel', 'Retail', 'Health', 'Events', 'Professional Services', 'Other']
const TIMELINES = ['ASAP (rush)', '1–2 weeks', '2–4 weeks', '1–2 months', 'Flexible']
const BUDGETS = ['Under KES 5,000', 'KES 5,000–15,000', 'KES 15,000–30,000', 'KES 30,000–60,000', 'KES 60,000+', 'Not sure yet']

type Service = 'campaign' | 'video' | 'audio' | 'multi'

const SERVICES: { id: Service; icon: typeof Zap; label: string; desc: string; color: string }[] = [
  { id: 'campaign', icon: Zap,    label: 'Campaign Copy',    desc: 'AI captions, scripts, WhatsApp ads', color: '#8b5cf6' },
  { id: 'video',    icon: Film,   label: 'Video Production', desc: 'Human creative + AI-generated film', color: '#3b82f6' },
  { id: 'audio',    icon: Music,  label: 'Audio Studio',     desc: 'Jingle, voice over, or radio spot',  color: '#10b981' },
  { id: 'multi',    icon: Layers, label: 'Multi-Service',    desc: 'I need a mix — let\'s talk',         color: '#f59e0b' },
]

const PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'WhatsApp', 'LinkedIn', 'X (Twitter)', 'Website']
const VIDEO_TYPES = ['15s Commercial', '30s Commercial', '60s Brand Film', 'Mini Documentary', 'Product Demo', 'Event Coverage', 'Not sure yet']
const AUDIO_TYPES = ['Jingle', 'Voice Over', 'Radio Spot', 'Podcast Intro', 'All of the above']
const AUDIO_DURATIONS = ['15 seconds', '30 seconds', '60 seconds', '2 minutes', 'Multiple versions']
const POST_FREQ = ['Once-off', '4–8 posts/month', '10–20 posts/month', '20+ posts/month']

function SuccessScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}>
        <CheckCircle2 size={34} className="text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h2>
      <p className="text-gray-500 max-w-md mb-6 leading-relaxed">
        Our team will review your brief and reach out within <strong className="text-white">24 hours</strong> to discuss scope, timeline, and next steps.
      </p>
      <div className="flex flex-col gap-2 text-left max-w-sm mx-auto mb-8">
        {[
          'Check your email for a confirmation',
          'WhatsApp response within 2–4 hours (business hours)',
          'No commitment until you approve a quote',
        ].map(s => (
          <div key={s} className="flex items-center gap-2 text-sm text-gray-600">
            <Check size={13} className="text-green-400 shrink-0" /> {s}
          </div>
        ))}
      </div>
      <a href="/dashboard" className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2">
        Back to Dashboard <ArrowRight size={14} />
      </a>
    </div>
  )
}

function ChipSelect({ options, value, onChange, multi = false }: {
  options: string[]
  value: string | string[]
  onChange: (v: string | string[]) => void
  multi?: boolean
}) {
  const active = (o: string) => multi ? (value as string[]).includes(o) : value === o
  const toggle = (o: string) => {
    if (multi) {
      const arr = value as string[]
      onChange(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o])
    } else {
      onChange(o)
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            active(o) ? 'border-purple-500/60 bg-purple-500/20 text-white' : 'border-gray-200 text-gray-500 hover:border-white/20'
          }`}>{o}</button>
      ))}
    </div>
  )
}

function Form() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [service, setService] = useState<Service>('campaign')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Pre-fill from ConceptStudio / AudioStudio query params
  const conceptTitle = searchParams.get('concept') ?? ''
  const conceptFormat = searchParams.get('format') ?? ''

  // Shared fields
  const [base, setBase] = useState({
    name: '', business: '', phone: '',
    email: user?.email ?? '',
    industry: '', timeline: '', budget: '',
    extra: conceptTitle ? `Concept: "${conceptTitle}"${conceptFormat ? ` (${conceptFormat})` : ''}` : '',
  })

  // Sync email from user if it loads after mount
  useEffect(() => {
    if (user?.email) setBase(b => ({ ...b, email: b.email || user.email }))
  }, [user?.email])

  // Campaign-specific
  const [campPlatforms, setCampPlatforms] = useState<string[]>([])
  const [campFreq, setCampFreq] = useState('')
  const [campTone, setCampTone] = useState('')

  // Video-specific
  const [vidType, setVidType] = useState('')
  const [vidHasScript, setVidHasScript] = useState<boolean | null>(null)
  const [vidLocations, setVidLocations] = useState('')

  // Audio-specific
  const [audType, setAudType] = useState('')
  const [audDuration, setAudDuration] = useState('')
  const [audPlatforms, setAudPlatforms] = useState<string[]>([])

  const setB = (k: keyof typeof base) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setBase(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError('')

    const brief: Record<string, unknown> = { extra: base.extra }
    if (service === 'campaign') Object.assign(brief, { platforms: campPlatforms, frequency: campFreq, tone: campTone })
    if (service === 'video')    Object.assign(brief, { type: vidType, hasScript: vidHasScript, locations: vidLocations, platforms: campPlatforms })
    if (service === 'audio')    Object.assign(brief, { type: audType, duration: audDuration, platforms: audPlatforms })
    if (service === 'multi')    Object.assign(brief, { services: campPlatforms })

    const { error } = await supabase.from('package_requests').insert({
      user_id: user?.id ?? null,
      name: base.name,
      business: base.business,
      phone: base.phone,
      email: base.email,
      industry: base.industry,
      service,
      brief,
      timeline: base.timeline,
      budget: base.budget,
    })

    if (error) {
      setSubmitError('Something went wrong. Please try again or WhatsApp us directly.')
      setLoading(false)
      return
    }

    void supabase.functions.invoke('notify-admin', {
      body: { type: 'new_lead', title: base.name, business: base.business, phone: base.phone, email: base.email, service, timeline: base.timeline },
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) return <SuccessScreen />

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* Service selector */}
      <div>
        <p className="label mb-3">What service do you need? *</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SERVICES.map(s => {
            const Icon = s.icon
            const active = service === s.id
            return (
              <button key={s.id} type="button" onClick={() => setService(s.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  active ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-200 bg-white/2 hover:border-gray-300'
                }`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${s.color}20` }}>
                  <Icon size={17} style={{ color: s.color }} />
                </div>
                <p className="text-xs font-bold text-gray-900 mb-0.5">{s.label}</p>
                <p className="text-[10px] text-gray-500 leading-snug">{s.desc}</p>
                {active && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-400 font-semibold">
                    <Check size={10} /> Selected
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Base contact */}
      <div className="card-glow p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Your Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Your Name *</label><input className="input" placeholder="Jane Wanjiru" value={base.name} onChange={setB('name')} required /></div>
          <div><label className="label">Business Name *</label><input className="input" placeholder="Sunrise Homes Ltd" value={base.business} onChange={setB('business')} required /></div>
          <div><label className="label">Phone / WhatsApp *</label><input className="input" placeholder="+254 7XX XXX XXX" value={base.phone} onChange={setB('phone')} required /></div>
          <div><label className="label">Email Address *</label><input type="email" className="input" placeholder="you@company.com" value={base.email} onChange={setB('email')} required /></div>
          <div className="sm:col-span-2">
            <label className="label">Industry *</label>
            <ChipSelect options={INDUSTRIES} value={base.industry} onChange={v => setBase(p => ({ ...p, industry: v as string }))} />
          </div>
        </div>
      </div>

      {/* Campaign-specific fields */}
      {service === 'campaign' && (
        <div className="card-glow p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Campaign Details</p>
          <div className="space-y-5">
            <div>
              <label className="label">Which platforms? (select all)</label>
              <ChipSelect options={PLATFORMS} value={campPlatforms} onChange={v => setCampPlatforms(v as string[])} multi />
            </div>
            <div>
              <label className="label">How often do you post?</label>
              <ChipSelect options={POST_FREQ} value={campFreq} onChange={v => setCampFreq(v as string)} />
            </div>
            <div>
              <label className="label">Brand Tone</label>
              <ChipSelect options={['Professional', 'Friendly', 'Bold', 'Luxury', 'Youthful', 'Direct Sales']} value={campTone} onChange={v => setCampTone(v as string)} />
            </div>
            <div>
              <label className="label">Brief — what do you want to promote?</label>
              <textarea className="input w-full h-24 resize-none" rows={3}
                placeholder="Describe your product, offer, or campaign goal. Include any key messages, deadlines, or seasonal angles..."
                value={base.extra} onChange={setB('extra')} />
            </div>
          </div>
        </div>
      )}

      {/* Video-specific fields */}
      {service === 'video' && (
        <div className="card-glow p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Video Brief</p>
          <div className="space-y-5">
            <div>
              <label className="label">Video Type</label>
              <ChipSelect options={VIDEO_TYPES} value={vidType} onChange={v => setVidType(v as string)} />
            </div>
            <div>
              <label className="label">Do you have a script?</label>
              <div className="flex gap-3">
                {[{ v: true, l: 'Yes — I\'ll provide it' }, { v: false, l: 'No — write one for me' }].map(({ v, l }) => (
                  <button key={l} type="button" onClick={() => setVidHasScript(v)}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                      vidHasScript === v ? 'border-purple-500/50 bg-purple-500/10 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Number of filming locations</label>
              <ChipSelect options={['Studio only', '1 location', '2–3 locations', '3+ locations', 'TBD']} value={vidLocations} onChange={v => setVidLocations(v as string)} />
            </div>
            <div>
              <label className="label">Where will this video be used?</label>
              <ChipSelect options={PLATFORMS} value={campPlatforms} onChange={v => setCampPlatforms(v as string[])} multi />
            </div>
            <div>
              <label className="label">Tell us more about the project</label>
              <textarea className="input w-full h-24 resize-none" rows={3}
                placeholder="Brand story, product USP, target audience, competitors, visual references or mood board links..."
                value={base.extra} onChange={setB('extra')} />
            </div>
          </div>
        </div>
      )}

      {/* Audio-specific fields */}
      {service === 'audio' && (
        <div className="card-glow p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Audio Brief</p>
          <div className="space-y-5">
            <div>
              <label className="label">Audio Type</label>
              <ChipSelect options={AUDIO_TYPES} value={audType} onChange={v => setAudType(v as string)} />
            </div>
            <div>
              <label className="label">Duration</label>
              <ChipSelect options={AUDIO_DURATIONS} value={audDuration} onChange={v => setAudDuration(v as string)} />
            </div>
            <div>
              <label className="label">Where will this audio be used?</label>
              <ChipSelect options={['Radio', 'Instagram', 'Facebook', 'YouTube', 'TikTok', 'TV', 'In-store / PA', 'Podcast']} value={audPlatforms} onChange={v => setAudPlatforms(v as string[])} multi />
            </div>
            <div>
              <label className="label">Key message or brief</label>
              <textarea className="input w-full h-24 resize-none" rows={3}
                placeholder="What should the audio say? Include tagline, offers, language preference (English/Swahili/mix), tone, any reference tracks..."
                value={base.extra} onChange={setB('extra')} />
            </div>
          </div>
        </div>
      )}

      {/* Multi-service fields */}
      {service === 'multi' && (
        <div className="card-glow p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Multi-Service Brief</p>
          <div className="space-y-5">
            <div>
              <label className="label">Which services? (select all)</label>
              <div className="flex flex-wrap gap-2">
                {(['Campaign Copy', 'Video Production', 'Audio Studio'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setCampPlatforms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      campPlatforms.includes(s) ? 'border-purple-500/60 bg-purple-500/20 text-white' : 'border-gray-200 text-gray-500 hover:border-white/20'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Tell us about the full project</label>
              <textarea className="input w-full h-32 resize-none" rows={4}
                placeholder="Give us the big picture — what's the campaign, launch, or brand moment you're working toward? Include timing, goals, and any assets you already have..."
                value={base.extra} onChange={setB('extra')} />
            </div>
          </div>
        </div>
      )}

      {/* Timeline + Budget */}
      <div className="card-glow p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Timeline & Budget</p>
        <div className="space-y-4">
          <div>
            <label className="label">When do you need this?</label>
            <ChipSelect options={TIMELINES} value={base.timeline} onChange={v => setBase(p => ({ ...p, timeline: v as string }))} />
          </div>
          <div>
            <label className="label">Approximate budget</label>
            <ChipSelect options={BUDGETS} value={base.budget} onChange={v => setBase(p => ({ ...p, budget: v as string }))} />
          </div>
        </div>
      </div>

      {/* Rights reminder */}
      <div className="p-3.5 rounded-xl border border-green-500/20 bg-green-500/5 flex items-start gap-3">
        <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
        <p className="text-xs text-green-300 leading-relaxed">
          All Nia Media deliverables are AI-generated — <strong>zero third-party copyright</strong>. Full intellectual property rights transfer to you on payment confirmation. A Certificate of AI Origin is issued for every project.
        </p>
      </div>

      {submitError && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">{submitError}</div>
      )}

      <button type="submit" disabled={loading || !base.name || !base.business || !base.phone || !base.email}
        className="btn-primary w-full py-3.5 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
        {loading ? 'Submitting...' : <><ArrowRight size={15} /> Submit Request — Our Team Will Respond Within 24h</>}
      </button>
    </form>
  )
}

export default function PackageRequest() {
  const { isAuthenticated } = useAuth()

  const content = (
    <>
      <div className="mb-8">
        <span className="section-tag mb-2 inline-block">Get Started</span>
        <h1 className="text-2xl font-bold text-gray-900">Request a Package</h1>
        <p className="text-sm text-gray-500 mt-1">Tell us what you need — our team will build a custom quote and reach out within 24 hours.</p>
      </div>
      <Form />
    </>
  )

  if (isAuthenticated) return <DashboardLayout><div className="max-w-2xl">{content}</div></DashboardLayout>

  return (
    <div className="bg-slate-100 min-h-screen">
      <PublicHeader />
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">{content}</div>
      </div>
    </div>
  )
}

