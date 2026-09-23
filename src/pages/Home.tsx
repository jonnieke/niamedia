import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PublicHeader from '../components/layout/PublicHeader'
import HomeVideoCarousel from '../components/HomeVideoCarousel'
import HomeCampaignGenerator from '../components/HomeCampaignGenerator'
import VideoModal from '../components/VideoModal'
import {
  Sparkles, Play, ArrowRight, CheckCircle2, Shield, Clock,
  Smartphone, Film, Zap, Layers, Star, MessageSquare, ChevronDown,
  Volume2, Eye, Award, Check, Image as ImageIcon, ExternalLink,
  BarChart3, Target, ArrowUpRight, Globe, CreditCard
} from 'lucide-react'

const WHATSAPP_URL = 'https://wa.me/254751822556?text=Hi%2C%20I%20need%20a%20video%20commercial%20for%20my%20business'

/* ─── Video Pricing Ladder ────────────────────────────────────────── */
const DURATION_TIERS = [
  { id: 'startup_hook', label: '30s Startup Hook', name: '30s Startup Social Hook', price: 2000, usd: 15, desc: 'Kinetic AI commercial + branded poster for startups & small biz' },
  { id: '30s', label: '30 seconds', name: '30s Social Ad',  price: 8000, usd: 65, desc: 'Standard commercial all platforms (minimum commercial tier)' },
  { id: '60s', label: '60 seconds', name: '60s Full Pitch', price: 15000, usd: 120, desc: 'Complete brand story & high-converting CTA' },
  { id: '90s', label: '90 seconds', name: '90s Deep Story', price: 20000, usd: 160, desc: 'Detailed product, app or service demonstration' },
  { id: '3m+', label: '3 min+',     name: '3m+ Brand Film', price: 60000, usd: 480, desc: 'Infomercial & mini-documentary for brands & institutions' },
]

/* ─── Visual Styles Bento Grid Data ───────────────────────────────── */
const VISUAL_STYLES = [
  {
    id: 'cinematic',
    title: 'Live-Action / Cinematic Commercial',
    tag: 'Live-Action',
    badge: 'Popular for Retail & Dining',
    desc: 'Real Kenyan talent, authentic business storefronts, crisp close-ups, and natural golden hour cinematography.',
    image: '/images/styles/style-cinematic.jpg',
    idealFor: 'Restaurants, Retail Shops, Salons, Hospitality',
    turnaround: '48h–72h standard',
  },
  {
    id: 'motion_2d',
    title: '2D Motion Graphics & Kinetic Typography',
    tag: '2D Animation',
    badge: 'Best for Tech & SACCOs',
    desc: 'Bold animated vector illustrations, kinetic typography, energetic transitions, and mobile app UI demos that explain complex products.',
    image: '/images/styles/style-motion-2d.jpg',
    idealFor: 'Fintech Apps, SACCOs, Logistics, Online Platforms',
    turnaround: '48h standard',
  },
  {
    id: '3d_stylized',
    title: 'Semi-Realistic / Stylized 3D Commercial',
    tag: '3D Stylized',
    badge: 'High-End Product Renders',
    desc: 'Glossy 3D product modeling, floating liquid physics, studio lighting reflections, and futuristic modern aesthetics.',
    image: '/images/styles/style-3d-stylized.jpg',
    idealFor: 'Beverages, Luxury Goods, Packaged Consumer Goods, Cosmetics',
    turnaround: '3–5 days',
  },
  {
    id: 'hyper_ai',
    title: 'Hyper-Realistic AI Cinematic Commercial',
    tag: 'Hyper AI',
    badge: 'IMAX-Grade Scale',
    desc: 'Photorealistic film-grade AI scenes, cinematic lighting, futuristic metropolis scales, and visual effects that turn heads.',
    image: '/images/styles/style-hyper-ai.jpg',
    idealFor: 'Tech Summits, Real Estate Concept Teasers, Automotive, Bold Brands',
    turnaround: '48h standard',
  },
]

