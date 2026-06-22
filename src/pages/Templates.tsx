import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Hotel, GraduationCap, CreditCard, UtensilsCrossed, Calendar,
  ArrowRight, Film, Music, Zap, Search, Heart, ShoppingBag, Briefcase,
  Mic, Radio, Star, Play,
} from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { useAuth } from '../lib/AuthContext'
import DashboardLayout from '../components/layout/DashboardLayout'

type Tab = 'campaign' | 'video' | 'audio'

/* ── Campaign Copy Templates ── */
const campaignTemplates = [
  { id: 't1', icon: Building2, name: 'Real Estate Listing', industry: 'Real Estate', description: 'Apartments, land, rentals, and property launches. Drives leads, site visits, and enquiries.', platforms: ['Facebook', 'Instagram', 'WhatsApp'], color: '#10b981', to: '/new-campaign' },
  { id: 't2', icon: Hotel, name: 'Hotel Weekend Offer', industry: 'Hospitality', description: 'Hotels, Airbnbs, resorts, and travel packages. Built to drive bookings and direct enquiries.', platforms: ['Instagram', 'Facebook', 'WhatsApp'], color: '#3b82f6', to: '/new-campaign' },
  { id: 't3', icon: GraduationCap, name: 'School Admissions', industry: 'Education', description: 'Schools, tutors, colleges, and edtech platforms. Drives enrolment and parent enquiries.', platforms: ['Facebook', 'WhatsApp', 'LinkedIn'], color: '#f59e0b', to: '/new-campaign' },
  { id: 't4', icon: CreditCard, name: 'Fintech Product', industry: 'Fintech', description: 'Saccos, loans, insurance, savings, and mobile finance products. Builds trust and drives applications.', platforms: ['Facebook', 'LinkedIn', 'WhatsApp'], color: '#8b5cf6', to: '/new-campaign' },
  { id: 't5', icon: UtensilsCrossed, name: 'Restaurant Offer', industry: 'Restaurant', description: 'Food promos, delivery, and lunch offers. High-conversion copy for local food businesses.', platforms: ['Instagram', 'TikTok', 'WhatsApp'], color: '#ef4444', to: '/new-campaign' },
  { id: 't6', icon: Calendar, name: 'Event Promotion', industry: 'Events', description: 'Launches, church events, conferences, concerts, and trainings. Drives ticket sales and registrations.', platforms: ['Instagram', 'Facebook', 'WhatsApp'], color: '#06b6d4', to: '/new-campaign' },
  { id: 't7', icon: Heart, name: 'Health & Wellness', industry: 'Health', description: 'Clinics, gyms, supplement brands, and wellness services. Trust-first copy that converts.', platforms: ['Instagram', 'Facebook', 'WhatsApp'], color: '#ec4899', to: '/new-campaign' },
  { id: 't8', icon: ShoppingBag, name: 'Retail Product Launch', industry: 'Retail', description: 'New product arrivals, seasonal offers, and clearance sales. Urgency-driven copy for fast results.', platforms: ['Instagram', 'TikTok', 'WhatsApp'], color: '#f97316', to: '/new-campaign' },
  { id: 't9', icon: Briefcase, name: 'Professional Services', industry: 'Services', description: 'Law firms, accountants, consultants, and agencies. Credibility-first copy for B2B audiences.', platforms: ['LinkedIn', 'Facebook', 'WhatsApp'], color: '#64748b', to: '/new-campaign' },
  { id: 't10', icon: Heart, name: 'Sunday Service Invite', industry: 'Faith & Community', description: 'Warm, welcoming copy for weekly services, special Sundays, and sermon series. Drives attendance and community engagement.', platforms: ['WhatsApp', 'Facebook', 'Instagram'], color: '#8b5cf6', to: '/new-campaign' },
  { id: 't11', icon: Heart, name: 'Worship Night / Concert', industry: 'Faith & Community', description: 'High-energy promo for worship events, gospel concerts, and youth nights. Drives registration and tickets.', platforms: ['Instagram', 'Facebook', 'WhatsApp'], color: '#7c3aed', to: '/new-campaign' },
  { id: 't12', icon: Heart, name: 'Fundraising Campaign', industry: 'Faith & Community', description: 'Respectful, compelling fundraising copy for community projects, building funds, and outreach programs.', platforms: ['WhatsApp', 'Facebook', 'Instagram'], color: '#059669', to: '/new-campaign' },
  { id: 't13', icon: Heart, name: 'Faith Conference', industry: 'Faith & Community', description: 'Registration and awareness copy for conferences, seminars, retreats, and conventions. Drives delegate sign-ups.', platforms: ['Facebook', 'Instagram', 'WhatsApp'], color: '#2563eb', to: '/new-campaign' },
  { id: 't14', icon: Heart, name: 'Community Outreach', industry: 'Faith & Community', description: 'Volunteer recruitment and community awareness copy for outreach programs, food drives, and social impact events.', platforms: ['WhatsApp', 'Facebook', 'Instagram'], color: '#d97706', to: '/new-campaign' },
]

