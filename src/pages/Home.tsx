import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PublicHeader from '../components/layout/PublicHeader'
import Logo from '../components/ui/Logo'
import { NiaAgentButton } from '../components/NiaAgent'
import {
  ArrowRight, TrendingUp, Target, Zap,
  Film, MessageSquare, Building2, Hotel,
  GraduationCap, CreditCard, UtensilsCrossed, Plane,
  ShoppingBag, Calendar, Stethoscope, Briefcase,
  CheckCircle2, Star, BarChart2, Copy, Check,
  Music, Shield, Sparkles, Clock, Loader2, Languages, Bot,
} from 'lucide-react'

/* ─── Live AI Demo ─────────────────────────────────────────────── */
const DEMO_INDUSTRIES = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO',
  'Restaurant', 'Travel', 'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Faith & Community',
]
const DEMO_STEPS = [
  'Reading your brief…',
  'Researching your market…',
  'Crafting your strategy…',
  'Writing your campaign copy…',
  'Polishing your assets…',
]
const DEMO_TABS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'script', label: 'Video Script' },
  { id: 'poster', label: 'Poster Copy' },
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
  const [activeTab, setActiveTab] = useState('instagram')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const canGenerate = businessName.trim().length >= 2 && industry

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
      setOutput(data as DemoOutput); setActiveTab('instagram')
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
    <section id="demo" className="py-24 px-6 relative" style={{ background: '#f1f5f9' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
            <Zap size={12} /> Live AI Demo — No account needed
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            {output ? `Your campaign for ${businessName} is ready` : 'Generate your campaign — right now'}
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            {output ? 'Real AI output. Copy it, use it, own it.' : 'Type your business name. Get real ad copy in under 60 seconds.'}
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
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()} autoFocus />
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
                  Get My Full Campaign <ArrowRight size={12} />
                </Link>
                <button onClick={() => setOutput(null)}
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
              <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-gray-500">
                    Preview only. Full campaign includes <span className="text-purple-600 font-semibold">6 formats + strategy brief</span>.
                  </p>
                  <Link to="/register" className="btn-primary text-xs px-4 py-2 shrink-0 gap-1.5">
                    Get Full Campaign <ArrowRight size={12} />
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

/* ─── Hero output preview (static, cycles industries) ─────────── */
const PREVIEW_OUTPUTS = [
  {
    industry: 'Real Estate',
    color: '#7c3aed',
    tabs: ['Instagram', 'WhatsApp', 'Video Script'],
    copy: `🏠 Homes that sell lifestyles, not just walls.\n\nHeri Heights — 2BR from KES 6.5M. Walk to everything that matters in Westlands. Schools, malls, the pulse of the city.\n\nWhy rent forever when ownership is this close? 📲 DM for a private viewing this weekend.`,
  },
  {
    industry: 'Fintech / SACCO',
    color: '#2563eb',
    tabs: ['Instagram', 'WhatsApp', 'Video Script'],
    copy: `💸 Your money should work as hard as you do.\n\nWith Mama Pima SACCO, save KES 5,000/month and access up to 3X your deposits in emergency loans — no collateral needed.\n\nOver 4,000 members already growing. Join us. 👉 Click the link to apply.`,
  },
  {
    industry: 'Restaurant',
    color: '#dc2626',
    tabs: ['Instagram', 'WhatsApp', 'Video Script'],
    copy: `🍽️ Lunch just got a serious upgrade.\n\nEvery Thursday, our Chef's Special changes. This week: Swahili Coastal Biryani with freshly caught samaki — KES 650 only.\n\nReserve your table before noon or miss out. 📍 Karen, Nairobi. Call 0700 000 000.`,
  },
]

function HeroOutputPreview() {
  const [idx, setIdx] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [fade, setFade] = useState(true)
  const current = PREVIEW_OUTPUTS[idx]

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % PREVIEW_OUTPUTS.length)
        setActiveTab(0)
        setFade(true)
      }, 300)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#34d399' }} />
          <span className="text-xs font-bold text-white/70">Nia AI generating for</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${current.color}30`, color: current.color, border: `1px solid ${current.color}50`, transition: 'all 0.3s' }}>
            {current.industry}
          </span>
        </div>
        <div className="flex gap-1">
          {PREVIEW_OUTPUTS.map((_, i) => (
            <button key={i} onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setFade(true) }, 200) }}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? '#a78bfa' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>
      {/* format tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {current.tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className="px-4 py-2.5 text-xs font-semibold transition-all flex-1"
            style={{
              color: i === activeTab ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              borderBottom: i === activeTab ? '2px solid #a78bfa' : '2px solid transparent',
              background: i === activeTab ? 'rgba(167,139,250,0.08)' : 'transparent',
            }}>
            {tab}
          </button>
        ))}
      </div>
      {/* output */}
      <div className="p-5" style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease', minHeight: 140 }}>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-line' }}>
          {current.copy}
        </p>
      </div>
      {/* footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Generated by Nia AI · 47 seconds</span>
        </div>
        <Link to="/register"
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
          Get yours <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}

/* ─── Industries ───────────────────────────────────────────────── */
const industries = [
  { icon: Building2, name: 'Real Estate', desc: 'Property listings & launches', color: '#7c3aed' },
  { icon: Hotel, name: 'Hospitality', desc: 'Hotels, resorts & travel', color: '#2563eb' },
  { icon: GraduationCap, name: 'Education', desc: 'Schools, tutors & edtech', color: '#059669' },
  { icon: CreditCard, name: 'Fintech & SACCOs', desc: 'Loans, savings & finance', color: '#d97706' },
  { icon: UtensilsCrossed, name: 'Restaurants', desc: 'Food promos & delivery', color: '#dc2626' },
  { icon: Plane, name: 'Travel', desc: 'Tours & destinations', color: '#0891b2' },
  { icon: ShoppingBag, name: 'Retail', desc: 'Product launches & sales', color: '#7c3aed' },
  { icon: Calendar, name: 'Events', desc: 'Conferences & concerts', color: '#c026d3' },
  { icon: Stethoscope, name: 'Clinics', desc: 'Health & wellness', color: '#059669' },
  { icon: Briefcase, name: 'Professional', desc: 'Consulting & agencies', color: '#2563eb' },
]

/* ─── Main ─────────────────────────────────────────────────────── */
export default function Home() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div style={{ background: '#f1f5f9' }}>
      <PublicHeader />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #04000d 0%, #0b001f 55%, #040010 100%)', paddingTop: 80 }}>
        {/* Glow orbs */}
        <div className="absolute pointer-events-none" style={{ top: -80, left: '30%', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 65%)', filter: 'blur(1px)' }} />
        <div className="absolute pointer-events-none" style={{ top: 100, right: -100, width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 65%)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -40, left: -60, width: 300, height: 200, background: 'radial-gradient(ellipse, rgba(52,211,153,0.1) 0%, transparent 65%)' }} />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
                style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}>
                <MessageSquare size={13} style={{ color: '#a78bfa' }} />
                <span className="text-xs font-bold tracking-widest" style={{ color: '#c4b5fd' }}>WHATSAPP-FIRST · BUILT FOR KENYA</span>
              </div>

              <h1 className="font-extrabold leading-[1.05] tracking-tight mb-6" style={{ fontSize: 'clamp(40px, 6vw, 64px)', color: '#ffffff' }}>
                Ready-to-post ads for your business,<br />
                <span style={{ background: 'linear-gradient(90deg, #c4b5fd 0%, #7dd3fc 50%, #6ee7b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  in minutes.
                </span>
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,0.62)' }}>
                Nia Media helps African SMEs generate WhatsApp messages, social captions, poster copy, video scripts, and sales follow-ups — with optional human creative production when you need polished assets.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <button onClick={() => scrollTo('demo')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 24px rgba(124,58,237,0.45)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.45)')}>
                  <Zap size={15} /> Generate Free Campaign
                </button>
                <Link to="/register"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.88)' }}>
                  <Sparkles size={15} /> Talk to Nia Creative
                </Link>
              </div>

              {/* Trust strips */}
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: Clock, text: 'Ready in 60 seconds', color: '#a78bfa' },
                  { icon: Target, text: 'Built for East Africa', color: '#7dd3fc' },
                  { icon: Shield, text: '100% yours to own', color: '#6ee7b7' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon size={13} style={{ color }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live output preview */}
            <div className="relative z-10">
              <HeroOutputPreview />
              {/* floating social proof pill */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg"
                style={{ background: 'rgba(10,0,30,0.9)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
                <div className="flex -space-x-1.5">
                  {['#7c3aed','#2563eb','#059669'].map(c => (
                    <div key={c} className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: c, borderColor: 'rgba(10,0,30,0.9)' }}>
                      {c === '#7c3aed' ? 'J' : c === '#2563eb' ? 'A' : 'B'}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">500+ campaigns generated</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={9} fill="#f59e0b" style={{ color: '#f59e0b' }} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar — bleeds into next section */}
        <div className="relative max-w-7xl mx-auto px-6 -mb-10 z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            {[
              { val: '60s', label: 'Avg. generation time', color: '#c4b5fd' },
              { val: '10X', label: 'Faster than agencies', color: '#7dd3fc' },
              { val: 'KES 150K', label: 'Avg. annual savings', color: '#6ee7b7' },
              { val: '10+', label: 'Industries served', color: '#fcd34d' },
            ].map(({ val, label, color }) => (
              <div key={label} className="text-center px-6 py-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-2xl font-extrabold mb-1" style={{ color }}>{val}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave to light section */}
        <div style={{ height: 80, background: 'linear-gradient(145deg, #04000d 0%, #0b001f 55%, #040010 100%)' }} />
      </section>

      {/* ── LIVE DEMO ────────────────────────────────────────── */}
      <CampaignOutputDemo />

      {/* ── MEET NIA ─────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(145deg, #100030 0%, #08001a 100%)', padding: '80px 24px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)' }}>
                <Bot size={13} style={{ color: '#a78bfa' }} />
                <span className="text-xs font-bold tracking-widest" style={{ color: '#a78bfa' }}>MEET NIA AI</span>
              </div>
              <h2 className="font-extrabold text-white mb-4" style={{ fontSize: 36, lineHeight: 1.15 }}>
                Your AI creative director — always on.
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 440 }}>
                Tell Nia about your business. She'll ask the right questions, pitch campaign angles, and hand you ready-to-run copy — without you writing a brief.
              </p>
              <div className="flex flex-col gap-3 mb-8">
                {[
                  'Pitches 3 campaign angles before you even ask',
                  'Speaks Kiswahili and understands Kenyan culture',
                  'Available 24/7 — no waiting for a creative team',
                ].map(point => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 size={16} style={{ color: '#6ee7b7', flexShrink: 0, marginTop: 2 }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{point}</span>
                  </div>
                ))}
              </div>
              <Link to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                <MessageSquare size={15} /> Talk to Nia — It's Free
              </Link>
            </div>

            {/* Right — chat mockup */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Nia AI</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs" style={{ color: '#6ee7b7' }}>Online · responds instantly</p>
                  </div>
                </div>
              </div>
              {/* Messages */}
              <div className="p-5 space-y-4">
                {[
                  { from: 'nia', text: 'Habari! I\'m Nia 👋 Tell me about your business and I\'ll pitch you 3 campaign angles right now — no brief needed.' },
                  { from: 'user', text: 'We sell 2BR apartments in Westlands from KES 6.5M' },
                  { from: 'nia', text: 'Perfect! Here are 3 angles converting for Nairobi real estate RIGHT NOW:\n\n🔑 Lifestyle upgrade (aspiration)\n📈 Investment urgency (FOMO)\n🏘️ Neighbourhood pride (local identity)\n\nWhich do I write first?' },
                  { from: 'user', text: 'Lifestyle upgrade' },
                  { from: 'nia', text: '"Stop renting someone else\'s dream. Heri Heights puts you in Westlands — 2BR from KES 6.5M. Walk to everything. Own what matters. 📲 Book a private viewing this weekend."' },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.from === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                    }`} style={{
                      background: msg.from === 'nia' ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.08)',
                      color: msg.from === 'nia' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)',
                      whiteSpace: 'pre-line',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              {/* Input bar */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Sign up to keep chatting…</span>
                  <Link to="/register" className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section id="services" className="py-24 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
              One Platform
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Three services. Every format.</h2>
            <p className="text-gray-500 max-w-lg mx-auto">From a quick WhatsApp blast to a full broadcast commercial — everything your brand needs to show up professionally.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap, color: '#7c3aed', bgColor: '#ede9fe',
                label: 'Campaign Copy', tag: 'From KES 500 / credit',
                desc: 'AI-generated captions, scripts, WhatsApp ads, poster copy — instantly, for any industry.',
                items: ['Instagram & Facebook captions', 'WhatsApp broadcast messages', 'Video ad scripts (15s / 30s)', 'Poster & billboard copy', 'Landing page copy'],
                cta: 'Generate Free Preview', to: '#demo', isAnchor: true,
              },
              {
                icon: Film, color: '#2563eb', bgColor: '#dbeafe',
                label: 'Video Production', tag: 'From KES 5,000',
                desc: 'Human creative + AI tools produce broadcast-quality commercials and brand films.',
                items: ['15s / 30s / 60s commercials', 'Brand films & documentaries', 'AI-generated footage & avatars', '2 revision rounds included', 'Full exclusive rights on delivery'],
                cta: 'Start a Video Concept', to: '/register', isAnchor: false,
              },
              {
                icon: Music, color: '#059669', bgColor: '#d1fae5',
                label: 'Audio Studio', tag: 'From KES 1,500',
                desc: 'Radio-ready jingles, professional voice overs, and produced radio spots.',
                items: ['Brand jingles (15s, 30s, 60s)', 'African voice overs — 14 voices', 'Fully produced radio spots', 'Kiswahili & English mix', 'All rights yours on delivery'],
                cta: 'Order Audio', to: '/register', isAnchor: false,
              },
            ].map(({ icon: Icon, color, bgColor, label, tag, desc, items, cta, to, isAnchor }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white p-7 hover:border-purple-200 hover:shadow-lg transition-all flex flex-col group">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: bgColor }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500">{tag}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{desc}</p>
                <div className="space-y-2.5 mb-6 flex-1">
                  {items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={13} style={{ color }} className="shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                {isAnchor ? (
                  <button onClick={() => scrollTo('demo')}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: color, boxShadow: `0 4px 16px ${color}40` }}>
                    {cta} <ArrowRight size={14} />
                  </button>
                ) : (
                  <Link to={to} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border"
                    style={{ borderColor: `${color}40`, color, background: `${color}08` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}15` }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${color}08` }}>
                    {cta} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f1f5f9' }}>
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #0d0024 0%, #06000f 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid lg:grid-cols-2 gap-0 items-stretch">
              {/* Testimonial */}
              <div className="p-10 lg:p-12" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#f59e0b" style={{ color: '#f59e0b' }} />)}
                </div>
                <blockquote className="text-xl font-semibold text-white leading-relaxed mb-6">
                  "Nia Media helps us launch campaigns faster and get more results. It's like having a creative team on autopilot."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>B</div>
                  <div>
                    <p className="text-sm font-bold text-white">Brian M.</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Co-founder, PesaSure Fintech</p>
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {[
                  { icon: TrendingUp, val: '10X', label: 'Faster ad creation', color: '#c4b5fd' },
                  { icon: BarChart2, val: '3X', label: 'More engagement', color: '#7dd3fc' },
                  { icon: Target, val: '40%', label: 'Lower cost per lead', color: '#6ee7b7' },
                ].map(({ icon: Icon, val, label, color }, i) => (
                  <div key={label} className="flex flex-col items-center justify-center py-10 px-6 text-center"
                    style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <Icon size={18} style={{ color, marginBottom: 10 }} />
                    <p className="font-extrabold mb-1" style={{ fontSize: 36, color }}>{val}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
              Process
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">From brief to campaign in minutes.</h2>
          </div>
          <div className="grid lg:grid-cols-5 gap-4 relative">
            {[
              { n: '01', title: 'Pick your service', desc: 'Campaign copy, video, or audio.', color: '#7c3aed' },
              { n: '02', title: 'Add your brief', desc: 'Your business, audience & goal.', color: '#5b21b6' },
              { n: '03', title: 'AI generates', desc: 'Multiple creative options in seconds.', color: '#4338ca' },
              { n: '04', title: 'Tweak it', desc: 'Refine any section with one click.', color: '#2563eb' },
              { n: '05', title: 'Publish & grow', desc: 'Launch to every platform at once.', color: '#0891b2' },
            ].map(({ n, title, desc, color }, i, arr) => (
              <div key={n} className="relative text-center">
                {i < arr.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-px z-10"
                    style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.4), rgba(8,145,178,0.2))' }} />
                )}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-sm font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 16px ${color}40` }}>
                  {n}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT BY CREATIVES ───────────────────────────────── */}
      <section className="py-16 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
            Creative authority
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Not a generic AI wrapper.</h2>
          <p className="text-gray-500 leading-relaxed max-w-2xl mx-auto mb-8">
            Nia Media is built by creative professionals with real experience in storytelling, film & TV, sound, editing, creative direction, and campaign production. The AI does the speed — our craft shapes what good looks like.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {['Storytelling', 'Film & TV', 'Sound & Audio', 'Creative Direction', 'Campaign Production'].map(d => (
              <div key={d} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CheckCircle2 size={14} className="text-purple-500" /> {d}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO UPSELL ─────────────────────────────────────── */}
      <section className="py-12 px-6" style={{ background: '#f1f5f9' }}>
        <div className="mt-0 max-w-2xl mx-auto text-center bg-white rounded-2xl border border-gray-200 p-8">
          <Film size={24} className="text-purple-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Need the final video too?</h3>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Generate your script instantly, then let Nia Media turn it into a polished campaign video for WhatsApp, Instagram, TikTok, Facebook, or YouTube. Short campaign videos can be delivered within 24–48 hours depending on scope and asset availability.
          </p>
          <Link to="/request-video" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            <Film size={14} /> Request Video Production
          </Link>
        </div>
      </section>

      {/* ── INDUSTRIES ───────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#f1f5f9' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
              Industries
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">Built for businesses that sell every day.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {industries.map(({ icon: Icon, name, desc, color }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-200 p-5 text-center hover:border-purple-200 hover:shadow-md transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-xs font-bold text-gray-900 mb-1">{name}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section className="py-24 px-6" id="pricing" style={{ background: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}>
              Pricing
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Start free. Pay as you grow.</h2>
            <p className="text-gray-500">Buy a single campaign, subscribe monthly, or let our team run it for you.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Pay as you go */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pay As You Go</p>
              <p className="font-extrabold text-gray-900 mb-0.5" style={{ fontSize: 32 }}>KES 500</p>
              <p className="text-xs text-gray-400 mb-6">Per campaign credit · 5 for 2,000</p>
              <div className="space-y-2.5 mb-8">
                {['WhatsApp broadcast + status', 'Social captions (all platforms)', 'Poster copy + video script', '7-day content calendar', 'Lead follow-up messages'].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollTo('demo')} className="btn-secondary w-full text-center text-sm py-3">Generate Free Campaign</button>
            </div>

            {/* Growth — highlighted */}
            <div className="relative rounded-2xl p-7 overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #0b001f 0%, #060012 100%)', border: '1px solid rgba(167,139,250,0.35)' }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }} />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>Most Popular</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 mt-2" style={{ color: '#a78bfa' }}>Growth Monthly</p>
              <p className="font-extrabold text-white mb-0.5" style={{ fontSize: 32 }}>KES 2,500</p>
              <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Per month · cancel anytime</p>
              <div className="space-y-2.5 mb-8">
                {['15 campaigns / month', '3 brand kits', 'Ideas Bank + Nia Assistant', '7-day calendars + follow-ups', 'Priority generation'].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} style={{ color: '#a78bfa' }} className="shrink-0" />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn-primary w-full text-center text-sm py-3">Start Growth</Link>
            </div>

            {/* Done-for-you */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Done-For-You</p>
              <p className="font-extrabold text-gray-900 mb-0.5" style={{ fontSize: 32 }}>From KES 5,000</p>
              <p className="text-xs text-gray-400 mb-6">One-off or monthly managed</p>
              <div className="space-y-2.5 mb-8">
                {['Human-reviewed campaign kit', 'Poster + short-video production', 'Monthly managed packages', 'Competitor tracking & reports', 'Creative direction by our team'].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/package-request" className="btn-secondary w-full text-center text-sm py-3">Talk to Us</Link>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link to="/pricing" className="text-sm font-semibold text-purple-700 hover:underline inline-flex items-center gap-1">
              See full pricing — credits, monthly & managed <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1.5"><Shield size={11} className="text-emerald-500" /> Secure checkout</span>
            <span>·</span>
            <span>M-Pesa, Visa, Mastercard accepted</span>
            <span>·</span>
            <span>PesaPal powered</span>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #04000d 0%, #0b001f 55%, #040010 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(124,58,237,0.28) 0%, transparent 65%)' }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-xs font-bold tracking-widest mb-5" style={{ color: '#a78bfa', letterSpacing: '0.12em' }}>
            FINALLY — ADS BUILT FOR YOUR BUSINESS
          </p>
          <h2 className="font-extrabold text-white mb-5" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1 }}>
            Your next campaign is<br />
            <span style={{ background: 'linear-gradient(90deg, #c4b5fd, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              60 seconds away.
            </span>
          </h2>
          <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Join businesses across Kenya using Nia Media to launch faster, spend smarter, and grow with professional creative content.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 6px 32px rgba(124,58,237,0.5)' }}>
              <Zap size={17} /> Start for Free
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.8)' }}>
              View Pricing
            </Link>
          </div>
          <p className="text-xs mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
            No credit card required · Free to explore · M-Pesa accepted
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="py-10 px-6" style={{ background: '#04000d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Professional ads for East African businesses.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Terms</Link>
            <Link to="/privacy" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>Privacy</Link>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Nia Media.</p>
          </div>
        </div>
      </footer>

      <NiaAgentButton />
    </div>
  )
}
