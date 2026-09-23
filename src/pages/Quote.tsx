import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Film, CheckCircle2, ArrowRight, Clock, Zap,
  Phone, Building2, MessageSquare, ChevronRight, Star, Mic, Loader2, Paperclip, Sparkles, Trash2, Lock, FileText,
  Sliders, Palette, Volume2, ShieldCheck, Check, Edit3, ArrowLeft, RefreshCw, Layers, HelpCircle,
  Smartphone, CreditCard
} from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { supabase } from '../lib/supabase'
import { SECONDARY_NIA_CTA } from '../lib/cta'
import { trackEvent } from '../lib/analytics'
import MarketSurveyModal from '../components/MarketSurveyModal'
import QuotationPrintModal, { QuotationData } from '../components/QuotationPrintModal'
import PackageCompareModal from '../components/PackageCompareModal'

/* Pricing Constants & Logic */

export const BUSINESS_SIZES = [
  { id: 'startup', label: 'Startup / Solopreneur', desc: 'Pre-revenue or early stage (< 5 team)', recommended: 'startup_hook' },
  { id: 'sme', label: 'Small Business (SME)', desc: 'Local store, clinic, agency or service', recommended: '30s' },
  { id: 'growth', label: 'Growing Brand', desc: 'Scaling digital ads across multiple feeds', recommended: '60s' },
  { id: 'enterprise', label: 'Enterprise / Corporate', desc: 'SACCO, tech summit, or national brand', recommended: '90s' },
]

export const BUSINESS_GOALS = [
  { id: 'social_ads', label: 'High-Converting Social Ads', desc: 'Reels, TikTok & Shorts hooks' },
  { id: 'whatsapp_leads', label: 'Direct WhatsApp Sales Leads', desc: 'Direct customer inquiries' },
  { id: 'product_launch', label: 'Product / Service Launch', desc: 'Announce new offer or menu' },
  { id: 'brand_authority', label: 'Brand Trust & Prestige', desc: 'Broadcast-grade cinematic authority' },
  { id: 'cut_costs', label: 'Quality Without Agency Markup', desc: 'Transparent fast-turnaround production' },
]

export const TARGET_MARKETS = [
  { id: 'kenya', label: 'Kenya 🇰🇪', desc: 'Local Kenyan audience' },
  { id: 'east_africa', label: 'East Africa 🌍', desc: 'Kenya, Uganda, Tanzania, Rwanda' },
  { id: 'global', label: 'Global / International 🌐', desc: 'US, UK, Europe, UAE, Worldwide' },
]

const LENGTHS = [
  { id: 'startup_hook', label: '30s Startup Social Hook', desc: 'Kinetic AI commercial + branded poster + captions', price: 2000, usd: 15, tag: 'Startups & Small Biz' },
  { id: '30s', label: '30 seconds Standard', desc: 'Full broadcast commercial all platforms (Minimum Duration)', price: 8000, usd: 65, tag: 'Most Popular' },
  { id: '60s', label: '60 seconds Campaign', desc: 'Campaign film with full narrative story arc & CTA', price: 15000, usd: 120, tag: 'Growth Brands' },
  { id: '90s', label: '90 seconds Deep Story', desc: 'Extended product, app or real estate demonstration', price: 20000, usd: 160, tag: 'Deep Showcases' },
  { id: '3m+', label: '3 min+ Brand Documentary', desc: 'Infomercial & institutional brand mini-documentary', price: 60000, usd: 480, tag: 'Enterprise & Summits' },
]

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',    desc: 'Vertical 9:16' },
  { id: 'instagram', label: 'Instagram', desc: 'Reels & Feed' },
  { id: 'facebook',  label: 'Facebook',  desc: 'Feed & Video' },
  { id: 'whatsapp',  label: 'WhatsApp',  desc: 'Status & Broadcast' },
  { id: 'youtube',   label: 'YouTube',   desc: 'Horizontal 16:9 / Shorts' },
  { id: 'linkedin',  label: 'LinkedIn',  desc: 'Corporate Feed' },
]

const INDUSTRIES = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO',
  'Restaurant', 'Travel', 'Retail', 'Health & Wellness',
  'Events', 'Professional Services', 'Faith & Community', 'Other',
]

const RUSH = [
  { id: 'standard', label: 'Standard',   desc: '3-5 business days', mult: 1.0 },
  { id: '48h',      label: '48-hr rush', desc: '+25% expedite fee', mult: 1.25 },
  { id: '24h',      label: '24-hr rush', desc: '+50% expedite fee', mult: 1.5 },
]

const VISUAL_STYLES = [
  {
    id: 'cinematic',
    title: 'Live-Action / Cinematic Commercial',
    desc: 'Real talent, real location footage, product close-ups, crisp cinematography.',
    badge: 'Popular for Retail & Products',
    tag: 'Live-Action',
    icon: Film,
    image: '/images/styles/style-cinematic.jpg',
  },
  {
    id: 'motion_2d',
    title: '2D Motion Graphics & Kinetic Typography',
    desc: 'Bold animated vectors, dynamic kinetic text, energetic transitions, high engagement.',
    badge: 'Best for Tech, SACCOs & Apps',
    tag: '2D Animation',
    icon: Zap,
    image: '/images/styles/style-motion-2d.jpg',
  },
  {
    id: '3d_stylized',
    title: 'Semi-Realistic / Stylized 3D Commercial',
    desc: 'Sleek 3D product renders, stylized illustrative elements, futuristic aesthetic.',
    badge: 'Modern & Eye-Catching',
    tag: '3D Stylized',
    icon: Sparkles,
    image: '/images/styles/style-3d-stylized.jpg',
  },
  {
    id: 'hyper_ai',
    title: 'Hyper-Realistic AI Cinematic Commercial',
    desc: 'Photorealistic film-grade AI scenes, cinematic scale, high-end global aesthetic.',
    badge: 'Film-Grade Aesthetics',
    tag: 'Hyper AI',
    icon: Star,
    image: '/images/styles/style-hyper-ai.jpg',
  },
]

const VOICE_TONES = [
  { id: 'en_ke', label: 'Kenyan English', desc: 'Warm, clear, and professional Kenyan delivery' },
  { id: 'sw_ke', label: 'Kiswahili', desc: 'Authentic, culturally grounded Kiswahili Sanifu' },
  { id: 'sheng', label: 'Urban / Sheng', desc: 'High-energy youth and street appeal' },
  { id: 'en_us', label: 'US English (Global)', desc: 'North American commercial broadcast delivery' },
  { id: 'en_uk', label: 'UK English (Global)', desc: 'British corporate & prestige delivery' },
  { id: 'global_neutral', label: 'Global Neutral English', desc: 'International accent for worldwide audiences' },
]

function calcPrice(
  lengthId: string,
  platforms: string[],
  rush: string,
  subtitles: boolean,
): { min: number; max: number; total: number; usdTotal: number } {
  const base = LENGTHS.find(l => l.id === lengthId) ?? LENGTHS[1]
  const rushMult = RUSH.find(r => r.id === rush)?.mult ?? 1
  const platformMult = platforms.includes('youtube') ? 1.15 : 1
  const multiMult = platforms.length >= 3 ? 1.1 : 1
  const sub = subtitles ? 500 : 0
  const usdSub = subtitles ? 4 : 0
  const total = Math.round(base.price * rushMult * platformMult * multiMult + sub)
  const usdTotal = Math.round(base.usd * rushMult * platformMult * multiMult + usdSub)

  return {
    min: total,
    max: total,
    total,
    usdTotal,
  }
}

