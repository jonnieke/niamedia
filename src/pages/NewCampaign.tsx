import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, Zap, Sparkles, Languages } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import CreativeAssistant from '../components/CreativeAssistant'
import BuyCreditsModal from '../components/BuyCreditsModal'
import { CampaignFormData } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const industries = ['Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO', 'Restaurant', 'Travel', 'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Faith & Community', 'Other']
const objectives = ['Get leads', 'Sell product', 'Promote offer', 'Increase bookings', 'Launch product', 'Grow social media', 'Drive WhatsApp enquiries']
const tones = ['Professional', 'Friendly', 'Bold', 'Luxury', 'Youthful', 'Emotional', 'Direct sales']
const platformOptions = ['Facebook', 'Instagram', 'TikTok', 'YouTube Shorts', 'WhatsApp', 'LinkedIn']
const ctaOptions = ['Call now', 'WhatsApp us', 'Book now', 'Apply today', 'Visit website', 'Send message']

const empty: CampaignFormData = {
  business_name: '', industry: '', product_name: '', objective: '',
  target_audience: '', location: '', offer: '', tone: '', platforms: [], cta: '', notes: '',
  whatsapp_number: '',
}

const GENERATING_STEPS = [
  'Reading your brief...',
  'Crafting your strategy...',
  'Writing your video script...',
  'Building social captions...',
  'Finalising your campaign...',
]

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-glow p-6">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5 pb-3 border-b border-gray-200">{title}</h2>
      {children}
    </div>
  )
}