/* ── Video Script Templates ── */
const videoTemplates = [
  {
    id: 'v1', icon: Film, name: '30s Property Commercial',
    industry: 'Real Estate', color: '#10b981',
    duration: '30 seconds', style: 'Product Showcase',
    description: 'Open on drone shot of property. Cut to lifestyle b-roll. Key features in title cards. Voiceover: aspirational + urgency close. End with brand + CTA.',
    structure: ['Aerial/hook shot (0–5s)', 'Lifestyle b-roll (5–18s)', 'Features overlay (18–25s)', 'CTA close (25–30s)'],
    to: '/concept-studio',
  },
  {
    id: 'v2', icon: Film, name: 'Restaurant Story Film',
    industry: 'Restaurant', color: '#ef4444',
    duration: '60 seconds', style: 'Brand Story',
    description: 'Behind-the-scenes of food being made. Chef/owner interview soundbite. Happy customers. Ends with ambience shot + call to visit.',
    structure: ['Kitchen prep montage (0–12s)', 'Owner interview (12–30s)', 'Customer reactions (30–48s)', 'Ambience + CTA (48–60s)'],
    to: '/concept-studio',
  },
  {
    id: 'v3', icon: Film, name: 'School Admissions Film',
    industry: 'Education', color: '#f59e0b',
    duration: '90 seconds', style: 'Institutional',
    description: 'Establishing campus shots. Student testimonial. Teacher interview. Achievements graphic. Application deadline close with WhatsApp CTA.',
    structure: ['Campus wide shots (0–15s)', 'Student voice (15–45s)', 'Achievement highlights (45–70s)', 'Deadline + CTA (70–90s)'],
    to: '/concept-studio',
  },
  {
    id: 'v4', icon: Film, name: 'Fintech Trust Ad',
    industry: 'Fintech', color: '#8b5cf6',
    duration: '45 seconds', style: 'Problem–Solution',
    description: 'Opens on relatable money struggle. Introduces product as the fix. Screen recording of app UX. Testimonial soundbite. CTA with urgency.',
    structure: ['Pain-point hook (0–8s)', 'Product intro (8–22s)', 'App UX demo (22–35s)', 'Social proof + CTA (35–45s)'],
    to: '/concept-studio',
  },
  {
    id: 'v5', icon: Film, name: 'Product Launch Reel',
    industry: 'Retail', color: '#f97316',
    duration: '15 seconds', style: 'Hook Reel',
    description: 'Fast cut product close-ups. Satisfying unboxing moment. Single key benefit text overlay. Brand colour closing card.',
    structure: ['Product hero (0–4s)', 'Unboxing moment (4–10s)', 'Benefit + price (10–13s)', 'Brand card (13–15s)'],
    to: '/concept-studio',
  },
  {
    id: 'v6', icon: Film, name: 'Event Hype Video',
    industry: 'Events', color: '#06b6d4',
    duration: '30 seconds', style: 'Hype / FOMO',
    description: 'Crowd energy from past events. Speaker/headliner teaser. Countdown graphic. Ticket link CTA with scarcity copy.',
    structure: ['Past event highlights (0–8s)', 'Speaker teaser (8–18s)', 'Date/venue (18–25s)', 'Ticket CTA (25–30s)'],
    to: '/concept-studio',
  },
]