/* ─── Wall of Posters Data ────────────────────────────────────────── */
const POSTERS_DATA = [
  {
    id: 'real-estate',
    title: 'Aspire Residences Kilimani',
    category: 'Luxury Real Estate',
    subtitle: 'Elevated Luxury. Urban Sophistication.',
    image: '/images/posters/poster-real-estate.jpg',
  },
  {
    id: 'rooftop-brunch',
    title: 'Nairobi Rooftop Weekend Brunch',
    category: 'Hospitality & Dining',
    subtitle: 'Exquisite Gourmet Cuisine & Skyline Views',
    image: '/images/posters/poster-brunch.jpg',
  },
  {
    id: 'tech-horizon',
    title: 'Nairobi Tech Horizon Summit',
    category: 'Conferences & Events',
    subtitle: 'Shaping the Future of African Innovation',
    image: '/images/styles/style-hyper-ai.jpg',
  },
  {
    id: 'fintech-growth',
    title: 'Smart Chama & Investment App',
    category: 'Fintech & SACCOs',
    subtitle: 'Grow Your Wealth with Instant Micro-Savings',
    image: '/images/styles/style-motion-2d.jpg',
  },
]

/* ─── Client Partner Logos ────────────────────────────────────────── */
const CLIENT_LOGOS = [
  'Onfon Media',
  'Onfon Mobile',
  'PesaFlix',
  'Treasured Artifacts',
  'Ndovu Group',
  'Somo Smart',
  'Adiel Media',
  'Shekel Coin',
]

