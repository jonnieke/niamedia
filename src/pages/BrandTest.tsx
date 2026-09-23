import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sparkles, Award, ArrowRight, Upload, X,
  RefreshCw, BarChart3, Target, Compass, Printer, Film, Check,
  DollarSign, Mic, MicOff, HelpCircle, Repeat,
  ShieldCheck, AlertTriangle, Users, Play, Copy, Zap, TrendingUp,
  ChevronRight, CheckCircle2, ShoppingBag, Eye, Lightbulb, Share2,
  Globe, Lock, ExternalLink, UserPlus, LogIn, Calendar, CheckSquare,
  Download, Clock, Layers, ArrowUpRight, ShoppingCart, Smartphone,
  FileText
} from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { useAuth } from '../lib/AuthContext'
import { getBookingUrl } from '../lib/booking'

export const PRICING_MODELS = [
  { id: 'per_item', label: 'Per Item / Unit', short: '/ item', category: 'unit', desc: 'One-off price per physical item, bottle, pack, or piece' },
  { id: 'subscription_daily', label: 'Daily Pass (Micro-billing)', short: '/ day', category: 'subscription', desc: 'Daily recurring fee (e.g. daily tips, study access, micro-SaaS)' },
  { id: 'subscription_weekly', label: 'Weekly Subscription', short: '/ week', category: 'subscription', desc: '7-day recurring sprint (e.g. exam revision sprint, weekly harvest basket)' },
  { id: 'subscription_monthly', label: 'Monthly Subscription', short: '/ month', category: 'subscription', desc: 'Standard 30-day recurring plan (e.g. software, school fees, retainer)' },
  { id: 'subscription_termly', label: 'Termly / Quarterly (3 Months)', short: '/ term', category: 'subscription', desc: '90-day seasonal term pass (e.g. school term, 3-month coaching retainer)' },
  { id: 'subscription_biannual', label: 'Semi-Annual (6 Months)', short: '/ 6 mo', category: 'subscription', desc: '6-month semester or bi-annual harvest cycle membership' },
  { id: 'subscription_annual', label: 'Annual Subscription', short: '/ year', category: 'subscription', desc: 'Yearly recurring subscription (typically 12 months for price of 10)' },
  { id: 'per_service', label: 'Per Service / Project', short: '/ project', category: 'unit', desc: 'One-time fee per project, consultation, or custom service' },
] as const

/* ─── Industry Profiles & Benchmark Data ───────────────────────────── */
export interface CompetitorProfile {
  name: string
  marketTier: string
  howTheyWin: string
  vulnerability: string
  attackAngle: string
}

export interface TargetAudienceProfile {
  who: {
    icp: string
    ageBracket: string
    incomeBracket: string
    decisionMakers: string
    geoHubs: string
    deviceHabits: string
  }
  why: {
    functionalJob: string
    emotionalRelief: string
    socialStatus: string
    costOfInaction: string
  }
  how: {
    primaryChannels: string
    paymentFlow: string
    trustSignalsNeeded: string
  }
  when: {
    monthlyPayrollCycle: string
    seasonalPeak: string
    weeklyBuyingHours: string
  }
}

export interface CroPlaybook {
  speedBenchmark: string
  checkoutRequirement: string
  aboveTheFoldMustHave: string
  recommendedVideoType: string
  pixelsAndTracking: string
}