/* ── Audio Brief Templates ── */
const audioTemplates = [
  {
    id: 'a1', icon: Music, name: 'Brand Jingle — Upbeat',
    type: 'Jingle', color: '#8b5cf6',
    duration: '30s', mood: 'Energetic & Upbeat',
    description: 'Catchy hook melody, brand name integrated into lyrics, ends on logo-sound sting. Ideal for restaurants, retail, and FMCG.',
    prompt: 'Upbeat Afropop/highlife-influenced jingle. Brand name in chorus. Friendly, singable, 4/4 time. Ends with 2-bar stinger.',
    to: '/audio-studio',
  },
  {
    id: 'a2', icon: Mic, name: 'Voice Over — Professional',
    type: 'Voice Over', color: '#3b82f6',
    duration: '60s', mood: 'Authoritative & Clear',
    description: 'Authoritative male or female voice. Clean read, no music bed, broadcast-ready. Ideal for fintech, insurance, and services.',
    prompt: 'Professional Kenyan English voice. Clear diction, measured pace. No music. Reads business description, key benefit, CTA. Broadcast quality.',
    to: '/audio-studio',
  },
  {
    id: 'a3', icon: Radio, name: 'Radio Spot — Call to Action',
    type: 'Radio Spot', color: '#10b981',
    duration: '30s', mood: 'Conversational & Direct',
    description: 'Two-voice dialogue, problem-solution structure, brand mention x2, clear phone/WhatsApp CTA at close. Proven radio format.',
    prompt: 'Two voice dialogue (male + female). Problem-solution structure. Brand mentioned twice. Ends with phone number and WhatsApp read twice.',
    to: '/audio-studio',
  },
  {
    id: 'a4', icon: Star, name: 'Luxury Brand Jingle',
    type: 'Jingle', color: '#f59e0b',
    duration: '20s', mood: 'Elegant & Aspirational',
    description: 'Understated melody, piano or strings, whispered/smooth VO, brand name held at end. For real estate, hotels, fashion.',
    prompt: 'Elegant, minimal instrumentation. Piano lead or string pad. Smooth, whispered brand name at end. No percussion. Premium feel.',
    to: '/audio-studio',
  },
  {
    id: 'a5', icon: Play, name: 'Podcast / YouTube Intro',
    type: 'Voice Over', color: '#06b6d4',
    duration: '15s', mood: 'Punchy & Modern',
    description: 'Short branded intro with music sting, channel name, and tagline read. Ready for video content creators and podcast shows.',
    prompt: 'Modern electronic music bed. Host name + show name + tagline read over music. Energetic but not loud. Fades to silence.',
    to: '/audio-studio',
  },
  {
    id: 'a6', icon: Radio, name: 'Event Radio Spot',
    type: 'Radio Spot', color: '#ec4899',
    duration: '60s', mood: 'Exciting & Urgent',
    description: 'Single energetic voice, event highlights, date/venue x3, ticket info, scarcity close. Tested for concerts and church events.',
    prompt: 'Single high-energy voice. Event name + highlights. Date and venue repeated 3 times. Ticket price. Urgent close: limited seats. Music bed throughout.',
    to: '/audio-studio',
  },
]

/* ── Reusable card components ── */

// Map template industry labels to NewCampaign's exact <select> option values
const INDUSTRY_MAP: Record<string, string> = {
  'Fintech': 'Fintech / SACCO',
  'Health': 'Health & Wellness',
  'Services': 'Professional Services',
}

function CampaignCard({ t, search }: { t: typeof campaignTemplates[0]; search: string }) {
  if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.industry.toLowerCase().includes(search.toLowerCase())) return null
  const Icon = t.icon
  const industryParam = INDUSTRY_MAP[t.industry] ?? t.industry
  const toWithParams = `${t.to}?industry=${encodeURIComponent(industryParam)}`
  return (
    <div className="card-glow p-6 hover:border-purple-500/30 transition-all duration-300 flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          style={{ background: `${t.color}20`, border: `1px solid ${t.color}40` }}>
          <Icon size={20} style={{ color: t.color }} />
        </div>
        <span className="badge" style={{ background: `${t.color}15`, color: t.color }}>{t.industry}</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-2">{t.name}</h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{t.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {t.platforms.map(p => (
          <span key={p} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-medium rounded-lg">{p}</span>
        ))}
      </div>
      <Link to={toWithParams} className="btn-outline text-xs w-full text-center gap-1.5">
        Use Template <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function VideoCard({ t, search }: { t: typeof videoTemplates[0]; search: string }) {
  if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.industry.toLowerCase().includes(search.toLowerCase())) return null
  const Icon = t.icon
  return (
    <div className="card-glow p-6 hover:border-blue-500/30 transition-all duration-300 flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          style={{ background: `${t.color}20`, border: `1px solid ${t.color}40` }}>
          <Icon size={20} style={{ color: t.color }} />
        </div>
        <div className="flex gap-1.5">
          <span className="badge" style={{ background: `${t.color}15`, color: t.color }}>{t.industry}</span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{t.name}</h3>
      <div className="flex gap-2 mb-3">
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.duration}</span>
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.style}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{t.description}</p>

      {/* Script structure */}
      <div className="mb-4 space-y-1">
        {t.structure.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: `${t.color}25`, color: t.color }}>{i + 1}</div>
            {s}
          </div>
        ))}
      </div>

      <Link to={t.to} className="btn-outline text-xs w-full text-center gap-1.5"
        style={{ borderColor: `${t.color}40`, color: t.color }}>
        Start with this Structure <ArrowRight size={12} />
      </Link>
    </div>
  )
}

