import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Award, ArrowRight, Upload, X,
  RefreshCw, BarChart3, Target, Compass, Printer, Film, Check,
  DollarSign, Mic, MicOff, HelpCircle, Repeat
} from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'

export const PRICING_MODELS = [
  { id: 'per_item', label: 'Per Item / Unit', short: '/ item', desc: 'One-off price per physical item, bottle, pack, or piece' },
  { id: 'subscription_daily', label: 'Daily Subscription', short: '/ day', desc: 'Daily recurring micro-fee (e.g. daily tips, study access)' },
  { id: 'subscription_monthly', label: 'Monthly Subscription', short: '/ month', desc: 'Monthly recurring plan (e.g. software, school fees, retainer)' },
  { id: 'subscription_annual', label: 'Annual Subscription', short: '/ year', desc: 'Yearly recurring subscription or membership' },
  { id: 'per_service', label: 'Per Service / Project', short: '/ project', desc: 'One-time fee per project, consultation, or service' },
] as const

/* ─── Industry Profiles & Benchmark Data ───────────────────────────── */
interface IndustryBenchmark {
  id: string
  name: string
  kesFloor: number
  kesSweetSpot: number
  kesCeiling: number
  usdFloor: number
  usdSweetSpot: number
  usdCeiling: number
  typicalMargin: string
  marketSizeNote: string
  keyCompetitors: string[]
  primaryBarrier: string
  globalUptakeFactor: number
}

