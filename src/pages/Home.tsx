import { Link } from 'react-router-dom'
import { useState } from 'react'
import PublicHeader from '../components/layout/PublicHeader'
import Logo from '../components/ui/Logo'
import { NiaAgentButton } from '../components/NiaAgent'
import {
  ArrowRight, TrendingUp, Target, Zap,
  Film, MessageSquare, Building2, Hotel,
  GraduationCap, CreditCard, UtensilsCrossed, Plane,
  ShoppingBag, Calendar, Stethoscope, Briefcase,
  CheckCircle2, Star, BarChart2, MousePointerClick, Copy, Check,
  Music, Shield, Sparkles, Clock, Loader2, Languages,
} from 'lucide-react'

/* ─── Mini dashboard mockup ─────────────────────────────────── */
function DashboardMockup() {
  const campaigns = [
    { tag: 'REAL ESTATE', title: 'Heri Heights Property Launch', ctr: '4.23%', leads: 128, color: '#10b981', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80' },
    { tag: 'HOSPITALITY', title: 'Safari Stays Weekend Getaway', ctr: '3.81%', leads: 86, color: '#3b82f6', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=300&q=80' },
    { tag: 'FINTECH', title: 'Move Money With Confidence', ctr: '5.12%', leads: 210, color: '#8b5cf6', img: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=300&q=80' },
    { tag: 'EDUCATION', title: 'Learn Today. Lead Tomorrow.', ctr: '3.27%', leads: 95, color: '#f59e0b', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&q=80' },
  ]

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="relative rounded-3xl border border-white/10 overflow-hidden"
        style={{ background: 'rgba(15,15,28,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
              + New Campaign
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">W</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-0 border-b border-white/6">
          {[
            { label: 'Total Campaigns', val: '24', change: '+18%', icon: BarChart2 },
            { label: 'Active Campaigns', val: '12', change: '+25%', icon: Zap },
            { label: 'Total Ad Spend', val: 'KES 145K', change: '+12%', icon: TrendingUp },
            { label: 'Avg. CTR', val: '3.62%', change: '+0.8%', icon: MousePointerClick },
          ].map(({ label, val, change, icon: Icon }, i) => (
            <div key={i} className="px-4 py-3 border-r border-white/6 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">{label}</p>
                <Icon size={12} className="text-gray-600" />
              </div>
              <p className="text-lg font-bold text-white">{val}</p>
              <p className="text-xs text-emerald-400 font-medium">{change} vs last month</p>
            </div>
          ))}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white">Your Campaigns</p>
            <span className="text-xs text-purple-400">View All →</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {campaigns.map((c, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-white/8">
                <div className="relative h-24 overflow-hidden">
                  <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)' }} />
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-white font-bold" style={{ background: c.color, fontSize: '8px' }}>{c.tag}</span>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white font-semibold leading-tight" style={{ fontSize: '10px' }}>{c.title}</p>
                  </div>
                </div>
                <div className="px-2 py-1.5 flex items-center justify-between" style={{ background: 'rgba(15,15,28,0.8)' }}>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 font-semibold" style={{ fontSize: '9px' }}>Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400" style={{ fontSize: '9px' }}>
                    <span>CTR {c.ctr}</span>
                    <span className="text-gray-600">·</span>
                    <span>Leads {c.leads}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Live AI Demo ───────────────────────────────────────────── */
const DEMO_INDUSTRIES = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO',
  'Restaurant', 'Travel', 'Retail', 'Health & Wellness', 'Events', 'Professional Services',
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
  { id: 'poster', label: 'Poster' },
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
    setLoading(true)
    setError('')
    setOutput(null)
    setStepIdx(0)

    const stepTimer = setInterval(() => {
      setStepIdx(i => (i < DEMO_STEPS.length - 1 ? i + 1 : i))
    }, 1400)

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
        body: JSON.stringify({
          business_name: businessName.trim(),
          industry,
          product_name: product.trim() || `${industry} services`,
          objective: 'Get leads and grow brand awareness',
          target_audience: 'Kenyan professionals and households',
          location: 'Nairobi, Kenya',
          offer: '',
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
      setOutput(data as DemoOutput)
      setActiveTab('instagram')
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
      case 'script': return {
        heading: '15-Second Video Script',
        body: `[HOOK]\n${output.videoScript.hook}\n\n[SCENE 1]\n${output.videoScript.scene1}\n\n[SCENE 2]\n${output.videoScript.scene2}\n\n[CTA]\n${output.videoScript.callToAction}`,
      }
      case 'poster': return {
        heading: 'Poster Copy',
        body: `HEADLINE:\n"${output.posterCopy.headline}"\n\nSUB-HEADLINE:\n${output.posterCopy.subheadline}\n\nOFFER:\n${output.posterCopy.offerText}\n\nCTA:\n"${output.posterCopy.cta}"`,
      }
      default: return { heading: '', body: '' }
    }
  }

  const handleCopy = () => {
    const { body } = getTabContent()
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="demo" className="py-20 px-6 relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12">
          <div className="section-tag mx-auto mb-4 w-fit">Live AI Demo</div>
          <h2 className="text-3xl font-bold text-white mb-3">
            {output ? `Your campaign for ${businessName}` : 'Generate your campaign — right now'}
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {output ? 'Real AI output, ready to copy and publish.' : 'Type your business name. Get real ad copy in under 60 seconds. No sign-up.'}
          </p>
        </div>

        {/* Input form */}
        {!loading && !output && (
          <div className="max-w-2xl mx-auto">
            <div className="card-glow p-8">
              <div className="space-y-4">
                <div>
                  <label className="label">Your business name *</label>
                  <input
                    className="input w-full text-base"
                    placeholder="e.g. Sunrise Homes, Mama Pima SACCO, Safari Stays…"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    autoFocus
                  />
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
                              ? 'border-purple-500/60 bg-purple-500/15 text-white'
                              : 'border-white/10 text-gray-500 hover:border-white/20'
                          }`}>
                          <Languages size={12} />
                          {lang === 'en' ? 'English' : 'Kiswahili'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">What are you promoting? <span className="text-gray-600">(optional)</span></label>
                  <input
                    className="input w-full"
                    placeholder="e.g. 2BR apartments from KES 6.5M, monthly savings account, weekend lunch special…"
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button onClick={handleGenerate} disabled={!canGenerate}
                  className="btn-primary w-full py-3.5 text-sm gap-2 disabled:opacity-40">
                  <Zap size={15} /> Generate My Campaign — Free
                </button>
                <p className="text-center text-xs text-gray-600">No account needed · Takes 30–60 seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}>
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
            <p className="text-white font-semibold mb-2">{DEMO_STEPS[stepIdx]}</p>
            <p className="text-xs text-gray-600 mb-6">Generating for <span className="text-purple-400">{businessName}</span>…</p>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.round(((stepIdx + 1) / DEMO_STEPS.length) * 100)}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                }} />
            </div>
            <p className="text-xs text-gray-600 mt-2">Step {stepIdx + 1} of {DEMO_STEPS.length}</p>
          </div>
        )}

        {/* Output */}
        {output && !loading && (
          <>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Brief summary */}
              <div className="w-full lg:w-72 xl:w-80 shrink-0 card-glow p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 pb-3 border-b border-white/6">Your Brief</p>
                <div className="space-y-4">
                  {[
                    { label: 'Business', value: businessName },
                    { label: 'Industry', value: industry },
                    { label: 'Goal', value: 'Get leads & grow awareness' },
                    { label: 'Language', value: language === 'sw' ? 'Kiswahili' : 'English' },
                    { label: 'Strategy', value: output.strategy.angle },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-sm text-white leading-snug">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-emerald-400 font-semibold">Generated by Nia AI</p>
                  </div>
                  <Link to="/register" className="btn-primary w-full text-center text-xs py-2.5">
                    Get My Full Campaign <ArrowRight size={12} />
                  </Link>
                  <button onClick={() => setOutput(null)}
                    className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors text-center py-1">
                    Try a different business
                  </button>
                </div>
              </div>

              {/* Output panel */}
              <div className="flex-1 min-w-0 card-glow overflow-hidden">
                <div className="flex border-b border-white/6 overflow-x-auto">
                  {DEMO_TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors flex-1 ${
                        activeTab === tab.id
                          ? 'text-white border-b-2 border-purple-500 bg-purple-500/5'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-white">{getTabContent().heading}</p>
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        color: copied ? '#34d399' : '#9ca3af',
                        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans max-h-72 overflow-y-auto">
                    {getTabContent().body}
                  </pre>
                </div>
                <div className="px-6 pb-6 pt-2 border-t border-white/6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-gray-500">
                      This is just the preview. The full campaign includes <span className="text-white">6 asset types + a full strategy brief</span>.
                    </p>
                    <Link to="/register" className="btn-primary text-xs px-4 py-2 shrink-0">
                      Get Full Campaign — KES 5,000 <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/* ─── Data ─────────────────────────────────────────────────── */
const industries = [
  { icon: Building2, name: 'Real Estate', desc: 'Property listings and launches' },
  { icon: Hotel, name: 'Hospitality', desc: 'Hotels, resorts, and travel' },
  { icon: GraduationCap, name: 'Education', desc: 'Schools, tutors, and edtech' },
  { icon: CreditCard, name: 'Fintech & SACCOs', desc: 'Loans, savings, and finance' },
  { icon: UtensilsCrossed, name: 'Restaurants', desc: 'Food promos and delivery' },
  { icon: Plane, name: 'Travel', desc: 'Tours and destination campaigns' },
  { icon: ShoppingBag, name: 'Retail', desc: 'Product launches and sales' },
  { icon: Calendar, name: 'Events', desc: 'Conferences and concerts' },
  { icon: Stethoscope, name: 'Clinics & Wellness', desc: 'Health and wellness services' },
  { icon: Briefcase, name: 'Professional', desc: 'Consulting and agencies' },
]

export default function Home() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-ink-900 min-h-screen">
      <PublicHeader />

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.35) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative z-10">
              <div className="section-tag mb-5 w-fit">
                <Sparkles size={11} /> AI-Powered Creative Platform
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.06] tracking-tight mb-5">
                Professional ads
                <br />
                <span className="text-gradient">ready in minutes.</span>
                <br />
                <span className="text-gray-400 text-4xl lg:text-5xl">Not weeks.</span>
              </h1>

              <p className="text-base text-gray-400 leading-relaxed mb-8 max-w-md">
                Stop paying agency rates. Nia Media creates scroll-stopping captions, video scripts, jingles, and radio spots — tailored to your business, for a fraction of the cost.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/register" className="btn-primary px-6 py-3 text-sm">
                  Start for Free
                  <ArrowRight size={15} />
                </Link>
                <button onClick={() => scrollTo('demo')} className="btn-secondary px-6 py-3 text-sm gap-2">
                  See a Live Demo
                </button>
              </div>

              {/* Proof strips */}
              <div className="flex flex-wrap gap-6 text-xs text-gray-500">
                {[
                  { icon: Clock, label: 'Ads ready in under 60 seconds' },
                  { icon: Shield, label: '100% copyright-free content' },
                  { icon: Target, label: 'Built for East African markets' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={12} className="text-purple-400 shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="relative z-10 hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section className="py-8 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">Industries we serve</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['Real Estate', 'Fintech & SACCOs', 'Hospitality', 'Education', 'Retail', 'Events'].map(ind => (
                <span key={ind} className="px-3 py-1.5 rounded-lg border border-white/8 bg-white/3 text-xs text-gray-400">{ind}</span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={11} className="text-amber-400" fill="currentColor" />)}
              </div>
              Rated 5 stars by early clients
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO (moved up — show before telling) ── */}
      <CampaignOutputDemo />

      {/* ── THREE SERVICES ── */}
      <section id="services" className="py-20 px-6 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="section-tag mb-3 inline-block">One Platform</span>
            <h2 className="text-3xl font-bold text-white mb-3">Three services. One platform.</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">From a quick social caption to a full broadcast commercial — everything your brand needs to show up professionally.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                color: '#8b5cf6',
                label: 'Campaign Copy',
                tag: 'From KES 5,000',
                desc: 'AI-generated captions, scripts, WhatsApp ads, poster copy — instantly, for any industry.',
                items: ['Instagram & Facebook captions', 'WhatsApp sales messages', 'Video ad scripts', 'Poster & billboard copy', 'Landing page copy'],
                cta: 'Generate Free Preview',
                to: '/register',
              },
              {
                icon: Film,
                color: '#3b82f6',
                label: 'Video Production',
                tag: 'From KES 5,000',
                desc: 'Human creative + AI tools produce broadcast-quality commercials, brand films, and documentaries.',
                items: ['15s / 30s / 60s commercials', 'Brand films & documentaries', 'AI-generated footage & avatars', '2 revision rounds included', 'Full exclusive rights on delivery'],
                cta: 'Start a Video Concept',
                to: '/register',
              },
              {
                icon: Music,
                color: '#10b981',
                label: 'Audio Studio',
                tag: 'From KES 1,500',
                desc: 'Radio-ready jingles, professional voice overs, and produced radio spots — separately billed.',
                items: ['Brand jingles (15s, 30s, 60s)', 'African voice overs — 14 voices', 'Fully produced radio spots', 'Kiswahili & English mix', 'All rights yours on delivery'],
                cta: 'Order Audio',
                to: '/register',
              },
            ].map(({ icon: Icon, color, label, tag, desc, items, cta, to }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/2 p-7 hover:border-purple-500/20 transition-all flex flex-col group">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 text-gray-400">{tag}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{label}</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">{desc}</p>
                <div className="space-y-2 mb-6 flex-1">
                  {items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-gray-300">
                      <CheckCircle2 size={12} style={{ color }} className="shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link to={to} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/10 hover:border-purple-500/40 transition-all">
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-2xl border border-green-500/15 bg-green-500/5 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Shield size={18} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Full rights. Zero agency markup.</p>
              <p className="text-xs text-gray-400 mt-0.5">All creative is produced exclusively for you — no stock libraries, no shared assets. Full exclusive rights transfer on delivery. You own everything.</p>
            </div>
            <Link to="/pricing" className="btn-secondary text-xs px-4 py-2 shrink-0 whitespace-nowrap">
              See All Pricing <ArrowRight size={12} className="inline" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="card-glow p-8 lg:p-10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-amber-400" fill="currentColor" />)}
                </div>
                <blockquote className="text-xl font-semibold text-white leading-relaxed mb-4">
                  "Nia Media helps us launch campaigns faster and get more results. It's like having a creative team on autopilot."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>B</div>
                  <div>
                    <p className="text-sm font-semibold text-white">Brian M.</p>
                    <p className="text-xs text-gray-500">Co-founder, PesaSure Fintech</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { icon: TrendingUp, val: '10X', label: 'Faster Ad Creation' },
                  { icon: BarChart2, val: '3X', label: 'More Engagement' },
                  { icon: Target, val: '40%', label: 'Lower Cost per Lead' },
                ].map(({ icon: Icon, val, label }) => (
                  <div key={label} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Icon size={16} className="text-purple-400" />
                      <span className="text-3xl font-extrabold text-gradient">{val}</span>
                    </div>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY NIA MEDIA ── */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, title: 'AI-Powered', desc: 'Advanced AI models trained to create ads that convert — not just look good.' },
              { icon: Target, title: 'Local Insight', desc: 'Built for Kenya and East Africa. We understand your audience, language, and culture.' },
              { icon: TrendingUp, title: 'Fast Turnaround', desc: 'Campaign copy in 60 seconds. Audio delivered within 24–48 hours.' },
              { icon: CheckCircle2, title: 'Fraction of Agency Cost', desc: 'An agency charges KES 150K+ for a campaign. We start at KES 5,000.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5 hover:border-purple-500/30 transition-all group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <Icon size={16} className="text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="section-tag mx-auto mb-4 w-fit">Industries</div>
            <h2 className="text-3xl font-bold text-white">Built for businesses that sell every day.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {industries.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="card p-4 text-center hover:border-purple-500/30 transition-all group cursor-pointer">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Icon size={16} className="text-purple-400" />
                </div>
                <p className="text-xs font-bold text-white mb-0.5">{name}</p>
                <p className="text-[11px] text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="section-tag mx-auto mb-4 w-fit">Process</div>
            <h2 className="text-3xl font-bold text-white">From brief to campaign in minutes.</h2>
          </div>
          <div className="grid lg:grid-cols-5 gap-4">
            {[
              { n: '1', title: 'Choose Service', desc: 'Pick campaign copy, video, or audio.' },
              { n: '2', title: 'Add Your Brief', desc: 'Tell us your business, audience, and goal.' },
              { n: '3', title: 'AI Generates', desc: 'Multiple high-converting creative options in seconds.' },
              { n: '4', title: 'Review & Refine', desc: 'Fine-tune your favourite to perfection.' },
              { n: '5', title: 'Publish & Grow', desc: 'Launch to Facebook, Instagram, WhatsApp, radio, and more.' },
            ].map(({ n, title, desc }, i, arr) => (
              <div key={n} className="relative card-glow p-5 text-center hover:border-purple-500/30 transition-all">
                {i < arr.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2 w-4 h-px z-10" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.6), rgba(59,130,246,0.3))' }} />
                )}
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>{n}</div>
                <h3 className="text-xs font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="section-tag mx-auto mb-4 w-fit">Pricing</div>
            <h2 className="text-3xl font-bold text-white">Flexible packages for every stage.</h2>
            <p className="text-sm text-gray-500 mt-3">Pay per project or monthly. No lock-in. Cancel whenever you need.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-7">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Starter Pack</p>
              <p className="text-3xl font-extrabold text-white mb-0.5">KES 5,000</p>
              <p className="text-xs text-gray-500 mb-6">One-time project</p>
              <div className="space-y-2.5 mb-8">
                {['1 video ad script', '2 poster copy concepts', '3 captions', '1 WhatsApp sales message', 'Campaign direction'].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} className="text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn-secondary w-full text-center text-sm">Get Started Free</Link>
            </div>

            <div className="relative rounded-2xl p-7 overflow-hidden"
              style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(139,92,246,0.4)' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>Most Popular</span>
              </div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 mt-2">Growth Pack</p>
              <p className="text-3xl font-extrabold text-white mb-0.5">KES 30,000</p>
              <p className="text-xs text-gray-500 mb-6">Per month · cancel anytime</p>
              <div className="space-y-2.5 mb-8">
                {['8 social media post ideas', '4 video ad scripts', 'Captions for all platforms', 'WhatsApp campaign copy', 'Monthly content direction'].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} className="text-purple-400 shrink-0" />
                    <span className="text-sm text-gray-200">{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/package-request" className="btn-primary w-full text-center text-sm">Choose Growth Pack</Link>
            </div>

            <div className="card p-7">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Business Pack</p>
              <p className="text-3xl font-extrabold text-white mb-0.5">KES 60,000</p>
              <p className="text-xs text-gray-500 mb-6">Per month · cancel anytime</p>
              <div className="space-y-2.5 mb-8">
                {['12 video ad concepts', '20 social media content ideas', 'Full campaign strategy', 'Landing page copy', 'Monthly creative review'].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} className="text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/package-request" className="btn-secondary w-full text-center text-sm">Talk to Us</Link>
            </div>
          </div>

          {/* Payment note */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><Shield size={11} className="text-green-400" /> Secure checkout</span>
            <span>·</span>
            <span>M-Pesa, Visa, Mastercard accepted</span>
            <span>·</span>
            <span>PesaPal powered</span>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="card-glow p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">More than ads. We build growth.</p>
              <h2 className="text-3xl font-extrabold text-white mb-4">Your next campaign shouldn't take weeks.</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Join businesses across Kenya using Nia Media to launch faster, spend smarter, and grow with professional creative content.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/register" className="btn-primary px-8 py-3.5 text-sm inline-flex">
                  Start for Free <ArrowRight size={15} />
                </Link>
                <Link to="/pricing" className="btn-secondary px-6 py-3.5 text-sm inline-flex">
                  View Pricing
                </Link>
              </div>
              <p className="text-xs text-gray-600 mt-5">No credit card required · Free to explore · M-Pesa accepted</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLOATING NIA BUTTON ── */}
      <NiaAgentButton />

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-gray-500">Professional ads for East African businesses.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</Link>
            <p className="text-xs text-gray-600">© 2026 Nia Media. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
