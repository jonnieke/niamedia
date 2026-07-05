import { Link, useSearchParams } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import PublicHeader from '../components/layout/PublicHeader'
import Logo from '../components/ui/Logo'
import {
  ArrowRight, Zap, Film, MessageSquare, CheckCircle2, Star,
  Copy, Check, Music, Sparkles, Clock, Loader2, Languages,
  Image as ImageIcon, ChevronDown, Shield, Smartphone,
} from 'lucide-react'

const NiaAgent = lazy(() => import('../components/NiaAgent'))

const WHATSAPP_URL = 'https://wa.me/254751822556?text=Hi%2C%20I%20need%20a%20video%20commercial%20for%20my%20business'

/* ─── Hero image (AI-generated Kenyan scene, cached 7 days) ────── */
const HERO_CACHE_KEY = 'nia_hero_v2'
const HERO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const HERO_PROMPT =
  'Cinematic wide photograph at golden hour on a vibrant Nairobi street, Kenya: a proud Kenyan woman shop owner standing at the entrance of her colourful small-business storefront, smiling with arms crossed, customers browsing and a matatu passing in the background, a professional video camera on a tripod in the soft-focus foreground filming her — a commercial shoot in progress, warm African sunlight, authentic East African urban energy, rich natural colours, shallow depth of field, photorealistic commercial production still'

function useHeroImage(): string | null {
  const [img, setImg] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(HERO_CACHE_KEY)
      if (raw) {
        const { src, expires } = JSON.parse(raw)
        if (expires > Date.now() && typeof src === 'string') return src
      }
    } catch {}
    return null
  })

  useEffect(() => {
    if (img) return
    let cancelled = false
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-poster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
      },
      body: JSON.stringify({ raw_prompt: HERO_PROMPT }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const src: string | undefined = data?.images?.hero
        if (src && !cancelled) {
          setImg(src)
          try { localStorage.setItem(HERO_CACHE_KEY, JSON.stringify({ src, expires: Date.now() + HERO_CACHE_TTL })) } catch {}
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [img])

  return img
}

/* ─── Live AI Demo (kept — moved below the fold) ───────────────── */
const DEMO_INDUSTRIES = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO',
  'Restaurant', 'Travel', 'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Faith & Community',
]
const DEMO_STEPS = [
  'Reading your brief...',
  'Researching your market...',
  'Crafting your strategy...',
  'Writing your campaign copy...',
  'Polishing your assets...',
]
const DEMO_TABS = [
  { id: 'poster', label: 'Your Poster' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'script', label: 'Video Script' },
]

interface DemoOutput {
  captions: { instagram: string; facebook: string; tiktok: string; linkedin: string }
  whatsapp: { status: string; broadcast: string; reply: string }
  videoScript: { hook: string; scene1: string; scene2: string; scene3: string; callToAction: string; visualDirection: string }
  posterCopy: { headline: string; subheadline: string; offerText: string; cta: string }
  strategy: { angle: string; keyMessage: string }
}