function AudioCard({ t, search }: { t: typeof audioTemplates[0]; search: string }) {
  if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.type.toLowerCase().includes(search.toLowerCase())) return null
  const Icon = t.icon
  return (
    <div className="card-glow p-6 hover:border-green-500/30 transition-all duration-300 flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          style={{ background: `${t.color}20`, border: `1px solid ${t.color}40` }}>
          <Icon size={20} style={{ color: t.color }} />
        </div>
        <div className="flex gap-1.5">
          <span className="badge" style={{ background: `${t.color}15`, color: t.color }}>{t.type}</span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{t.name}</h3>
      <div className="flex gap-2 mb-3">
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.duration}</span>
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.mood}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{t.description}</p>

      {/* Brief prompt preview */}
      <div className="mb-4 p-3 rounded-xl bg-white/3 border border-gray-200">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Brief Prompt</p>
        <p className="text-xs text-gray-500 leading-relaxed italic">"{t.prompt}"</p>
      </div>

      <Link to={t.to} className="btn-outline text-xs w-full text-center gap-1.5"
        style={{ borderColor: `${t.color}40`, color: t.color }}>
        Use this Brief <ArrowRight size={12} />
      </Link>
    </div>
  )
}

/* ── Main grid ── */
function TemplatesGrid() {
  const [tab, setTab] = useState<Tab>('campaign')
  const [search, setSearch] = useState('')

  const tabs: { id: Tab; icon: typeof Zap; label: string; count: number; color: string }[] = [
    { id: 'campaign', icon: Zap, label: 'Campaign Copy', count: campaignTemplates.length, color: '#8b5cf6' },
    { id: 'video', icon: Film, label: 'Video Scripts', count: videoTemplates.length, color: '#3b82f6' },
    { id: 'audio', icon: Music, label: 'Audio Briefs', count: audioTemplates.length, color: '#10b981' },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="text-sm text-gray-500 mt-1">Pre-structured starting points for campaigns, video scripts, and audio briefs.</p>
      </div>

      {/* Tab bar + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 border-b border-gray-200 w-full sm:w-auto">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 -mb-px transition-all ${
                  tab === t.id ? 'text-white border-current' : 'border-transparent text-gray-500 hover:text-gray-600'
                }`}
                style={tab === t.id ? { borderColor: t.color, color: t.color } : {}}>
                <Icon size={13} />
                {t.label}
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                  style={{ background: `${t.color}20`, color: t.color }}>{t.count}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-8 text-sm w-full"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content-type hint banner */}
      {tab === 'video' && (
        <div className="mb-5 p-3 rounded-xl border border-blue-500/20 bg-blue-500/6 flex items-center gap-3">
          <Film size={14} className="text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">These are narrative structures for your human creative — not AI-generated videos. Start a concept in <Link to="/concept-studio" className="underline hover:no-underline">Concept Studio</Link> to brief your creator.</p>
        </div>
      )}
      {tab === 'audio' && (
        <div className="mb-5 p-3 rounded-xl border border-green-500/20 bg-green-500/6 flex items-center gap-3">
          <Music size={14} className="text-green-400 shrink-0" />
          <p className="text-xs text-green-300">Use these as your starting brief in <Link to="/audio-studio" className="underline hover:no-underline">Audio Studio</Link>. Our team will tailor every detail to your brand.</p>
        </div>
      )}

      {/* Grids */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tab === 'campaign' && campaignTemplates.map(t => <CampaignCard key={t.id} t={t} search={search} />)}
        {tab === 'video' && videoTemplates.map(t => <VideoCard key={t.id} t={t} search={search} />)}
        {tab === 'audio' && audioTemplates.map(t => <AudioCard key={t.id} t={t} search={search} />)}
      </div>
    </>
  )
}

export default function Templates() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <DashboardLayout><TemplatesGrid /></DashboardLayout>
  }

  return (
    <div className="bg-slate-100 min-h-screen">
      <PublicHeader />
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Creative Templates</h1>
            <p className="text-base text-gray-500">Campaign copy, video scripts, and audio briefs — all pre-structured for African businesses.</p>
          </div>
          <TemplatesGrid />
        </div>
      </div>
    </div>
  )
}