const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  education_edtech: {
    id: 'education_edtech',
    name: 'Education, EdTech & Academic Services',
    kesFloor: 500,
    kesSweetSpot: 2500,
    kesCeiling: 12000,
    usdFloor: 5,
    usdSweetSpot: 25,
    usdCeiling: 120,
    typicalMargin: '65% – 85%',
    marketSizeNote: 'High parent & candidate demand in Kenya (CBC, KCSE, IGCSE); student pass-rate testimonials and teacher endorsements drive rapid WhatsApp adoption.',
    keyCompetitors: ['Traditional Tuition Centers', 'Online Revision Portals', 'Textbook Publishers'],
    primaryBarrier: 'Curriculum CBC/KCSE alignment proof & academic trust',
    globalUptakeFactor: 0.90,
  },
  agriculture_agritech: {
    id: 'agriculture_agritech',
    name: 'Agriculture, Agri-Tech & Fresh Produce',
    kesFloor: 800,
    kesSweetSpot: 3500,
    kesCeiling: 25000,
    usdFloor: 8,
    usdSweetSpot: 35,
    usdCeiling: 250,
    typicalMargin: '30% – 50%',
    marketSizeNote: 'Pillar of East African trade; farmers, agrovets, and cooperatives respond strongly to video harvest proof, yield demonstrations, and direct farm-gate WhatsApp ordering.',
    keyCompetitors: ['Agrovet Stockists', 'Regional Commodity Brokers', 'Export Cooperatives'],
    primaryBarrier: 'Field harvest proof, quality consistency & delivery logistics',
    globalUptakeFactor: 0.84,
  },
  fmcg_retail: {
    id: 'fmcg_retail',
    name: 'Retail & Consumer Packaged Goods (FMCG)',
    kesFloor: 500,
    kesSweetSpot: 1500,
    kesCeiling: 4500,
    usdFloor: 5,
    usdSweetSpot: 15,
    usdCeiling: 40,
    typicalMargin: '28% – 45%',
    marketSizeNote: 'High velocity, impulse-driven, sensitive to shelf visual appeal and WhatsApp distribution.',
    keyCompetitors: ['Local Supermarket Brands', 'Imported EU/SA Goods', 'Artisan Kenyan Makers'],
    primaryBarrier: 'Packaging finish & consistent retail shelf distribution',
    globalUptakeFactor: 0.85,
  },
  beauty_cosmetics: {
    id: 'beauty_cosmetics',
    name: 'Beauty, Skincare & Cosmetics',
    kesFloor: 800,
    kesSweetSpot: 2200,
    kesCeiling: 6500,
    usdFloor: 8,
    usdSweetSpot: 22,
    usdCeiling: 65,
    typicalMargin: '55% – 75%',
    marketSizeNote: 'Explosive TikTok/Reels uptake; customers pay high premiums for organic trust signals and authentic video proof.',
    keyCompetitors: ['International Pharmacy Brands', 'L’Oreal/Garnier', 'Local Organic Skin Lines'],
    primaryBarrier: 'Dermatological trust proof & high-end bottle/label finish',
    globalUptakeFactor: 0.95,
  },
  tech_saas: {
    id: 'tech_saas',
    name: 'Tech Apps, Fintech & Software (SaaS)',
    kesFloor: 1500,
    kesSweetSpot: 5000,
    kesCeiling: 25000,
    usdFloor: 15,
    usdSweetSpot: 49,
    usdCeiling: 200,
    typicalMargin: '70% – 90%',
    marketSizeNote: 'Massive mobile-first market across East Africa; global diaspora adoption high if payment is frictionless.',
    keyCompetitors: ['Regional Fintechs', 'Global SaaS Tools', 'Custom Built Local Portals'],
    primaryBarrier: 'Onboarding friction & clear kinetic 2D video explanation',
    globalUptakeFactor: 0.92,
  },
  fashion_apparel: {
    id: 'fashion_apparel',
    name: 'Fashion, Apparel & Luxury Accessories',
    kesFloor: 1200,
    kesSweetSpot: 3500,
    kesCeiling: 12000,
    usdFloor: 12,
    usdSweetSpot: 35,
    usdCeiling: 120,
    typicalMargin: '45% – 65%',
    marketSizeNote: 'High visual demand on Instagram; cultural identity and modern streetwear resonate strongly locally and globally.',
    keyCompetitors: ['Mitumba High-End Markets', 'Fast Fashion (Zara/Shein)', 'Bespoke African Designers'],
    primaryBarrier: 'Fabric texture perception online & fit confidence',
    globalUptakeFactor: 0.88,
  },
  food_dining: {
    id: 'food_dining',
    name: 'Food, Dining & Gourmet Products',
    kesFloor: 600,
    kesSweetSpot: 1800,
    kesCeiling: 5000,
    usdFloor: 6,
    usdSweetSpot: 18,
    usdCeiling: 50,
    typicalMargin: '35% – 50%',
    marketSizeNote: 'Driven by mouthwatering video close-ups, delivery reliability, and word-of-mouth social clout.',
    keyCompetitors: ['Established Casual Dining Chains', 'Cloud Kitchens', 'Artisan Caterers'],
    primaryBarrier: 'Consistent taste expectation & delivery radius',
    globalUptakeFactor: 0.78,
  },
  hospitality_realestate: {
    id: 'hospitality_realestate',
    name: 'Hospitality, Airbnbs & Real Estate',
    kesFloor: 4500,
    kesSweetSpot: 12000,
    kesCeiling: 45000,
    usdFloor: 45,
    usdSweetSpot: 120,
    usdCeiling: 450,
    typicalMargin: '40% – 60%',
    marketSizeNote: 'Diaspora and international business travellers represent over 60% of premium bookings.',
    keyCompetitors: ['Boutique Hotels', 'Kilimani/Westlands Luxury Airbnbs', 'Savills/Knight Frank'],
    primaryBarrier: 'Cinematic 4K walkthrough video proof & verified host trust',
    globalUptakeFactor: 0.98,
  },
  services_consulting: {
    id: 'services_consulting',
    name: 'Professional Services & Consultancies',
    kesFloor: 5000,
    kesSweetSpot: 18000,
    kesCeiling: 75000,
    usdFloor: 50,
    usdSweetSpot: 180,
    usdCeiling: 750,
    typicalMargin: '60% – 85%',
    marketSizeNote: 'High ticket authority market; closed via LinkedIn positioning, client case studies, and WhatsApp follow-up.',
    keyCompetitors: ['Traditional Mid-Tier Agencies', 'Independent Consultants', 'Big 4 Consultancies'],
    primaryBarrier: 'Perceived institutional gravitas & brand authority',
    globalUptakeFactor: 0.90,
  },
}