export interface IndustryBenchmark {
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
  competitorProfiles: CompetitorProfile[]
  audience: TargetAudienceProfile
  croPlaybook: CroPlaybook
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
    keyCompetitors: ['Zeraki Analytics & Learning', 'Eneza Education (Shupavu 291)', 'Longhorn E-Learning & Traditional Publishers'],
    competitorProfiles: [
      {
        name: 'Zeraki Analytics & Learning',
        marketTier: 'Market Leader (B2B School Software in 4,000+ Kenyan schools)',
        howTheyWin: 'Institutional school lock-in; teachers enter marks into their grading portal; strong relationships with principals.',
        vulnerability: 'Administrative focus with a cold clinical interface; lacks direct student-friendly mobile video mentoring and parent WhatsApp engagement.',
        attackAngle: 'Direct-to-parent and direct-to-student personal WhatsApp revision coach; zero school bureaucracy needed; bite-sized interactive past-paper challenges.'
      },
      {
        name: 'Eneza Education (Shupavu 291)',
        marketTier: 'Legacy Mass Market Pioneer',
        howTheyWin: 'Safaricom USSD code (*291#) partnership; accessible on basic 2G feature phones without internet.',
        vulnerability: 'Text-only SMS format is dry, lacks diagrams, interactive animations, and modern smartphone media engagement.',
        attackAngle: 'Rich visual 2D animated lessons, kinetic video breakdowns, and audio voice explanations on smartphones and tablets.'
      },
      {
        name: 'Longhorn E-Learning & Traditional Publishers',
        marketTier: 'Incumbent Curriculum Publishers',
        howTheyWin: 'Decades of syllabus textbook credibility and bookstore shelf presence across East Africa.',
        vulnerability: 'Sells static, boring PDF ebooks; expensive printed revisions (KES 800 per book); zero adaptive personalization.',
        attackAngle: '24/7 interactive WhatsApp revision bot at KES 2,500/term covering all subjects, replacing a stack of KES 12,000 physical books.'
      }
    ],
    audience: {
      who: {
        icp: 'Kenyan parents with candidates in CBC (Grades 6–9) and KCSE (Form 1–4), plus private tutors and teachers.',
        ageBracket: '32 – 54 years old (Mothers & Fathers)',
        incomeBracket: 'Middle to Upper-Middle (KES 45,000 – KES 250,000 / mo household income)',
        decisionMakers: 'Mother controls academic revision budget; Father approves high-ticket termly tuition; Student is daily user.',
        geoHubs: 'Nairobi (Westlands, Kilimani, Buruburu, South C, Kasarani), Nakuru, Eldoret, Kisumu, Mombasa.',
        deviceHabits: '92% mobile access, evening revision peak (7:30 PM – 9:30 PM), heavy parent WhatsApp group sharing.'
      },
      why: {
        functionalJob: 'Pass KNEC national exams, master tricky STEM concepts, and get instant step-by-step marking schemes 24/7.',
        emotionalRelief: 'Eliminates chronic parent anxiety over failing grades and embarrassment during school parents’ meetings.',
        socialStatus: 'Pride in raising high-achieving candidates who qualify for national schools and university admissions.',
        costOfInaction: 'Candidate misses university cut-off marks, forcing parents to pay KES 300,000+ in self-sponsored tuition or repeat years.'
      },
      how: {
        primaryChannels: 'Parent WhatsApp groups, Meta video ads (Facebook/Instagram targeting parents), teacher word-of-mouth.',
        paymentFlow: 'M-Pesa Express Daraja STK Push (Daily revision pass or termly discounted pass).',
        trustSignalsNeeded: 'Certified KNEC/CBC curriculum alignment badges, student score improvements, teacher video endorsements.'
      },
      when: {
        monthlyPayrollCycle: '25th – 5th payday surge (when school revision fees and termly subscriptions are paid).',
        seasonalPeak: 'January (Term 1 kickoff), June/July (Mid-year mocks), September–November (KCSE/KPSEA exam countdown).',
        weeklyBuyingHours: 'Sunday 6:00 PM – 9:30 PM (weekly study planning) and weekday evenings.'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.5s on Safaricom 4G; lightweight mobile assets for fast loading on student devices.',
      checkoutRequirement: 'Instant M-Pesa Daraja STK Push with automated SMS confirmation and WhatsApp study pass delivery.',
      aboveTheFoldMustHave: 'Headline with guaranteed exam practice ("Master KCSE & CBC in 30 Days") + WhatsApp direct trial button.',
      recommendedVideoType: '30s broadcast commercial showing a mother reviewing past exam results and child solving a tricky problem in 15 seconds.',
      pixelsAndTracking: 'Meta Pixel targeting parents aged 32–54 + Google Search Ads on "KCSE past papers with answers".'
    },
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
    keyCompetitors: ['Twiga Foods & Fresh Aggregators', 'Elgon Kenya & Agrovet Stockists', 'Local Farm-Gate Commodity Brokers ("Brokers wa Marikiti")'],
    competitorProfiles: [
      {
        name: 'Twiga Foods & Produce Aggregators',
        marketTier: 'Scaled B2B Supply Chain Leader',
        howTheyWin: 'Massive distribution logistics, fleet of delivery trucks, vendor financing, and formal supermarket supply contracts.',
        vulnerability: 'High operational overheads, vendor payment delays (farmers waiting 14–30 days for payout), generic bulk commoditization.',
        attackAngle: 'Immediate 24h M-Pesa farm-gate payout; premium single-origin traceability; direct chef/hotel supply without broker discount.'
      },
      {
        name: 'Elgon Kenya & Traditional Agrovet Stockists',
        marketTier: 'Traditional Input & Fertilizer Giants',
        howTheyWin: 'Nationwide shelf presence in 5,000+ local agrovets; institutional subsidies and government tenders.',
        vulnerability: 'Traditional offline retail, zero direct farmer digital guidance, technical chemical jargon on packaging.',
        attackAngle: 'Direct-to-farm WhatsApp agronomy support with voice notes in Swahili/vernacular; tailored micro-dosed nutrient packs.'
      },
      {
        name: 'Local Farm-Gate Commodity Brokers ("Brokers wa Marikiti")',
        marketTier: 'Informal Dominant Channel',
        howTheyWin: 'Physically present at farm gate with cash on collection day.',
        vulnerability: 'Unfair weighing scales, price fixing, taking up to 60% of retail margin from hard-working growers.',
        attackAngle: 'Digital scale verification, published daily market prices on WhatsApp, guaranteed transparent weight-based contracts.'
      }
    ],
    audience: {
      who: {
        icp: 'Commercial smallholders, cooperative managers, poultry/dairy farmers, and fresh produce exporters in Rift Valley, Central, and Eastern Kenya.',
        ageBracket: '28 – 60 years old (Agri-entrepreneurs)',
        incomeBracket: 'KES 35,000 – KES 500,000 / month (cyclical harvest revenues)',
        decisionMakers: 'Farm owner / farm manager; spouse manages daily bookkeeping; agrovets advise input purchases.',
        geoHubs: 'Nakuru, Uasin Gishu, Kiambu, Meru, Kirinyaga, Machakos, Naivasha.',
        deviceHabits: '85% Android smartphone, WhatsApp voice notes preferred over typing, early morning (5:30 AM – 7:30 AM) and evening checking.'
      },
      why: {
        functionalJob: 'Maximize crop yield per acre, prevent disease outbreaks, and secure guaranteed buyer contracts.',
        emotionalRelief: 'Eliminates terror of crop disease wiping out KES 200,000 investment; relief from broker price manipulation.',
        socialStatus: 'Respected as a progressive model farmer in the county/chama; visible wealth through bumper harvests.',
        costOfInaction: '40% post-harvest crop spoilage or broker undervaluation, losing up to KES 150,000 per acre per season.'
      },
      how: {
        primaryChannels: 'Agrovet physical recommendations, Facebook farming groups, WhatsApp direct ordering.',
        paymentFlow: 'M-Pesa Buy Goods Till or Paybill upon delivery or verified weighbridge receipt.',
        trustSignalsNeeded: 'Video proof of field harvest, agronomist certification, neighbor farmer testimonials with actual sack counts.'
      },
      when: {
        monthlyPayrollCycle: 'Irregular cashflows tied to harvest sales (M-Pesa cash-in peaks upon produce collection).',
        seasonalPeak: 'Long rains planting (March–May), Short rains planting (October–November), Harvest sales (July/August & December).',
        weeklyBuyingHours: 'Saturday morning market days and Sunday afternoon farmer reviews.'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.8s on 3G rural networks; highly compressed WebP imagery.',
      checkoutRequirement: 'WhatsApp Click-to-Chat with pre-filled product name + M-Pesa Till number in pinned message.',
      aboveTheFoldMustHave: 'Raw unedited 4K smartphone video showing lush crop yield or clean packaging + verified kilogram pricing.',
      recommendedVideoType: '30s farmer testimonial standing in front of healthy crops, stating harvest numbers and income increase.',
      pixelsAndTracking: 'Meta Ads targeting Agricultural interests + Location targeting in agricultural counties.'
    },
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
    keyCompetitors: ['Bidco / Unilever / Kapa Oil', 'Naivas & Quickmart Supermarket House Brands', 'Artisan Kenyan Boutique Makers'],
    competitorProfiles: [
      {
        name: 'Bidco, Unilever & Kapa Oil',
        marketTier: 'Industrial Conglomerate Leaders',
        howTheyWin: 'Massive supermarket shelf dominance, nationwide television and billboard ad spend, deep retail distribution.',
        vulnerability: 'Mass-produced perception, generic corporate branding, heavy reliance on palm oil/synthetic fillers.',
        attackAngle: 'Pure organic, cold-pressed, clean-label artisan positioning with traceable Kenyan farm ingredients.'
      },
      {
        name: 'Naivas & Quickmart Supermarket House Brands',
        marketTier: 'Retailer Private Label Brands',
        howTheyWin: 'Prime eye-level supermarket shelf placement and aggressive 15% discount pricing.',
        vulnerability: 'Bland packaging, zero brand loyalty or lifestyle community clout.',
        attackAngle: 'High-end aspirational packaging, influencer unboxing video proof, and direct-to-consumer home delivery bundles.'
      },
      {
        name: 'Informal Local Traders & Mitumba FMCG',
        marketTier: 'Local Low-Cost Sellers',
        howTheyWin: 'Cheapest cash price at local estate kiosks.',
        vulnerability: 'Inconsistent hygiene standards, counterfeit risk, lack of KEBS standardization.',
        attackAngle: 'Official KEBS quality stamp, tamper-evident seals, and guaranteed return policy.'
      }
    ],
    audience: {
      who: {
        icp: 'Kenyan urban households, mothers, wellness-conscious millennials, and estate retail shoppers.',
        ageBracket: '24 – 48 years old',
        incomeBracket: 'Middle to Upper-Middle (KES 40,000 – KES 180,000 / month)',
        decisionMakers: 'Primary household grocery decision maker (mothers & young working professionals).',
        geoHubs: 'Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika.',
        deviceHabits: 'Mobile-first, Instagram & TikTok scrolling during commutes and lunch hours.'
      },
      why: {
        functionalJob: 'Clean, reliable, everyday consumable products that nourish family health without synthetic toxins.',
        emotionalRelief: 'Peace of mind knowing food or household items are hygienic, genuine, and safe for children.',
        socialStatus: 'Displaying premium, aesthetically pleasing packaged goods on kitchen counters and dining tables.',
        costOfInaction: 'Consuming low-grade counterfeit or chemical-heavy generic oils and pantry goods.'
      },
      how: {
        primaryChannels: 'Instagram Reels, TikTok influencer recipes, estate mini-marts, WhatsApp delivery groups.',
        paymentFlow: 'M-Pesa STK push for direct delivery, card at supermarket checkout.',
        trustSignalsNeeded: 'KEBS certification mark, visible manufacturing expiry date, clean tamper-evident bottle packaging.'
      },
      when: {
        monthlyPayrollCycle: 'Heavy monthly stock-up shopping between 28th and 5th of each month.',
        seasonalPeak: 'Easter, August school holiday family feasts, and Christmas holiday hampers.',
        weeklyBuyingHours: 'Friday evening grocery orders and Saturday supermarket visits.'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.6s on mobile; quick-loading image gallery.',
      checkoutRequirement: 'M-Pesa STK push checkout with bundle options (Buy 2 Get 1 Free, or Free Nairobi Delivery over KES 2,500).',
      aboveTheFoldMustHave: 'Clear product bottle/pack mockup with volume/weight tag and prominent "Add to Cart / WhatsApp Order" button.',
      recommendedVideoType: '30s fast-paced sensory commercial: unboxing, bottle pour, sizzling texture, and satisfied family smiles.',
      pixelsAndTracking: 'Meta Pixel + TikTok Pixel tracking "Add to Cart" and "Initiate Checkout".'
    },
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
    keyCompetitors: ['L’Oreal / Garnier / Nivea', 'Suzzie Beauty & Local Cosmetics', 'Imported Boutique Skincare Lines'],
    competitorProfiles: [
      {
        name: 'L’Oreal, Garnier & Nivea',
        marketTier: 'Multinational Pharmacy Giants',
        howTheyWin: 'Global marketing power, shelf space in every pharmacy, dermatologist clinical claims.',
        vulnerability: 'Formulated for generic Western skin; rarely address melanin-specific hyperpigmentation or East African sun intensity.',
        attackAngle: 'Melanin-first formulations using local East African botanicals (Nilotica shea, avocado, marula); authentic Kenyan creator video proof.'
      },
      {
        name: 'Suzzie Beauty & First-Wave Kenyan Lines',
        marketTier: 'Local Brand Pioneers',
        howTheyWin: 'Local founder story and initial department store presence.',
        vulnerability: 'Dated brand packaging, inconsistent stock availability, limited modern TikTok creator advocacy.',
        attackAngle: 'Modern glass dropper aesthetic, viral TikTok before-and-after routines, 24-hour fast dispatch.'
      },
      {
        name: 'Imported Dubai & UK Boutique Skincare',
        marketTier: 'Import Resellers',
        howTheyWin: 'Imported prestige appeal.',
        vulnerability: 'High prices (KES 4,000–8,000), frequent customs stockouts, lack of personalized consultation.',
        attackAngle: 'Direct local production at half the price (KES 2,000) with guaranteed same-day availability.'
      }
    ],
    audience: {
      who: {
        icp: 'Kenyan women & young professionals (20–42) battling hyperpigmentation, dry skin, or hair breakage.',
        ageBracket: '20 – 42 years old',
        incomeBracket: 'KES 35,000 – KES 200,000 / month',
        decisionMakers: 'Individual consumer making personal wellness and beauty choices.',
        geoHubs: 'Nairobi (Kilimani, Westlands, Rongai, Roysambu), Mombasa, Kisumu, Nakuru, Eldoret.',
        deviceHabits: 'Heavy TikTok & Instagram Reels daily consumption (1–2 hours/day), night-time scrolling.'
      },
      why: {
        functionalJob: 'Clear blemishes, hyperpigmentation, sun damage, and retain deep all-day skin hydration.',
        emotionalRelief: 'Overcomes self-consciousness about acne scars and dull skin; confidence to go makeup-free.',
        socialStatus: 'Aesthetic glowing skin compliments from friends, peers, and on social media.',
        costOfInaction: 'Wasting money on harsh bleaching creams or ineffective pharmacy lotions that worsen skin barriers.'
      },
      how: {
        primaryChannels: 'TikTok organic routines, Instagram Reels, beauty creator collaborations, WhatsApp skin consultation.',
        paymentFlow: 'M-Pesa STK Push direct checkout or WhatsApp order with rider dispatch.',
        trustSignalsNeeded: 'Unfiltered before-and-after video proof, ingredient transparency, dermatologist safety endorsement.'
      },
      when: {
        monthlyPayrollCycle: 'Surge from 25th to 5th (treating oneself on payday).',
        seasonalPeak: 'December festive season, Valentine’s month, and sunny outdoor wedding season (August–October).',
        weeklyBuyingHours: 'Thursday & Friday evenings (preparing for weekend outings).'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.4s on mobile; instant product image swatches.',
      checkoutRequirement: 'M-Pesa Express 1-click checkout + optional WhatsApp beauty advisor consultation.',
      aboveTheFoldMustHave: 'Close-up macro skin texture video + 14-day results guarantee banner.',
      recommendedVideoType: '30s TikTok routine: Close-up dropper application, texture glide, Day 1 vs Day 14 skin glow comparison.',
      pixelsAndTracking: 'TikTok Pixel + Meta Pixel optimized for Purchase conversions with video view retargeting.'
    },
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
    keyCompetitors: ['ChamaSoft & Kopokopo', 'Global SaaS (QuickBooks / Zoho / Stripe)', 'Custom Built Local Portals'],
    competitorProfiles: [
      {
        name: 'ChamaSoft, Kopokopo & Regional Fintechs',
        marketTier: 'Established Regional Incumbents',
        howTheyWin: 'Direct M-Pesa B2B integration, early mover brand recognition in East Africa.',
        vulnerability: 'Clunky legacy web dashboards, high transaction commissions, slow customer support ticketing.',
        attackAngle: 'Zero-install WhatsApp-native interface; AI-automated bookkeeping; instant dispute resolution via live chat.'
      },
      {
        name: 'Global SaaS (QuickBooks, Zoho, Xero)',
        marketTier: 'Global Enterprise Giants',
        howTheyWin: 'Deep enterprise feature depth, international investor trust, extensive documentation.',
        vulnerability: 'Priced in expensive USD ($30–$90/month), zero native M-Pesa STK push, not compliant with KRA eTIMS.',
        attackAngle: 'Billed in affordable KES; built-in automated M-Pesa reconciliation; 1-click KRA eTIMS invoice generation.'
      },
      {
        name: 'Manual Spreadsheets & Paper Ledgers',
        marketTier: 'Informal Dominant Alternative',
        howTheyWin: 'Free, familiar, zero subscription fees.',
        vulnerability: 'Massive human error, fraud risk in chamas/businesses, lost receipts, zero automated audit trail.',
        attackAngle: 'Free 14-day trial showing how 5 hours of manual weekly bookkeeping shrinks to 30 seconds of automated M-Pesa sync.'
      }
    ],
    audience: {
      who: {
        icp: 'Kenyan SME founders, chama treasurers, landlords, retailers, and modern agency directors.',
        ageBracket: '25 – 50 years old',
        incomeBracket: 'Business turnover KES 150,000 – KES 5,000,000 / month',
        decisionMakers: 'Business owner, Managing Director, or Chama Treasurer.',
        geoHubs: 'Nairobi, Mombasa, Kisumu, Eldoret, plus East African diaspora in US/UK/UAE.',
        deviceHabits: 'Mobile-first during day (checking M-Pesa), laptop/desktop for deep accounting.'
      },
      why: {
        functionalJob: 'Eliminate manual bookkeeping, track every M-Pesa payment automatically, and prevent staff theft/leakage.',
        emotionalRelief: 'Ends the stress of unaccounted balances, reconciliation arguments in chamas, and fear of KRA tax audits.',
        socialStatus: 'Positioned as an organized, tech-savvy, professional business operator.',
        costOfInaction: 'Losing KES 30,000+ monthly in undetected payment leakages, inventory theft, or KRA non-compliance penalties.'
      },
      how: {
        primaryChannels: 'LinkedIn positioning, Meta video ads demonstrating UI, founder Twitter/X, business WhatsApp referrals.',
        paymentFlow: 'Automated recurring M-Pesa STK push or corporate card billing (Monthly or Annual pass).',
        trustSignalsNeeded: 'Bank-grade 256-bit encryption badge, Safaricom Daraja certified partner status, customer case studies.'
      },
      when: {
        monthlyPayrollCycle: 'Subscription renewals concentrated on 1st–5th of every month.',
        seasonalPeak: 'January (annual business planning & tax prep) and July (mid-year financial audit).',
        weeklyBuyingHours: 'Monday morning operational planning (8:00 AM – 11:00 AM).'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.2s web app loading; sub-second API responses.',
      checkoutRequirement: 'Frictionless 14-day free trial with no credit card required; 1-click M-Pesa activation.',
      aboveTheFoldMustHave: 'Interactive screen recording showing M-Pesa payment sync in under 5 seconds + "Start Free Trial" CTA.',
      recommendedVideoType: '30s kinetic UI walkthrough showing a chaotic spreadsheet transformed into clean real-time financial graphs.',
      pixelsAndTracking: 'Google Tag Manager + Meta Pixel tracking "CompleteRegistration" and "Subscribe".'
    },
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
    keyCompetitors: ['Gikomba & High-End Thrift Curators', 'Fast Fashion Importers (Zara / Shein)', 'Bespoke Kenyan Labels (Vivo, KikoRomeo)'],
    competitorProfiles: [
      {
        name: 'Gikomba & Instagram Thrift Curators',
        marketTier: 'High-Volume Secondhand Segment',
        howTheyWin: 'One-of-a-kind pieces, rapid weekly inventory drops, very low unit cost.',
        vulnerability: 'Used clothing hygiene stigma, inconsistent sizing, zero repeat inventory availability.',
        attackAngle: 'Brand new, premium Kenyan-tailored pieces with consistent standard sizing and luxury brand packaging.'
      },
      {
        name: 'Fast Fashion Importers (Zara, Shein, ASOS)',
        marketTier: 'Global Fast Fashion Giants',
        howTheyWin: 'Massive product catalogs, runway trend copies within 14 days.',
        vulnerability: 'Expensive international shipping (KES 2,000+), 2-3 week customs delays, generic non-African fit.',
        attackAngle: 'Designed specifically for African body proportions, premium breathable fabrics, same-day Nairobi delivery.'
      },
      {
        name: 'Bespoke High-End Kenyan Labels (Vivo, KikoRomeo)',
        marketTier: 'Established Domestic Retailers',
        howTheyWin: 'Mall store locations, strong brand recognition among older professionals.',
        vulnerability: 'High mall retail overheads reflected in elevated prices (KES 6,000–15,000); conservative silhouettes.',
        attackAngle: 'Direct-to-consumer online pricing (KES 3,500), modern afro-urban streetwear aesthetic, creator-led styling.'
      }
    ],
    audience: {
      who: {
        icp: 'Kenyan urban youth, creatives, stylish corporate professionals, and African diaspora fashionistas.',
        ageBracket: '21 – 38 years old',
        incomeBracket: 'KES 40,000 – KES 250,000 / month',
        decisionMakers: 'Individual consumer expressing identity and style.',
        geoHubs: 'Nairobi, Mombasa, plus diaspora in UK, US, Canada, Europe.',
        deviceHabits: 'Instagram Stories & Reels heavy, TikTok outfit-of-the-day (OOTD) culture.'
      },
      why: {
        functionalJob: 'Look stylish, confident, and comfortable for work, brunches, events, and photos.',
        emotionalRelief: 'Eliminates outfit anxiety and fear of showing up underdressed or in poor-quality fabric.',
        socialStatus: 'Compliments from peers, aesthetic Instagram photos, pride in wearing original African design.',
        costOfInaction: 'Wasting money on flimsy fast-fashion items that shrink or fade after two washes.'
      },
      how: {
        primaryChannels: 'Instagram Reels styling videos, TikTok creator hauls, influencer tagging, WhatsApp direct catalogue.',
        paymentFlow: 'M-Pesa STK push on website or Paybill upon rider delivery.',
        trustSignalsNeeded: 'Video clips showing fabric stretch and texture, clear size chart, easy exchange policy.'
      },
      when: {
        monthlyPayrollCycle: 'Payday wardrobe shopping (25th–5th).',
        seasonalPeak: 'Blankets & Wine / festival weekends, December holiday travel, Easter brunch season.',
        weeklyBuyingHours: 'Wednesday & Thursday evenings (ordering outfits in time for Friday/Saturday events).'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.5s on mobile; instant high-res zoom on garment fabrics.',
      checkoutRequirement: 'Express M-Pesa STK Push with size selector and rider delivery tracking.',
      aboveTheFoldMustHave: '30s dynamic model walkthrough showing movement and drape + clear sizing guide button.',
      recommendedVideoType: '30s fashion lookbook: Runway walk, outdoor golden-hour lighting, fabric close-up, and styling combinations.',
      pixelsAndTracking: 'Meta Pixel + TikTok Pixel tracking "ViewContent" and "AddToCart" with lookalike audience retargeting.'
    },
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
    keyCompetitors: ['Java House & Artcaffe', 'Cloud Kitchens & Glovo Delivery Brands', 'Artisan Gourmet Caterers & Bakeries'],
    competitorProfiles: [
      {
        name: 'Java House & Artcaffe',
        marketTier: 'Commercial Restaurant Giants',
        howTheyWin: 'Prime mall real estate, familiar standardized menus, corporate meeting locations.',
        vulnerability: 'Expensive restaurant pricing (KES 2,000+ per meal), impersonal mass dining experience, high delivery commissions.',
        attackAngle: 'Boutique artisan specialty focus (e.g. signature gourmet burgers, artisanal pastries, specialty coffee roast) with direct WhatsApp dispatch.'
      },
      {
        name: 'Cloud Kitchens & Glovo/UberEats Brands',
        marketTier: 'Aggregator Delivery Brands',
        howTheyWin: 'Prominent placement in Glovo/UberEats apps, fast delivery algorithms.',
        vulnerability: 'Food arrives cold/soggy due to generic packaging; high 25–30% platform commission passed to customer.',
        attackAngle: 'Insulated custom branded packaging, direct WhatsApp order club with free delivery perks, fresher taste.'
      },
      {
        name: 'Estate Fast Food Joints & Kiosks',
        marketTier: 'Hyper-Local Budget Players',
        howTheyWin: 'Lowest prices in the neighborhood.',
        vulnerability: 'Unpredictable hygiene standards, lack of packaging aesthetics, limited menu innovation.',
        attackAngle: 'Guaranteed hygienic open-kitchen video proof, tamper-proof packaging, gourmet flavor profiles.'
      }
    ],
    audience: {
      who: {
        icp: 'Kenyan urban foodies, working professionals ordering lunch, weekend brunch enthusiasts, and family dinner hosts.',
        ageBracket: '22 – 45 years old',
        incomeBracket: 'KES 40,000 – KES 250,000 / month',
        decisionMakers: 'Hungry individual, office lunch organizer, or evening family meal planner.',
        geoHubs: 'Nairobi (Westlands, Kilimani, Lavington, CBD, Parklands, Karen), Mombasa, Kisumu.',
        deviceHabits: 'Food app browsing during lunch hour (11:30 AM – 1:30 PM) and evening dinner cravings (6:00 PM – 8:30 PM).'
      },
      why: {
        functionalJob: 'Delicious, freshly prepared, piping-hot meals or gourmet pantry items delivered reliably on time.',
        emotionalRelief: 'Instant comfort and reward after a exhausting workday; relief from cooking and cleaning dishes.',
        socialStatus: 'Sharing Instagrammable meals, artisanal coffee, or hosting friends with gourmet foods.',
        costOfInaction: 'Wasting money on disappointing, cold, bland food that ruins an evening.'
      },
      how: {
        primaryChannels: 'Instagram food reels, TikTok food creator reviews, WhatsApp direct order line, office word of mouth.',
        paymentFlow: 'M-Pesa STK push upon order confirmation or Buy Goods Till on delivery.',
        trustSignalsNeeded: 'Steaming-hot food video clips, authentic customer reviews, clean food-grade packaging.'
      },
      when: {
        monthlyPayrollCycle: 'Dining-out spikes from 26th to 5th; steady lunch orders throughout the month.',
        seasonalPeak: 'Festive seasons (December, Easter), Valentine’s dinners, and rainy cold days (comfort food delivery).',
        weeklyBuyingHours: 'Friday evening dinner orders, Saturday brunch, and Sunday family dinners.'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.2s mobile loading; mouthwatering menu navigation.',
      checkoutRequirement: '2-click M-Pesa STK push checkout with delivery location pin and real-time rider dispatch update.',
      aboveTheFoldMustHave: 'High-definition macro video of sizzling cheese/fresh roast + 30-minute delivery guarantee.',
      recommendedVideoType: '30s sensory food commercial: Sizzling sound, slow-motion steam, sauce drizzle, and crunch bite.',
      pixelsAndTracking: 'Meta Ads with click-to-WhatsApp messaging + Location radius geo-fencing (5km delivery radius).'
    },
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
    keyCompetitors: ['BuyRentKenya & HassConsult', 'Kilimani & Westlands Luxury Airbnbs', 'Knight Frank & Pam Golding'],
    competitorProfiles: [
      {
        name: 'BuyRentKenya, HassConsult & Property24',
        marketTier: 'Dominant Property Aggregators',
        howTheyWin: 'Huge Google search SEO traffic, thousands of agent listings.',
        vulnerability: 'Full of fake duplicate listings, outdated prices, unresponsive agents, zero cinematic video tours.',
        attackAngle: '100% verified developer listings, 4K cinematic drone and interior walkthroughs, direct WhatsApp concierge.'
      },
      {
        name: 'Kilimani & Westlands Airbnb Superhosts',
        marketTier: 'Short-Stay Rental Hosts',
        howTheyWin: 'Airbnb platform algorithm rankings, established reviews.',
        vulnerability: 'High 15% platform fees, unpredictable Wi-Fi/water backups, impersonal automated lockboxes.',
        attackAngle: 'Direct booking portal saving guests 15%; guaranteed 100Mbps fiber + solar backup; personal airport transfer concierge.'
      },
      {
        name: 'Traditional Legacy Hotels',
        marketTier: 'Corporate Hospitality Incumbents',
        howTheyWin: 'Conference facilities, legacy corporate account contracts.',
        vulnerability: 'High room rates ($150–$300/night) for small cramped rooms with no kitchen or living space.',
        attackAngle: 'Spacious serviced 2BR/3BR luxury apartments with full chef kitchens at half the hotel rate.'
      }
    ],
    audience: {
      who: {
        icp: 'Kenyan diaspora visiting home, corporate business travelers, expat consultants, and property investors.',
        ageBracket: '28 – 65 years old',
        incomeBracket: 'Upper-Middle to High Net Worth (Income KES 150,000 – KES 1,500,000+ / mo)',
        decisionMakers: 'Investor / Head of Household / Corporate Travel Manager.',
        geoHubs: 'Nairobi (Kilimani, Westlands, Riverside, Karen, Kitisuru), Diani, Naivasha, Mombasa, plus Diaspora in US/UK/Europe/UAE.',
        deviceHabits: 'Researches on laptop/tablet, books via mobile WhatsApp or direct website.'
      },
      why: {
        functionalJob: 'Secure safe, luxurious, fully serviced accommodation or high-yield verified property investments in Kenya.',
        emotionalRelief: 'Eliminates fear of being scammed by fake agents or arriving at dirty, noisy Airbnbs.',
        socialStatus: 'Prestige of owning luxury Kenyan real estate or staying in breathtaking penthouses.',
        costOfInaction: 'Losing millions of shillings to fraudulent land/off-plan schemes or wasting KES 100,000 on sub-par hotel stays.'
      },
      how: {
        primaryChannels: 'YouTube property video tours, Instagram luxury reels, Diaspora Facebook groups, WhatsApp concierge.',
        paymentFlow: 'International Visa/Mastercard, M-Pesa STK push for deposits, bank wire for real estate purchases.',
        trustSignalsNeeded: 'Cinematic 4K walkthrough video, verified title deed credentials, Google Street View context, reviews from diaspora guests.'
      },
      when: {
        monthlyPayrollCycle: 'Corporate travel booked 1–3 weeks ahead; real estate purchases triggered by diaspora remittances.',
        seasonalPeak: 'July–August (Summer diaspora visits), November–January (Christmas holiday influx), Easter Naivasha/Coast getaways.',
        weeklyBuyingHours: 'Sunday afternoon property research and weekday evening international WhatsApp calls.'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.5s on international connections; CDN-hosted 4K video player.',
      checkoutRequirement: 'Direct calendar date selector with instant M-Pesa/Card deposit + WhatsApp host concierge button.',
      aboveTheFoldMustHave: 'Breathtaking 4K drone view of property + exact neighborhood landmark proximity + verified amenities badge.',
      recommendedVideoType: '30s cinematic commercial: Drone exterior swoop, luxury interior walk, balcony sunset view, and smiling guest relaxation.',
      pixelsAndTracking: 'Meta Pixel + Google Ads targeting "Airbnb Nairobi" and Diaspora audiences in North America & Europe.'
    },
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
    keyCompetitors: ['Big 4 Consultancies (PwC, KPMG, Deloitte)', 'Mid-Tier Nairobi Corporate Agencies', 'Freelance Upwork / LinkedIn Specialists'],
    competitorProfiles: [
      {
        name: 'Big 4 Consultancies (PwC, Deloitte, KPMG)',
        marketTier: 'Enterprise Global Firms',
        howTheyWin: 'Boardroom brand authority, corporate enterprise tenders, multi-million shilling retainers.',
        vulnerability: 'Exorbitant fees (KES 500,000+), slow bureaucratic execution, junior associates doing the actual work.',
        attackAngle: 'Agile execution delivered directly by senior specialists in 1/4 of the time at 1/5 of the fee.'
      },
      {
        name: 'Mid-Tier Nairobi Traditional Agencies',
        marketTier: 'Local Agency Competitors',
        howTheyWin: 'Established physical offices in Westlands/Kilimani, personal connections with marketing directors.',
        vulnerability: 'Outdated non-AI workflows, generic deliverables, slow 6-week turnaround times.',
        attackAngle: 'AI-accelerated 48-hour turnarounds, data-backed ROI reporting, modern digital-first deliverables.'
      },
      {
        name: 'Freelance Upwork & Fiverr Contractors',
        marketTier: 'Budget Offshore Freelancers',
        howTheyWin: 'Low hourly rates.',
        vulnerability: 'Zero understanding of Kenyan cultural nuances, lack of institutional accountability, ghosting.',
        attackAngle: 'Locally grounded experts with legal contracts, physical Nairobi accountability, and proven regional track record.'
      }
    ],
    audience: {
      who: {
        icp: 'Managing Directors, Marketing Heads, SME Founders, Corporate Executives, and Diaspora Investors.',
        ageBracket: '30 – 58 years old',
        incomeBracket: 'Corporate budgets / High-earning founders (KES 100,000 – KES 1,000,000+ / month)',
        decisionMakers: 'CEO, Managing Director, or Head of Department.',
        geoHubs: 'Nairobi (Upper Hill, Westlands, CBD, Kilimani) and international corporate clients.',
        deviceHabits: 'Desktop during work hours, LinkedIn mobile app during commutes, WhatsApp for fast business decisions.'
      },
      why: {
        functionalJob: 'Solve high-stakes business challenges (branding, marketing, legal, compliance, tax, strategy) with zero risk.',
        emotionalRelief: 'Eliminates fear of costly commercial mistakes, lost contracts, or looking incompetent before board members.',
        socialStatus: 'Authority and prestige of partnering with state-of-the-art specialist advisors.',
        costOfInaction: 'Wasting months of company time and millions in lost revenue on failed in-house trials.'
      },
      how: {
        primaryChannels: 'LinkedIn thought leadership, executive referrals, Cal.com strategy calls, WhatsApp direct consultation.',
        paymentFlow: 'Formal corporate invoicing with 70% bank transfer/M-Pesa deposit and milestone delivery balance.',
        trustSignalsNeeded: 'Documented case studies with revenue metrics, recognizable client logos, executive testimonials.'
      },
      when: {
        monthlyPayrollCycle: 'Corporate budgets allocated at the start of each month or quarterly budget cycles.',
        seasonalPeak: 'Q1 (January–February strategy kickoffs) and Q4 (budget clearing before December).',
        weeklyBuyingHours: 'Tuesday and Thursday mornings (peak corporate meeting and decision hours).'
      }
    },
    croPlaybook: {
      speedBenchmark: 'Under 1.2s on corporate high-speed networks; clean minimalist UI.',
      checkoutRequirement: 'Embedded 1-click Cal.com strategy consultation booking + instant PDF case study download.',
      aboveTheFoldMustHave: 'Executive authority headline + client results metric ("Helped 40+ East African Brands Scale") + "Book Strategy Call".',
      recommendedVideoType: '30s executive founder video explaining the core strategic framework with client outcome proofs.',
      pixelsAndTracking: 'LinkedIn Insight Tag + Meta Pixel tracking "Schedule" and "Lead" conversions.'
    },
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
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()

  // Form States
  const [brandName, setBrandName] = useState('')
  const [industryId, setIndustryId] = useState('education_edtech')
  const [productDesc, setProductDesc] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [priceInput, setPriceInput] = useState<number | ''>(2500)
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES')
  const [priceModel, setPriceModel] = useState<string>('per_item')
  const [targetRegion, setTargetRegion] = useState('urban_ke')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // Rate Limiting & Auth Gating Modals
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showPdfAuthModal, setShowPdfAuthModal] = useState(false)

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

  // Hydrate draft from localStorage on mount (preserves analysis when user signs in or registers)
  useEffect(() => {
    const savedDraft = localStorage.getItem('nia_brand_test_draft')
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft)
        if (parsed.brandName) setBrandName(parsed.brandName)
        if (parsed.industryId && INDUSTRY_BENCHMARKS[parsed.industryId]) setIndustryId(parsed.industryId)
        if (parsed.productDesc) setProductDesc(parsed.productDesc)
        if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl)
        if (parsed.priceInput !== undefined) setPriceInput(parsed.priceInput)
        if (parsed.currency) setCurrency(parsed.currency)
        if (parsed.priceModel) setPriceModel(parsed.priceModel)
        if (parsed.targetRegion) setTargetRegion(parsed.targetRegion)
        if (parsed.uploadedImage) setUploadedImage(parsed.uploadedImage)
        if (parsed.hasTested) setHasTested(true)
      } catch (err) {
        console.error('Failed to parse brand test draft from localStorage', err)
      }
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
  const [analysisStage, setAnalysisStage] = useState('Parsing Brand Concept...')
  const [activeTab, setActiveTab] = useState<'who_why_when' | 'competitors' | 'storefront' | 'commercial' | 'roadmap'>('who_why_when')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const benchmark = INDUSTRY_BENCHMARKS[industryId] || INDUSTRY_BENCHMARKS.education_edtech

  // Auto-download PDF if user just signed in and was redirected with download intent
  useEffect(() => {
    const isPending = searchParams.get('download') === 'true' || sessionStorage.getItem('nia_pending_pdf_download') === 'true'
    if (isAuthenticated && isPending && hasTested) {
      sessionStorage.removeItem('nia_pending_pdf_download')
      const timer = setTimeout(() => {
        window.print()
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, searchParams, hasTested])

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

  // PDF Export Gate Handler - Gated for Authenticated Users
  const handlePdfDownload = () => {
    if (!isAuthenticated) {
      // Save draft first so user never loses their report!
      localStorage.setItem('nia_brand_test_draft', JSON.stringify({
        brandName,
        industryId,
        productDesc,
        websiteUrl,
        priceInput,
        currency,
        priceModel,
        targetRegion,
        uploadedImage,
        hasTested: true,
      }))
      sessionStorage.setItem('nia_pending_pdf_download', 'true')
      setShowPdfAuthModal(true)
      return
    }
    window.print()
  }

  // Direct Markdown Dossier Download (Offline Backup)
  const handleDownloadFile = () => {
    if (!isAuthenticated) {
      localStorage.setItem('nia_brand_test_draft', JSON.stringify({
        brandName,
        industryId,
        productDesc,
        websiteUrl,
        priceInput,
        currency,
        priceModel,
        targetRegion,
        uploadedImage,
        hasTested: true,
      }))
      sessionStorage.setItem('nia_pending_pdf_download', 'true')
      setShowPdfAuthModal(true)
      return
    }
    const blob = new Blob([diagnostics.fullReportText], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(brandName || 'Brand').replace(/[^a-zA-Z0-9_-]/g, '_')}_Strategic_Market_Dossier.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Redirect to Auth with Draft Persisted
  const handleProceedToAuth = (path: '/login' | '/register') => {
    localStorage.setItem('nia_brand_test_draft', JSON.stringify({
      brandName,
      industryId,
      productDesc,
      websiteUrl,
      priceInput,
      currency,
      priceModel,
      targetRegion,
      uploadedImage,
      hasTested: true,
    }))
    sessionStorage.setItem('nia_pending_pdf_download', 'true')
    navigate(`${path}?redirect=/test-brand%3Fdownload%3Dtrue`)
  }

  // Run Brand Diagnostic Simulation
  const handleRunTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) {
      alert('Please enter your brand or product name.')
      return
    }

    // Abuse Prevention: Limit guest visitors to 1 test
    const guestCount = parseInt(localStorage.getItem('nia_guest_brand_test_count') || '0', 10)
    if (!isAuthenticated && guestCount >= 1 && !hasTested) {
      setShowLimitModal(true)
      return
    }

    // Stop listening if mic was left on
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    setIsAnalyzing(true)
    setAnalysisProgress(15)
    setAnalysisStage('Extracting Core Value Proposition & Buyer Psychology...')

    const p1 = setTimeout(() => {
      setAnalysisProgress(40)
      setAnalysisStage('Benchmarking East African & Regional Competitors...')
    }, 350)

    const p2 = setTimeout(() => {
      setAnalysisProgress(70)
      setAnalysisStage('Simulating Price Elasticity & 30s Commercial Script...')
    }, 750)

    const p3 = setTimeout(() => {
      setAnalysisProgress(90)
      setAnalysisStage('Finalizing 7-Day Go-To-Market Execution Plan...')
    }, 1100)

    const p4 = setTimeout(() => {
      setAnalysisProgress(100)
      setIsAnalyzing(false)
      setHasTested(true)
      if (!isAuthenticated) {
        localStorage.setItem('nia_guest_brand_test_count', '1')
      }
      // Save draft into localStorage
      localStorage.setItem('nia_brand_test_draft', JSON.stringify({
        brandName,
        industryId,
        productDesc,
        websiteUrl,
        priceInput,
        currency,
        priceModel,
        targetRegion,
        uploadedImage,
        hasTested: true,
      }))
      setActiveTab('who_why_when')
      window.scrollTo({ top: 480, behavior: 'smooth' })
    }, 1450)

    return () => {
      clearTimeout(p1)
      clearTimeout(p2)
      clearTimeout(p3)
      clearTimeout(p4)
    }
  }

  // Diagnostic Deep Semantic Intelligence Engine
  const diagnostics = useMemo(() => {
    const rawBrand = brandName.trim() || 'Your Brand'
    const rawDesc = productDesc.trim()
    const lowerDesc = rawDesc.toLowerCase()
    const lowerBrand = rawBrand.toLowerCase()

    const numPrice = Number(priceInput) || benchmark.kesSweetSpot
    const rawKesPrice = currency === 'KES' ? numPrice : numPrice * 130

    // Normalize price for subscription frequency if applicable
    let effectiveKesPrice = rawKesPrice
    if (priceModel === 'subscription_daily') {
      effectiveKesPrice = rawKesPrice * 30
    } else if (priceModel === 'subscription_weekly') {
      effectiveKesPrice = rawKesPrice * 4.33
    } else if (priceModel === 'subscription_termly') {
      effectiveKesPrice = rawKesPrice / 3
    } else if (priceModel === 'subscription_biannual') {
      effectiveKesPrice = rawKesPrice / 6
    } else if (priceModel === 'subscription_annual') {
      effectiveKesPrice = rawKesPrice / 12
    }

    const activeModel = PRICING_MODELS.find((m) => m.id === priceModel) || PRICING_MODELS[0]

    // Pricing Assessment
    let priceVerdict: 'underpriced' | 'sweet_spot' | 'premium' = 'sweet_spot'
    if (effectiveKesPrice < benchmark.kesFloor * 1.05) {
      priceVerdict = 'underpriced'
    } else if (effectiveKesPrice > benchmark.kesSweetSpot * 1.45) {
      priceVerdict = 'premium'
    }

    // Dynamic Viability Scoring based on input depth, realism, differentiation, and domain link
    let baseScore = 74
    if (rawBrand.length >= 3 && rawBrand.length <= 22) baseScore += 4
    if (rawDesc.length > 25) baseScore += 5
    if (rawDesc.length > 70) baseScore += 4
    if (uploadedImage) baseScore += 5
    if (websiteUrl.trim().length > 5) baseScore += 4
    if (priceVerdict === 'sweet_spot') baseScore += 4
    if (targetRegion === 'global') baseScore = Math.round(baseScore * benchmark.globalUptakeFactor)
    const overallScore = Math.min(Math.max(baseScore, 68), 96)

    const uptakeRate = Math.min(Math.round(overallScore * 0.91), 94)
    const addressableShare = (Math.max(14, Math.round(overallScore * 0.24 * 10) / 10)).toFixed(1)

    // Domain Specific Extraction
    const isEd = industryId === 'education_edtech' || lowerDesc.includes('school') || lowerDesc.includes('exam') || lowerDesc.includes('kcse') || lowerDesc.includes('cbc') || lowerDesc.includes('teacher') || lowerDesc.includes('student') || lowerDesc.includes('tutor')
    const isAgri = industryId === 'agriculture_agritech' || lowerDesc.includes('farm') || lowerDesc.includes('crop') || lowerDesc.includes('produce') || lowerDesc.includes('vegetable') || lowerDesc.includes('cow') || lowerDesc.includes('dairy') || lowerDesc.includes('poultry') || lowerDesc.includes('avocado') || lowerDesc.includes('harvest')
    const isTech = industryId === 'tech_saas' || lowerDesc.includes('app') || lowerDesc.includes('software') || lowerDesc.includes('saas') || lowerDesc.includes('fintech') || lowerDesc.includes('chama') || lowerDesc.includes('pos') || lowerDesc.includes('bot')
    const isBeauty = industryId === 'beauty_cosmetics' || lowerDesc.includes('skin') || lowerDesc.includes('hair') || lowerDesc.includes('oil') || lowerDesc.includes('cream') || lowerDesc.includes('glow') || lowerDesc.includes('soap') || lowerDesc.includes('lotion')
    const isFood = industryId === 'food_dining' || lowerDesc.includes('cafe') || lowerDesc.includes('restaurant') || lowerDesc.includes('burger') || lowerDesc.includes('meal') || lowerDesc.includes('snack') || lowerDesc.includes('baking') || lowerDesc.includes('coffee')
    const isRealEstate = industryId === 'hospitality_realestate' || lowerDesc.includes('apartment') || lowerDesc.includes('airbnb') || lowerDesc.includes('house') || lowerDesc.includes('plot') || lowerDesc.includes('land') || lowerDesc.includes('villa')
    const isFashion = industryId === 'fashion_apparel' || lowerDesc.includes('cloth') || lowerDesc.includes('wear') || lowerDesc.includes('dress') || lowerDesc.includes('suit') || lowerDesc.includes('streetwear') || lowerDesc.includes('shoe')

    // Contextual Insights Generator
    let executiveVerdict = ''
    let superpower = ''
    let criticalBlindspot = ''
    let buyerPersona = { payer: '', endUser: '', trigger: '' }
    let objections: { objection: string; counter: string }[] = []
    let commercial = {
      hook: '',
      scene1Visual: '',
      proof: '',
      scene2Visual: '',
      cta: '',
      scene3Visual: '',
      voiceover: '',
      style: '',
    }
    let competitors: { name: string; flaw: string; attackAngle: string } = {
      name: benchmark.keyCompetitors.join(', '),
      flaw: '',
      attackAngle: '',
    }
    let frequencyAdvice = ''
    let recommendedAdBudget = ''
    let launchPlan: { day: string; task: string; tip: string }[] = []

    if (isEd) {
      executiveVerdict = `For an academic and educational solution like ${rawBrand}, customer willingness-to-pay in Kenya is high because parents prioritize exam outcomes above all discretionary spend. However, your biggest obstacle is not student desire—it is parent trust, syllabus authenticity (CBC/KCSE), and proof of tangible grade improvement.`
      superpower = `High emotional urgency: Parents feel acute anxiety as national exam windows approach and will pay rapidly if they see guaranteed test practice and direct WhatsApp mentor access.`
      criticalBlindspot = `Parent skepticism regarding screen time: If parents suspect the app or platform encourages aimless mobile phone browsing or lacks official KNEC syllabus rigor, churn will be rapid.`
      buyerPersona = {
        payer: 'Kenyan Parents (mothers & fathers managing school budgets) and School Administrators.',
        endUser: 'Primary & High School Candidates (Grades 6–9 CBC and Form 1–4 KCSE).',
        trigger: 'Fear of weak exam grades, frustration with high private tuition fees (KES 15K–30K/term), and WhatsApp parent group recommendations.',
      }
      objections = [
        { objection: 'Will my child use the phone to play games or watch TikTok instead of studying?', counter: 'Feature a "Parental Daily Revision SMS / WhatsApp Report" showing exact minutes and subjects studied.' },
        { objection: 'Does this match the actual current KNEC/CBC syllabus or is it foreign content?', counter: 'Display certified Kenyan subject-teacher badges and actual past-paper question tags.' },
        { objection: 'What if data bundles run out or Wi-Fi is unavailable in our home?', counter: 'Highlight lightweight offline download mode or direct SMS/WhatsApp bot revision.' },
      ]
      commercial = {
        hook: `“POV: KCSE and CBC exams are 90 days away, your child is averaging a C, and private tutors want KES 20,000 per term. Here is what smart Kenyan parents are doing instead.”`,
        scene1Visual: 'Close-up of a worried Kenyan mother reviewing a report card at the kitchen table; evening ambient lighting; smartphone screen turns on displaying the Soma / learning dashboard.',
        proof: `“With ${rawBrand}, candidates get instant step-by-step revision, past-paper breakdowns, and interactive exam hints 24/7 on WhatsApp or mobile.”`,
        scene2Visual: 'Split screen: High school candidate smiling as a tricky physics/math problem gets solved with a clear visual graphic; mother receives an automated SMS: "15 questions mastered today".',
        cta: `“Give your candidate the unfair advantage they deserve. Send 'REVISE' to our official WhatsApp right now to unlock 3 days of free practice.”`,
        scene3Visual: 'Clean branded end-card with M-Pesa Till/Paybill badge, WhatsApp CTA button, and 48-hour revision pass callout.',
        voiceover: 'Warm, reassuring Kenyan English with an authoritative mentor cadence. Calm, aspirational, and deeply credible.',
        style: 'Kinetic 2D UI screen captures combined with live-action parent/student b-roll and animated typography.',
      }
      competitors = {
        name: 'Zeraki Analytics, Eneza Education (Shupavu 291), Longhorn E-Learning, Private Tuition Tutors',
        flaw: 'Traditional textbook publishers sell static, dry PDFs that students find boring. Institutional portals cater primarily to school admin rather than direct parent-student empowerment.',
        attackAngle: 'Position as a 24/7 personal revision coach on WhatsApp that speaks the student\'s language and keeps parents in the loop.',
      }
      frequencyAdvice = priceModel === 'subscription_daily'
        ? `At ${currency === 'KES' ? `KES ${numPrice}` : `$${numPrice}`} / day, daily billing lowers the M-Pesa barrier. However, daily manual STK pushes suffer over 45% drop-off by Day 5. STRATEGY: Use the daily fee as the marketing hook ("Only KES ${numPrice}/day!"), but sell 7-Day Sprint Passes (${currency === 'KES' ? `KES ${(numPrice * 6).toLocaleString()}` : `$${numPrice * 6}`}) and Termly Passes to secure upfront cashflow.`
        : `At ${currency === 'KES' ? `KES ${numPrice.toLocaleString()}` : `$${numPrice}`} ${activeModel.short}, parents perceive this as high value compared to weekend tuition. Offer a 3-day risk-free trial that rolls into the subscription.`
      recommendedAdBudget = 'Target KES 1,200 – 2,500/day on Meta (Facebook & Instagram) targeting Parents aged 32–54 in Nairobi, Nakuru, Eldoret, Kisumu & Mombasa.'
      launchPlan = [
        { day: 'Day 1', task: 'WhatsApp Funnel Setup', tip: 'Configure WhatsApp Business catalogue and 3 auto-replies: Syllabus Breakdown, Free Trial Link, and Parent FAQ.' },
        { day: 'Day 2', task: 'Commercial Video Production', tip: 'Produce a 30s broadcast hook video demonstrating the single hardest math/science concept made simple in 15 seconds.' },
        { day: 'Day 3', task: 'Teacher Micro-Endorsements', tip: 'Seed access to 5 popular TikTok/YouTube Kenyan teachers for authentic testimonial reactions.' },
        { day: 'Day 4', task: 'Launch Meta Ads to WhatsApp', tip: 'Run video ads with "Send WhatsApp Message" objective targeting mothers interested in education.' },
        { day: 'Day 5', task: 'Parent Social Proof Broadcast', tip: 'Share a screenshot of candidate grade improvement or solved exam question to active inquirers.' },
        { day: 'Day 6', task: 'Term Pass Offer', tip: 'Introduce a limited-time termly bundle with 20% discount for the first 100 subscribers.' },
        { day: 'Day 7', task: 'CAC & Conversion Review', tip: 'Evaluate cost per WhatsApp conversation (target: < KES 65) and scale the top-performing video creative.' },
      ]
    } else if (isAgri) {
      executiveVerdict = `For an agriculture or fresh-produce brand like ${rawBrand}, the East African market is enormous, but plagued by broker exploitation and customer fear of post-harvest spoilage. Your commercial strategy must lead with visual harvest freshness, farm-gate provenance, and guaranteed pricing.`
      superpower = `Direct-to-consumer or direct-to-agrovet arbitrage: Cutting out multiple broker tiers allows you to pay farmers higher rates while offering urban buyers fresher produce at lower prices.`
      criticalBlindspot = `Cold-chain transit delays: If delivery takes longer than 12 hours or packaging bruises delicate produce, initial trial buyers will never re-order.`
      buyerPersona = {
        payer: 'Commercial Farmers, Agrovet Stockists, Nairobi estate household buyers, or Wholesale Cooperatives.',
        endUser: 'Farmers seeking yield improvement or urban households demanding verified organic produce.',
        trigger: 'Desire to bypass unreliable brokers, ensure predictable weekly earnings, and access farm-fresh goods.',
      }
      objections = [
        { objection: 'Will the produce arrive bruised or wilted after county transit?', counter: 'Demonstrate ventilated harvest crates and guaranteed 6-hour farm-to-door delivery in video.' },
        { objection: 'Are yield improvement or organic claims backed by field testing?', counter: 'Film real Kenyan farmers walking through their fields showing harvest volume and measuring tape proof.' },
        { objection: 'Will payments be delayed for 30–60 days like traditional supermarket brokers?', counter: 'Promote instant M-Pesa settlement upon harvest verification.' },
      ]
      commercial = {
        hook: `“Stop letting middlemen take 40% of your farm earnings at the gate. Here is how Kenyan agricultural producers are selling direct with ${rawBrand}.”`,
        scene1Visual: 'Morning golden hour over a lush Kenyan farm; dew on vibrant produce; broker driving away leaving farmer underpaid and frustrated.',
        proof: `“With ${rawBrand}, verified harvest quality connects directly to high-paying urban buyers with guaranteed transparent pricing and same-day M-Pesa.”`,
        scene2Visual: 'Farmer inspecting crisp harvest; tapping WhatsApp confirmation; instant M-Pesa payment alert pops up on screen; produce loaded into branded clean crates.',
        cta: `“Take control of your agricultural profits today. Tap the link or message our WhatsApp team to list your harvest.”`,
        scene3Visual: 'Branded delivery van, WhatsApp contact number, and verified agricultural quality seal.',
        voiceover: 'Grounded, respectful Swahili or authentic Kenyan English with genuine agricultural warmth and authority.',
        style: 'Cinematic 4K outdoor macro shots, vibrant soil and foliage contrasts, and authentic documentary field footage.',
      }
      competitors = {
        name: 'Twiga Foods, Selina Wamucii, Regional Commodity Brokers, Wakulima / Marikiti Open Markets',
        flaw: 'Brokers delay payouts by up to 30 days and arbitrarily downgrade quality grades upon delivery. Open markets lack consistency.',
        attackAngle: 'Guaranteed instant M-Pesa payouts, transparent grading standards, and direct WhatsApp booking.',
      }
      frequencyAdvice = priceModel === 'subscription_daily'
        ? `A daily fee of ${currency === 'KES' ? `KES ${numPrice}` : `$${numPrice}`} fits daily market collection fees. Bundle into weekly harvest cycles.`
        : `At ${currency === 'KES' ? `KES ${numPrice.toLocaleString()}` : `$${numPrice}`} ${activeModel.short}, ensure your unit margin covers transport and crate loss. Minimum order size should be KES 1,500 to absorb courier costs.`
      recommendedAdBudget = 'Target KES 1,000 – 2,000/day on Facebook & TikTok targeting estate communities in Kilimani, Westlands, Kileleshwa, and Karen.'
      launchPlan = [
        { day: 'Day 1', task: 'Farm-Gate Harvest Audit', tip: 'Record 3 raw video clips directly on the farm showing produce quality and harvest handling.' },
        { day: 'Day 2', task: 'Produce 30s Commercial', tip: 'Assemble a cinematic commercial contrasting broker deductions vs direct farm-gate freshness.' },
        { day: 'Day 3', task: 'WhatsApp Ordering Channel', tip: 'Post a fresh weekly harvest price list on WhatsApp Status and broadcast to estate groups.' },
        { day: 'Day 4', task: 'Sample Basket Seeding', tip: 'Send 3 sample produce baskets to neighborhood food creators or community leaders for unboxing videos.' },
        { day: 'Day 5', task: 'Launch Paid Meta Ads', tip: 'Target residential estate radiuses with "Fresh Farm Delivery to Your Door Tomorrow Morning".' },
        { day: 'Day 6', task: 'Delivery Proof Reel', tip: 'Post customer delivery unboxing reactions on Instagram Reels and TikTok.' },
        { day: 'Day 7', task: 'Repeat Subscriber Offer', tip: 'Introduce a weekly recurring vegetable/fruit box discount for standing orders.' },
      ]
    } else if (isTech) {
      executiveVerdict = `For a tech platform or software solution like ${rawBrand}, the East African market is rapidly adopting mobile-first tools, but customers resist friction. If your onboarding takes more than 2 minutes or requires a desktop computer, drop-off will exceed 70%.`
      superpower = `Frictionless M-Pesa integration & mobile responsiveness: Businesses want software that works seamlessly on WhatsApp or their smartphone without complex training.`
      criticalBlindspot = `Perceived setup complexity: Non-technical SME owners fear getting locked into tools they cannot independently manage.`
      buyerPersona = {
        payer: 'Kenyan SME Owners, Chama Treasurers, Operations Managers, and Solo Entrepreneurs.',
        endUser: 'Frontline staff, cashiers, field officers, or community members.',
        trigger: 'Lost inventory, manual spreadsheet chaos, missing cash tracking, and desire to automate daily repetitive tasks.',
      }
      objections = [
        { objection: 'Is my data secure and will M-Pesa payments reconcile automatically?', counter: 'Show real-time M-Pesa STK push and bank-grade encryption badges in your demo video.' },
        { objection: 'Will my staff find this too complicated to use daily?', counter: 'Showcase an intuitive 3-tap interface designed specifically for mobile screens.' },
        { objection: 'What if we need support when a glitch occurs during business hours?', counter: 'Promote dedicated Nairobi-based WhatsApp priority support.' },
      ]
      commercial = {
        hook: `“Running a business in Kenya shouldn't mean losing hours every night balancing chaotic notebooks and manual M-Pesa statements. Meet ${rawBrand}.”`,
        scene1Visual: 'Frustrated SME owner surrounded by receipts, calculator, and ringing phones late at night in a Nairobi shop.',
        proof: `“With ${rawBrand}, sales, inventory, and customer payments reconcile automatically in real time right from your phone.”`,
        scene2Visual: 'Customer taps phone to pay via M-Pesa; instant green checkmark appears on ${rawBrand} mobile dashboard; owner smiles with automated daily summary.',
        cta: `“Start your 14-day free trial today. Tap the link or WhatsApp our onboarding team to get set up in 5 minutes.”`,
        scene3Visual: 'Sleek smartphone mockup displaying the live app interface with WhatsApp signup button.',
        voiceover: 'Confident, crisp Kenyan professional voice. Tech-forward, modern, and pragmatic.',
        style: 'Kinetic UI motion graphics, dynamic screen flows, and clean split-screen demonstrations.',
      }
      competitors = {
        name: 'Zoho Local Partners, Kopokopo, QuickBooks Online, Custom-Built Local Web Portals',
        flaw: 'Foreign tools require credit cards, lack native M-Pesa reconciliation, and offer slow offshore email support.',
        attackAngle: '100% mobile-first, native M-Pesa integration, and instant local WhatsApp onboarding.',
      }
      frequencyAdvice = `At ${currency === 'KES' ? `KES ${numPrice.toLocaleString()}` : `$${numPrice}`} ${activeModel.short}, software pricing is viable. Offer annual prepayments with 2 months free to boost upfront annual recurring revenue (ARR).`
      recommendedAdBudget = 'Target KES 1,500 – 3,000/day on LinkedIn and Meta targeting Business Page Admins and SME Owners in Kenya.'
      launchPlan = [
        { day: 'Day 1', task: 'Onboarding Screen Recording', tip: 'Record a 45-second screen recording showing a complete transaction completed in under 30 seconds.' },
        { day: 'Day 2', task: 'Produce 30s Commercial Video', tip: 'Assemble a high-impact commercial contrasting spreadsheet chaos with automated dashboard peace of mind.' },
        { day: 'Day 3', task: 'Case Study Graphic', tip: 'Design a single carousel showing: "How Shop X saved 12 hours a week with ${rawBrand}".' },
        { day: 'Day 4', task: 'Launch Founder Direct Outreach', tip: 'Reach out to 25 target SME owners on WhatsApp with a personalized 30s loom/screen demo.' },
        { day: 'Day 5', task: 'Run Meta B2B Video Campaign', tip: 'Target retail, service, and fintech business owners with a direct "Book a Demo" CTA.' },
        { day: 'Day 6', task: 'Free Migration Offer', tip: 'Offer free data import from Excel/notebooks for the first 50 business signups.' },
        { day: 'Day 7', task: 'Conversion Sprint Review', tip: 'Analyze trial-to-paid conversion rate (target: > 18%) and optimize the onboarding sequence.' },
      ]
    } else {
      // Universal High-Value Commercial Architecture for Beauty, Food, Fashion, Real Estate & General
      executiveVerdict = `For ${rawBrand} in ${benchmark.name}, your brand has strong digital viability because visual appeal and social proof are the primary conversion drivers on Instagram, TikTok, and WhatsApp. To win, your messaging must emphasize authentic product quality, verified customer proof, and frictionless delivery.`
      superpower = `High visual desirability: Products in this category command immediate purchase impulse when presented with high-production video and clear lifestyle positioning.`
      criticalBlindspot = `Generic positioning: If your branding looks like an unverified drop-shipping product or lacks clear local brand authority, shoppers will hesitate to transfer funds.`
      buyerPersona = {
        payer: 'Urban aspirational consumers, diaspora shoppers, and professionals seeking premium quality.',
        endUser: 'Individuals upgrading their personal lifestyle, wellness, or wardrobe.',
        trigger: 'Visual social proof, influencer endorsements, and desire for premium self-expression.',
      }
      objections = [
        { objection: 'Is the quality genuinely as good as the photos and videos depict?', counter: 'Use unedited 4K macro video footage showing texture, packaging finish, and real customer reactions.' },
        { objection: 'What happens if delivery is delayed or I need customer support?', counter: 'Promote same-day Nairobi delivery and instant WhatsApp tracking.' },
        { objection: 'Why should I choose this over established supermarket or imported alternatives?', counter: 'Emphasize superior natural ingredients, custom bespoke craftsmanship, and local community pride.' },
      ]
      commercial = {
        hook: `“Tired of generic products that overpromise and underdeliver? Discover why ${rawBrand} is turning heads across Nairobi.”`,
        scene1Visual: 'Cinematic slow-motion product reveal with dramatic lighting, reflections, and premium color grading.',
        proof: `“Crafted with premium standards and verified by hundreds of happy customers, ${rawBrand} delivers exceptional quality you can see and feel.”`,
        scene2Visual: 'Customer using the product with visible delight; macro close-up of craftsmanship, ingredients, and flawless finish.',
        cta: `“Upgrade your experience today. Tap the link or order directly via WhatsApp for same-day delivery.”`,
        scene3Visual: 'Branded callout card with package, WhatsApp order button, and satisfaction guarantee badge.',
        voiceover: 'Sophisticated, energetic, and contemporary voiceover reflecting modern East African lifestyle aesthetics.',
        style: 'High-end commercial lighting, 60fps slow-motion macro shots, and kinetic typography.',
      }
      competitors = {
        name: benchmark.keyCompetitors.join(', '),
        flaw: 'Mass-market competitors rely on generic corporate advertising and impersonal retail channels.',
        attackAngle: 'Direct, personal customer relationship via WhatsApp, authentic local storytelling, and agile product iteration.',
      }
      frequencyAdvice = `At ${currency === 'KES' ? `KES ${numPrice.toLocaleString()}` : `$${numPrice}`} ${activeModel.short}, you are well positioned in the market. Create 2-pack or 3-pack bundles to increase average order value (AOV) and absorb Nairobi delivery fees.`
      recommendedAdBudget = 'Target KES 1,000 – 2,000/day on Instagram Reels and TikTok Ads targeting lifestyle consumers in Nairobi, Mombasa, and regional urban hubs.'
      launchPlan = [
        { day: 'Day 1', task: 'Product Photography & Macro Video', tip: 'Capture 5 high-resolution macro video clips highlighting product textures, labels, and packaging.' },
        { day: 'Day 2', task: 'Produce 30s Commercial', tip: 'Create an engaging commercial combining hook, product demonstration, and WhatsApp order CTA.' },
        { day: 'Day 3', task: 'WhatsApp Catalog Setup', tip: 'List all items with clear pricing, variant descriptions, and payment guidelines.' },
        { day: 'Day 4', task: 'Micro-Influencer Gifting', tip: 'Send 3 curated packages to aligned creators for organic unboxing stories.' },
        { day: 'Day 5', task: 'Launch Paid Video Ads', tip: 'Run Instagram Reels ads with direct WhatsApp click-to-chat messaging.' },
        { day: 'Day 6', task: 'Urgency & Free Delivery Promo', tip: 'Offer free delivery within Nairobi for all orders placed in the next 48 hours.' },
        { day: 'Day 7', task: 'Repeat Purchase Re-engagement', tip: 'Message initial buyers for reviews and offer a 10% loyalty discount on their next order.' },
      ]
    }

    // Storefront & Domain Link Semantic Audit
    const cleanUrl = websiteUrl.trim()
    let websiteAudit = {
      type: 'missing',
      statusLabel: 'No Digital Link Provided',
      badgeColor: 'amber',
      insight: 'Operating without a digital destination reduces buyer trust by ~38% in modern African and global commerce. Even a direct WhatsApp Business catalog shortlink (wa.me/254...) provides a tangible buying destination.',
      recommendation: 'Register an official .co.ke or .com domain, or generate a free WhatsApp Business shortlink to capture commercial ad traffic.',
      trustScore: 45,
    }

    if (cleanUrl) {
      const lowerUrl = cleanUrl.toLowerCase()
      if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com')) {
        websiteAudit = {
          type: 'whatsapp',
          statusLabel: 'Direct WhatsApp Conversational Storefront',
          badgeColor: 'emerald',
          insight: `Direct WhatsApp links (${cleanUrl}) boast the highest impulse closing rates in East Africa (over 65% of Kenyan digital purchases close in WhatsApp chats). However, manual response delays during paid ad surges cause up to 40% lead drop-off.`,
          recommendation: 'Implement an automated welcome catalog with Nia Media’s WhatsApp Brief Bot to instantly qualify buyers and issue M-Pesa Till/Paybill prompts 24/7.',
          trustScore: 82,
        }
      } else if (lowerUrl.includes('instagram.com') || lowerUrl.includes('tiktok.com') || lowerUrl.includes('facebook.com')) {
        websiteAudit = {
          type: 'social',
          statusLabel: 'Social Media Bio Storefront',
          badgeColor: 'purple',
          insight: `Social profile destinations (${cleanUrl}) offer great visual proof and viral discovery. However, social friction is high: users landing on profiles often get sidetracked by notifications before completing an order.`,
          recommendation: 'Place a dedicated single-link checkout or WhatsApp order link in your bio instead of generic "DM to order" friction.',
          trustScore: 78,
        }
      } else if (lowerUrl.includes('.co.ke') || lowerUrl.includes('.ke') || lowerUrl.includes('.com') || lowerUrl.includes('.africa') || lowerUrl.includes('.org') || lowerUrl.includes('.io') || lowerUrl.includes('.store')) {
        websiteAudit = {
          type: 'custom_domain',
          statusLabel: 'Dedicated Web / E-Commerce Domain',
          badgeColor: 'teal',
          insight: `Having an official domain (${cleanUrl}) delivers high brand equity and opens doors for international corporate clients and diaspora buyers.`,
          recommendation: 'Ensure your mobile checkout supports instant M-Pesa Daraja STK Push and loads under 2 seconds on Safaricom 4G networks.',
          trustScore: 94,
        }
      } else {
        websiteAudit = {
          type: 'other_link',
          statusLabel: 'Digital Product Link',
          badgeColor: 'blue',
          insight: `Detected digital link: ${cleanUrl}. Digital direct response links allow accurate tracking of cost-per-acquisition (CPA).`,
          recommendation: 'Ensure tracking pixels (Meta Pixel / Google Tag) are active on this URL to retarget visitors who do not buy on day 1.',
          trustScore: 80,
        }
      }
    }

    // Cross-Frequency Subscription Modeling
    const baseMonthlyNormalized = (
      priceModel === 'subscription_daily' ? numPrice * 30
      : priceModel === 'subscription_weekly' ? numPrice * 4.33
      : priceModel === 'subscription_termly' ? numPrice / 3
      : priceModel === 'subscription_biannual' ? numPrice / 6
      : priceModel === 'subscription_annual' ? numPrice / 12
      : numPrice
    )

    const subscriptionMatrix = [
      {
        frequency: 'Daily Pass (Micro-billing)',
        cadence: 'Billed daily or on-demand',
        price: Math.max(1, Math.round(baseMonthlyNormalized / 20)),
        savings: 'Entry hook',
        churnRisk: 'High (45-60%) due to daily M-Pesa PIN prompt fatigue',
        retentionTactic: 'Convert daily users into 7-Day Sprint Passes by Day 3 with bonus revision/content unlock.'
      },
      {
        frequency: 'Weekly Sprint (7 Days)',
        cadence: 'Billed every 7 days',
        price: Math.max(1, Math.round(baseMonthlyNormalized / 3.6)),
        savings: 'Save ~25% vs daily',
        churnRisk: 'Medium (25-35%)',
        retentionTactic: 'Send Day 5 milestone recap SMS highlighting progress before the renewal prompt.'
      },
      {
        frequency: 'Monthly Standard',
        cadence: 'Billed every 30 days',
        price: Math.max(1, Math.round(baseMonthlyNormalized)),
        savings: 'Standard baseline',
        churnRisk: 'Moderate (12-18%)',
        retentionTactic: 'Incentivize auto-renewal STK push with a 5% loyalty cashback or monthly masterclass.'
      },
      {
        frequency: 'Termly / Quarterly (3 Months)',
        cadence: 'Billed every 90 days',
        price: Math.max(1, Math.round(baseMonthlyNormalized * 2.55)),
        savings: 'Save 15% (Best cashflow)',
        churnRisk: 'Very Low (< 8% during active term)',
        retentionTactic: 'Sync with Kenyan school term dates (Jan, May, Sept) or quarterly business planning.'
      },
      {
        frequency: 'Semi-Annual (6 Months)',
        cadence: 'Billed every 6 months',
        price: Math.max(1, Math.round(baseMonthlyNormalized * 4.8)),
        savings: 'Save 20%',
        churnRisk: 'Low (< 5%)',
        retentionTactic: 'Dedicated onboarding check-in call and seasonal content/inventory priority.'
      },
      {
        frequency: 'Annual Membership (12 Months)',
        cadence: 'Billed yearly (Lump-sum)',
        price: Math.max(1, Math.round(baseMonthlyNormalized * 9.0)),
        savings: 'Pay for 9 months, get 12 (Save 25%)',
        churnRisk: 'Lowest churn, locks in 12-month LTV upfront',
        retentionTactic: 'VIP WhatsApp channel, zero downtime guarantee, and 1-on-1 strategy review.'
      },
    ]

    const fullReportText = `=====================================================
NIA MEDIA — STRATEGIC BRAND & MARKET INTELLIGENCE DOSSIER
=====================================================
Brand: ${rawBrand}
Industry: ${benchmark.name}
Domain / Digital Storefront: ${websiteUrl.trim() || 'None provided'} (${websiteAudit.statusLabel})
Proposed Price: ${currency === 'KES' ? `KES ${numPrice.toLocaleString()}` : `$${numPrice}`} ${activeModel.short} (${activeModel.label})
Market Viability Score: ${overallScore} / 100
Customer Uptake Probability: ${uptakeRate}%
Est. Addressable Market Share: ${addressableShare}%

-----------------------------------------------------
1. EXECUTIVE STRATEGIC VERDICT
-----------------------------------------------------
${executiveVerdict}

BRAND SUPERPOWER (UNFAIR ADVANTAGE):
${superpower}

CRITICAL BLINDSPOT / FATAL OBJECTION:
${criticalBlindspot}

-----------------------------------------------------
2. WHO WE SELL TO, WHY, HOW, WHEN (BUYER INTELLIGENCE)
-----------------------------------------------------
WHO DO WE SELL TO (ICP & DEMOGRAPHICS):
- Ideal Customer Profile: ${benchmark.audience.who.icp}
- Age & Life Stage: ${benchmark.audience.who.ageBracket}
- Income Bracket: ${benchmark.audience.who.incomeBracket}
- Key Decision Makers: ${benchmark.audience.who.decisionMakers}
- Geographic Hubs: ${benchmark.audience.who.geoHubs}
- Device & Media Habits: ${benchmark.audience.who.deviceHabits}

WHY DO THEY BUY (PSYCHOLOGICAL & ECONOMIC DRIVERS):
- Functional Job-to-be-Done: ${benchmark.audience.why.functionalJob}
- Emotional Relief: ${benchmark.audience.why.emotionalRelief}
- Social Status Signal: ${benchmark.audience.why.socialStatus}
- Cost of Inaction: ${benchmark.audience.why.costOfInaction}

HOW DO THEY BUY (CONVERSION CHANNELS & TRUST):
- Primary Discovery Channels: ${benchmark.audience.how.primaryChannels}
- Payment Mechanism: ${benchmark.audience.how.paymentFlow}
- Trust Signals Required: ${benchmark.audience.how.trustSignalsNeeded}

WHEN DO THEY BUY (SEASONALITY & CASHFLOW TIMING):
- Monthly Payroll Cycle: ${benchmark.audience.when.monthlyPayrollCycle}
- Seasonal Peaks: ${benchmark.audience.when.seasonalPeak}
- Weekly Peak Buying Hours: ${benchmark.audience.when.weeklyBuyingHours}

-----------------------------------------------------
3. COMPETITOR WARFARE & DISTRIBUTION MOATS
-----------------------------------------------------
NAMED MARKET INCUMBENTS & HOW THEY WIN:
${benchmark.competitorProfiles.map((c, i) => `
[Competitor ${i + 1}: ${c.name}] (${c.marketTier})
- How They Win The Market (Moat): ${c.howTheyWin}
- Their Critical Vulnerability: ${c.vulnerability}
- Recommended Attack Angle: ${c.attackAngle}
`).join('')}

TOP BUYING OBJECTIONS & PROVEN REBUTTALS:
${objections.map((o, i) => `
[Objection ${i + 1}]: "${o.objection}"
Rebuttal in Video / Ad: ${o.counter}
`).join('')}

-----------------------------------------------------
4. DIGITAL STOREFRONT & WEBSITE CONVERSION AUDIT (CRO)
-----------------------------------------------------
Submitted URL Diagnostic:
- Status: ${websiteAudit.statusLabel} (Trust Score: ${websiteAudit.trustScore}/100)
- Strategic Analysis: ${websiteAudit.insight}
- Actionable Recommendation: ${websiteAudit.recommendation}

Mobile Speed & Performance Benchmark:
- ${benchmark.croPlaybook.speedBenchmark}
- Target: Under 1.8s page load on Safaricom 4G/3G mobile networks.

M-Pesa Checkout Architecture (STK Push vs Manual Paybill):
- ${benchmark.croPlaybook.checkoutRequirement}
- Critical Insight: Manual Paybill numbers lose ~42% of buyers at checkout. Always use automated Daraja STK Push.

Above-The-Fold Wireframe Blueprint:
- ${benchmark.croPlaybook.aboveTheFoldMustHave}

Tracking Pixels & Retargeting:
- ${benchmark.croPlaybook.pixelsAndTracking}

-----------------------------------------------------
5. 30-SECOND COMMERCIAL SCRIPT CONCEPT & STORYBOARD
-----------------------------------------------------
Recommended Style: ${benchmark.croPlaybook.recommendedVideoType}
Voiceover Cadence: ${commercial.voiceover}
Production Visuals: ${commercial.style}

[00:00 - 00:05 Hook]:
${commercial.hook}
Visual: ${commercial.scene1Visual}

[00:05 - 00:20 Demonstration & Proof]:
${commercial.proof}
Visual: ${commercial.scene2Visual}

[00:20 - 00:30 Direct CTA]:
${commercial.cta}
Visual: ${commercial.scene3Visual}

-----------------------------------------------------
6. PRICING & UNIT ECONOMICS
-----------------------------------------------------
- Assessment: ${priceVerdict.toUpperCase()}
- Frequency Advice: ${frequencyAdvice}
- Recommended Daily Ad Budget: ${recommendedAdBudget}

CROSS-FREQUENCY SUBSCRIPTION MATRIX:
${subscriptionMatrix.map(s => `- ${s.frequency}: ${currency === 'KES' ? 'KES ' : '$'}${s.price} (${s.savings}) | Churn Risk: ${s.churnRisk} | Retention: ${s.retentionTactic}`).join('\n')}

-----------------------------------------------------
7. 7-DAY GO-TO-MARKET EXECUTION ROADMAP
-----------------------------------------------------
${launchPlan.map((l) => `${l.day} (${l.task}): ${l.tip}`).join('\n')}

=====================================================
Produced by Nia Media Brand & Commercial Studio
https://niamedia.org
=====================================================`.trim()

    return {
      priceVerdict,
      overallScore,
      uptakeRate,
      addressableShare,
      activeModel,
      effectiveKesPrice,
      executiveVerdict,
      superpower,
      criticalBlindspot,
      buyerPersona,
      objections,
      commercial,
      competitors,
      audience: benchmark.audience,
      competitorProfiles: benchmark.competitorProfiles,
      croPlaybook: benchmark.croPlaybook,
      frequencyAdvice,
      recommendedAdBudget,
      launchPlan,
      websiteAudit,
      subscriptionMatrix,
      baseMonthlyNormalized,
      fullReportText,
    }
  }, [priceInput, currency, priceModel, benchmark, brandName, productDesc, uploadedImage, targetRegion, websiteUrl])

  // Copy Brief to Clipboard
  const handleCopyReport = () => {
    navigator.clipboard.writeText(diagnostics.fullReportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

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

  // Open Consultation Booking (Cal.com or WhatsApp fallback)
  const handleBookConsultation = () => {
    const url = getBookingUrl('consultation')
    if (url && url !== 'https://cal.com') {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      navigate('/book?service=consultation')
    }
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

              {/* Product / Service / Store URL */}
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} className="text-purple-400" />
                    <span>Product, Service or Store Link (URL)</span>
                  </span>
                  <span className="text-[10px] text-white/40 font-normal lowercase">optional · website, social or wa.me</span>
                </label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="e.g. https://mybrand.co.ke, instagram.com/brand, or wa.me/2547..."
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400 transition-all font-normal"
                  />
                </div>
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

              {/* Guest Quota & Token Abuse Protection Indicator */}
              {!isAuthenticated ? (
                <div className="flex items-center justify-between text-[11px] text-white/60 bg-white/[0.03] border border-white/10 px-3.5 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-amber-400 shrink-0" />
                    <span>Free Guest Quota: <strong>1 Full Brand Analysis</strong></span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                    {parseInt(localStorage.getItem('nia_guest_brand_test_count') || '0', 10) >= 1 ? '1/1 Used (Sign In to Retest)' : '1 Free Test Available'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/20 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Member Mode: <strong>Unlimited Brand Tests &amp; PDF Exports Active</strong></span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                    Pro Verified
                  </span>
                </div>
              )}

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
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white">Running Strategic Brand Diagnostic...</h3>
                  <p className="text-xs text-purple-300 font-medium animate-pulse">
                    {analysisStage}
                  </p>
                  <p className="text-[11px] text-white/40">
                    Benchmarking {brandName || 'Brand'} in {benchmark.name} ({targetRegion === 'global' ? 'International / Global Markets' : 'East Africa & Kenya'}).
                  </p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-amber-400 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Deep Diagnostic Report Output */
              <div className="space-y-5">
                {/* Header Score Card Banner */}
                <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-purple-900/50 via-[#12082b] to-[#07050d] border border-purple-500/30 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                          DIAGNOSTIC BENCHMARK REPORT
                        </span>
                        <span className="text-[10px] font-bold text-white/50">
                          {benchmark.name}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
                        {brandName}
                      </h3>
                      <p className="text-xs text-purple-200/80 mt-0.5">
                        Proposed: <strong className="text-white">{currency === 'KES' ? `KES ${Number(priceInput).toLocaleString()}` : `$${priceInput}`}</strong> {diagnostics.activeModel.short} · {targetRegion === 'global' ? 'Global Export' : 'East Africa'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                          {diagnostics.overallScore}
                        </span>
                        <span className="text-[11px] text-white/50 block font-medium">/ 100 Viability</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <Award size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Badges Strip */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/90 font-semibold">
                        Uptake Probability: <strong className="text-emerald-300">{diagnostics.uptakeRate}%</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/90 font-semibold">
                        Addressable Share: <strong className="text-purple-300">{diagnostics.addressableShare}%</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/90 font-semibold">
                        Typical Margins: <strong className="text-amber-300">{benchmark.typicalMargin}</strong>
                      </span>
                    </div>

                    {/* Header Quick Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyReport}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Copy full strategic report as plain text"
                      >
                        {copied ? (
                          <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-300 font-bold">Brief Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} className="text-purple-300" />
                            <span>Copy Brief</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadFile}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 text-teal-200 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Download complete offline markdown dossier (.md)"
                      >
                        <FileText size={13} className="text-teal-300" />
                        <span>Download Dossier (.md)</span>
                        {!isAuthenticated && <Lock size={11} className="text-amber-300 ml-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={handlePdfDownload}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-white flex items-center gap-1.5 transition-all cursor-pointer"
                        title={isAuthenticated ? 'Export full report as PDF' : 'Sign in required to export PDF'}
                      >
                        <Printer size={13} className="text-purple-300" />
                        <span>Export PDF</span>
                        {!isAuthenticated && <Lock size={11} className="text-amber-300 ml-0.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report Navigation Tabs - 5 Strategic Pillars */}
                <div className="flex items-center gap-1 bg-white/[0.04] p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('who_why_when')}
                    className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'who_why_when'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Users size={14} />
                    <span>Who, Why &amp; When</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('competitors')}
                    className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'competitors'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Target size={14} />
                    <span>Competitor Warfare</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('storefront')}
                    className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'storefront'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Globe size={14} />
                    <span>Website &amp; CRO Audit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('commercial')}
                    className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'commercial'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Film size={14} />
                    <span>30s Video Script</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('roadmap')}
                    className={`flex-1 min-w-[135px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'roadmap'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <BarChart3 size={14} />
                    <span>Economics &amp; Plan</span>
                  </button>
                </div>

                {/* TAB 1: WHO WE SELL TO, WHY, HOW, WHEN (BUYER INTELLIGENCE) */}
                {activeTab === 'who_why_when' && (
                  <div className="space-y-4">
                    {/* Primary Buyer Profile Header */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-emerald-400" />
                          <h4 className="font-extrabold text-sm text-white">Target Buyer Persona &amp; Decision-Making Unit</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          ICP Demographics
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">Primary Payer (Who Signs Off)</span>
                          <p className="font-bold text-white text-sm">{diagnostics.buyerPersona.payer}</p>
                          <p className="text-[11px] text-white/60 mt-1">Authority: {benchmark.audience.who.decisionMakers}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                          <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider">End Beneficiary / User</span>
                          <p className="font-bold text-white text-sm">{diagnostics.buyerPersona.endUser}</p>
                          <p className="text-[11px] text-white/60 mt-1">Life Stage: {benchmark.audience.who.ageBracket}</p>
                        </div>
                      </div>

                      {/* Purchasing Power & Hubs Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                          <span className="text-[10px] font-bold text-purple-300 uppercase block mb-0.5">Income Bracket</span>
                          <p className="text-white font-medium text-[11px]">{benchmark.audience.who.incomeBracket}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                          <span className="text-[10px] font-bold text-purple-300 uppercase block mb-0.5">Geographic Hubs</span>
                          <p className="text-white font-medium text-[11px]">{benchmark.audience.who.geoHubs}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                          <span className="text-[10px] font-bold text-purple-300 uppercase block mb-0.5">Device &amp; Media Habits</span>
                          <p className="text-white font-medium text-[11px]">{benchmark.audience.who.deviceHabits}</p>
                        </div>
                      </div>
                    </div>

                    {/* WHY THEY BUY: Jobs To Be Done & Emotional Relievers */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3.5">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-400" />
                        <h4 className="font-extrabold text-sm text-white">Why They Buy: Psychological &amp; Economic Drivers</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                          <span className="text-amber-300 block text-[10px] uppercase font-bold tracking-wider">Functional Job-to-be-Done</span>
                          <p className="text-white/90 leading-relaxed">{benchmark.audience.why.functionalJob}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                          <span className="text-emerald-300 block text-[10px] uppercase font-bold tracking-wider">Emotional Relief</span>
                          <p className="text-white/90 leading-relaxed">{benchmark.audience.why.emotionalRelief}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                          <span className="text-purple-300 block text-[10px] uppercase font-bold tracking-wider">Social Status Signal</span>
                          <p className="text-white/90 leading-relaxed">{benchmark.audience.why.socialStatus}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                          <span className="text-rose-300 block text-[10px] uppercase font-bold tracking-wider">Cost of Inaction (Status Quo)</span>
                          <p className="text-rose-100/90 leading-relaxed">{benchmark.audience.why.costOfInaction}</p>
                        </div>
                      </div>
                    </div>

                    {/* HOW & WHEN THEY BUY: Channels, M-Pesa & Seasonal Timing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* How They Buy */}
                      <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3">
                        <div className="flex items-center gap-2 text-teal-400">
                          <Smartphone size={16} />
                          <h5 className="font-bold text-xs uppercase tracking-wider text-white">How They Buy (Channels &amp; Payments)</h5>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                            <span className="text-white/50 block text-[10px] uppercase font-bold">Discovery Channels</span>
                            <p className="text-white/90 font-medium">{benchmark.audience.how.primaryChannels}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                            <span className="text-white/50 block text-[10px] uppercase font-bold">East Africa Payment Flow</span>
                            <p className="text-emerald-300 font-medium">{benchmark.audience.how.paymentFlow}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                            <span className="text-white/50 block text-[10px] uppercase font-bold">Trust Signals Required</span>
                            <p className="text-amber-200 font-medium">{benchmark.audience.how.trustSignalsNeeded}</p>
                          </div>
                        </div>
                      </div>

                      {/* When They Buy */}
                      <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-400">
                          <Clock size={16} />
                          <h5 className="font-bold text-xs uppercase tracking-wider text-white">When They Buy (Cashflow &amp; Timing)</h5>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                            <span className="text-white/50 block text-[10px] uppercase font-bold">Monthly Payroll Cycle</span>
                            <p className="text-white/90 font-medium">{benchmark.audience.when.monthlyPayrollCycle}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                            <span className="text-white/50 block text-[10px] uppercase font-bold">Seasonal Spending Peaks</span>
                            <p className="text-purple-300 font-medium">{benchmark.audience.when.seasonalPeak}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                            <span className="text-white/50 block text-[10px] uppercase font-bold">Weekly Peak Buying Hours</span>
                            <p className="text-teal-300 font-medium">{benchmark.audience.when.weeklyBuyingHours}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: COMPETITOR WARFARE & DISTRIBUTION MOATS */}
                {activeTab === 'competitors' && (
                  <div className="space-y-4">
                    {/* Incumbent Battlecards Grid */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Target size={18} className="text-purple-400" />
                          <h4 className="font-extrabold text-sm text-white">Named Competitor Battlecards &amp; Attack Angles</h4>
                        </div>
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-400/20">
                          Market Warfare
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {benchmark.competitorProfiles.map((comp, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-black text-xs flex items-center justify-center border border-purple-500/30">
                                  {idx + 1}
                                </span>
                                <h5 className="font-bold text-sm text-white">{comp.name}</h5>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70">
                                {comp.marketTier}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                <span className="text-white/40 block text-[10px] font-bold uppercase">How They Win (Moat)</span>
                                <p className="text-white/80 leading-relaxed text-[11px]">{comp.howTheyWin}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                                <span className="text-amber-400 block text-[10px] font-bold uppercase">Their Vulnerability / Flaw</span>
                                <p className="text-amber-100/90 leading-relaxed text-[11px]">{comp.vulnerability}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                                <span className="text-emerald-400 block text-[10px] font-bold uppercase">Your Recommended Attack Angle</span>
                                <p className="text-emerald-200 leading-relaxed text-[11px] font-medium">{comp.attackAngle}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top 3 Objections & Rebuttals */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-400" />
                        <h4 className="font-extrabold text-sm text-white">Top Buying Objections &amp; How To Rebut Them In Ads</h4>
                      </div>

                      <div className="space-y-2.5">
                        {diagnostics.objections.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-xs">
                            <p className="font-bold text-rose-300">
                              ❓ Objection {idx + 1}: “{item.objection}”
                            </p>
                            <p className="text-white/80 bg-white/5 p-2 rounded-lg border border-white/5">
                              💡 <strong>Rebuttal in Video / Ad:</strong> {item.counter}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DIGITAL STOREFRONT & WEBSITE OPTIMIZATION (CRO AUDIT) */}
                {activeTab === 'storefront' && (
                  <div className="space-y-4">
                    {/* Submitted URL Diagnostic Box */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe size={18} className="text-teal-400" />
                          <h4 className="font-extrabold text-sm text-white">Submitted Storefront / Domain Audit</h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          diagnostics.websiteAudit.badgeColor === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : diagnostics.websiteAudit.badgeColor === 'teal'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                            : diagnostics.websiteAudit.badgeColor === 'purple'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}>
                          {diagnostics.websiteAudit.statusLabel}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2 text-xs">
                        {websiteUrl.trim() && (
                          <div className="flex items-center gap-2 text-purple-300 font-mono text-[11px] pb-1.5 border-b border-white/5">
                            <ExternalLink size={12} className="shrink-0" />
                            <a
                              href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-white truncate"
                            >
                              {websiteUrl}
                            </a>
                            <span className="ml-auto text-[10px] text-white/50">Trust Score: {diagnostics.websiteAudit.trustScore}/100</span>
                          </div>
                        )}
                        <p className="text-white/80 leading-relaxed">
                          {diagnostics.websiteAudit.insight}
                        </p>
                        <div className="pt-2 flex items-start gap-2 text-emerald-300 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
                          <p className="text-xs font-medium leading-relaxed">
                            <strong>Immediate Action:</strong> {diagnostics.websiteAudit.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CRO Pillars Grid: Speed, M-Pesa STK, Wireframe & Pixels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Mobile Speed & Performance */}
                      <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-amber-300">
                          <Zap size={16} />
                          <h5 className="font-bold uppercase tracking-wider text-white">Mobile Speed Benchmark</h5>
                        </div>
                        <p className="text-white/80 leading-relaxed">
                          {benchmark.croPlaybook.speedBenchmark}
                        </p>
                        <div className="p-2.5 rounded-lg bg-black/30 text-[11px] text-white/60 space-y-1">
                          <p>⚡ <strong>Target:</strong> Under 1.8s page load on Safaricom 4G/3G mobile networks.</p>
                          <p>📦 Use WebP image compression to keep total page weight under 1.2MB.</p>
                        </div>
                      </div>

                      {/* M-Pesa STK Push Checkout */}
                      <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Smartphone size={16} />
                          <h5 className="font-bold uppercase tracking-wider text-white">M-Pesa STK Push Checkout</h5>
                        </div>
                        <p className="text-white/80 leading-relaxed">
                          {benchmark.croPlaybook.checkoutRequirement}
                        </p>
                        <div className="p-2.5 rounded-lg bg-black/30 text-[11px] text-emerald-300 space-y-1">
                          <p>💡 Manual Paybill numbers lose ~42% of buyers at checkout due to app-switching.</p>
                          <p>Always integrate Daraja API 1-tap STK Push or instant WhatsApp Paybill prompt.</p>
                        </div>
                      </div>

                      {/* Above-The-Fold Wireframe */}
                      <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-purple-300">
                          <Layers size={16} />
                          <h5 className="font-bold uppercase tracking-wider text-white">Above-The-Fold Blueprint</h5>
                        </div>
                        <p className="text-white/80 leading-relaxed">
                          {benchmark.croPlaybook.aboveTheFoldMustHave}
                        </p>
                        <div className="p-2.5 rounded-lg bg-black/30 text-[11px] text-white/60">
                          Layout: [Urgent Hook Headline] + [30s Commercial Video Embed] + [Sticky WhatsApp Concierge CTA].
                        </div>
                      </div>

                      {/* Tracking Pixels & Attribution */}
                      <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-teal-300">
                          <BarChart3 size={16} />
                          <h5 className="font-bold uppercase tracking-wider text-white">Tracking &amp; Ad Retargeting</h5>
                        </div>
                        <p className="text-white/80 leading-relaxed">
                          {benchmark.croPlaybook.pixelsAndTracking}
                        </p>
                        <div className="p-2.5 rounded-lg bg-black/30 text-[11px] text-teal-300">
                          Set up Custom Audiences for 180-day retargeting to recover abandoned checkouts.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: 30-SECOND COMMERCIAL SCRIPT CONCEPT */}
                {activeTab === 'commercial' && (
                  <div className="space-y-4">
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Film size={18} className="text-purple-400" />
                          <h4 className="font-extrabold text-sm text-white">30-Second Commercial Storyboard Concept</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          30s Broadcast Standard
                        </span>
                      </div>

                      {/* Scene 1: Hook */}
                      <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase text-amber-300 tracking-wider">
                            Scene 1 · 00:00 – 00:05 (Scroll-Stopping Hook)
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">05s</span>
                        </div>
                        <p className="text-xs text-white/90 font-medium italic">
                          {diagnostics.commercial.hook}
                        </p>
                        <p className="text-[11px] text-white/50 bg-white/5 p-2.5 rounded-lg border border-white/5">
                          <strong>Visual Direction:</strong> {diagnostics.commercial.scene1Visual}
                        </p>
                      </div>

                      {/* Scene 2: Proof & Agitation */}
                      <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase text-purple-300 tracking-wider">
                            Scene 2 · 00:05 – 00:20 (Demonstration &amp; Social Proof)
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">15s</span>
                        </div>
                        <p className="text-xs text-white/90 font-medium italic">
                          {diagnostics.commercial.proof}
                        </p>
                        <p className="text-[11px] text-white/50 bg-white/5 p-2.5 rounded-lg border border-white/5">
                          <strong>Visual Direction:</strong> {diagnostics.commercial.scene2Visual}
                        </p>
                      </div>

                      {/* Scene 3: Direct Action CTA */}
                      <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase text-emerald-300 tracking-wider">
                            Scene 3 · 00:20 – 00:30 (Direct WhatsApp / Purchase Action)
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">10s</span>
                        </div>
                        <p className="text-xs text-white/90 font-medium italic">
                          {diagnostics.commercial.cta}
                        </p>
                        <p className="text-[11px] text-white/50 bg-white/5 p-2.5 rounded-lg border border-white/5">
                          <strong>Visual Direction:</strong> {diagnostics.commercial.scene3Visual}
                        </p>
                      </div>

                      {/* Voiceover & Style Recommendations */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                          <span className="text-[10px] font-bold uppercase text-purple-300 block mb-1">Recommended Voiceover:</span>
                          <p className="text-white/80">{diagnostics.commercial.voiceover}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                          <span className="text-[10px] font-bold uppercase text-purple-300 block mb-1">Production Visual Style:</span>
                          <p className="text-white/80">{diagnostics.commercial.style}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: UNIT ECONOMICS & 7-DAY LAUNCH PLAN */}
                {activeTab === 'roadmap' && (
                  <div className="space-y-4">
                    {/* Executive Verdict Box */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Compass size={16} className="text-purple-400" />
                        <h4 className="font-extrabold text-sm text-white">Strategic Executive Verdict</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-white/90 leading-relaxed bg-black/30 p-4 rounded-2xl border border-white/5">
                        {diagnostics.executiveVerdict}
                      </p>
                    </div>

                    {/* Superpower & Fatal Blindspot Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <ShieldCheck size={16} />
                          <h5 className="font-bold text-xs uppercase tracking-wider">Unfair Superpower</h5>
                        </div>
                        <p className="text-xs text-emerald-100/90 leading-relaxed">
                          {diagnostics.superpower}
                        </p>
                      </div>

                      <div className="rounded-2xl p-4 bg-amber-950/20 border border-amber-500/30 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertTriangle size={16} />
                          <h5 className="font-bold text-xs uppercase tracking-wider">Fatal Blindspot to Fix</h5>
                        </div>
                        <p className="text-xs text-amber-100/90 leading-relaxed">
                          {diagnostics.criticalBlindspot}
                        </p>
                      </div>
                    </div>

                    {/* Pricing Spectrum & Elasticity Assessment */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-amber-400" />
                          <h4 className="font-extrabold text-sm text-white">Price Elasticity &amp; Position</h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          diagnostics.priceVerdict === 'sweet_spot'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : diagnostics.priceVerdict === 'underpriced'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        }`}>
                          {diagnostics.priceVerdict === 'sweet_spot' ? 'Sweet-Spot Value' : diagnostics.priceVerdict === 'underpriced' ? 'Penetration / Underpriced' : 'Premium Positioning'}
                        </span>
                      </div>

                      {/* Spectrum Bar Graphic */}
                      <div className="space-y-1.5 pt-1">
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

                      <div className="text-xs text-white/80 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1.5">
                        <p>
                          <strong>Price Assessment:</strong> Your price of{' '}
                          <strong className="text-white">
                            {currency === 'KES' ? `KES ${Number(priceInput).toLocaleString()}` : `$${priceInput} USD`} {diagnostics.activeModel.short}
                          </strong>{' '}
                          ({diagnostics.activeModel.label}) {diagnostics.priceVerdict === 'sweet_spot'
                            ? 'is right in the sweet spot of consumer purchasing power. You have sufficient advertising margin to run profitable Meta and TikTok campaigns.'
                            : diagnostics.priceVerdict === 'underpriced'
                            ? 'is significantly lower than category standards. While this drives rapid trial, you risk being perceived as poor quality or failing to cover marketing delivery costs.'
                            : 'is at the top tier. To convert at this price, you must provide flawless visual branding and high-end video social proof.'}
                        </p>
                        <p className="text-[11px] text-purple-300 font-medium">
                          {diagnostics.frequencyAdvice}
                        </p>
                      </div>
                    </div>

                    {/* Unit Economics Advisory */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-400" />
                        <h4 className="font-extrabold text-sm text-white">Unit Economics &amp; Ad Budget Guidelines</h4>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 text-xs space-y-2 leading-relaxed">
                        <p className="text-white/90">
                          <strong>Pricing Structure:</strong> {diagnostics.frequencyAdvice}
                        </p>
                        <p className="text-amber-300 font-medium">
                          <strong>Target Ad Budget:</strong> {diagnostics.recommendedAdBudget}
                        </p>
                      </div>
                    </div>

                    {/* Multi-Frequency Subscription Pricing Matrix & Churn Defense */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Repeat size={16} className="text-purple-400" />
                          <h4 className="font-extrabold text-sm text-white">Subscription Pricing Matrix &amp; Churn Defense</h4>
                        </div>
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-400/20">
                          Multi-Frequency Modeling
                        </span>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed">
                        Compare how your price maps across East African and global recurring cadences. In Kenya, churn is heavily driven by payment friction (e.g. daily M-Pesa PIN prompt fatigue vs. upfront term passes).
                      </p>

                      {/* Subscription Tier Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {diagnostics.subscriptionMatrix.map((tier, idx) => (
                          <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 hover:border-purple-500/30 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white">{tier.frequency}</span>
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {tier.savings}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-amber-300">
                                {currency === 'KES' ? `KES ${tier.price.toLocaleString()}` : `$${tier.price.toLocaleString()}`}
                              </span>
                              <span className="text-[10px] text-white/40">{tier.cadence}</span>
                            </div>
                            <div className="text-[11px] space-y-1 pt-1.5 border-t border-white/5">
                              <p className="text-rose-300/90 font-medium">
                                <strong>⚠️ Churn Risk:</strong> {tier.churnRisk}
                              </p>
                              <p className="text-white/70 leading-relaxed">
                                <strong>🛡️ Retention Play:</strong> {tier.retentionTactic}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* East African Payment Retention Playbook */}
                      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs space-y-1.5 text-purple-200">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <Zap size={14} className="text-amber-300" />
                          <span>Sustaining Platform Cashflow: The "Termly Pass" Rule</span>
                        </p>
                        <p className="leading-relaxed text-[11px] text-purple-200/90">
                          If selling digital subscriptions or recurring services in Kenya, avoid relying solely on daily or weekly manual M-Pesa STK prompts. Over 50% of consumers abandon daily prompts after day 4 due to transaction fatigue or balance gaps. Always offer a <strong>Termly / Quarterly Pass</strong> with a 15% discount; this collects 90 days of revenue upfront, giving you cash reserves to fund customer acquisition.
                        </p>
                      </div>
                    </div>

                    {/* 7-Day Launch Checklist */}
                    <div className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 shadow-xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-amber-400" />
                          <h4 className="font-extrabold text-sm text-white">7-Day Tactical Go-To-Market Roadmap</h4>
                        </div>
                        <span className="text-[10px] text-white/50">Step-by-step to first 500 sales</span>
                      </div>

                      <div className="space-y-2">
                        {diagnostics.launchPlan.map((step, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-start gap-3 text-xs">
                            <span className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-400/30 font-bold text-[10px] shrink-0 mt-0.5">
                              {step.day}
                            </span>
                            <div className="space-y-0.5">
                              <p className="font-bold text-white">{step.task}</p>
                              <p className="text-white/70 text-[11px] leading-relaxed">{step.tip}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Call-to-Action Bridge & Revenue Streams */}
                <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-purple-900/70 via-[#12082b] to-indigo-950/70 border border-purple-400/40 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Film size={20} className="text-amber-300" />
                    <h4 className="font-black text-lg text-white">Execute This Brand &amp; Commercial Strategy</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed max-w-2xl">
                    Transform this strategic audit into live commercial revenue. Nia Media pairs AI intelligence with full-stack commercial video production, creative director consulting, and high-converting marketing campaigns.
                  </p>

                  {/* Revenue CTAs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Option 1: 30s Commercial Production */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Fastest Turnaround</span>
                          <span className="text-xs font-extrabold text-white">From KES 8,000 / $65</span>
                        </div>
                        <h5 className="font-extrabold text-sm text-white">Produce 30s Video Commercial</h5>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          We bring this exact 30s storyboard to life with pro voiceover, motion graphics, and WhatsApp CTA in 48 hours.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleProceedToCommercial}
                        className="w-full mt-2 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Film size={14} />
                        <span>Book Commercial Video Deposit →</span>
                      </button>
                    </div>

                    {/* Option 2: 1-on-1 Creative Director Strategy Call */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">1-on-1 Strategy</span>
                          <span className="text-xs font-extrabold text-white">Cal.com Booking</span>
                        </div>
                        <h5 className="font-extrabold text-sm text-white">Creative Director Consultation</h5>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          Book a 30-minute deep dive with our creative team to refine your brand positioning, packaging, and ad scaling roadmap.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleBookConsultation}
                        className="w-full mt-2 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Calendar size={14} />
                        <span>Schedule Strategy Call →</span>
                      </button>
                    </div>
                  </div>

                  {/* Utility Bar: Print PDF, Download Markdown, Copy Report */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePdfDownload}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/40 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer size={14} />
                        <span>Export PDF Brief</span>
                        {!isAuthenticated && <Lock size={12} className="text-amber-400 ml-1" />}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadFile}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-teal-200 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={14} className="text-teal-300" />
                        <span>Download Dossier (.md)</span>
                        {!isAuthenticated && <Lock size={12} className="text-amber-400 ml-1" />}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyReport}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copied ? 'Brief Copied!' : 'Copy Markdown'}</span>
                      </button>
                    </div>

                    {!isAuthenticated && (
                      <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                        <Lock size={12} />
                        <span>PDF &amp; Dossier export requires free account login</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Rate Limiting & Auth Modals ─────────────────────────────── */}
      {/* 1-Analysis Guest Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#12082b] border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowLimitModal(false)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Lock size={28} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                Guest Limit Reached (1/1 Free Tests)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Create A Free Account For Unlimited Analyses
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-sm mx-auto">
                You have completed your complimentary guest brand test. Sign up for a free Nia Media account to run unlimited market simulations, save your brand dossiers, and export PDF briefs.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => handleProceedToAuth('/register')}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus size={16} />
                <span>Create Free Account (Takes 30s) →</span>
              </button>

              <button
                onClick={() => handleProceedToAuth('/login')}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={14} />
                <span>Already have an account? Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Auth Gate Modal */}
      {showPdfAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#12082b] border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowPdfAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Printer size={28} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                Member Feature Only
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Sign In To Export PDF &amp; Market Dossier
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-sm mx-auto">
                High-resolution PDF dossiers, 30s commercial storyboards, competitor battlecards, and CRO audit checklists are exclusively available to authenticated members. Sign in or create a free account to instantly download and print your full strategic dossier.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => handleProceedToAuth('/register')}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus size={16} />
                <span>Register To Download PDF &amp; Dossier →</span>
              </button>

              <button
                onClick={() => handleProceedToAuth('/login')}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={14} />
                <span>Sign In To Existing Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Specific Executive Styling */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          header, nav, button, input, select, textarea, form, .no-print {
            display: none !important;
          }
          .bg-white\\/\\[0\\.03\\], .bg-black\\/30, .bg-black\\/40, .bg-purple-950\\/20 {
            background: #ffffff !important;
            color: #111111 !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
          }
          .text-white, .text-purple-200, .text-white\\/90, .text-white\\/80, .text-white\\/70 {
            color: #111111 !important;
          }
        }
      `}</style>
    </div>
  )
}