/* Step Bar Sub-Component */

function StepBar({ step, onStepClick }: { step: number; onStepClick: (step: number) => void }) {
  const steps = [
    { label: 'Business Survey', short: '1. Survey' },
    { label: 'Scope & Tier', short: '2. Scope' },
    { label: 'Style & Voice', short: '3. Style' },
    { label: 'Brief & Media', short: '4. Brief' },
    { label: 'Quote Review', short: '5. Review' },
  ]

  return (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
      {steps.map((s, i) => {
        const isPassed = i < step
        const isCurrent = i === step
        const isClickable = i <= step

        return (
          <div key={s.label} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              className={`flex items-center gap-2 group transition-all ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isPassed
                    ? 'bg-emerald-500 text-white group-hover:bg-emerald-600'
                    : isCurrent
                    ? 'bg-purple-600 text-white ring-4 ring-purple-100 shadow-md'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isPassed ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                  isCurrent ? 'text-purple-900 font-bold' : isPassed ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                <span className="sm:hidden">{s.short}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            </button>

            {i < steps.length - 1 && (
              <div className="w-5 sm:w-8 h-0.5 mx-2 bg-gray-200" />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* Sticky Price Panel */

function PricePanel({
  max,
  usdMax,
  length,
  rush,
  platforms,
  subtitles,
  visualStyle,
  currency,
  onCurrencyToggle,
}: {
  max: number
  usdMax: number
  length: string
  rush: string
  platforms: string[]
  subtitles: boolean
  visualStyle: string
  currency: 'KES' | 'USD'
  onCurrencyToggle: (c: 'KES' | 'USD') => void
}) {
  const rushLabel = RUSH.find(r => r.id === rush)?.label ?? 'Standard'
  const lengthObj = LENGTHS.find(l => l.id === length) ?? LENGTHS[1]
  const styleLabel = VISUAL_STYLES.find(s => s.id === visualStyle)?.tag ?? 'Live-Action'

  const displayTotal = currency === 'KES' ? `KES ${max.toLocaleString()}` : `$${usdMax.toLocaleString()} USD`
  const altTotal = currency === 'KES' ? `~$${usdMax.toLocaleString()} USD` : `~KES ${max.toLocaleString()}`
  const deposit = currency === 'KES' ? `KES ${Math.round(max * 0.7).toLocaleString()}` : `$${Math.round(usdMax * 0.7).toLocaleString()} USD`
  const balance = currency === 'KES' ? `KES ${Math.round(max * 0.3).toLocaleString()}` : `$${Math.round(usdMax * 0.3).toLocaleString()} USD`

  return (
    <div
      className="rounded-2xl p-6 sticky top-24 shadow-xl border"
      style={{
        background: 'linear-gradient(145deg, #09031a 0%, #150833 100%)',
        borderColor: 'rgba(167,139,250,0.3)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">STANDARD ESTIMATE</p>
        <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/15">
          <button
            type="button"
            onClick={() => onCurrencyToggle('KES')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              currency === 'KES' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            KES
          </button>
          <button
            type="button"
            onClick={() => onCurrencyToggle('USD')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              currency === 'USD' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      <div className="mb-5">
        <p className="text-3xl font-black text-white">{displayTotal}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-purple-200/80 font-medium">{altTotal}</span>
          <span className="text-[11px] text-purple-200/40">•</span>
          <span className="text-[11px] text-purple-200/60">2 revision rounds included</span>
        </div>
      </div>

      <div className="space-y-2 mb-5 pb-5 border-b border-white/10 text-xs">
        {[
          { label: 'Video tier', val: lengthObj.label },
          { label: 'Visual style', val: styleLabel },
          { label: 'Delivery', val: rushLabel },
          {
            label: 'Platforms',
            val: platforms.length > 0 ? platforms.map(p => PLATFORMS.find(pl => pl.id === p)?.label || p).join(', ') : 'Not selected',
          },
          { label: 'Promo poster', val: 'Included Free' },
          { label: 'Subtitles', val: subtitles ? (currency === 'KES' ? '+KES 500' : '+$4 USD') : 'None' },
        ].map(({ label, val }) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="text-purple-200/60 shrink-0">{label}</span>
            <span className="text-right font-medium text-white/90">{val}</span>
          </div>
        ))}
      </div>

      {/* Milestone Terms */}
      <div className="rounded-xl p-3 bg-white/5 border border-white/10 space-y-1.5 mb-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-purple-200/70">70% Deposit to Start:</span>
          <span className="font-extrabold text-emerald-400">{deposit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-purple-200/70">30% Balance on Delivery:</span>
          <span className="font-semibold text-white">{balance}</span>
        </div>
      </div>

      <div className="space-y-2 text-[11px] text-purple-200/60 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
          <span>Branded promo poster included free</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
          <span>AI-generated script before filming</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
          <span>Full commercial broadcast rights</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 text-center">
        <p className="text-[10px] font-bold tracking-widest text-purple-200/40 uppercase mb-1">TRUSTED CLIENTS</p>
        <p className="text-[11px] text-purple-200/50">Treasured Artifacts · Onfon · PesaFlix · Ndovu</p>
      </div>
    </div>
  )
}

/* Session Storage Helper */

const SUCCESS_KEY = 'nia_quote_submitted'
const SUCCESS_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

interface StoredSuccess {
  bizName: string
  waMessage: string
  quoteId?: string
  depositAmount?: number
  totalPrice?: number
  email?: string
  phone?: string
  lengthLabel?: string
  isPaid?: boolean
  ts: number
}

function readStoredSuccess(): StoredSuccess | null {
  if (typeof window === 'undefined') return null
  const isSubmitted = window.location.search.includes('submitted=1')
  const isPaid = window.location.search.includes('paid=true')
  if (!isSubmitted && !isPaid) return null
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SUCCESS_KEY) ?? 'null')
    if (!parsed?.ts || Date.now() - parsed.ts > SUCCESS_TTL_MS) return null
    if (!parsed.bizName) return null
    if (isPaid) {
      parsed.isPaid = true
    }
    return parsed
  } catch {
    return null
  }
}

/* Main Component */

export default function Quote() {
  const [successData, setSuccessData] = useState(() => readStoredSuccess())
  // Step 0: Contacts, 1: Scope, 2: Style, 3: Brief, 4: Live Adjuster Review, 5: Confirmed
  const [step, setStep] = useState(() => (readStoredSuccess() ? 5 : 0))

  // Step 0 - Contact Details
  const demoCtx = (() => {
    try {
      const ctx = JSON.parse(localStorage.getItem('nia_demo_ctx') ?? '{}')
      return typeof ctx === 'object' && ctx !== null ? ctx : {}
    } catch {
      return {}
    }
  })()

  const [bizName, setBizName] = useState<string>(demoCtx.businessName ?? '')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [industry, setIndustry] = useState<string>(
    INDUSTRIES.includes(demoCtx.industry) ? demoCtx.industry : ''
  )

  // Survey States
  const isUsdParam = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('currency')?.toUpperCase() === 'USD' ||
    localStorage.getItem('nia_preferred_currency') === 'USD'
  )
  const [currency, setCurrency] = useState<'KES' | 'USD'>(isUsdParam ? 'USD' : 'KES')
  const [compareOpen, setCompareOpen] = useState(false)
  const [businessStage, setBusinessStage] = useState<string>('startup')
  const [primaryGoal, setPrimaryGoal] = useState<string>('social_ads')
  const [targetMarket, setTargetMarket] = useState<string>(isUsdParam ? 'global' : 'kenya')

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      if (customEvent.detail === 'KES' || customEvent.detail === 'USD') {
        const next = customEvent.detail as 'KES' | 'USD'
        setCurrency(next)
        if (next === 'USD') {
          setTargetMarket('global')
          setVoiceTone('global_neutral')
        }
      }
    }
    window.addEventListener('nia-currency-changed', handleSync)
    return () => window.removeEventListener('nia-currency-changed', handleSync)
  }, [])

  // Step 1 - Video Scope & Formats
  const [length, setLength] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('length')
      if (p && LENGTHS.some(l => l.id === p)) return p
    }
    return '30s'
  })
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'tiktok'])
  const [rush, setRush] = useState('standard')

  // Step 2 - Creative Style & Add-ons
  const [visualStyle, setVisualStyle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('style')
      if (s && VISUAL_STYLES.some(v => v.id === s)) return s
    }
    return 'cinematic'
  })
  const [voiceTone, setVoiceTone] = useState(isUsdParam ? 'global_neutral' : 'en_ke')
  const [poster] = useState(true)
  const [subtitles, setSubtitles] = useState(false)

  const handleSelectBusinessStage = (stageId: string) => {
    setBusinessStage(stageId)
    const rec = BUSINESS_SIZES.find(b => b.id === stageId)?.recommended
    if (rec) setLength(rec)
  }

  const handleSelectTargetMarket = (marketId: string) => {
    setTargetMarket(marketId)
    if (marketId === 'global') {
      setCurrency('USD')
      setVoiceTone('global_neutral')
    } else {
      setCurrency('KES')
      setVoiceTone('en_ke')
    }
  }

  // Step 3 - Brief & Media
  const [brief, setBrief] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const b = new URLSearchParams(window.location.search).get('brief')
      if (b) return b
    }
    return demoCtx.product ? `Promoting: ${demoCtx.product}` : ''
  })
  const [supportingFiles, setSupportingFiles] = useState<{
    id: string
    file: File
    width?: number
    height?: number
    isLowRes?: boolean
  }[]>([])
  const [isListening, setIsListening] = useState(false)
  const [listeningText, setListeningText] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [refining, setRefining] = useState(false)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showSurvey, setShowSurvey] = useState(false)
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [pesapalLoading, setPesapalLoading] = useState(false)
  const [pesapalError, setPesapalError] = useState('')
  const [stkPhone, setStkPhone] = useState('')
  const [stkLoading, setStkLoading] = useState(false)
  const [stkSent, setStkSent] = useState(false)
  const [stkMsg, setStkMsg] = useState('')
  const [portalToken, setPortalToken] = useState<string | null>(null)
  const [portalChecking, setPortalChecking] = useState(false)

  const price = useMemo(() => calcPrice(length, platforms, rush, subtitles), [length, platforms, rush, subtitles])

  const isDepositPaid = Boolean(successData?.isPaid || (typeof window !== 'undefined' && window.location.search.includes('paid=true')))

  // Auto-lookup project when deposit is cleared
  useEffect(() => {
    if (!isDepositPaid) return

    const clientEmail = successData?.email || email
    const bName = successData?.bizName || bizName

    setPortalChecking(true)
    let attempts = 0
    const maxAttempts = 12

    const findProject = async () => {
      attempts++
      let query = supabase.from('projects').select('id, token, business_name, email, status')
      if (clientEmail) {
        query = query.eq('email', clientEmail)
      } else if (bName) {
        query = query.eq('business_name', bName)
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (data?.token) {
        setPortalToken(data.token)
        setPortalChecking(false)
        return
      }

      if (attempts < maxAttempts) {
        setTimeout(findProject, 2000)
      } else {
        setPortalChecking(false)
      }
    }

    void findProject()
  }, [isDepositPaid, successData?.email, successData?.bizName, email, bizName])

  // Speech recognition setup
  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window))
    return () => {
      try {
        recognitionRef.current?.stop?.()
      } catch {}
    }
  }, [])

  const togglePlatform = (id: string) => {
    setPlatforms(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]))
  }

  const handleSupportingFiles = (incoming: FileList | null) => {
    if (!incoming) return
    Array.from(incoming).forEach(file => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      if (file.type.startsWith('image/')) {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
          const width = img.naturalWidth
          const height = img.naturalHeight
          const isLowRes = width < 800 || height < 600
          setSupportingFiles(prev => [...prev, { id, file, width, height, isLowRes }])
          URL.revokeObjectURL(url)
        }
        img.onerror = () => {
          setSupportingFiles(prev => [...prev, { id, file }])
          URL.revokeObjectURL(url)
        }
        img.src = url
      } else {
        setSupportingFiles(prev => [...prev, { id, file }])
      }
    })
  }

  const removeSupportingFile = (id: string) => {
    setSupportingFiles(prev => prev.filter(item => item.id !== id))
  }

  const handleMicClick = () => {
    if (!speechSupported) return
    if (isListening) {
      try {
        recognitionRef.current?.stop?.()
      } catch {}
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-KE'
    transcriptRef.current = ''

    recognition.onresult = (event: any) => {
      let full = ''
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript
      }
      transcriptRef.current = full
      setListeningText(full)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (transcriptRef.current.trim()) {
        setBrief(prev => (prev ? `${prev.trim()}\n${transcriptRef.current.trim()}` : transcriptRef.current.trim()))
        setListeningText('')
        transcriptRef.current = ''
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setListeningText('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const refineBrief = useCallback(async () => {
    const currentBrief = brief.trim()
    const lengthLabel = LENGTHS.find(l => l.id === length)?.label || '30s'
    const styleLabel = VISUAL_STYLES.find(s => s.id === visualStyle)?.title || 'Live-Action'

    setRefining(true)
    setError('')
    try {
      const promptText = currentBrief
        ? `Refine this commercial video brief for ${bizName || 'a business'} in ${industry || 'general industry'} into a sharp, conversion-oriented video brief. Duration: ${lengthLabel}. Style: ${styleLabel}. Draft: ${currentBrief}. Return only the improved brief prose without headers or markdown.`
        : `Write a compelling commercial video brief for ${bizName || 'a business'} in ${industry || 'general industry'}. Duration: ${lengthLabel}. Style: ${styleLabel}. Return only the brief prose without markdown.`

      const { data, error: fnErr } = await supabase.functions.invoke('assistant', {
        body: { prompt: promptText },
      })
      if (fnErr) throw fnErr

      const reply = data?.reply || data?.message || ''
      if (reply.trim()) {
        setBrief(reply.trim())
      }
    } catch {
      setError('AI assistant is temporarily busy. You can continue writing your brief manually.')
    } finally {
      setRefining(false)
    }
  }, [brief, bizName, industry, length, visualStyle])

  // Navigation handlers
  const goToScope = () => {
    if (!bizName.trim()) {
      setError('Please enter your business name.')
      return
    }
    if (!phone.trim()) {
      setError('Please enter your WhatsApp phone number.')
      return
    }
    setError('')
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Submission handler
  const submit = async () => {
    if (!bizName.trim() || !phone.trim()) {
      setError('Business name and phone number are required.')
      setStep(0)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const attachmentNotes: string[] = []
      for (const item of supportingFiles) {
        try {
          const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
          const path = `quote-requests/${uniqueId}-${safeName}`
          const { error: uploadErr } = await supabase.storage.from('brand-assets').upload(path, item.file, {
            upsert: false,
            contentType: item.file.type || 'application/octet-stream',
          })

          if (uploadErr) {
            attachmentNotes.push(`${item.file.name} (attached file)`)
            continue
          }

          const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
          attachmentNotes.push(`${item.file.name}: ${data.publicUrl}`)
        } catch {
          attachmentNotes.push(`${item.file.name} (attached file)`)
        }
      }

      const supportingText = attachmentNotes.length
        ? `\n\nSupporting files:\n${attachmentNotes.map(note => `- ${note}`).join('\n')}`
        : ''

      const selectedStyleObj = VISUAL_STYLES.find(s => s.id === visualStyle)
      const selectedVoiceObj = VOICE_TONES.find(v => v.id === voiceTone)
      const stageObj = BUSINESS_SIZES.find(s => s.id === businessStage)
      const goalObj = BUSINESS_GOALS.find(g => g.id === primaryGoal)
      const marketObj = TARGET_MARKETS.find(m => m.id === targetMarket)

      const surveySpec = `[Business Stage: ${stageObj?.label || 'Startup'}]\n[Primary Goal: ${goalObj?.label || 'Social Ads'}]\n[Target Market: ${marketObj?.label || 'Kenya'}]\n[Currency: ${currency}]\n[Visual Style: ${selectedStyleObj?.title || 'Live-Action'}]\n[Voiceover: ${selectedVoiceObj?.label || 'Kenyan English'}]\n\n`
      const whatToPromote = `${surveySpec}${brief.trim() || 'Will share brief details on WhatsApp'}${supportingText}`

      const generatedQuoteId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `q_${Date.now()}`

      const { error: dbErr } = await supabase.from('quote_requests').insert({
        id: generatedQuoteId,
        business_name: bizName.trim(),
        contact_name: contactName.trim() || null,
        phone: phone.trim(),
        email: email.trim() || null,
        industry: industry || null,
        video_length: length,
        platforms,
        what_to_promote: whatToPromote,
        delivery_speed: rush,
        include_poster: poster,
        include_subtitles: subtitles,
        price_min: price.min,
        price_max: price.max,
        status: 'new',
      })

      if (dbErr) {
        console.error('Quote submit failed:', dbErr)
        trackEvent('quote_submit_failed', { reason: 'db_error' })
        setError('Something went wrong. Please try again or message us on WhatsApp.')
        return
      }

      // Best-effort admin notification
      try {
        void supabase.rpc('notify_admins', {
          p_type: 'action',
          p_title: `New quote - ${bizName.trim()} (${stageObj?.label || 'Startup'})`,
          p_body: `${length} video (${selectedStyleObj?.tag}) - KES ${price.total.toLocaleString()} (~$${price.usdTotal} USD) - WhatsApp: ${phone.trim()}`,
          p_action_url: '/admin',
        })
        trackEvent('quote_submit_success', {
          video_length: length,
          platform_count: platforms.length,
          rush,
          poster,
          subtitles,
          visual_style: visualStyle,
          business_stage: businessStage,
          primary_goal: primaryGoal,
          target_market: targetMarket,
          currency,
          attachment_count: supportingFiles.length,
        })
      } catch {}

      const lengthLabel = LENGTHS.find(l => l.id === length)?.label || length
      const depositAmount = Math.round(price.total * 0.7)

      if (email.trim()) {
        try {
          void supabase.functions.invoke('send-client-email', {
            body: {
              type: 'quote_received',
              to: email.trim(),
              name: contactName.trim() || bizName.trim(),
              businessName: bizName.trim(),
              videoLength: lengthLabel,
              finalPrice: price.total,
              depositAmount,
              quoteId: generatedQuoteId,
            },
          })
        } catch {}
      }
      const submittedPayload: StoredSuccess = {
        bizName: bizName.trim(),
        waMessage,
        quoteId: generatedQuoteId,
        depositAmount,
        totalPrice: price.total,
        email: email.trim(),
        phone: phone.trim(),
        lengthLabel,
        ts: Date.now(),
      }

      try {
        sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(submittedPayload))
        window.history.replaceState(null, '', '/quote?submitted=1')
      } catch {}

      setSuccessData(submittedPayload)
      setStep(5) // Step 5 is Confirmed Screen
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Quote submit failed:', err)
      setError('Something went wrong submitting your quote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // PesaPal 70% Deposit Checkout
  const handlePayDeposit = async () => {
    setPesapalLoading(true)
    setPesapalError('')
    try {
      const qId = successData?.quoteId || `quote_${Date.now()}`
      const orderId = qId.startsWith('quote_') ? qId : `quote_${qId}`
      const depositAmt = successData?.depositAmount || Math.round(price.total * 0.7)
      const bName = successData?.bizName || bizName || 'Customer'
      const clientEmail = successData?.email || email || 'billing@niamedia.co.ke'
      const clientPhone = successData?.phone || phone || '0700000000'
      const lenLabel = successData?.lengthLabel || LENGTHS.find(l => l.id === length)?.label || 'Video'

      const { data, error: fnErr } = await supabase.functions.invoke('pesapal-checkout', {
        body: {
          orderId,
          quoteId: qId,
          amountKes: depositAmt,
          amount: depositAmt,
          description: `70% Deposit for ${bName} (${lenLabel} commercial)`,
          email: clientEmail,
          phone: clientPhone,
          customerName: bName,
          currency: 'KES',
          callbackUrl: `${window.location.origin}/quote?paid=true&quote_id=${qId}`,
        },
      })

      if (fnErr || !data?.redirectUrl) {
        throw new Error(data?.error || fnErr?.message || 'Unable to connect to PesaPal gateway')
      }

      window.location.href = data.redirectUrl
    } catch (err: any) {
      console.error('PesaPal checkout error:', err)
      setPesapalError(err.message || 'Payment initiation failed. Please WhatsApp us to pay directly via Paybill.')
      setPesapalLoading(false)
    }
  }

  // Direct M-Pesa STK Push with seamless PesaPal fallback
  const handleDirectMpesaStk = async () => {
    const rawNumber = (stkPhone || successData?.phone || phone || '').trim()
    if (!rawNumber) {
      setPesapalError('Please enter your Safaricom M-Pesa phone number.')
      return
    }
    setStkLoading(true)
    setPesapalError('')
    setStkMsg('')

    try {
      const qId = successData?.quoteId || `quote_${Date.now()}`
      const orderId = qId.startsWith('quote_') ? qId : `quote_${qId}`
      const depositAmt = successData?.depositAmount || Math.round(price.total * 0.7)

      const { data, error: fnErr } = await supabase.functions.invoke('mpesa-payment', {
        body: {
          phone: rawNumber,
          amount: depositAmt,
          reference: orderId,
        },
      })

      if (fnErr || data?.error) {
        if (data?.usePesapal) {
          // Gracefully fallback to PesaPal gateway
          await handlePayDeposit()
          return
        }
        throw new Error(data?.error || fnErr?.message || 'Direct STK push failed')
      }

      setStkSent(true)
      setStkMsg(`📲 STK Push prompt sent to ${rawNumber}! Check your phone now and enter your M-Pesa PIN for KES ${depositAmt.toLocaleString()}.`)
    } catch (err: any) {
      console.warn('Direct STK failed, falling back to PesaPal:', err)
      await handlePayDeposit()
    } finally {
      setStkLoading(false)
    }
  }

  // WhatsApp pre-fill message
  const waMessage = encodeURIComponent(
    `Hi Nia Media, I need a commercial video.\n\nBusiness: ${bizName}\nStage: ${BUSINESS_SIZES.find(s => s.id === businessStage)?.label || 'Startup'}\nGoal: ${BUSINESS_GOALS.find(g => g.id === primaryGoal)?.label || 'Social Ads'}\nMarket: ${TARGET_MARKETS.find(m => m.id === targetMarket)?.label || 'Kenya'}\nPackage: ${LENGTHS.find(l => l.id === length)?.label}\nStyle: ${VISUAL_STYLES.find(s => s.id === visualStyle)?.title}\nPlatforms: ${platforms.join(', ')}\nDelivery: ${RUSH.find(r => r.id === rush)?.label}\nEstimated Total: KES ${price.total.toLocaleString()} (~$${price.usdTotal} USD)\n70% Deposit to Start: KES ${Math.round(price.total * 0.7).toLocaleString()} (~$${Math.round(price.usdTotal * 0.7)} USD)\n\nWhat I am promoting: ${brief || 'Will share brief on WhatsApp'}\nContact: ${phone}`
  )

  // Quotation PDF modal data
  const quotationModalData = useMemo<QuotationData | null>(() => {
    const bName = successData?.bizName || bizName || 'Valued Client'
    const len = successData?.lengthLabel || LENGTHS.find(l => l.id === length)?.label || '30 seconds'
    const total = successData?.totalPrice || price.total
    const deposit = successData?.depositAmount || Math.round(total * 0.7)
    const balance = total - deposit

    return {
      quoteId: successData?.quoteId,
      businessName: bName,
      contactName: contactName || undefined,
      phone: phone || undefined,
      email: successData?.email || email || undefined,
      videoLength: len,
      platforms: platforms.map(p => PLATFORMS.find(pl => pl.id === p)?.label || p),
      deliverySpeed: rush,
      visualStyle: VISUAL_STYLES.find(s => s.id === visualStyle)?.title,
      standardPrice: total,
      depositAmount: deposit,
      balanceAmount: balance,
      isPaid: Boolean(successData?.isPaid || isDepositPaid),
    }
  }, [successData, bizName, contactName, phone, email, length, platforms, rush, visualStyle, price.total, isDepositPaid])

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <PublicHeader />

      {/* Hero Header */}
      <div className="pt-16" style={{ background: 'linear-gradient(145deg, #04000d 0%, #0b001f 55%, #040010 100%)' }}>
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}
          >
            <Film size={12} style={{ color: '#a78bfa' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#c4b5fd' }}>
              VIDEO COMMERCIAL CONFIGURATOR
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Configure Your Commercial Video
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto text-purple-200/70">
            Step through your requirements, select your visual style, and live-adjust your quote before submitting.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {step < 5 && <StepBar step={step} onStepClick={s => setStep(s)} />}

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">✕</button>
          </div>
        )}

        {/* STEP 5: CONFIRMED & DEPOSIT LOCK-IN */}
        {step === 5 ? (
          <div className="max-w-lg mx-auto text-center py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: isDepositPaid ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)',
                border: isDepositPaid ? '2px solid rgba(16,185,129,0.3)' : '2px solid rgba(124,58,237,0.25)',
              }}>
              <CheckCircle2 size={32} className={isDepositPaid ? 'text-emerald-500' : 'text-purple-600'} />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              {isDepositPaid ? '🎉 70% Deposit Confirmed!' : 'Quote request received'}
            </h2>

            <p className="text-gray-500 mb-6 leading-relaxed text-sm">
              {isDepositPaid ? (
                <>Your production queue slot is locked in for <strong className="text-gray-900">{successData?.bizName ?? bizName}</strong>. Our creative team has started prep work on your commercial.</>
              ) : (
                <>We have your brief, <strong className="text-gray-900">{successData?.bizName ?? bizName}</strong>. You can lock in your production queue immediately with a 70% deposit or chat with our team on WhatsApp first.</>
              )}
            </p>

            {/* Instant PesaPal 70% Deposit Checkout OR Cleared Milestone Portal */}
            {isDepositPaid ? (
              <div
                className="max-w-md mx-auto mb-6 p-6 rounded-2xl text-left shadow-xl border relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #052e16 0%, #064e3b 50%, #022c22 100%)', borderColor: 'rgba(52,211,153,0.4)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">Milestone Payment Verified</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    70% Deposit Cleared
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white mb-2">🎬 Live Production Assigned</h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed mb-4">
                  Your commercial is in pre-production. Track scriptwriting, filming, and watermarked cuts in your dedicated client portal.
                </p>

                {portalToken ? (
                  <Link
                    to={`/delivery/${portalToken}`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-extrabold text-white shadow-lg transition-all hover:opacity-95 active:scale-[0.99] cursor-pointer mb-3"
                    style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}
                  >
                    <Film size={16} /> Open Live Video Production Portal →
                  </Link>
                ) : portalChecking ? (
                  <div className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-xs font-semibold text-emerald-100 bg-emerald-900/50 border border-emerald-500/30 mb-3">
                    <Loader2 size={15} className="animate-spin text-emerald-300" />
                    Connecting your live production tracking portal...
                  </div>
                ) : (
                  <Link
                    to={`/delivery/demo`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-extrabold text-white shadow-lg transition-all hover:opacity-95 active:scale-[0.99] cursor-pointer mb-3"
                    style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}
                  >
                    <Film size={16} /> Open Production Portal →
                  </Link>
                )}

                <div className="rounded-xl p-3 bg-black/25 border border-white/10 space-y-1.5 text-xs text-emerald-100/90">
                  <div className="flex justify-between">
                    <span>70% Deposit Cleared:</span>
                    <span className="font-bold text-white">KES {(successData?.depositAmount || Math.round(price.total * 0.7)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>30% Balance on Delivery Approval:</span>
                    <span className="font-bold text-emerald-300">KES {Math.round((successData?.totalPrice || price.total) * 0.3).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="max-w-md mx-auto mb-6 p-5 rounded-2xl text-left shadow-lg border relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #09031a 0%, #150833 100%)', borderColor: 'rgba(124,58,237,0.35)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Lock In Production Now</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    70% Deposit Model
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <p className="text-xs text-purple-200/70">70% Milestone Deposit to Start</p>
                    <p className="text-2xl font-black text-white">
                      KES {(successData?.depositAmount || Math.round(price.total * 0.7)).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-purple-200/50">Total Standard Price</p>
                    <p className="text-sm font-semibold text-purple-200/80">
                      KES {(successData?.totalPrice || price.total).toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-purple-200/60 leading-relaxed mb-4">
                  Pay securely via M-Pesa, Visa, or Mastercard. The 30% balance (KES {Math.round((successData?.totalPrice || price.total) * 0.3).toLocaleString()}) is only payable after you review and approve your watermarked video preview.
                </p>

                {pesapalError && (
                  <p className="text-xs text-rose-300 mb-3 bg-rose-500/20 p-2.5 rounded-lg border border-rose-500/30">
                    {pesapalError}
                  </p>
                )}

                {/* Option 1: Direct M-Pesa STK Push */}
                <div className="mb-4 p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-left">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Smartphone size={14} />
                    <span>Instant M-Pesa STK Push (Phone PIN Prompt):</span>
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={stkPhone || successData?.phone || phone || ''}
                      onChange={(e) => setStkPhone(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleDirectMpesaStk}
                      disabled={stkLoading || pesapalLoading}
                      className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                    >
                      {stkLoading ? <Loader2 size={13} className="animate-spin" /> : <Smartphone size={13} />}
                      <span>Prompt PIN</span>
                    </button>
                  </div>
                  {stkMsg && (
                    <p className="text-[11px] text-emerald-200 bg-emerald-500/20 p-2.5 rounded-lg border border-emerald-500/30 leading-relaxed">
                      {stkMsg}
                    </p>
                  )}
                  <p className="text-[10px] text-purple-200/50">
                    Enter Safaricom number to trigger immediate pop-up on your handset.
                  </p>
                </div>

                {/* Option 2: PesaPal Gateway (Card / M-Pesa / Airtel) */}
                <button
                  type="button"
                  onClick={handlePayDeposit}
                  disabled={pesapalLoading || stkLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-xs sm:text-sm font-extrabold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 cursor-pointer border border-white/20 bg-white/10 hover:bg-white/15"
                >
                  {pesapalLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Connecting to PesaPal...
                    </>
                  ) : (
                    <>
                      <CreditCard size={15} />
                      Pay via PesaPal Gateway (Visa / Master / M-Pesa)
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2.5 mt-3 text-[10px] text-purple-200/50 font-medium">
                  <span>🔒 Safaricom Daraja STK</span>
                  <span>•</span>
                  <span>Visa</span>
                  <span>•</span>
                  <span>Mastercard</span>
                  <span>•</span>
                  <span>PesaPal IPN</span>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="max-w-md mx-auto mb-3">
              <button
                type="button"
                onClick={() => setShowQuotationModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all cursor-pointer shadow-sm"
              >
                <FileText size={15} />
                <span>View / Print Official Quotation (PDF)</span>
              </button>
            </div>

            <a
              href={`https://wa.me/254751822556?text=${successData?.waMessage ?? waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full max-w-md mx-auto px-8 py-4 rounded-2xl text-sm font-bold text-white mb-4 transition-all"
              style={{ background: '#25d366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
            >
              <MessageSquare size={16} /> Send Brief on WhatsApp
            </a>

            <div className="flex justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(SUCCESS_KEY)
                  setSuccessData(null)
                  setStep(0)
                  window.history.replaceState(null, '', '/quote')
                }}
                className="text-xs text-gray-500 hover:text-purple-700 font-semibold transition-colors"
              >
                ← Configure another commercial video
              </button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Left Column: Multi-Step Interactive Form */}
            <div>
              {/* STEP 0: Business & Contact Identity */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 mb-2 border border-purple-200">
                      <Sparkles size={12} className="text-purple-600" />
                      <span>STEP 1 OF 5: TAILORED BUSINESS INTAKE</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-1">Tell Us About Your Business &amp; Goals</h2>
                    <p className="text-xs text-gray-500">
                      We calibrate production scope, creative style, and pricing to your exact growth stage.
                    </p>
                  </div>

                  {/* 1. Business Stage & Scale Selector */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                      1. What best describes your business stage?
                    </label>
                    <p className="text-xs text-gray-400 mb-3.5">This helps us recommend the most cost-effective package without bloated agency markups.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {BUSINESS_SIZES.map(s => {
                        const selected = businessStage === s.id
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleSelectBusinessStage(s.id)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                              selected
                                ? 'border-purple-600 bg-purple-50/60 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-gray-900">{s.label}</span>
                              {selected && <Check size={14} className="text-purple-600" />}
                            </div>
                            <p className="text-[11px] text-gray-500">{s.desc}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 2. Marketing Goal / Bottleneck */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                      2. What is your primary commercial goal?
                    </label>
                    <p className="text-xs text-gray-400 mb-3.5">What outcome matters most to your business right now?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {BUSINESS_GOALS.map(g => {
                        const selected = primaryGoal === g.id
                        return (
                          <div
                            key={g.id}
                            onClick={() => setPrimaryGoal(g.id)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              selected
                                ? 'border-purple-600 bg-purple-50/60 text-purple-900 font-semibold'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <p className="text-xs font-bold">{g.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{g.desc}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 3. Target Market / Geography */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                        3. Target Market &amp; Location
                      </label>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Global Commercial Rights Included
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Where will your commercial air and reach customers?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {TARGET_MARKETS.map(m => {
                        const selected = targetMarket === m.id
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleSelectTargetMarket(m.id)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              selected
                                ? 'border-purple-600 bg-purple-50/60 text-purple-900 font-semibold'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <p className="text-xs font-bold">{m.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Contact Identity */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                      4. Your Business &amp; Contact Info
                    </label>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                        placeholder="e.g. Mama Pima Organics, Nairobi Haven Suites, Apex Tech"
                        value={bizName}
                        onChange={e => setBizName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Contact Person Name
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                          placeholder="e.g. Sarah Wanjiru"
                          value={contactName}
                          onChange={e => setContactName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          WhatsApp Phone Number *
                        </label>
                        <input
                          type="tel"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                          placeholder="0712 345 678 or +1 / +44 for global"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Email Address (for PDF quotation &amp; updates)
                      </label>
                      <input
                        type="email"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                        placeholder="billing@yourbusiness.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Industry / Sector
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRIES.map(ind => (
                          <button
                            type="button"
                            key={ind}
                            onClick={() => setIndustry(industry === ind ? '' : ind)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                            style={{
                              borderColor: industry === ind ? '#7c3aed' : '#e5e7eb',
                              background: industry === ind ? '#ede9fe' : '#fff',
                              color: industry === ind ? '#6d28d9' : '#374151',
                            }}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="button"
                      onClick={goToScope}
                      className="px-7 py-3.5 rounded-xl text-sm font-bold text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                    >
                      Next: Choose Package &amp; Scope <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: Video Scope, Duration & Formats */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Step 2: Video Packages &amp; Duration</h2>
                      <p className="text-xs text-gray-500">
                        Minimum commercial duration is 30 seconds. Choose the tier that matches your business needs.
                      </p>
                    </div>

                    {/* Currency Selector Pill */}
                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setCurrency('KES')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currency === 'KES' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        KES (Kenya)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currency === 'USD' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        USD ($ Global)
                      </button>
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Select Package &amp; Duration
                        </label>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Standard commercial production starts at 30 seconds.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCompareOpen(true)}
                        className="text-xs font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Sparkles size={13} className="text-amber-500" />
                        <span>Compare 2K vs 8K: What's included?</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {LENGTHS.map(l => {
                        const isSelected = length === l.id
                        const priceDisplay = currency === 'KES' ? `KES ${l.price.toLocaleString()}` : `$${l.usd} USD`
                        const altPrice = currency === 'KES' ? `~$${l.usd} USD` : `~KES ${l.price.toLocaleString()}`

                        return (
                          <div
                            key={l.id}
                            onClick={() => setLength(l.id)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-100'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {l.tag && (
                              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                                {l.tag}
                              </span>
                            )}
                            <div>
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="font-extrabold text-sm text-gray-900">{l.label}</span>
                                <div className="text-right">
                                  <span className="font-extrabold text-sm text-purple-700">{priceDisplay}</span>
                                  <span className="text-[10px] text-gray-400 block font-normal">{altPrice}</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed mt-1">{l.desc}</p>
                            </div>
                            {isSelected && (
                              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-purple-700">
                                <Check size={13} /> Selected Package
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Helpful 2K vs 8K Clarity Box */}
                    <div className="mt-4 p-3.5 rounded-xl bg-purple-50/80 border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
                      <HelpCircle size={15} className="text-purple-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-purple-950">Why KES 2,000 vs KES 8,000?</strong> The <strong>KES 2,000 (~$15)</strong> tier is an entry package for bootstrapped founders testing organic TikTok/Reels traction (kinetic animation &amp; AI voice). The <strong>KES 8,000 (~$65)</strong> tier is our flagship commercial package with a <strong>professional human studio voice artist</strong>, custom cinematography or 2D animation, 2 full revision rounds, and 100% worldwide broadcast rights for paid advertising.{' '}
                        <button
                          type="button"
                          onClick={() => setCompareOpen(true)}
                          className="font-bold underline text-purple-800 hover:text-purple-950 cursor-pointer ml-1"
                        >
                          View complete side-by-side comparison &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Platforms & Aspect Ratios */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Target Formats & Channels
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Select where you plan to post or run ads:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {PLATFORMS.map(p => {
                        const selected = platforms.includes(p.id)
                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              selected
                                ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">{p.label}</span>
                              {selected && <Check size={13} className="text-purple-600 shrink-0" />}
                            </div>
                            <span className="text-[10px] text-gray-400 font-normal">{p.desc}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Turnaround Speed */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Production Timeline
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {RUSH.map(r => (
                        <div
                          key={r.id}
                          onClick={() => setRush(r.id)}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            rush === r.id
                              ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <p className="font-bold text-xs text-gray-900">{r.label}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{r.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-6 py-3.5 rounded-xl text-sm font-bold text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                    >
                      Next: Creative Style & Add-ons <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Creative Visual Style & Add-ons */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Step 3: Creative Visual Style & Add-ons</h2>
                    <p className="text-xs text-gray-500">
                      Pick the aesthetic direction that fits your brand identity.
                    </p>
                  </div>

                  {/* Visual Style Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {VISUAL_STYLES.map(s => {
                      const Icon = s.icon
                      const selected = visualStyle === s.id
                      return (
                        <div
                          key={s.id}
                          onClick={() => setVisualStyle(s.id)}
                          className={`rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                            selected
                              ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-200'
                              : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                          }`}
                        >
                          {/* Image preview banner */}
                          <div className="relative h-44 w-full overflow-hidden bg-gray-900">
                            <img
                              src={s.image}
                              alt={s.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white border border-white/20">
                                {s.tag}
                              </span>
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-md text-white shadow-sm">
                                {s.badge}
                              </span>
                            </div>
                            {selected && (
                              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-600 text-white shadow-lg">
                                <Check size={13} /> Selected Style
                              </div>
                            )}
                          </div>

                          <div className="p-4 flex flex-col flex-1 justify-between">
                            <div>
                              <h3 className="font-extrabold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  selected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <Icon size={14} />
                                </span>
                                {s.title}
                              </h3>
                              <p className="text-xs text-gray-500 leading-relaxed mt-1.5">{s.desc}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                              <span className="text-[11px] font-semibold text-purple-700">Studio Grade</span>
                              <span className={`text-[11px] font-medium ${selected ? 'text-purple-700 font-bold' : 'text-gray-400'}`}>
                                {selected ? 'Active selection' : 'Click to select'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Voiceover Tone */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Voiceover Narration Tone
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {VOICE_TONES.map(v => (
                        <div
                          key={v.id}
                          onClick={() => setVoiceTone(v.id)}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            voiceTone === v.id
                              ? 'border-purple-600 bg-purple-50 text-purple-900'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <p className="text-xs font-bold">{v.label}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{v.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Deliverable Add-ons
                    </label>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Branded Promotional Poster</p>
                          <p className="text-[11px] text-gray-500">Matching social and print banner for your campaign</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600">INCLUDED FREE</span>
                    </div>

                    <div
                      onClick={() => setSubtitles(!subtitles)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        subtitles ? 'border-purple-500 bg-purple-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            subtitles ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {subtitles && <Check size={12} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Burned-in Subtitles + SRT Captions</p>
                          <p className="text-[11px] text-gray-500">Essential for mobile viewers who scroll on mute</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-700">+KES 500</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(3)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-6 py-3.5 rounded-xl text-sm font-bold text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                    >
                      Next: Promotion Brief & Media <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Promotion Brief & Media Assets */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Step 4: Promotion Brief & Media Assets</h2>
                    <p className="text-xs text-gray-500">
                      Tell us what you are promoting or attach your logo and product photos.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        What are you promoting?
                      </label>
                      <textarea
                        rows={4}
                        className="w-full border border-gray-200 rounded-xl p-3.5 text-sm leading-relaxed text-gray-800 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                        placeholder="e.g. 2BR apartments in Kilimani starting from KES 8.5M. Key feature: flexible payment plan, ready title deed. Call to action: Book site visit."
                        value={brief}
                        onChange={e => setBrief(e.target.value)}
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleMicClick}
                          disabled={!speechSupported}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50"
                        >
                          <Mic size={14} /> {isListening ? 'Listening...' : 'Record Voice Note'}
                        </button>

                        <button
                          type="button"
                          onClick={refineBrief}
                          disabled={refining}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
                        >
                          {refining ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          {brief.trim() ? 'Polish with Nia AI' : 'Draft with Nia AI'}
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Paperclip size={14} /> Attach Assets / Logo
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,application/pdf,.doc,.docx,.txt"
                          onChange={e => handleSupportingFiles(e.target.files)}
                          className="hidden"
                        />
                      </div>

                      {listeningText && <p className="mt-2 text-xs text-sky-600 font-medium">Recording: {listeningText}</p>}
                      {refining && (
                        <p className="mt-2 text-xs text-purple-600 font-medium flex items-center gap-1.5">
                          <Loader2 size={12} className="animate-spin" /> Nia is refining your brief...
                        </p>
                      )}

                      {supportingFiles.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {supportingFiles.map(item => (
                              <div
                                key={item.id}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
                                  item.isLowRes
                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                    : item.width
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                    : 'border-gray-200 bg-gray-50 text-gray-700'
                                }`}
                              >
                                <Paperclip size={12} className={item.isLowRes ? 'text-amber-500' : 'text-gray-400'} />
                                <span className="truncate max-w-[150px] font-medium">{item.file.name}</span>
                                {item.width && item.height && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    item.isLowRes ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                                  }`}>
                                    {item.isLowRes ? `⚠️ Low Res (${item.width}×${item.height})` : `✅ HD (${item.width}×${item.height})`}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeSupportingFile(item.id)}
                                  className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                          {supportingFiles.some(f => f.isLowRes) && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                              💡 <strong>Asset Tip:</strong> One or more attached images are under 1080px resolution. For crisp 4K commercial video rendering, we recommend attaching a vector SVG/PDF logo or image above 1080px.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(4)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-6 py-3.5 rounded-xl text-sm font-bold text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                    >
                      Review Quote & Live Adjuster <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Interactive Quote Review & Live Adjuster */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Step 5: Review & Live Price Adjuster</h2>
                    <p className="text-xs text-gray-500">
                      Tweak any parameter below to watch your quote and deposit recalculate live before submitting.
                    </p>
                  </div>

                  {/* Live Adjuster Controls */}
                  <div className="rounded-2xl border-2 border-purple-300 bg-purple-50/40 p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders size={18} className="text-purple-700" />
                        <h3 className="font-extrabold text-sm text-purple-950">Interactive Live Adjuster</h3>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full uppercase">
                        Instant Recalculation
                      </span>
                    </div>

                    {/* Adjust Duration */}
                    <div>
                      <span className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Adjust Package / Duration:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {LENGTHS.map(l => {
                          const pStr = currency === 'KES' ? `KES ${l.price.toLocaleString()}` : `$${l.usd} USD`
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => setLength(l.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                length === l.id
                                  ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {l.label} ({pStr})
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Adjust Rush */}
                    <div>
                      <span className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Adjust Timeline:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {RUSH.map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setRush(r.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              rush === r.id
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Adjust Subtitles */}
                    <div>
                      <span className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Adjust Captions:
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSubtitles(false)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            !subtitles
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          No Captions
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubtitles(true)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            subtitles
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Burned-in Subtitles &amp; SRT ({currency === 'KES' ? '+KES 500' : '+$4 USD'})
                        </button>
                      </div>
                    </div>

                    {/* Adjust Visual Style */}
                    <div>
                      <span className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Adjust Visual Style:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {VISUAL_STYLES.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setVisualStyle(s.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              visualStyle === s.id
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {s.tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary & Client Details Card */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                        Quotation Breakdown
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowQuotationModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
                      >
                        <FileText size={14} /> View / Print PDF Quote
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400 font-medium">Business:</span>
                          <button onClick={() => setStep(0)} className="text-purple-600 text-[11px] font-semibold hover:underline">
                            Edit
                          </button>
                        </div>
                        <p className="font-bold text-gray-900">{bizName}</p>
                        <p className="text-gray-500">{contactName ? `${contactName} · ` : ''}{phone}</p>
                        {email && <p className="text-gray-500">{email}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                            {BUSINESS_SIZES.find(s => s.id === businessStage)?.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                            {BUSINESS_GOALS.find(g => g.id === primaryGoal)?.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400 font-medium">Production Scope:</span>
                          <button onClick={() => setStep(1)} className="text-purple-600 text-[11px] font-semibold hover:underline">
                            Edit
                          </button>
                        </div>
                        <div className="flex items-start gap-3 mt-1.5">
                          <img
                            src={VISUAL_STYLES.find(s => s.id === visualStyle)?.image}
                            alt={visualStyle}
                            className="w-14 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-gray-900">{LENGTHS.find(l => l.id === length)?.label} Commercial</p>
                            <p className="text-gray-500">Style: {VISUAL_STYLES.find(s => s.id === visualStyle)?.tag}</p>
                            <p className="text-gray-500">Timeline: {RUSH.find(r => r.id === rush)?.label}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {brief && (
                      <div className="pt-3 border-t border-gray-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400 font-medium">Promotion Brief:</span>
                          <button onClick={() => setStep(3)} className="text-purple-600 text-[11px] font-semibold hover:underline">
                            Edit
                          </button>
                        </div>
                        <p className="text-gray-700 line-clamp-2 leading-relaxed italic">"{brief}"</p>
                      </div>
                    )}

                    {/* Milestone Pricing Box */}
                    <div className="rounded-xl p-4 bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Standard Price:</span>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-gray-900">
                            {currency === 'KES' ? `KES ${price.total.toLocaleString()}` : `$${price.usdTotal} USD`}
                          </span>
                          <span className="text-[11px] text-gray-400 block font-normal">
                            {currency === 'KES' ? `(~$${price.usdTotal} USD)` : `(~KES ${price.total.toLocaleString()})`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-emerald-700 font-bold">
                        <span>70% Milestone Deposit to Start:</span>
                        <span>
                          {currency === 'KES'
                            ? `KES ${Math.round(price.total * 0.7).toLocaleString()}`
                            : `$${Math.round(price.usdTotal * 0.7)} USD`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>30% Balance on Delivery Approval:</span>
                        <span>
                          {currency === 'KES'
                            ? `KES ${Math.round(price.total * 0.3).toLocaleString()}`
                            : `$${Math.round(price.usdTotal * 0.3)} USD`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft size={15} /> Back to Brief
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className="px-7 py-3.5 rounded-xl text-sm font-extrabold text-white shadow-md flex items-center gap-2 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Confirm Brief &amp; Submit Quote →
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Live Price Panel */}
            <div className="hidden lg:block">
              <PricePanel
                max={price.total}
                usdMax={price.usdTotal}
                length={length}
                rush={rush}
                platforms={platforms}
                subtitles={subtitles}
                visualStyle={visualStyle}
                currency={currency}
                onCurrencyToggle={setCurrency}
              />
            </div>
          </div>
        )}
      </div>

      {/* Official Quotation Modal */}
      <QuotationPrintModal
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        data={quotationModalData}
      />

      {/* Market Survey Modal */}
      <MarketSurveyModal
        isOpen={showSurvey}
        onClose={() => setShowSurvey(false)}
        sourcePage="quote_success"
      />

      {/* Package Comparison 2K vs 8K Modal */}
      <PackageCompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        onSelectPackage={(pkg) => setLength(pkg)}
        currentCurrency={currency}
      />
    </div>
  )
}