/* ─── FAQs ────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'How does your video commercial production work?',
    a: 'It takes 3 simple steps: 1) You choose your duration and visual style in our 60-second quote flow or message us on WhatsApp. 2) We script, voice, and produce your commercial in 48–72 hours, sending you a watermarked preview cut for review (2 revision rounds included). 3) You approve the video, pay the 30% milestone balance, and download the clean 4K broadcast master with 100% commercial rights.',
  },
  {
    q: 'Why do you charge a 70% deposit to start?',
    a: 'Your 70% deposit locks in your creative director, voiceover artist, and production schedule immediately. The remaining 30% balance is payable only after you have reviewed and approved your watermarked video cut.',
  },
  {
    q: 'What languages and voiceover accents do you provide?',
    a: 'We provide authentic Kenyan English, Swahili (Kiswahili Sanifu), and Urban Sheng voiceovers recorded by professional Kenyan voice artists with commercial studio audio mastering.',
  },
  {
    q: 'Do I get the matching promotional poster for free?',
    a: 'Yes! Every commercial video project includes a matching high-resolution promotional graphic poster designed for your social media feed, WhatsApp broadcast, or print flyer.',
  },
  {
    q: 'How fast can you deliver?',
    a: 'Standard delivery is 48 to 72 hours. Need it urgently? Select our 24-hour Express Rush option during quote checkout.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept M-Pesa, Visa, and Mastercard through PesaPal secure checkout (Till 4122394 / Treasured Artifacts). You can also pay directly via M-Pesa on WhatsApp.',
  },
]

export default function Home() {
  const [searchParams] = useSearchParams()
  const [selectedDuration, setSelectedDuration] = useState('30s')
  const [currency, setCurrency] = useState<'KES' | 'USD'>(() => {
    const c = searchParams.get('currency')
    if (c) return c.toUpperCase() === 'USD' ? 'USD' : 'KES'
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nia_preferred_currency')
      if (stored === 'USD' || stored === 'KES') return stored
    }
    return 'KES'
  })

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      if (customEvent.detail === 'KES' || customEvent.detail === 'USD') {
        setCurrency(customEvent.detail as 'KES' | 'USD')
      }
    }
    window.addEventListener('nia-currency-changed', handleSync)
    return () => window.removeEventListener('nia-currency-changed', handleSync)
  }, [])

  const handleCurrencySwitch = (newCurrency: 'KES' | 'USD') => {
    setCurrency(newCurrency)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nia_preferred_currency', newCurrency)
      window.dispatchEvent(new CustomEvent('nia-currency-changed', { detail: newCurrency }))
    }
  }
  const [activeHeroStyle, setActiveHeroStyle] = useState(0)
  const [heroAspectRatio, setHeroAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showreelOpen, setShowreelOpen] = useState(false)
  const [selectedPosterModal, setSelectedPosterModal] = useState<typeof POSTERS_DATA[0] | null>(null)

  // Cycle hero style preview every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroStyle((prev) => (prev + 1) % VISUAL_STYLES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const currentDuration = DURATION_TIERS.find((d) => d.id === selectedDuration) ?? DURATION_TIERS[1]
  const currentHeroStyle = VISUAL_STYLES[activeHeroStyle]

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-purple-600 selection:text-white">
      {/* Dark Studio Glassmorphic Header */}
      <PublicHeader dark={true} />

      {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Ambient Volumetric Lighting */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Column: Core Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Studio Status Live Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/[0.05] border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300">STUDIO OPEN</span>
                <span className="text-white/30">•</span>
                <span className="text-white/70">48h Commercial Production · Kenya &amp; Worldwide 🌍</span>
              </div>

              {/* High-Impact Editorial Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
                Commercial Videos &amp;{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-purple-400">
                  Branded Posters
                </span>{' '}
                That Turn Scrollers into Customers.
              </h1>

              {/* Sub-Headline */}
              <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed font-normal">
                Nia Media scripts, films, and sound-engineers broadcast-quality commercial videos and promotional graphic posters for Kenyan and global businesses. Transparent pricing from <strong className="text-white">KES 2,000 ($15 USD)</strong>.
              </p>

              {/* Primary Action Button Cluster */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/quote"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_35px_rgba(147,51,234,0.5)] transition-all transform hover:-translate-y-0.5 border border-purple-400/30"
                >
                  <Sparkles size={18} className="text-amber-300 animate-pulse" />
                  <span>Request a Video Commercial</span>
                  <ArrowRight size={16} className="text-white/80" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowreelOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all"
                >
                  <Play size={15} className="fill-white" /> Watch 30s Showreel
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] shadow-lg transition-all"
                >
                  <MessageSquare size={16} /> WhatsApp
                </a>
              </div>

              {/* Trust Bar */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-white/60">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-purple-400" />
                  <span>70% Deposit to Start · 30% Balance on Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Free Matching Promotional Poster</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" />
                  <span>48h Standard Delivery</span>
                </div>
              </div>
            </div>

            {/* Hero Right Column: Interactive 3D Cinema Frame */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-[360px] bg-gradient-to-b from-white/15 to-white/5 p-1 rounded-3xl backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
                
                {/* Format Switcher Bar */}
                <div className="flex items-center justify-between p-3 bg-[#0c0916] rounded-t-[22px] border-b border-white/10 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/80">
                      LIVE STUDIO PREVIEW
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                    {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setHeroAspectRatio(ratio)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          heroAspectRatio === ratio ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cinema Display Screen - Edge-to-Edge with no gap */}
                <div
                  className={`relative w-full overflow-hidden bg-black transition-all duration-500 ${
                    heroAspectRatio === '9:16'
                      ? 'h-[480px]'
                      : heroAspectRatio === '16:9'
                      ? 'aspect-video'
                      : 'aspect-square'
                  }`}
                >
                  <img
                    src={currentHeroStyle.image}
                    alt={currentHeroStyle.title}
                    className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Floating Studio Spec Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white border border-white/20">
                      {currentHeroStyle.tag}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-600/90 text-white shadow">
                      {currentHeroStyle.badge}
                    </span>
                  </div>

                  {/* Interactive Play Trigger Overlay */}
                  <button
                    onClick={() => setShowreelOpen(true)}
                    className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-purple-600/90 group-hover:bg-purple-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.7)] group-hover:scale-110 transition-transform">
                      <Play size={24} className="fill-white translate-x-0.5" />
                    </div>
                  </button>

                  {/* Audio Equalizer & Title Bottom Bar */}
                  <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white text-xs">{currentHeroStyle.title}</p>
                      <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                        Kenyan Voiceover + Commercial Music Included
                      </p>
                    </div>

                    {/* Animated Sound Bars */}
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-1 bg-purple-400 h-2 animate-pulse" />
                      <span className="w-1 bg-purple-400 h-4 animate-bounce" />
                      <span className="w-1 bg-purple-400 h-3 animate-pulse" />
                      <span className="w-1 bg-purple-400 h-4 animate-bounce" />
                    </div>
                  </div>
                </div>

                {/* Style Carousel Selector Below Cinema Screen */}
                <div className="p-3 bg-[#0c0916] rounded-b-[22px] border-t border-white/10 flex items-center justify-between gap-1">
                  {VISUAL_STYLES.map((style, idx) => (
                    <button
                      key={style.id}
                      onClick={() => setActiveHeroStyle(idx)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold text-center transition-all truncate ${
                        activeHeroStyle === idx
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      {style.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CLIENT BRANDS MARQUEE ─────────────────────────────────────────────── */}
      <div className="border-y border-white/10 bg-white/[0.02] py-5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/40 whitespace-nowrap">
            TRUSTED BY BUSINESSES ACROSS KENYA
          </span>
          <div className="w-full overflow-hidden relative">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
              {CLIENT_LOGOS.concat(CLIENT_LOGOS).map((logo, i) => (
                <span
                  key={i}
                  className="text-sm font-bold text-white/50 hover:text-white transition-colors cursor-default"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE AI CAMPAIGN & BRIEF GENERATOR (VOICE / TEXT) ───────────── */}
      <HomeCampaignGenerator />

      {/* ── SATISFIED CUSTOMERS VIDEO CAROUSEL ─────────────────────────────────── */}
      <HomeVideoCarousel />

      {/* ── INTERACTIVE RATE EXPLORER (HOMEPAGE TEASER) ────────────────────────── */}
      <section className="py-16 px-6 relative bg-gradient-to-b from-[#07050d] via-[#0d091a] to-[#07050d]">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white/[0.03] border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                  INSTANT RATE EXPLORER
                </span>
                {/* Currency Switcher Toggle */}
                <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/15">
                  <button
                    type="button"
                    onClick={() => handleCurrencySwitch('KES')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      currency === 'KES' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    KES
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencySwitch('USD')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      currency === 'USD' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Transparent Video Pricing. Zero Hidden Fees.
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Choose your duration to calculate your exact rate and 70% production deposit.
              </p>
            </div>
            <div className="text-right self-start md:self-end">
              <span className="text-xs text-white/40 block">Estimated Total</span>
              <span className="text-3xl font-extrabold text-white">
                {currency === 'KES' ? `KES ${currentDuration.price.toLocaleString()}` : `$${currentDuration.usd.toLocaleString()} USD`}
              </span>
              <span className="text-xs text-emerald-400 font-semibold block mt-0.5">
                (70% Deposit to Start: {currency === 'KES' ? `KES ${Math.round(currentDuration.price * 0.7).toLocaleString()}` : `$${Math.round(currentDuration.usd * 0.7).toLocaleString()} USD`})
              </span>
            </div>
          </div>

          {/* Interactive Duration Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
            {DURATION_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedDuration(tier.id)}
                className={`p-3 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                  selectedDuration === tier.id
                    ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white">{tier.label}</p>
                  <p className="text-[10px] text-white/40 leading-tight mt-1">{tier.desc}</p>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xs font-extrabold text-amber-300">
                    {currency === 'KES' ? `KES ${tier.price.toLocaleString()}` : `$${tier.usd} USD`}
                  </span>
                  <span className="text-[10px] font-semibold text-white/50">
                    {currency === 'KES' ? `~$${tier.usd} USD` : `~KES ${tier.price.toLocaleString()}`}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Deliverable Inclusions Strip */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-white/70">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>Scriptwriting Included</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>Kenyan Voiceover Included</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>Free Promotional Poster</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>2 Revision Rounds</span>
              </span>
            </div>

            <Link
              to={`/quote?length=${selectedDuration}&currency=${currency}`}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow"
            >
              Start This Project <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TEST YOUR BRAND TEASER ────────────────────────────────────────────── */}
      <section className="py-12 px-6 relative bg-gradient-to-r from-purple-950/40 via-[#0c081e] to-indigo-950/40 border-y border-purple-500/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-purple-300 border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>NEW: AI BRAND &amp; PRICING VIABILITY STUDIO</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Test Your Product Compatibility Before Producing a Commercial
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Upload a screenshot or product concept to benchmark customer uptake %, real market pricing (KES/USD), competitor share, and regional targeting (Urban vs Mass vs Global).
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 pt-1">
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <CheckCircle2 size={13} /> 100% Free Instant Diagnostic
              </span>
              <span className="flex items-center gap-1 text-purple-300 font-semibold">
                <BarChart3 size={13} /> Competitor Benchmark
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <Target size={13} /> Price Elasticity Simulator
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/test-brand"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all transform hover:-translate-y-0.5 border border-purple-400/30"
            >
              <Sparkles size={16} className="text-amber-300" />
              <span>Launch Brand Test Studio</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── VISUAL STYLES BENTO SHOWCASE ──────────────────────────────────────── */}
      <section id="services" className="py-24 px-6 relative bg-[#07050d]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 bg-purple-500/15 text-purple-300 border border-purple-500/25">
              <Film size={13} />
              <span>THE 4 VISUAL STYLES</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Crafted to Command Attention on Every Feed
            </h2>
            <p className="text-sm text-white/60 mt-2">
              Whether you need live-action storefront footage, dynamic 2D app animations, or high-end 3D product renders, we deliver studio-grade polish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VISUAL_STYLES.map((style) => (
              <div
                key={style.id}
                className="group relative rounded-3xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-purple-500/50 transition-all duration-500 flex flex-col justify-between shadow-xl"
              >
                {/* Visual Image Banner */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                  <img
                    src={style.image}
                    alt={style.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0916] via-[#0c0916]/30 to-transparent" />

                  {/* Style Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white border border-white/20">
                      {style.tag}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-purple-600/90 backdrop-blur-md text-white shadow">
                      {style.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-4 text-xs text-white/60 font-medium">
                    Turnaround: <strong className="text-white">{style.turnaround}</strong>
                  </div>
                </div>

                {/* Details & Copy */}
                <div className="p-6 md:p-8 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{style.title}</h3>
                    <p className="text-xs sm:text-sm text-white/65 leading-relaxed mb-4">
                      {style.desc}
                    </p>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70 mb-6">
                      <strong className="text-purple-300">Ideal For:</strong> {style.idealFor}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Full Commercial Rights
                    </span>
                    <Link
                      to={`/quote?style=${style.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                    >
                      Quote This Style <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE "WALL OF POSTERS" SHOWCASE ────────────────────────────────────── */}
      <section className="py-24 px-6 relative bg-[#07050d]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 bg-amber-500/15 text-amber-300 border border-amber-500/25">
                <ImageIcon size={13} />
                <span>BRANDED PROMOTIONAL POSTERS</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                High-Impact Posters for WhatsApp &amp; Social Feeds
              </h2>
              <p className="text-sm text-white/60 max-w-xl mt-2">
                Every video project includes a matching graphic poster. You can also order custom one-off poster kits for your events, offers, and launches.
              </p>
            </div>

            <Link
              to="/quote"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all self-start md:self-end"
            >
              Order Matching Poster <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POSTERS_DATA.map((poster) => (
              <div
                key={poster.id}
                onClick={() => setSelectedPosterModal(poster)}
                className="group relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer hover:border-amber-400/50 transition-all duration-300 shadow-lg"
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={poster.image}
                    alt={poster.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                </div>

                <div className="absolute bottom-4 inset-x-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/90 text-black font-mono">
                    {poster.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{poster.title}</h3>
                  <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">{poster.subtitle}</p>
                </div>

                {/* Hover Quick Zoom Trigger */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/20">
                    <Eye size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3-STEP PRODUCTION PIPELINE ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 relative bg-gradient-to-b from-[#07050d] to-[#0c0916] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
              SIMPLE &amp; TRANSPARENT
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
              From Concept to Master in 3 Steps
            </h2>
            <p className="text-sm text-white/60 mt-2">
              No endless back-and-forth emails. A clean, streamlined studio experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Brief & Style Lock',
                desc: 'Pick your duration, visual style, and voiceover in 60 seconds on our instant quote form or via WhatsApp. Pay your 70% deposit to reserve your creative team.',
              },
              {
                step: '02',
                title: '48h Studio Production',
                desc: 'Our team scripts, voices, sound-engineers, and edits your commercial. You receive a watermarked preview link with 2 included revision rounds.',
              },
              {
                step: '03',
                title: 'Clear Balance & Launch',
                desc: 'Approve your final preview cut, clear the 30% milestone balance, and immediately download your clean 4K broadcast master and full commercial usage rights.',
              },
            ].map((s, idx) => (
              <div
                key={s.step}
                className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md relative flex flex-col justify-between"
              >
                <div>
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                    {s.step}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-4 mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-white/65 leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
                  <CheckCircle2 size={14} className="text-purple-400" /> Guaranteed Timeline
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KENYAN DIASPORA & GLOBAL BUSINESSES ──────────────────────────────── */}
      <section className="py-20 px-6 relative bg-gradient-to-b from-[#0c0916] via-[#150a2a] to-[#07050d] border-t border-purple-500/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Globe size={13} className="text-amber-400" />
                <span>FOR KENYAN DIASPORA &amp; GLOBAL BRANDS</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Run Your Business in Kenya From Abroad? We Are Your On-Ground Media Studio.
              </h2>
              <p className="text-sm text-white/70 max-w-2xl mt-2 leading-relaxed">
                Whether you are managing luxury Airbnbs, real estate developments, retail stores, or tech startups from London, Texas, Dubai, or Toronto — get broadcast-grade commercial video ads produced in Nairobi without the hassle of local coordination.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/quote?currency=USD"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all"
              >
                <CreditCard size={14} className="text-amber-300" /> Quote in USD ($15–$480)
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-4 font-bold">
                  01
                </div>
                <h3 className="text-lg font-bold text-white mb-2">100% Remote Video Direction</h3>
                <p className="text-xs text-white/65 leading-relaxed">
                  Brief our team online in 60 seconds. We write the script, voice the audio with Kenyan or global talent, and shoot or animate your commercial. You review a watermarked preview link with 2 included revision rounds.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Zero travel or on-site supervision needed
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-4 font-bold">
                  02
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Pay in USD with Visa &amp; Mastercard</h3>
                <p className="text-xs text-white/65 leading-relaxed">
                  Pay securely using any international credit or debit card through PesaPal. Transparent 70% deposit to start ($10–$336 USD) and 30% milestone balance payable only when you approve the final cut.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> No foreign exchange hassle or M-Pesa requirement
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 mb-4 font-bold">
                  03
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Kenyan Culture or Global Polish</h3>
                <p className="text-xs text-white/65 leading-relaxed">
                  Target local Kenyan customers with authentic Kenyan English, Swahili, or Sheng — or choose North American/British corporate voiceovers to pitch international diaspora investors.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-[11px] font-semibold text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> 6 authentic accent profiles ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 relative bg-[#07050d]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
              CLARITY &amp; PEACE OF MIND
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-purple-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform text-white/50 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-center text-xs text-white/50 mt-8">
            Have a custom brief or enterprise question?{' '}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold hover:underline"
            >
              Chat directly with our Creative Director on WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* ── CLOSING STUDIO CTA BANNER ─────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-b from-[#07050d] via-[#120a24] to-[#07050d] border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Sparkles size={13} />
            <span>START YOUR PRODUCTION TODAY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Ready to Upgrade Your Business with Studio-Grade Commercials?
          </h2>

          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-8">
            Lock in your creative director, voiceover artist, and video schedule in 60 seconds. 70% deposit to start, 30% on delivery approval.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_40px_rgba(147,51,234,0.5)] transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles size={16} /> Get Your Instant Quote
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all"
            >
              <MessageSquare size={16} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {/* 30s Showreel Video Modal */}
      {showreelOpen && (
        <VideoModal
          isOpen={showreelOpen}
          onClose={() => setShowreelOpen(false)}
          videoUrl="https://www.youtube.com/embed/FQzMXAd0lNU"
          title="Own a Smartphone Without Paying All at Once | Onfon Mobile"
          clientName="Onfon Mobile"
          deliverableTag="60s Commercial Showcase"
          aspectRatio="16:9"
        />
      )}

      {/* Poster Zoom Lightbox Modal */}
      {selectedPosterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedPosterModal(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#0d0918] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden">
              <img
                src={selectedPosterModal.image}
                alt={selectedPosterModal.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/90 text-black">
                  {selectedPosterModal.category}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedPosterModal.title}</h3>
                <p className="text-xs text-white/60">{selectedPosterModal.subtitle}</p>
              </div>
              <Link
                to="/quote"
                onClick={() => setSelectedPosterModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Order This Style
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
