import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, Mic, MicOff, ArrowRight, CheckCircle2, Copy, Check,
  Share2, MessageSquare, Smartphone, Film, Radio, Image as ImageIcon,
  DollarSign, Target, Users, Lightbulb, RefreshCw, ChevronRight,
  TrendingUp, Award, Layers
} from 'lucide-react'
import PackageCompareModal from './PackageCompareModal'

interface CampaignBrief {
  title: string
  industry: string
  masterHook: string
  coreAngle: string
  targetAudience: {
    primary: string
    secondary: string
    decisionMakers: string
  }
  channels: {
    type: 'reels' | 'poster' | 'radio' | 'commercial'
    title: string
    platforms: string
    format: string
    hook: string
    visualConcept: string
    badge: string
  }[]
  recommendedBudget: {
    entry: { kes: number; usd: number; label: string; desc: string; packageId: string }
    growth: { kes: number; usd: number; label: string; desc: string; packageId: string }
    pro: { kes: number; usd: number; label: string; desc: string; packageId: string }
  }
  whatsappCopy: string
}

const PRESET_IDEAS = [
  {
    label: '🏠 Kilimani Luxury Apartments (Real Estate)',
    prompt:
      'We are selling newly completed 2BR and 3BR luxury apartments in Kilimani, Nairobi with flexible payment plans, swimming pool, and high rental yield for investors.',
  },
  {
    label: '☕ Nairobi Rooftop Cafe & Brunch',
    prompt:
      'Weekend rooftop brunch promotion in Westlands targeting young professionals and foodies with live acoustic music and panoramic sunset views.',
  },
  {
    label: '💰 Smart Chama & Investment App',
    prompt:
      'Mobile fintech app for automated chama table-banking, group micro-investments, and instant emergency borrowing for Kenyan SMEs and women chamas.',
  },
  {
    label: '👗 Afro-Urban Streetwear Label',
    prompt:
      'Sustainable Afro-urban streetwear collection made in Nairobi, targeting Gen Z, campus students, and creative professionals across East Africa & global diaspora.',
  },
  {
    label: '🎓 Exam Revision & Learning Platform (EdTech)',
    prompt:
      'An educational learning platform targeting teachers and learners in high school and primary school, especially candidates preparing for national and international exams.',
  },
]