export default function NewCampaign() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<CampaignFormData>(empty)
  const [language, setLanguage] = useState<'en' | 'sw' | 'sheng' | 'mixed' | 'conversational'>('en')
  const [showNia, setShowNia] = useState(false)
  const [showBuyCredits, setShowBuyCredits] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [prefilled, setPrefilled] = useState(false)

  // Fetch credit balance
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('credits').eq('id', user.id).single()
      .then(({ data }) => { if (data) setCredits(data.credits) })
  }, [user])

  // Pre-fill from saved Brand Kit (only fields still empty — URL params win)
  useEffect(() => {
    if (!user) return
    supabase.from('brand_kits')
      .select('business_name, industry, preferred_tone, target_customer')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const hasContent = data.business_name || data.industry || data.preferred_tone || data.target_customer
        setForm(prev => ({
          ...prev,
          business_name: prev.business_name || data.business_name || '',
          industry: prev.industry || data.industry || '',
          tone: prev.tone || data.preferred_tone || '',
          target_audience: prev.target_audience || data.target_customer || '',
        }))
        if (hasContent) setPrefilled(true)
      })
  }, [user])

  // Pre-fill from Nia agent URL params
  useEffect(() => {
    const fields: Partial<CampaignFormData> = {}
    if (searchParams.get('business_name')) fields.business_name = searchParams.get('business_name')!
    if (searchParams.get('industry')) fields.industry = searchParams.get('industry')!
    if (searchParams.get('product_name')) fields.product_name = searchParams.get('product_name')!
    if (searchParams.get('target_audience')) fields.target_audience = searchParams.get('target_audience')!
    if (searchParams.get('objective')) fields.objective = searchParams.get('objective')!
    if (searchParams.get('tone')) fields.tone = searchParams.get('tone')!
    if (searchParams.get('offer')) fields.offer = searchParams.get('offer')!
    if (searchParams.get('location')) fields.location = searchParams.get('location')!
    if (searchParams.get('notes')) fields.notes = searchParams.get('notes')!
    if (Object.keys(fields).length > 0) setForm(prev => ({ ...prev, ...fields }))
  }, [searchParams])

  const set = (field: keyof CampaignFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const togglePlatform = (p: string) =>
    setForm(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Gate: no credits
    if (credits !== null && credits < 1) {
      setShowBuyCredits(true)
      return
    }

    setLoading(true)
    setError('')
    setStep(0)

    // Animate through steps while we wait for Claude
    const stepInterval = setInterval(() => {
      setStep(s => (s < GENERATING_STEPS.length - 1 ? s + 1 : s))
    }, 1800)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-campaign', {
        body: { ...form, language },
      })
      clearInterval(stepInterval)

      if (fnError) throw new Error(fnError.message)
      if (data?.error === 'insufficient_credits') {
        setShowBuyCredits(true)
        setLoading(false)
        clearInterval(stepInterval)
        return
      }
      if (data?.error) throw new Error(data.friendly || data.error)

      navigate('/campaign-results', { state: { form, content: data } })
    } catch (err: unknown) {
      clearInterval(stepInterval)
      setError(err instanceof Error ? err.message : "We couldn't generate your campaign just now. No credit was used — please try again.")
      setLoading(false)
    }
  }

  const SelectWrapper = ({ label, field, options }: { label: string; field: keyof CampaignFormData; options: string[] }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <select className="select pr-9" value={form[field] as string} onChange={set(field)} required>
          <option value="">Select {label.toLowerCase()}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  )

  const chipClass = (active: boolean) =>
    `px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
      active
        ? 'text-white border-purple-500/60 bg-purple-500/20'
        : 'text-gray-500 border-gray-200 bg-white/3 hover:border-white/20 hover:text-gray-200'
    }`

  const canSubmit = form.platforms.length > 0 && !!form.cta

  const noCredits = credits !== null && credits < 1

  return (
    <DashboardLayout>
      {showNia && <CreativeAssistant onClose={() => setShowNia(false)} />}
      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}
      <div className="max-w-2xl">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
            <p className="text-sm text-gray-500 mt-1">Fill in your brief and we'll generate a complete campaign.</p>
          </div>
          <button type="button" onClick={() => setShowNia(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-700 shrink-0 transition-all hover:bg-purple-50"
            style={{ background: '#ffffff', border: '1px solid #e9d5ff' }}>
            <Sparkles size={14} className="text-purple-600" />
            Brainstorm with Nia
          </button>
        </div>

        {prefilled && (
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl border border-purple-200 bg-purple-50">
            <Zap size={14} className="text-purple-600 shrink-0" />
            <p className="text-xs text-purple-800">Prefilled from your <a href="/brand-kit" className="font-semibold underline">Brand Kit</a> — edit anything below.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <SectionCard title="Business Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Business name</label>
                <input className="input" placeholder="e.g. Sunrise Homes" value={form.business_name} onChange={set('business_name')} required />
              </div>
              <SelectWrapper label="Industry" field="industry" options={industries} />
              <div className="sm:col-span-2">
                <label className="label">Product or service name</label>
                <input className="input" placeholder="e.g. 2-bedroom apartments in Ruaka" value={form.product_name} onChange={set('product_name')} required />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Campaign Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectWrapper label="Campaign objective" field="objective" options={objectives} />
              <SelectWrapper label="Tone" field="tone" options={tones} />
              <div>
                <label className="label">Target audience</label>
                <input className="input" placeholder="e.g. Young professionals aged 25–40" value={form.target_audience} onChange={set('target_audience')} required />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="e.g. Nairobi, Westlands" value={form.location} onChange={set('location')} required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Offer or price</label>
                <input className="input" placeholder="e.g. 2 bedrooms from KES 4.5M, free parking" value={form.offer} onChange={set('offer')} required />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Platforms">
            <div className="flex flex-wrap gap-2">
              {platformOptions.map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)} className={chipClass(form.platforms.includes(p))}>{p}</button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Call to Action & Notes">
            <div className="space-y-4">
              <div>
                <label className="label">Call to action</label>
                <div className="flex flex-wrap gap-2">
                  {ctaOptions.map(c => (
                    <button key={c} type="button" onClick={() => setForm(prev => ({ ...prev, cta: c }))} className={chipClass(form.cta === c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">WhatsApp number <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                <input className="input" placeholder="e.g. 0712 345 678" value={form.whatsapp_number ?? ''} onChange={set('whatsapp_number')} />
                <p className="text-[11px] text-gray-500 mt-1.5">We'll weave a click-to-chat line into your WhatsApp copy and CTAs.</p>
              </div>
              <div>
                <label className="label">Extra notes <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                <textarea className="input resize-none" rows={3} placeholder="Any specific details, special requirements..." value={form.notes} onChange={set('notes')} />
              </div>
            </div>
          </SectionCard>

          {/* Language toggle */}
          <div className="card-glow p-5">
            <label className="label mb-3 flex items-center gap-1.5"><Languages size={13} /> Output language</label>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'en', label: 'English' },
                { id: 'sw', label: 'Kiswahili' },
                { id: 'conversational', label: 'Kenyan English' },
                { id: 'sheng', label: 'Sheng-light' },
                { id: 'mixed', label: 'Mixed EN/SW' },
              ] as const).map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setLanguage(id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    language === id
                      ? 'border-purple-500/60 bg-purple-500/15 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-white/20 hover:text-gray-600'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {language !== 'en' && (
              <p className="text-xs text-gray-500 mt-2">
                {language === 'sw' && 'All copy in natural Kiswahili.'}
                {language === 'conversational' && 'Warm, everyday Kenyan English — not corporate.'}
                {language === 'sheng' && 'Light, professional Sheng — current but clear to everyone.'}
                {language === 'mixed' && 'Natural English/Kiswahili code-switching, the way Kenyans actually chat.'}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
              {error}
            </div>
          )}

          {noCredits ? (
            <button type="button" onClick={() => setShowBuyCredits(true)}
              className="w-full py-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.15))', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }}>
              <Zap size={15} /> Buy Credits to Generate
            </button>
          ) : (
            <button type="submit" className="btn-primary w-full py-4 text-sm" disabled={loading || !canSubmit}>
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {GENERATING_STEPS[step]}
                </span>
              ) : (
                <><Zap size={15} /> Generate Campaign {credits !== null && <span className="opacity-60 text-xs ml-1">· {credits} credit{credits !== 1 ? 's' : ''} remaining</span>}</>
              )}
            </button>
          )}

          {!noCredits && !canSubmit && !loading && (
            <p className="text-xs text-gray-600 text-center -mt-2">Select at least one platform and a call to action to continue</p>
          )}
        </form>
      </div>
    </DashboardLayout>
  )
}