const REGION_TARGETS = [
  { id: 'urban_ke', label: 'Local Urban Hubs 🇰🇪', desc: 'Nairobi (Westlands, Kilimani, CBD), Mombasa & Kisumu (High purchasing power)' },
  { id: 'mass_ke', label: 'Countrywide Mass Market 🇰🇪', desc: 'Peri-urban towns, counties & nationwide distribution' },
  { id: 'east_africa', label: 'East Africa Region 🌍', desc: 'Kenya, Uganda, Tanzania & Rwanda cross-border trade' },
  { id: 'global', label: 'Global / International 🌐', desc: 'US, UK, Europe, UAE, Diaspora & International consumers' },
]

export default function BrandTest() {
  const navigate = useNavigate()

  // Form States
  const [brandName, setBrandName] = useState('')
  const [industryId, setIndustryId] = useState('education_edtech')
  const [productDesc, setProductDesc] = useState('')
  const [priceInput, setPriceInput] = useState<number | ''>(2500)
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES')
  const [priceModel, setPriceModel] = useState<string>('per_item')
  const [targetRegion, setTargetRegion] = useState('urban_ke')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // Speech Recognition (Mic Voice Input for Description)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRec) {
      setSpeechSupported(true)
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('Voice dictation is not supported by your current browser. You can type directly or use Google Chrome or Safari.')
      return
    }

    try {
      const recognition = new SpeechRec()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-KE'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript.trim()) {
          setProductDesc((prev) => {
            const trimmed = prev.trim()
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim()
          })
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
    }
  }

  // Simulation / Result States
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasTested, setHasTested] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const benchmark = INDUSTRY_BENCHMARKS[industryId] || INDUSTRY_BENCHMARKS.education_edtech

  // Handle Image Upload
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Run Brand Diagnostic Simulation
  const handleRunTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) {
      alert('Please enter your brand or product name.')
      return
    }

    // Stop listening if mic was left on
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    setIsAnalyzing(true)
    setAnalysisProgress(15)

    const p1 = setTimeout(() => setAnalysisProgress(45), 400)
    const p2 = setTimeout(() => setAnalysisProgress(75), 900)
    const p3 = setTimeout(() => {
      setAnalysisProgress(100)
      setIsAnalyzing(false)
      setHasTested(true)
      window.scrollTo({ top: 480, behavior: 'smooth' })
    }, 1400)

    return () => {
      clearTimeout(p1)
      clearTimeout(p2)
      clearTimeout(p3)
    }
  }

  // Diagnostic Computed Metrics
  const diagnostics = useMemo(() => {
    const numPrice = Number(priceInput) || benchmark.kesSweetSpot
    const rawKesPrice = currency === 'KES' ? numPrice : numPrice * 130

    // Normalize price for subscription frequency if applicable
    let effectiveKesPrice = rawKesPrice
    if (priceModel === 'subscription_daily') {
      // Compare daily recurring to benchmark baseline (average 30 days)
      effectiveKesPrice = rawKesPrice * 30
    } else if (priceModel === 'subscription_annual') {
      effectiveKesPrice = rawKesPrice / 12
    }

    // Pricing assessment
    let priceVerdict: 'underpriced' | 'sweet_spot' | 'premium' = 'sweet_spot'
    if (effectiveKesPrice < benchmark.kesFloor * 1.05) {
      priceVerdict = 'underpriced'
    } else if (effectiveKesPrice > benchmark.kesSweetSpot * 1.45) {
      priceVerdict = 'premium'
    }

    // Compatibility Index
    let baseScore = 78
    if (brandName.length >= 4 && brandName.length <= 18) baseScore += 5
    if (productDesc.length > 50) baseScore += 5
    if (uploadedImage) baseScore += 6
    if (priceVerdict === 'sweet_spot') baseScore += 4
    if (targetRegion === 'global') baseScore = Math.round(baseScore * benchmark.globalUptakeFactor)
    const overallScore = Math.min(Math.max(baseScore, 62), 96)

    // Market Share & Uptake
    const uptakeRate = Math.min(Math.round(overallScore * 0.92), 94)
    const addressableShare = (Math.max(12, Math.round(overallScore * 0.22 * 10) / 10)).toFixed(1)

    // Aesthetic & Brand Rating
    const nameRating = brandName.length < 15 ? '8.8 / 10 (High Recall)' : '7.5 / 10 (Consider Shortening)'
    const visualCritique = uploadedImage
      ? 'Packaging visual uploaded: Clean contrast, high digital feed viability. Enhancing typography weight and contrast will boost luxury perception.'
      : 'No visual asset provided yet: Product packaging or clear mockups will be essential to establish digital shelf authority.'

    // Regional Takeaway
    let regionalNote = ''
    if (targetRegion === 'urban_ke') {
      regionalNote = 'Nairobi & Urban Core: Consumers expect polished short-form video demos, instant WhatsApp checkout, and same-day delivery.'
    } else if (targetRegion === 'mass_ke') {
      regionalNote = 'Countrywide Mass Distribution: Focus on clear value communication in Swahili/English and multi-pack affordability.'
    } else if (targetRegion === 'east_africa') {
      regionalNote = 'East African Cross-Border: High potential in Kampala & Dar es Salaam. Keep packaging bilingual (English & Swahili).'
    } else {
      regionalNote = 'Global & Diaspora Export: High margin arbitrage potential! International consumers pay 2x–3x more, but demand certified ingredient purity and cinematic brand proof.'
    }

    const activeModel = PRICING_MODELS.find((m) => m.id === priceModel) || PRICING_MODELS[0]

    return {
      priceVerdict,
      overallScore,
      uptakeRate,
      addressableShare,
      nameRating,
      visualCritique,
      regionalNote,
      activeModel,
      effectiveKesPrice,
    }
  }, [priceInput, currency, priceModel, benchmark, brandName, productDesc, uploadedImage, targetRegion])

  // Navigate to Video Commercial Quote with brand context pre-filled
  const handleProceedToCommercial = () => {
    const params = new URLSearchParams({
      businessName: brandName,
      product: `${productDesc} (${benchmark.name})`,
      price: `${priceInput} (${PRICING_MODELS.find((m) => m.id === priceModel)?.label || 'per item'})`,
      region: targetRegion,
    })
    navigate(`/quote?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-purple-600 selection:text-white pb-24">
      <PublicHeader dark={true} />

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-14 md:pt-40 md:pb-18 overflow-hidden border-b border-white/10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/15 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 bg-purple-500/15 text-purple-300 border border-purple-500/30 backdrop-blur-md">
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span>AI BRAND COMPATIBILITY &amp; MARKET TESTER</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Test Your Brand, Pricing &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-purple-400">
              Market Uptake
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
            Simulate how your product, packaging, and pricing compete across local Kenyan and global markets. Get instant diagnostic feedback on customer uptake, market percentage, and optimal launch positioning.
          </p>
        </div>
      </section>

      {/* ─── Main Interactive Studio Container ───────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Brand & Product Input Form */}
          <div className="lg:col-span-6 bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Compass size={18} className="text-purple-400" />
                  <span>Brand &amp; Product Specification</span>
                </h2>
                <p className="text-xs text-white/50 mt-0.5">Enter your details to generate your market compatibility report.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Self-Serve
              </span>
            </div>

            <form onSubmit={handleRunTest} className="space-y-5">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                  Brand or Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mama Pima Organics, Solis Hydration, Apex CRM"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
                />
              </div>

              {/* Category / Sector */}
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                  Industry / Market Category
                </label>
                <select
                  value={industryId}
                  onChange={(e) => setIndustryId(e.target.value)}
                  className="w-full bg-[#120d24] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
                >
                  {Object.values(INDUSTRY_BENCHMARKS).map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#120d24] text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Brief Description with Speech-to-Text Mic */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                    Product / Service Description &amp; What It Does
                  </label>
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? 'Stop recording voice description' : 'Dictate description using voice microphone'}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500/25 text-rose-200 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                        : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-400/30'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        <MicOff size={13} className="text-rose-300" />
                        <span className="font-bold">Listening... (Tap to finish)</span>
                      </>
                    ) : (
                      <>
                        <Mic size={13} className="text-purple-300" />
                        <span>Voice Mic (Dictate)</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder={
                    isListening
                      ? '🎙️ Listening... Speak naturally about your product, what it does, and who it is for.'
                      : 'e.g. Pure cold-pressed avocado oil for natural hair hydration and glowing skin. Packaged in 250ml amber bottles with dropper.'
                  }
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className={`w-full bg-white/5 border rounded-xl p-3.5 text-sm text-white placeholder-white/30 focus:outline-none transition-all resize-none ${
                    isListening
                      ? 'border-rose-400/80 ring-2 ring-rose-500/30 bg-rose-950/20'
                      : 'border-white/15 focus:border-purple-400'
                  }`}
                />
                {isListening && (
                  <p className="text-[11px] text-rose-300/90 mt-1.5 flex items-center gap-1.5 font-medium animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Recording voice notes into description... Click "Listening... (Tap to finish)" when done.
                  </p>
                )}
              </div>

              {/* Screenshot / Photo / Packaging Uploader */}
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                  Upload Product Screenshot, Packaging or Logo
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    uploadedImage
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-white/20 hover:border-white/40 bg-white/[0.02]'
                  }`}
                >
                  {uploadedImage ? (
                    <div className="relative flex items-center justify-center">
                      <img
                        src={uploadedImage}
                        alt="Product preview"
                        className="max-h-44 rounded-xl object-contain shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedImage(null)
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto text-purple-400">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-white">Click or drag &amp; drop to upload visual mockup</p>
                      <p className="text-[11px] text-white/40">Screenshots, packaging photos, logos, or digital flyers (JPG, PNG)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Price & Billing Model (Per Item vs Subscription) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                    Current or Planned Price
                  </label>
                  <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/15">
                    <button
                      type="button"
                      onClick={() => setCurrency('KES')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        currency === 'KES' ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      KES
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        currency === 'USD' ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                {/* Pricing Structure Pill Selector */}
                <div className="mb-2.5">
                  <div className="text-[11px] text-white/60 mb-1.5 font-medium flex items-center justify-between">
                    <span>Billing Type / Pricing Unit:</span>
                    <span className="text-purple-300 font-bold">
                      {PRICING_MODELS.find((m) => m.id === priceModel)?.desc}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {PRICING_MODELS.map((model) => {
                      const isSelected = priceModel === model.id
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setPriceModel(model.id)}
                          className={`px-2.5 py-2 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                          }`}
                        >
                          <div className="font-bold text-[11px] leading-tight">{model.label}</div>
                          <div className="text-[10px] text-white/40 mt-0.5">{model.short}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount Input with Suffix */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">
                    {currency === 'KES' ? 'KES' : '$'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder={currency === 'KES' ? '2500' : '20'}
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-14 pr-24 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-all font-semibold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-400/30">
                    {PRICING_MODELS.find((m) => m.id === priceModel)?.short || '/ unit'}
                  </span>
                </div>

                {/* Contextual Sub-note for Daily vs Monthly vs Item */}
                <p className="text-[11px] text-white/50 mt-1.5">
                  {priceModel === 'subscription_daily' && (
                    <span className="text-amber-300">
                      💡 Daily rate: {currency === 'KES' ? `KES ${(Number(priceInput) * 30).toLocaleString()}` : `$${(Number(priceInput) * 30).toFixed(0)}`}/month normalized run-rate across 30 days.
                    </span>
                  )}
                  {priceModel === 'subscription_monthly' && (
                    <span className="text-emerald-300">
                      💡 Monthly recurring subscription billed each 30 days.
                    </span>
                  )}
                  {priceModel === 'subscription_annual' && (
                    <span className="text-purple-300">
                      💡 Annual lump-sum (approx. {currency === 'KES' ? `KES ${(Number(priceInput) / 12).toFixed(0)}` : `$${(Number(priceInput) / 12).toFixed(1)}`}/month).
                    </span>
                  )}
                  {priceModel === 'per_item' && (
                    <span>💡 Unit price per individual package, bottle, box, or item sold.</span>
                  )}
                  {priceModel === 'per_service' && (
                    <span>💡 Project or retainer fee per completed engagement.</span>
                  )}
                </p>
              </div>

              {/* Target Region */}
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
                  Target Geographic Marketplace
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {REGION_TARGETS.map((r) => {
                    const active = targetRegion === r.id
                    return (
                      <div
                        key={r.id}
                        onClick={() => setTargetRegion(r.id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          active
                            ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                            : 'border-white/10 hover:border-white/20 bg-white/[0.02] text-white/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold">{r.label}</p>
                          {active && <Check size={13} className="text-purple-400" />}
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 leading-relaxed">{r.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full py-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-amber-300" />
                    <span>Analyzing Market Benchmark &amp; Uptake ({analysisProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 size={16} className="text-amber-300" />
                    <span>Run Brand &amp; Compatibility Test →</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Diagnostic & Market Benchmarking Report */}
          <div className="lg:col-span-6 space-y-6">
            {!hasTested && !isAnalyzing ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                  <Compass size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-white">Your Brand Benchmark Awaits</h3>
                <p className="text-sm text-white/60 max-w-md mx-auto leading-relaxed">
                  Fill in your product and proposed pricing on the left to simulate your competitiveness against existing market leaders.
                </p>
                <div className="pt-4 grid grid-cols-2 gap-3 text-left max-w-sm mx-auto text-xs text-white/70">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="font-bold text-amber-300 block">📊 Price Elasticity</span>
                    <span>Low, Mid &amp; Premium tier range</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="font-bold text-emerald-400 block">🌍 Global Viability</span>
                    <span>Local vs international uptake</span>
                  </div>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mx-auto" />
                <div>
                  <h3 className="text-lg font-extrabold text-white">Simulating Competitive Environment...</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Benchmarking against {benchmark.name} in {targetRegion === 'global' ? 'International Markets' : 'East Africa'}.
                  </p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-amber-400 h-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Diagnostic Report Output */
              <div className="space-y-6">
                {/* Score Card Banner */}
                <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-purple-900/40 via-[#12082b] to-[#07050d] border border-purple-500/30 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-extrabold tracking-widest uppercase text-amber-300">
                        DIAGNOSTIC BENCHMARK REPORT
                      </span>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {brandName}
                      </h3>
                      <p className="text-xs text-purple-200/70">{benchmark.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-3xl font-black text-emerald-400">
                          {diagnostics.overallScore}
                        </span>
                        <span className="text-xs text-white/50 block">/ 100 Score</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                        <Award size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Badges Strip */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/90 font-semibold">
                      Uptake Likelihood: <strong className="text-emerald-300">{diagnostics.uptakeRate}%</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/90 font-semibold">
                      Est. Addressable Share: <strong className="text-purple-300">{diagnostics.addressableShare}%</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/90 font-semibold">
                      Margin Potential: <strong className="text-amber-300">{benchmark.typicalMargin}</strong>
                    </span>
                  </div>
                </div>

                {/* Pricing Spectrum & Elasticity Assessment */}
                <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-amber-400" />
                      <h4 className="font-extrabold text-sm text-white">Market Pricing Spectrum</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      diagnostics.priceVerdict === 'sweet_spot'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : diagnostics.priceVerdict === 'underpriced'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {diagnostics.priceVerdict === 'sweet_spot' ? 'Sweet-Spot Value' : diagnostics.priceVerdict === 'underpriced' ? 'Value / Penetration Price' : 'Premium Positioning'}
                    </span>
                  </div>

                  {/* Spectrum Bar Graphic */}
                  <div className="space-y-1.5 pt-2">
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
                      <div className="w-1/3 bg-blue-500/70" title="Budget Floor" />
                      <div className="w-1/3 bg-emerald-500/80" title="Sweet Spot" />
                      <div className="w-1/3 bg-amber-500/70" title="Premium" />
                    </div>
                    <div className="flex justify-between text-[11px] text-white/60">
                      <span>Floor: {currency === 'KES' ? `KES ${benchmark.kesFloor.toLocaleString()}` : `$${benchmark.usdFloor}`}</span>
                      <span className="text-emerald-300 font-bold">Sweet-Spot: {currency === 'KES' ? `KES ${benchmark.kesSweetSpot.toLocaleString()}` : `$${benchmark.usdSweetSpot}`}</span>
                      <span>Premium: {currency === 'KES' ? `KES ${benchmark.kesCeiling.toLocaleString()}` : `$${benchmark.usdCeiling}`}</span>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1">
                    <div>
                      <strong>Pricing Verdict:</strong> Your price of{' '}
                      <strong className="text-white">
                        {currency === 'KES' ? `KES ${Number(priceInput).toLocaleString()}` : `$${priceInput} USD`}
                        <span className="text-purple-300"> {diagnostics.activeModel.short}</span>
                      </strong>{' '}
                      <span className="text-white/50 text-[11px]">({diagnostics.activeModel.label})</span>{' '}
                      {diagnostics.priceVerdict === 'sweet_spot'
                        ? 'is right in the sweet-spot of consumer willingness to pay. You have solid room for customer acquisition and advertising margin.'
                        : diagnostics.priceVerdict === 'underpriced'
                        ? 'is lower than typical category benchmarks. While this accelerates rapid adoption, you risk leaving revenue on the table or being perceived as cheap. Consider bundling or raising prices once initial social proof is established.'
                        : 'is at the premium top tier. To justify this premium, your brand must deliver high-production cinematic commercial video, verified social proof, and flawless packaging.'}
                    </div>
                    {priceModel === 'subscription_daily' && (
                      <div className="text-[11px] text-amber-300/90 pt-1 border-t border-white/5">
                        🔄 <strong>Subscription Note:</strong> Billed at {currency === 'KES' ? `KES ${Number(priceInput).toLocaleString()}` : `$${priceInput}`} daily (~{currency === 'KES' ? `KES ${(Number(priceInput) * 30).toLocaleString()}` : `$${(Number(priceInput) * 30).toFixed(0)}`}/month run-rate). Daily billing significantly reduces customer friction for mobile money (M-Pesa) users.
                      </div>
                    )}
                    {priceModel === 'subscription_monthly' && (
                      <div className="text-[11px] text-emerald-300/90 pt-1 border-t border-white/5">
                        🔄 <strong>Subscription Note:</strong> Monthly recurring billing offers predictable ARR/MRR. Maintain high video retention and renewal onboarding to prevent churn.
                      </div>
                    )}
                  </p>
                </div>

                {/* Brand Identity & Visual Polish Critique */}
                <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" />
                    <h4 className="font-extrabold text-sm text-white">Brand &amp; Visual Audit</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-white/50 block text-[10px] uppercase font-bold">Name Recall Score</span>
                      <p className="font-bold text-white mt-0.5">{diagnostics.nameRating}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-white/50 block text-[10px] uppercase font-bold">Key Category Competitors</span>
                      <p className="font-medium text-white/80 mt-0.5">{benchmark.keyCompetitors.join(', ')}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed">
                    <p className="font-bold text-white mb-1">Visual Feedback:</p>
                    <p>{diagnostics.visualCritique}</p>
                  </div>
                </div>

                {/* Regional Strategy Playbook */}
                <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-emerald-400" />
                    <h4 className="font-extrabold text-sm text-white">Regional Targeting Recommendation</h4>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/10">
                    {diagnostics.regionalNote}
                  </p>
                </div>

                {/* Call-to-Action Bridge to Video Production */}
                <div className="rounded-3xl p-6 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-400/30 shadow-2xl space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Film size={18} className="text-amber-300" />
                    <h4 className="font-black text-base text-white">Next Step: Turn This Brand Into Sales</h4>
                  </div>
                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    A strong brand needs high-converting video. We can produce a 30s broadcast commercial and promotional poster using this exact brand specification in 48 hours.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleProceedToCommercial}
                      className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Film size={14} />
                      <span>Produce Commercial For This Brand →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-3 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Print / PDF Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