export default function HomeCampaignGenerator() {
  const navigate = useNavigate()
  const [ideaText, setIdeaText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [brief, setBrief] = useState<CampaignBrief | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'reels' | 'poster' | 'radio' | 'commercial'>('all')
  const [copied, setCopied] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>('')

  // Speech Recognition initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
    }
  }, [])

  const toggleRecording = () => {
    if (!speechSupported) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your idea.')
      return
    }
    setSpeechError('')

    if (isRecording) {
      try {
        recognitionRef.current?.stop?.()
      } catch {}
      setIsRecording(false)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
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
      setIdeaText(full)
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (transcriptRef.current.trim()) {
        setIdeaText(transcriptRef.current.trim())
      }
    }

    recognition.onerror = (e: any) => {
      setIsRecording(false)
      if (e.error !== 'no-speech') {
        setSpeechError('Microphone input interrupted. You can type your idea.')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setIsRecording(true)
    } catch {
      setSpeechError('Unable to access microphone. Please check permissions.')
      setIsRecording(false)
    }
  }

  // Strategic rule-based generator providing immediate, high-value briefs without latency
  const generateCampaignBrief = (input: string) => {
    setIsGenerating(true)
    setTimeout(() => {
      const lower = input.toLowerCase()
      // Extract brand or product name if mentioned
      const brandMatch = input.match(/(?:for|about|called|named|promoting)\s+([A-Za-z0-9\s'-]+?)(?:,|\.|\bwhich\b|\ban\b|\btargeting\b|\bwith\b|$)/i)
      const detectedBrand = brandMatch?.[1]?.trim() || ''

      let isRealEstate =
        lower.includes('apartment') ||
        lower.includes('real estate') ||
        lower.includes('property') ||
        lower.includes('housing') ||
        lower.includes('plot') ||
        lower.includes('land')

      let isEdTech =
        lower.includes('school') ||
        lower.includes('exam') ||
        lower.includes('learn') ||
        lower.includes('teacher') ||
        lower.includes('candidate') ||
        lower.includes('student') ||
        lower.includes('education') ||
        lower.includes('edtech') ||
        lower.includes('course')

      let isFood =
        lower.includes('food') ||
        lower.includes('cafe') ||
        lower.includes('restaurant') ||
        lower.includes('brunch') ||
        lower.includes('dining') ||
        lower.includes('coffee')

      let isFintech =
        lower.includes('chama') ||
        lower.includes('invest') ||
        lower.includes('money') ||
        lower.includes('loan') ||
        lower.includes('sacco') ||
        lower.includes('app') ||
        lower.includes('fintech')

      let isFashion =
        lower.includes('cloth') ||
        lower.includes('fashion') ||
        lower.includes('wear') ||
        lower.includes('apparel') ||
        lower.includes('streetwear')

      let generated: CampaignBrief

      if (isRealEstate) {
        const propTitle = detectedBrand || 'Luxury Apartments'
        generated = {
          title: `${propTitle}: "Luxury Living & High-Yield Investment"`,
          industry: 'Real Estate & Property Development',
          masterHook: '“Why pay someone else’s mortgage when you can own your dream home in Nairobi today?”',
          coreAngle:
            'Focus on prime location prestige, verified title deed security, high rental yields, and flexible milestone payment plans for local buyers and diaspora investors.',
          targetAudience: {
            primary: 'First-time home buyers, diaspora investors, and professionals upgrading their lifestyle.',
            secondary: 'Real estate agents and property consultants seeking fast client conversions.',
            decisionMakers: 'Family heads and SACCO members making the final investment financing decision.',
          },
          channels: [
            {
              type: 'reels',
              title: 'Short Video Reels (TikTok, IG Reels, FB Reels)',
              platforms: 'TikTok · Instagram Reels · Facebook',
              format: '9:16 Vertical Video (30s Architectural Walkthrough)',
              badge: 'High Engagement Walkthrough',
              hook: `“POV: Touring a luxury modern apartment in Nairobi under KES 9M with ready title deeds.”`,
              visualConcept:
                'High-speed seamless drone transition from Nairobi skyline into a sunlit open-plan living room, modern kitchen island, and balcony sunset view.',
            },
            {
              type: 'poster',
              title: 'Branded Architectural Posters & WhatsApp Kits',
              platforms: 'WhatsApp Broadcasts · Instagram Feed · Print Brochures',
              format: 'High-Res 4:5 & 1:1 Social Posters',
              badge: 'Investor Inquiry Magnet',
              hook: '“Phase 1 Selling Fast: Book Your Site Visit & Lock In Off-Plan Prices Today.”',
              visualConcept:
                'Clean luxury architectural rendering with floor plans, payment milestone breakdown, Google Maps pin graphic, and WhatsApp helpline QR.',
            },
            {
              type: 'radio',
              title: 'Radio & Commuter Audio Spot',
              platforms: 'Classic 105 · Capital FM · Spotify Geo-Ad',
              format: '30s Studio Audio Commercial',
              badge: 'Commuter Investor Trigger',
              hook: '“Invest in Nairobi’s fastest growing neighborhood with guaranteed rental returns.”',
              visualConcept:
                'Authoritative, warm voiceover with gentle acoustic guitar bed, listing prime proximity to malls, schools, and airport expressway.',
            },
            {
              type: 'commercial',
              title: 'Cinematic 30s-60s Property Commercial',
              platforms: 'YouTube Pre-Roll · TV · Diaspora Expos · Website Header',
              format: '30s Cinematic Master (16:9 & 9:16)',
              badge: 'Institutional Grade Authority',
              hook: '“Welcome to a home designed for generations of prosperity.”',
              visualConcept:
                'Golden-hour drone cinematography, family relaxing by the pool, crisp architectural close-ups, and developer credibility lockup.',
            },
          ],
          recommendedBudget: {
            entry: {
              packageId: 'startup_hook',
              kes: 2000,
              usd: 15,
              label: '30s Social Walkthrough Hook',
              desc: '1x 30s vertical TikTok/Reels walkthrough + 1 high-resolution flyer for WhatsApp status.',
            },
            growth: {
              packageId: '30s',
              kes: 8000,
              usd: 65,
              label: '30s Standard Commercial',
              desc: 'Cinematic property commercial with professional voiceover, licensed music, and full ad rights.',
            },
            pro: {
              packageId: '60s',
              kes: 15000,
              usd: 120,
              label: '60s Full Property Showcase',
              desc: 'Complete architectural showcase, multi-aspect cuts (9:16 + 16:9), and full promotional poster kit.',
            },
          },
          whatsappCopy: `Hi Nia Media! I tested our campaign concept on your homepage for our real estate project: "${propTitle}". We want to produce a video commercial.`,
        }
      } else if (isEdTech) {
        const edTechName = detectedBrand || 'Exam Revision Platform'
        generated = {
          title: `${edTechName}: "Revision That Works As Hard As You"`,
          industry: 'Education & EdTech',
          masterHook: '“Exams are in 60 days. Is your revision working as hard as you are?”',
          coreAngle:
            `Focus on anxiety reduction for exam candidates (KCSE / KPSEA / IGCSE) and empowerment for teachers. Position ${edTechName} as the 24/7 personal study partner that turns past paper confusion into Grade A confidence.`,
          targetAudience: {
            primary: 'High school & primary school exam candidates (Forms 3-4 & Grades 6-8) seeking fast step-by-step solutions.',
            secondary: 'Teachers looking for instant lesson quizzes, curriculum marking aids, and student tracking.',
            decisionMakers: 'Parents who fund school fees and tuition, seeking guaranteed academic progress.',
          },
          channels: [
            {
              type: 'reels',
              title: 'Short Video Reels (TikTok, IG Reels, FB Reels)',
              platforms: 'TikTok · Instagram Reels · YouTube Shorts',
              format: '9:16 Vertical Video (30s Kinetic Hook)',
              badge: 'Highest Organic Reach',
              hook: `“Stop memorizing textbooks for 6 hours. Here is how to master difficult exam topics in 8 minutes with ${edTechName}.”`,
              visualConcept:
                `Split-screen comparison: Stressed student with a pile of confusing photocopied papers vs. student typing a hard exam question into ${edTechName} and getting an instant step-by-step breakdown.`,
            },
            {
              type: 'poster',
              title: 'Branded Graphic Posters & WhatsApp Kits',
              platforms: 'WhatsApp School Groups · Facebook Feed · Flyers',
              format: 'High-Res 4:5 & 1:1 Social Posters',
              badge: 'High Conversion / Trust',
              hook: '“Dear Candidate: 10 Past Papers in Your Pocket. 100% Curriculum Aligned.”',
              visualConcept:
                `Clean, trustworthy brand poster with smiling Kenyan candidate in uniform holding a phone with ${edTechName} quiz interface, verified teacher badge, and WhatsApp helpline QR code.`,
            },
            {
              type: 'radio',
              title: 'Audio Jingle / Radio Commute Spot',
              platforms: 'Classic 105 · Radio Maisha · Spotify & Podcasts',
              format: '30s Audio Commute Commercial',
              badge: 'Parent & Teacher Direct Hit',
              hook: '“Mzazi, mtoto wako yuko tayari kwa mtihani? (Parent, is your child ready for exams?)”',
              visualConcept:
                'Authentic Kenyan voiceover addressing morning rush-hour parents. Sounds of school bells and pencil scribbles transitioning to confident music bed and clear SMS/WhatsApp CTA.',
            },
            {
              type: 'commercial',
              title: 'Broadcast Commercial & YouTube Pre-roll',
              platforms: 'Citizen TV · NTV · YouTube Ads · School Boards',
              format: '30s–60s Cinematic Story Commercial',
              badge: 'Institutional Prestige',
              hook: '“The future of African education is not in heavier backpacks. It is in smarter minds.”',
              visualConcept:
                `Inspiring cinematic story of a student accessing top-tier interactive STEM tutoring through ${edTechName}. Golden hour classroom cinematography, teacher testimonial, and closing call to action.`,
            },
          ],
          recommendedBudget: {
            entry: {
              packageId: 'startup_hook',
              kes: 2000,
              usd: 15,
              label: '30s Startup Social Hook',
              desc: '1x 30s kinetic TikTok/Reels video + 1 matching branded poster. Ideal to test candidate engagement.',
            },
            growth: {
              packageId: '30s',
              kes: 8000,
              usd: 65,
              label: '30s Standard Commercial',
              desc: 'Studio voiceover in Kenyan English or Swahili + motion graphics + full commercial rights for ads.',
            },
            pro: {
              packageId: '60s',
              kes: 15000,
              usd: 120,
              label: '60s Comprehensive Brand Film',
              desc: 'Dual cuts (9:16 vertical + 16:9 widescreen) + 2 branded posters + audio master for radio/podcast.',
            },
          },
          whatsappCopy:
            `Hi Nia Media! I tested our campaign concept on your homepage for *${edTechName}*. I want to produce the 30s commercial targeting exam candidates & teachers.`,
        }
      } else if (isFood) {
        generated = {
          title: 'Gourmet Sizzle: "Nairobi\'s Best Kept Secret"',
          industry: 'Hospitality & Dining',
          masterHook: '“Your weekend plans just got an upgrade. Meet the brunch everyone is whispering about.”',
          coreAngle:
            'Sensory appetite appeal, vibrant ambiance, and weekend FOMO. Showcase sizzling gourmet dishes, crafted mocktails, and golden-hour rooftop aesthetics.',
          targetAudience: {
            primary: 'Nairobi foodies, couples, and brunch squads (ages 22–38).',
            secondary: 'Corporate groups looking for after-work mixers and private dinners.',
            decisionMakers: 'Weekend planners who organize group bookings via WhatsApp.',
          },
          channels: [
            {
              type: 'reels',
              title: 'Short Video Reels (TikTok, IG Reels, FB Reels)',
              platforms: 'TikTok · Instagram Reels',
              format: '9:16 Vertical Video (30s Sensory Hook)',
              badge: 'Viral Viral Appetite',
              hook: '“POV: You found the prettiest weekend rooftop brunch in Nairobi under KES 2,500.”',
              visualConcept:
                'Fast-paced macro b-roll: sizzling pan, drizzling syrup, clinking glasses, smiling patrons enjoying the skyline breeze.',
            },
            {
              type: 'poster',
              title: 'Promotional Table & WhatsApp Posters',
              platforms: 'Instagram Feed · WhatsApp Status · Printed Menus',
              format: '1:1 & 4:5 Branded Graphic Posters',
              badge: 'Instant Reservations',
              hook: '“Bottomless Weekend Brunch. Reserve Your Table Before Friday 5PM.”',
              visualConcept:
                'Editorial gastronomy photography, clean gold & midnight navy typography, pricing details, and direct reservation WhatsApp link.',
            },
            {
              type: 'radio',
              title: 'Audio Spot / Spotify Playlist Ad',
              platforms: 'Smooth FM · Capital FM · Spotify Geo-Ad',
              format: '20s Upbeat Audio Spot',
              badge: 'Commuter Weekend Trigger',
              hook: '“This Friday, leave the traffic behind and step into the skyline.”',
              visualConcept:
                'Smooth, warm voiceover accompanied by chilled soulful Afrobeats and ambient dining sounds.',
            },
            {
              type: 'commercial',
              title: 'Full Cinematic Brand Commercial',
              platforms: 'Meta Ad Manager · Google Display · Website Header',
              format: '30s Cinematic Master (16:9 & 9:16)',
              badge: 'High-Ticket Bookings',
              hook: '“Where Nairobi comes to dine, connect, and unwind.”',
              visualConcept:
                'Chef preparation precision, twilight lighting, intimate table laughter, and breathtaking skyline drone transition.',
            },
          ],
          recommendedBudget: {
            entry: {
              packageId: 'startup_hook',
              kes: 2000,
              usd: 15,
              label: '30s Startup Foodie Hook',
              desc: '1x 30s vertical TikTok reel + 1 weekend promo poster for WhatsApp status.',
            },
            growth: {
              packageId: '30s',
              kes: 8000,
              usd: 65,
              label: '30s Cinematic Commercial',
              desc: 'Cinematic storefront footage, authentic voiceover, color grading, and commercial rights.',
            },
            pro: {
              packageId: '60s',
              kes: 15000,
              usd: 120,
              label: '60s Restaurant Showcase',
              desc: 'Full menu highlights, chef feature, dual video cuts, and social graphic kit.',
            },
          },
          whatsappCopy:
            'Hi Nia Media! I generated a campaign concept on your homepage for our restaurant/cafe brunch promo. We would like to produce the 30s video commercial.',
        }
      } else if (isFintech) {
        generated = {
          title: 'Wealth Together: "Smart Chama & Micro-Growth"',
          industry: 'Fintech & Financial Inclusion',
          masterHook: '“Why is your chama money still sitting idle in a paper notebook?”',
          coreAngle:
            'Trust, automated financial transparency, and eliminating fraud/disputes. Show how everyday Kenyans and business circles scale collective savings seamlessly on their smartphones.',
          targetAudience: {
            primary: 'Chama treasurers, SME owners, and urban saving circles seeking financial order.',
            secondary: 'Young professionals setting up holiday or investment joint funds.',
            decisionMakers: 'Group administrators who decide the platform for the entire group.',
          },
          channels: [
            {
              type: 'reels',
              title: 'Short Video Reels (TikTok, IG Reels, FB Reels)',
              platforms: 'TikTok · Instagram · Facebook',
              format: '9:16 Kinetic Animation (30s)',
              badge: 'Relatable Problem-Solution',
              hook: '“That awkward moment when someone defaults on Chama turn and the treasurer has no receipts...”',
              visualConcept:
                'Humorous relatable skit transitioning into smooth app screen showing instant automated M-Pesa statements and dividend tracker.',
            },
            {
              type: 'poster',
              title: 'Branded Explainer Infographic Posters',
              platforms: 'WhatsApp Broadcasts · LinkedIn · Facebook',
              format: 'High-Resolution Posters (4:5 & 1:1)',
              badge: 'Trust & Credibility',
              hook: '“Automate Your Chama in 3 Steps. Zero Confusion, 100% Transparent.”',
              visualConcept:
                'Bank-grade modern infographic showing phone mockup, security lock badge, and regulatory compliance endorsement.',
            },
            {
              type: 'radio',
              title: 'Radio & Vernacular / Swahili Spot',
              platforms: 'Radio Citizen · Radio Jambo · Inooro · Kameme',
              format: '30s Conversational Audio Spot',
              badge: 'Mass County Market Penetration',
              hook: '“Pesa ya chama iwe wazi kwa kila mwanachama! (Let group funds be transparent for all!)”',
              visualConcept:
                'Warm dialogue between two chama members praising how the app eliminated meeting arguments and allowed instant payouts.',
            },
            {
              type: 'commercial',
              title: 'Full 30s-60s Motion Graphics Commercial',
              platforms: 'YouTube Pre-Roll · Business Expos · Website Hero',
              format: '30s 2D Motion Graphics Master',
              badge: 'SaaS Authority',
              hook: '“Build wealth together without the drama. Welcome to modern group finance.”',
              visualConcept:
                'Dynamic kinetic vectors, clean phone UI animations, and authentic Kenyan voiceover outlining security, speed, and growth.',
            },
          ],
          recommendedBudget: {
            entry: {
              packageId: 'startup_hook',
              kes: 2000,
              usd: 15,
              label: '30s Startup App Hook',
              desc: '1x 30s motion typography video + 1 high-impact feature poster.',
            },
            growth: {
              packageId: '30s',
              kes: 8000,
              usd: 65,
              label: '30s 2D Motion Commercial',
              desc: 'Custom vector characters, mobile UI screencast, studio voiceover, and ad rights.',
            },
            pro: {
              packageId: '60s',
              kes: 15000,
              usd: 120,
              label: '60s Full App Pitch Film',
              desc: 'Comprehensive product walk-through, customer story, and multi-platform promotional poster kit.',
            },
          },
          whatsappCopy:
            'Hi Nia Media! I tested our campaign concept on your website for our Chama/Fintech platform. We would like to produce the 30s video commercial.',
        }
      } else {
        // Universal Adaptive Engine
        const cleanedTitle = input.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '') || 'Your Business'
        generated = {
          title: `${cleanedTitle}: "Turn Attention Into Paying Customers"`,
          industry: isFashion ? 'Fashion & Retail' : 'Retail, Services & Growth Brand',
          masterHook: `“Stop wasting money on posts that get likes but no sales. Here is what actually converts.”`,
          coreAngle:
            'Position the business through clear differentiation, authentic customer proof, and an irresistible call to action (WhatsApp / Instant delivery).',
          targetAudience: {
            primary: 'High-intent Kenyan & regional buyers looking for verified quality & fast delivery.',
            secondary: 'Social media scrollers looking for lifestyle upgrades.',
            decisionMakers: 'Purchasers who message directly on WhatsApp to confirm price and stock.',
          },
          channels: [
            {
              type: 'reels',
              title: 'Short Video Reels (TikTok, IG Reels, FB Reels)',
              platforms: 'TikTok · Instagram Reels · Facebook',
              format: '9:16 Vertical Video (30s Kinetic Hook)',
              badge: 'High Conversion Hook',
              hook: `“If you're still looking for ${cleanedTitle.toLowerCase()}, watch this before you buy anywhere else.”`,
              visualConcept:
                'Dynamic 3-second visual scroll-stopper: high-speed unboxing, crisp product closeup, and customer smiling in natural daylight.',
            },
            {
              type: 'poster',
              title: 'Branded Promotional Posters for WhatsApp & Feeds',
              platforms: 'WhatsApp Status · Instagram Feed · Facebook Ads',
              format: '1:1 & 4:5 Matching Graphic Posters',
              badge: 'Direct WhatsApp Sales',
              hook: `“Limited Stock Available. Order Today & Get Same-Day Nairobi Delivery.”`,
              visualConcept:
                'Striking modern poster with product spotlight, pricing badge in bold KES, verified contact info, and clear CTA.',
            },
            {
              type: 'radio',
              title: 'Audio Spot & Podcast Voiceover',
              platforms: 'Radio Commute · Spotify · Instagram Voiceover',
              format: '30s Studio Audio Commercial',
              badge: 'Commuter Brand Recall',
              hook: `“Looking for quality you can trust? ${cleanedTitle} has you covered.”`,
              visualConcept:
                'Professional Kenyan voiceover with upbeat rhythmic background music and punchy phone/WhatsApp callout.',
            },
            {
              type: 'commercial',
              title: 'Full 30s Standard Video Commercial',
              platforms: 'YouTube · TV · Social Ads · Website Hero',
              format: '30s Cinematic Master (9:16 & 16:9)',
              badge: 'Complete Brand Authority',
              hook: `“Built for those who value authentic excellence.”`,
              visualConcept:
                'High-production lighting, customer lifestyle interaction, professional voice narration, and clear brand lockup.',
            },
          ],
          recommendedBudget: {
            entry: {
              packageId: 'startup_hook',
              kes: 2000,
              usd: 15,
              label: '30s Startup Social Hook',
              desc: '1x 30s kinetic social video + 1 matching branded poster. Fast 48h turnaround.',
            },
            growth: {
              packageId: '30s',
              kes: 8000,
              usd: 65,
              label: '30s Standard Commercial',
              desc: 'Broadcast-quality video commercial with studio voiceover, music licensing, and 2 revisions.',
            },
            pro: {
              packageId: '60s',
              kes: 15000,
              usd: 120,
              label: '60s Full Pitch & Ad Pack',
              desc: 'Complete brand story, dual aspect ratios (9:16 + 16:9), and promotional graphics kit.',
            },
          },
          whatsappCopy: `Hi Nia Media! I used your homepage campaign generator for our project: "${input.slice(0, 60)}". We want to order a video commercial.`,
        }
      }

      setBrief(generated)
      setIsGenerating(false)
    }, 700)
  }

  const handleCopy = () => {
    if (!brief) return
    const text = `CAMPAIGN BRIEF: ${brief.title}
Industry: ${brief.industry}
Master Hook: ${brief.masterHook}
Core Angle: ${brief.coreAngle}

AUDIENCE BREAKDOWN:
- Primary: ${brief.targetAudience.primary}
- Secondary: ${brief.targetAudience.secondary}
- Decision Makers: ${brief.targetAudience.decisionMakers}

RECOMMENDED CHANNELS:
${brief.channels.map(c => `• ${c.title} (${c.platforms})\n  Hook: ${c.hook}\n  Concept: ${c.visualConcept}`).join('\n\n')}

BUDGET OPTIONS:
- Startup Hook: KES ${brief.recommendedBudget.entry.kes.toLocaleString()} (~$${brief.recommendedBudget.entry.usd})
- Standard Commercial: KES ${brief.recommendedBudget.growth.kes.toLocaleString()} (~$${brief.recommendedBudget.growth.usd})
- Full Film: KES ${brief.recommendedBudget.pro.kes.toLocaleString()} (~$${brief.recommendedBudget.pro.usd})`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const filteredChannels = useMemo(() => {
    if (!brief) return []
    if (activeTab === 'all') return brief.channels
    return brief.channels.filter(c => c.type === activeTab)
  }, [brief, activeTab])

  return (
    <section id="campaign-generator" className="py-20 px-6 relative bg-gradient-to-b from-[#0c0916] via-[#120a26] to-[#07050d] border-b border-purple-500/20">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>INSTANT AI CAMPAIGN &amp; BRIEF GENERATOR</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            What Do You Want to Promote Today?
          </h2>
          <p className="text-sm sm:text-base text-white/70 mt-3 leading-relaxed">
            Type your raw business idea or <strong>speak into your microphone</strong>. In seconds, get tailored campaign options, creative hooks, channel recommendations (Reels, Posters, Radio, TV), and budget benchmarks—<strong>100% free before paying a shilling</strong>.
          </p>
        </div>

        {/* Input Card Container */}
        <div className="rounded-3xl bg-white/[0.04] border border-white/15 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Preset Fast-Fill Chips */}
          <div className="mb-4">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Try a Sample Business Idea (Any Industry):
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_IDEAS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIdeaText(preset.prompt)
                    generateCampaignBrief(preset.prompt)
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-purple-600/30 text-white/80 hover:text-white border border-white/10 hover:border-purple-400/40 transition-all text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Textarea & Audio Recorder */}
          <div className="relative">
            <textarea
              rows={4}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="Describe your business or promotion idea (e.g. We sell modern 2BR apartments in Kilimani, run a cafe weekend brunch, built an exam revision platform, offer financial services, or design streetwear)..."
              className="w-full rounded-2xl bg-black/40 border border-white/15 p-4 sm:p-5 text-sm sm:text-base text-white placeholder-white/35 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none shadow-inner"
            />

            {/* Live Mic Waveform Indicator */}
            {isRecording && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 backdrop-blur-md text-red-300 text-xs font-bold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Listening to your voice note... speak naturally</span>
              </div>
            )}
          </div>

          {speechError && (
            <p className="text-xs text-amber-400 mt-2 font-medium">{speechError}</p>
          )}

          {/* Controls Bar: Mic Button + Generate Action */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15 hover:border-white/30'
                }`}
              >
                {isRecording ? <MicOff size={15} /> : <Mic size={15} className="text-amber-400" />}
                <span>{isRecording ? 'Stop Recording' : '🎙️ Record Voice Note'}</span>
              </button>

              <span className="text-xs text-white/50 hidden sm:inline">
                {isRecording ? 'Speaking in Kenyan English / Kiswahili' : 'Supports voice or text'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {ideaText.trim() && (
                <button
                  type="button"
                  onClick={() => setIdeaText('')}
                  className="text-xs text-white/40 hover:text-white/80 transition-colors"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                disabled={!ideaText.trim() || isGenerating}
                onClick={() => generateCampaignBrief(ideaText)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(147,51,234,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 border border-purple-400/30"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-amber-300" />
                    <span>Analyzing Campaign Angles...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-300" />
                    <span>Generate Campaign Suggestions</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS: Generated Interactive Campaign Brief */}
        {brief && (
          <div className="mt-12 space-y-8 animate-fadeIn">
            
            {/* Top Summary Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-purple-900/30 via-black/50 to-indigo-900/30 border border-purple-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {brief.industry}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Strategy Ready
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
                    {brief.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied Brief!' : 'Copy Brief'}</span>
                  </button>

                  <a
                    href={`https://wa.me/254751822556?text=${encodeURIComponent(brief.whatsappCopy)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all shadow-md"
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp Studio</span>
                  </a>
                </div>
              </div>

              {/* Master Hook & Core Angle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                    🎯 Master Campaign Hook
                  </span>
                  <p className="text-lg font-bold text-white italic">
                    {brief.masterHook}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-1">
                    💡 Core Strategic Angle
                  </span>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    {brief.coreAngle}
                  </p>
                </div>
              </div>

              {/* Audience Segmentation Grid */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                  Target Audience Breakdown:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] font-extrabold text-purple-400 uppercase block">Primary Audience</span>
                    <p className="text-xs text-white/80 mt-1">{brief.targetAudience.primary}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase block">Secondary Influencers</span>
                    <p className="text-xs text-white/80 mt-1">{brief.targetAudience.secondary}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase block">Decision &amp; Funding Makers</span>
                    <p className="text-xs text-white/80 mt-1">{brief.targetAudience.decisionMakers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Channel Execution Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    Suggested Campaign Formats &amp; Channel Distribution
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    Compare how this message adapts for short viral video reels, social posters, audio radio, and broadcast commercials.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-auto overflow-x-auto">
                  {(
                    [
                      { id: 'all', label: 'All (4)' },
                      { id: 'reels', label: '📱 Reels' },
                      { id: 'poster', label: '🖼️ Posters' },
                      { id: 'radio', label: '🎙️ Radio' },
                      { id: 'commercial', label: '🎬 Commercial' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredChannels.map((channel, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 p-6 flex flex-col justify-between transition-all group shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold text-white/50">{channel.platforms}</span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {channel.badge}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {channel.title}
                      </h4>
                      <p className="text-xs font-semibold text-white/40 mb-3">{channel.format}</p>

                      <div className="space-y-3 pt-2">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                          <span className="font-bold text-amber-300 block mb-0.5">Recommended Hook / Headline:</span>
                          <span className="text-white/90 italic">{channel.hook}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                          <span className="font-bold text-purple-300 block mb-0.5">Visual &amp; Audio Direction:</span>
                          <span className="text-white/75">{channel.visualConcept}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                      <Link
                        to={`/quote?brief=${encodeURIComponent(channel.hook)}&style=${channel.type === 'commercial' ? 'cinematic' : 'motion_2d'}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white transition-colors"
                      >
                        <span>Produce this format</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget & Commercial Package Recommendations */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 backdrop-blur-xl">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                    REALISTIC PRICING &amp; BUDGET SPECTRUM
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                    How Much Should You Budget to Execute This Campaign?
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    Nia Media packages are designed for small and growing businesses with transparent 70/30 milestone pricing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition-all self-start sm:self-auto cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Compare 2K vs 8K Tiers</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Entry Tier */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500/30 flex flex-col justify-between transition-all">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-white/40">Small Business / Starter</span>
                    <h4 className="text-base font-bold text-white mt-1">{brief.recommendedBudget.entry.label}</h4>
                    <p className="text-xs text-white/60 mt-2 leading-relaxed">{brief.recommendedBudget.entry.desc}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-white">KES {brief.recommendedBudget.entry.kes.toLocaleString()}</span>
                      <span className="text-xs text-white/40 block">~${brief.recommendedBudget.entry.usd} USD</span>
                    </div>
                    <Link
                      to={`/quote?length=${brief.recommendedBudget.entry.packageId}&brief=${encodeURIComponent(brief.masterHook)}`}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-purple-600 text-white transition-all"
                    >
                      Select
                    </Link>
                  </div>
                </div>

                {/* Growth Tier (Recommended) */}
                <div className="p-5 rounded-2xl bg-purple-600/10 border-2 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col justify-between relative">
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 text-white uppercase tracking-wider shadow">
                    Most Popular
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-purple-300">High-Impact Growth</span>
                    <h4 className="text-base font-bold text-white mt-1">{brief.recommendedBudget.growth.label}</h4>
                    <p className="text-xs text-white/70 mt-2 leading-relaxed">{brief.recommendedBudget.growth.desc}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-purple-500/30 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-amber-300">KES {brief.recommendedBudget.growth.kes.toLocaleString()}</span>
                      <span className="text-xs text-white/50 block">~${brief.recommendedBudget.growth.usd} USD</span>
                    </div>
                    <Link
                      to={`/quote?length=${brief.recommendedBudget.growth.packageId}&brief=${encodeURIComponent(brief.masterHook)}`}
                      className="px-4 py-2 rounded-lg text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow"
                    >
                      Start Project
                    </Link>
                  </div>
                </div>

                {/* Pro Tier */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500/30 flex flex-col justify-between transition-all">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-white/40">Multi-Channel Pro</span>
                    <h4 className="text-base font-bold text-white mt-1">{brief.recommendedBudget.pro.label}</h4>
                    <p className="text-xs text-white/60 mt-2 leading-relaxed">{brief.recommendedBudget.pro.desc}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-white">KES {brief.recommendedBudget.pro.kes.toLocaleString()}</span>
                      <span className="text-xs text-white/40 block">~${brief.recommendedBudget.pro.usd} USD</span>
                    </div>
                    <Link
                      to={`/quote?length=${brief.recommendedBudget.pro.packageId}&brief=${encodeURIComponent(brief.masterHook)}`}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-purple-600 text-white transition-all"
                    >
                      Select
                    </Link>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Conversion Funnel Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#130b2c] to-indigo-950 border border-purple-500/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  Ready to turn this brief into a live commercial?
                </h3>
                <p className="text-xs sm:text-sm text-white/70 max-w-xl">
                  Take this brief into our 60-second quote configurator to lock in your voiceover, visual style, and production schedule. Or create a free account to save it for later.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={`/quote?brief=${encodeURIComponent(brief.masterHook)}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all"
                >
                  <Film size={16} />
                  <span>Request Video Commercial</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to={`/register?redirect=${encodeURIComponent(`/quote?brief=${encodeURIComponent(brief.masterHook)}`)}`}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
                >
                  <span>Save to Free Account</span>
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>

      <PackageCompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </section>
  )
}