function CampaignOutputDemo() {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [product, setProduct] = useState('')
  const [language, setLanguage] = useState<'en' | 'sw'>('en')
  const [loading, setLoading] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [output, setOutput] = useState<DemoOutput | null>(null)
  const [activeTab, setActiveTab] = useState('poster')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [posterImg, setPosterImg] = useState<string | null>(null)
  const [posterLoading, setPosterLoading] = useState(false)

  const canGenerate = businessName.trim().length >= 2 && industry

  const generatePosterVisual = async (biz: string, ind: string, prod: string) => {
    setPosterLoading(true); setPosterImg(null)
    try {
      const prompt =
        `Professional advertising poster background photograph for ${biz}, a ${ind} business in Kenya: ` +
        `authentic Kenyan commercial scene${prod ? ` featuring ${prod}` : ''}, warm inviting natural light, ` +
        `rich vibrant colours, East African setting, composed with clean negative space in the upper third for headline text, ` +
        `no text, no logos, no watermarks, photorealistic, high quality commercial photography`
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-poster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
        body: JSON.stringify({ raw_prompt: prompt }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.images?.hero) setPosterImg(data.images.hero)
      }
    } catch {} finally {
      setPosterLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!canGenerate || loading) return
    setLoading(true); setError(''); setOutput(null); setStepIdx(0)
    const stepTimer = setInterval(() => setStepIdx(i => i < DEMO_STEPS.length - 1 ? i + 1 : i), 1400)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
        body: JSON.stringify({
          business_name: businessName.trim(), industry,
          product_name: product.trim() || `${industry} services`,
          objective: 'Get leads and grow brand awareness',
          target_audience: 'Kenyan professionals and households',
          location: 'Nairobi, Kenya', offer: '',
          tone: 'Professional, warm, and locally resonant',
          platforms: ['Instagram', 'WhatsApp', 'Facebook'],
          cta: 'Contact us today',
          notes: 'Make the copy specific and locally resonant for the Kenyan market.',
          language,
        }),
      })
      clearInterval(stepTimer)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOutput(data as DemoOutput); setActiveTab('poster')
      // Hand the visitor's context to Register/Onboarding so signup continues
      // the journey instead of asking for the same details again.
      try {
        localStorage.setItem('nia_demo_ctx', JSON.stringify({
          businessName: businessName.trim(), industry, product: product.trim(), ts: Date.now(),
        }))
      } catch {}
      void generatePosterVisual(businessName.trim(), industry, product.trim())
    } catch {
      clearInterval(stepTimer)
      setError('Generation failed — please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const getTabContent = (): { heading: string; body: string } => {
    if (!output) return { heading: '', body: '' }
    switch (activeTab) {
      case 'instagram': return { heading: 'Instagram Caption', body: output.captions.instagram }
      case 'whatsapp': return { heading: 'WhatsApp Broadcast', body: output.whatsapp.broadcast }
      case 'script': return { heading: '15-Second Video Script', body: `[HOOK]\n${output.videoScript.hook}\n\n[SCENE 1]\n${output.videoScript.scene1}\n\n[SCENE 2]\n${output.videoScript.scene2}\n\n[CTA]\n${output.videoScript.callToAction}` }
      case 'poster': return { heading: 'Poster Copy', body: `HEADLINE:\n"${output.posterCopy.headline}"\n\nSUB-HEADLINE:\n${output.posterCopy.subheadline}\n\nOFFER:\n${output.posterCopy.offerText}\n\nCTA:\n"${output.posterCopy.cta}"` }
      default: return { heading: '', body: '' }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getTabContent().body)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="demo" className="py-20 px-6" style={{ background: '#f1f5f9' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
            <Zap size={12} /> Free AI tool — no account needed
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            {output ? `${businessName}, this is your ad kit` : 'See your ad before you spend a shilling'}
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            {output ? 'Real campaign copy and a real poster — generated for your business, not a template.' : 'Type your business name. In 60 seconds you\'ll see your campaign copy and a promotional poster — free, no account needed.'}
          </p>
        </div>

        {!loading && !output && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div className="space-y-4">
                <div>
                  <label className="label">Your business name *</label>
                  <input className="input w-full text-base" placeholder="e.g. Sunrise Homes, Mama Pima SACCO, Safari Stays…"
                    value={businessName} onChange={e => setBusinessName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Industry *</label>
                    <select className="input w-full" value={industry} onChange={e => setIndustry(e.target.value)}>
                      <option value="">Select industry…</option>
                      {DEMO_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Language</label>
                    <div className="flex gap-2 mt-1">
                      {(['en', 'sw'] as const).map(lang => (
                        <button key={lang} type="button" onClick={() => setLanguage(lang)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            language === lang
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>
                          <Languages size={12} />
                          {lang === 'en' ? 'English' : 'Kiswahili'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">What are you promoting? <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                  <input className="input w-full" placeholder="e.g. 2BR apartments from KES 6.5M, weekend lunch special…"
                    value={product} onChange={e => setProduct(e.target.value)} />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button onClick={handleGenerate} disabled={!canGenerate}
                  className="btn-primary w-full py-3.5 text-sm gap-2 disabled:opacity-40">
                  <Zap size={15} /> Generate My Campaign — Free
                </button>
                <p className="text-center text-xs text-gray-400">No account needed · Takes 30–60 seconds</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
            <p className="text-gray-900 font-bold text-lg mb-2">{DEMO_STEPS[stepIdx]}</p>
            <p className="text-sm text-gray-500 mb-8">Generating for <span className="text-purple-600 font-semibold">{businessName}</span>…</p>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.round(((stepIdx + 1) / DEMO_STEPS.length) * 100)}%`, background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Step {stepIdx + 1} of {DEMO_STEPS.length}</p>
          </div>
        )}

        {output && !loading && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 pb-3 border-b border-gray-100">Campaign Brief</p>
              <div className="space-y-4">
                {[
                  { label: 'Business', value: businessName },
                  { label: 'Industry', value: industry },
                  { label: 'Goal', value: 'Get leads & grow awareness' },
                  { label: 'Language', value: language === 'sw' ? 'Kiswahili' : 'English' },
                  { label: 'Strategy', value: output.strategy.angle },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm text-gray-900 leading-snug">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs text-emerald-600 font-semibold">Generated by Nia AI</p>
                </div>
                <Link to="/register" className="btn-primary w-full text-center text-xs py-2.5 gap-1.5">
                  Claim My Free Credit <ArrowRight size={12} />
                </Link>
                <button onClick={() => { setOutput(null); setPosterImg(null); setPosterLoading(false) }}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-center py-1">
                  Try a different business
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {DEMO_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors flex-1 ${
                      activeTab === tab.id
                        ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50/60'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === 'poster' ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-900">Promotional Poster Preview</p>
                    {posterLoading && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-600">
                        <Loader2 size={12} className="animate-spin" /> Designing…
                      </span>
                    )}
                  </div>

                  {/* Composited poster: AI background + real campaign copy */}
                  <div className="relative mx-auto rounded-2xl overflow-hidden shadow-xl"
                    style={{ maxWidth: 340, aspectRatio: '4/5', background: '#1c1917' }}>
                    {posterImg ? (
                      <img src={posterImg} alt={`Promotional poster for ${businessName}`}
                        className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 animate-pulse"
                        style={{ background: 'linear-gradient(160deg, #78350f 0%, #b45309 50%, #d97706 100%)' }} />
                    )}
                    {/* Legibility gradients */}
                    <div className="absolute inset-x-0 top-0 h-2/5"
                      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)' }} />
                    <div className="absolute inset-x-0 bottom-0 h-2/5"
                      style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)' }} />

                    {/* Poster copy overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-5 text-center">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.25em] text-white/85 uppercase mb-2">{businessName}</p>
                        <h3 className="text-2xl font-black text-white leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                          {output.posterCopy.headline}
                        </h3>
                        <p className="text-xs text-white/90 mt-2 leading-snug" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                          {output.posterCopy.subheadline}
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        {(() => {
                          // offerText can come back as a multi-line bullet list — a poster
                          // offer badge must be one punchy line.
                          const line = (output.posterCopy.offerText ?? '').split('\n')[0].replace(/^[•\-\s]+/, '').trim()
                          const offer = line.length > 72 ? `${line.slice(0, 69).trimEnd()}…` : line
                          return offer ? (
                            <p className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide max-w-full"
                              style={{ background: '#fbbf24', color: '#451a03' }}>
                              {offer}
                            </p>
                          ) : null
                        })()}
                        <div>
                          <span className="inline-block px-5 py-2 rounded-xl text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                            {output.posterCopy.cta}
                          </span>
                        </div>
                      </div>
                    </div>

                    {posterLoading && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white"
                          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
                          <Loader2 size={13} className="animate-spin" /> Designing your poster…
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    Your free account credit unlocks the full-resolution poster in 3 styles — ready to print and post.
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-gray-900">{getTabContent().heading}</p>
                    <button onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        copied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}>
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans max-h-72 overflow-y-auto">
                    {getTabContent().body}
                  </pre>
                </div>
              )}
              <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-gray-500">
                    Preview only. Your free credit unlocks <span className="text-purple-600 font-semibold">6 formats, 3 poster styles + strategy brief</span>.
                  </p>
                  <Link to="/register" className="btn-primary text-xs px-4 py-2 shrink-0 gap-1.5">
                    Claim Free Credit <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* ─── Static content ───────────────────────────────────────────── */
const VIDEO_PRICES = [
  { label: '15 seconds', use: 'TikTok, Reels, Stories', price: 'from KES 3,500' },
  { label: '30 seconds', use: 'Standard commercial — all platforms', price: 'from KES 5,000' },
  { label: '60 seconds', use: 'Campaign film with full story arc', price: 'from KES 7,500' },
  { label: '90 seconds', use: 'Extended brand story', price: 'from KES 12,000' },
  { label: '3 min+', use: 'Infomercial / mini-documentary', price: 'from KES 25,000' },
]

const FAQS = [
  {
    q: 'How much does a video commercial cost in Kenya?',
    a: 'Our video commercials start at KES 3,500 for a 15-second promo and range up to KES 60,000 for 3-minute-plus infomercials. Use the instant quote tool to price your exact video — no account or phone call needed.',
  },
  {
    q: 'How fast can you deliver my video?',
    a: 'Standard delivery is 3–5 business days once we have your brief and assets. Need it faster? 48-hour rush (+25%) and 24-hour rush (+50%) options are available at checkout.',
  },
  {
    q: 'Do you accept M-Pesa?',
    a: 'Yes. We accept M-Pesa, Visa, and Mastercard through PesaPal secure checkout. You pay a deposit to start production and the balance on delivery.',
  },
  {
    q: 'Do I need to visit a studio or arrange a shoot?',
    a: 'No. Most of our commercials are produced remotely — you send us your brief, photos, and brand materials via WhatsApp or the online form, and we handle production. Where filming is needed, we arrange it with you.',
  },
  {
    q: 'What exactly do I get when the video is delivered?',
    a: 'You receive the final video optimised for your chosen platforms (TikTok, Instagram, WhatsApp, Facebook, YouTube), with full exclusive rights. Add-ons include matching promo posters, subtitles, and AI-generated campaign copy for launching it.',
  },
  {
    q: 'Can you also write the ads and captions to promote the video?',
    a: 'Yes — every project can include AI-powered campaign copy: social captions, WhatsApp broadcast messages, and poster copy in English or Kiswahili. You can try the campaign generator free on this page.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left">
        <span className="text-sm font-bold text-gray-900">{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>}
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAssistant, setShowAssistant] = useState(searchParams.get('assistant') === '1')
  const heroImg = useHeroImage()

  // "Talk to Nia" links navigate to /?assistant=1 — react to the param even
  // when Home is already mounted, then strip it so refresh/HMR doesn't reopen.
  useEffect(() => {
    if (searchParams.get('assistant') === '1') {
      setShowAssistant(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <div style={{ background: '#f1f5f9' }}>
      <PublicHeader />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: '#0a0612', paddingTop: 64 }}>
        {/* Hero image backdrop */}
        <div className="absolute inset-0">
          {heroImg ? (
            <img src={heroImg} alt="A Kenyan business owner being filmed for a video commercial on a Nairobi street"
              className="w-full h-full object-cover" style={{ opacity: 0.55 }} />
          ) : (
            <div className="w-full h-full animate-pulse"
              style={{ background: 'linear-gradient(150deg, #3b1d0e 0%, #7c2d12 40%, #1e1b4b 100%)', opacity: 0.6 }} />
          )}
          {/* Legibility gradient — strong on the left where the copy sits */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(90deg, rgba(8,5,15,0.94) 0%, rgba(8,5,15,0.75) 45%, rgba(8,5,15,0.25) 100%)',
          }} />
          <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: 'linear-gradient(0deg, rgba(8,5,15,0.95), transparent)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
              style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.4)' }}>
              <Film size={13} style={{ color: '#c4b5fd' }} />
              <span className="text-xs font-bold tracking-widest" style={{ color: '#ddd6fe' }}>VIDEO COMMERCIALS FOR KENYAN BUSINESSES</span>
            </div>

            <h1 className="font-extrabold leading-[1.05] tracking-tight mb-6 text-white"
              style={{ fontSize: 'clamp(36px, 5.5vw, 58px)' }}>
              Your business deserves<br />
              <span style={{ background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                to be seen.
              </span>
            </h1>

            <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Professional video commercials for your shop, school, hotel, or service — from KES 3,500, delivered in as little as 48 hours. Start free: see your first campaign and promotional poster before you pay a shilling.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 24px rgba(124,58,237,0.5)' }}>
                <Sparkles size={15} /> Create My Free Ad Kit
              </button>
              <Link to="/quote"
                className="flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)' }}>
                Get an Instant Quote <ArrowRight size={15} />
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: '#25d366' }}>
                <MessageSquare size={15} /> WhatsApp
              </a>
            </div>

            {/* Honest trust line */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span className="flex items-center gap-1.5"><Sparkles size={13} style={{ color: '#a78bfa' }} /> First campaign + poster free</span>
              <span className="flex items-center gap-1.5"><Smartphone size={13} style={{ color: '#34d399' }} /> M-Pesa accepted</span>
              <span className="flex items-center gap-1.5"><Clock size={13} style={{ color: '#fbbf24' }} /> Delivery from 48 hours</span>
            </div>
          </div>
        </div>

        {/* Client strip */}
        <div className="relative max-w-7xl mx-auto px-6 pb-8 z-10">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>TRUSTED BY</span>
            {['NCBA', 'Onfon Media', 'PesaFlix', 'Ndovu Group', 'Somo Smart', 'Adiel Media'].map(name => (
              <span key={name} className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES (compact) ───────────────────────────────── */}
      <section id="services" className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">What we make for you</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Everything a business needs to show up professionally — produced by creatives, accelerated by AI.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Film, color: '#7c3aed', bg: '#ede9fe',
                title: 'Video Commercials', price: 'From KES 3,500',
                desc: '15-second promos to 3-minute brand films, optimised for TikTok, Instagram, WhatsApp, and TV.',
                to: '/quote', cta: 'Get a quote',
              },
              {
                icon: ImageIcon, color: '#2563eb', bg: '#dbeafe',
                title: 'Posters & Campaigns', price: 'From KES 500',
                desc: 'Promo posters plus AI-written captions, WhatsApp broadcasts, and ad copy — in English or Kiswahili.',
                to: '#demo', cta: 'Try it free', anchor: true,
              },
              {
                icon: Music, color: '#059669', bg: '#d1fae5',
                title: 'Jingles & Voice Overs', price: 'From KES 1,500',
                desc: 'Radio-ready jingles and professional African voice overs for your ads and IVR.',
                to: '/register', cta: 'Order audio',
              },
            ].map(({ icon: Icon, color, bg, title, price, desc, to, cta, anchor }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-7 hover:shadow-lg transition-all flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: bg, color }}>{price}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">{desc}</p>
                {anchor ? (
                  <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: color }}>
                    {cta} <ArrowRight size={14} />
                  </button>
                ) : (
                  <Link to={to} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: color }}>
                    {cta} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:underline">
              See our work <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS + PRICING ───────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6" style={{ background: '#f1f5f9' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* 3 steps */}
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Three steps. That's it.</h2>
              <div className="space-y-6">
                {[
                  { n: '1', title: 'Brief us', desc: 'Fill the 60-second quote form or message us on WhatsApp with what you\'re promoting.' },
                  { n: '2', title: 'We produce', desc: 'Our creative team + AI tools produce your commercial. You review and request changes — 2 rounds included.' },
                  { n: '3', title: 'You launch', desc: 'Pay the balance with M-Pesa, download your video with full rights, and post it everywhere.' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                      {n}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <Link to="/quote" className="btn-primary px-6 py-3 text-sm">Get an Instant Quote</Link>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#25d366' }}>
                  <MessageSquare size={14} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Price table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Video pricing</h3>
                <p className="text-xs text-gray-400 mt-0.5">Final price depends on platforms, delivery speed & add-ons</p>
              </div>
              <div className="divide-y divide-gray-100">
                {VIDEO_PRICES.map(({ label, use, price }) => (
                  <div key={label} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400">{use}</p>
                    </div>
                    <span className="text-sm font-bold text-purple-700 whitespace-nowrap">{price}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Shield size={12} className="text-emerald-500" /> M-Pesa, Visa & Mastercard via PesaPal
                </span>
                <Link to="/quote" className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1">
                  Price my video <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex gap-1 justify-center mb-5">
            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#f59e0b" style={{ color: '#f59e0b' }} />)}
          </div>
          <blockquote className="text-xl md:text-2xl font-semibold text-gray-900 leading-relaxed mb-6">
            "Nia Media helps us launch campaigns faster and get more results. It's like having a creative team on autopilot."
          </blockquote>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>B</div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Brian M.</p>
              <p className="text-xs text-gray-400">Co-founder, PesaSure Fintech</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FREE AI DEMO ─────────────────────────────────────── */}
      <CampaignOutputDemo />

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Common questions</h2>
          <div className="space-y-3">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            Something else on your mind?{' '}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline">
              Ask us on WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-20 px-6 relative overflow-hidden" style={{ background: '#0a0612' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 65%)' }} />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-extrabold text-white mb-4" style={{ fontSize: 'clamp(30px, 4.5vw, 44px)', lineHeight: 1.15 }}>
            Ready to put your business on screen?
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Get your price in 60 seconds — no account, no phone call, no obligation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/quote"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 6px 32px rgba(124,58,237,0.5)' }}>
              Get an Instant Quote <ArrowRight size={16} />
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-white"
              style={{ background: '#25d366' }}>
              <MessageSquare size={16} /> WhatsApp Us
            </a>
          </div>
          <p className="text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
            From KES 3,500 · M-Pesa accepted · Delivery from 48 hours
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="py-10 px-6" style={{ background: '#07040d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Video commercials for East African businesses.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Terms</Link>
            <Link to="/privacy" className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Privacy</Link>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Nia Media.</p>
          </div>
        </div>
      </footer>

      {showAssistant && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
            <div className="rounded-2xl bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-xl">
              Loading assistant...
            </div>
          </div>
        }>
          <NiaAgent onClose={() => setShowAssistant(false)} />
        </Suspense>
      )}
    </div>
  )
}
