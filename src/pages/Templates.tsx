import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2, Hotel, GraduationCap, CreditCard, UtensilsCrossed, Calendar,
  ArrowRight, Film, Music, Zap, Search, Heart, ShoppingBag, Briefcase,
  Mic, Radio, Star, Play, Loader2, Trash2, User as UserIcon, Globe,
} from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { useAuth } from '../lib/AuthContext'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'

type Tab = 'campaign' | 'video' | 'audio'

interface DBTemplate {
  id: string
  user_id: string | null
  title: string
  industry: string
  objective: string
  tone: string
  description: string
  content: Record<string, unknown> | null
  is_public: boolean
  use_count: number
  created_at: string
}

/* ── Industry icon map ── */
const INDUSTRY_ICONS: Record<string, typeof Building2> = {
  'Real Estate': Building2,
  'Hospitality': Hotel,
  'Education': GraduationCap,
  'Fintech': CreditCard,
  'Restaurant': UtensilsCrossed,
  'Events': Calendar,
  'Health': Heart,
  'Retail': ShoppingBag,
  'Services': Briefcase,
  'Faith & Community': Heart,
}
const INDUSTRY_COLORS: Record<string, string> = {
  'Real Estate': '#10b981',
  'Hospitality': '#3b82f6',
  'Education': '#f59e0b',
  'Fintech': '#8b5cf6',
  'Restaurant': '#ef4444',
  'Events': '#06b6d4',
  'Health': '#ec4899',
  'Retail': '#f97316',
  'Services': '#64748b',
  'Faith & Community': '#7c3aed',
}

/* ── Video Script Templates (static) ── */
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

/* ── Audio Brief Templates (static) ── */
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

const INDUSTRY_MAP: Record<string, string> = {
  'Fintech': 'Fintech / SACCO',
  'Health': 'Health & Wellness',
  'Services': 'Professional Services',
}

/* ── Campaign template card ── */
function CampaignCard({ t, userId, onDelete, search }: {
  t: DBTemplate
  userId?: string
  onDelete?: (id: string) => void
  search: string
}) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  if (search) {
    const q = search.toLowerCase()
    if (!t.title.toLowerCase().includes(q) && !t.industry.toLowerCase().includes(q)) return null
  }

  const Icon = INDUSTRY_ICONS[t.industry] ?? Briefcase
  const color = INDUSTRY_COLORS[t.industry] ?? '#8b5cf6'
  const isOwn = userId && t.user_id === userId

  const handleUse = async () => {
    // Increment use count
    await supabase.from('campaign_templates').update({ use_count: t.use_count + 1 }).eq('id', t.id)
    // Navigate to new campaign with template data
    const industryParam = INDUSTRY_MAP[t.industry] ?? t.industry
    const params = new URLSearchParams({ industry: industryParam, objective: t.objective, tone: t.tone })
    navigate(`/new-campaign?${params.toString()}`)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this template?')) return
    setDeleting(true)
    await supabase.from('campaign_templates').delete().eq('id', t.id)
    onDelete?.(t.id)
    setDeleting(false)
  }

  return (
    <div className="card-glow p-6 hover:border-purple-500/30 transition-all duration-300 flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div className="flex items-center gap-1.5">
          {isOwn ? (
            <span className="badge flex items-center gap-1" style={{ background: '#7c3aed20', color: '#7c3aed' }}>
              <UserIcon size={9} /> Mine
            </span>
          ) : (
            <span className="badge flex items-center gap-1" style={{ background: `${color}15`, color }}>
              <Globe size={9} /> {t.industry}
            </span>
          )}
        </div>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-2">{t.title}</h3>
      {t.description && (
        <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{t.description}</p>
      )}
      {t.objective && !t.description && (
        <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{t.objective}</p>
      )}
      <div className="flex items-center gap-2 mb-5">
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-medium rounded-lg">{t.tone}</span>
        {t.use_count > 0 && (
          <span className="text-[10px] text-gray-400">{t.use_count}× used</span>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={handleUse}
          className="btn-outline text-xs flex-1 text-center gap-1.5">
          Use Template <ArrowRight size={12} />
        </button>
        {isOwn && onDelete && (
          <button onClick={handleDelete} disabled={deleting}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 shrink-0">
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        )}
      </div>
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
        <span className="badge" style={{ background: `${t.color}15`, color: t.color }}>{t.industry}</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{t.name}</h3>
      <div className="flex gap-2 mb-3">
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.duration}</span>
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.style}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{t.description}</p>
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
        <span className="badge" style={{ background: `${t.color}15`, color: t.color }}>{t.type}</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{t.name}</h3>
      <div className="flex gap-2 mb-3">
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.duration}</span>
        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg">{t.mood}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{t.description}</p>
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

/* ── Main grid component ── */
function TemplatesGrid({ userId }: { userId?: string }) {
  const [tab, setTab] = useState<Tab>('campaign')
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [templates, setTemplates] = useState<DBTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  useEffect(() => {
    supabase
      .from('campaign_templates')
      .select('*')
      .order('user_id', { ascending: true, nullsFirst: true })
      .order('use_count', { ascending: false })
      .then(({ data }) => {
        setTemplates((data ?? []) as DBTemplate[])
        setLoadingTemplates(false)
      })
  }, [])

  const industries = ['all', ...Array.from(new Set(templates.map(t => t.industry))).sort()]
  const myTemplates = templates.filter(t => t.user_id === userId)
  const systemTemplates = templates.filter(t => t.user_id === null)
  const filteredTemplates = (industryFilter === 'all' ? templates : templates.filter(t => t.industry === industryFilter))

  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id))

  const tabConfig = [
    { id: 'campaign' as Tab, icon: Zap, label: 'Campaign Copy', count: filteredTemplates.length, color: '#8b5cf6' },
    { id: 'video' as Tab, icon: Film, label: 'Video Scripts', count: videoTemplates.length, color: '#3b82f6' },
    { id: 'audio' as Tab, icon: Music, label: 'Audio Briefs', count: audioTemplates.length, color: '#10b981' },
  ]

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Pre-structured starting points for campaigns, video scripts, and audio briefs.</p>
        </div>
        {userId && myTemplates.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
            <UserIcon size={12} />
            {myTemplates.length} saved template{myTemplates.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 border-b border-gray-200 w-full sm:w-auto">
          {tabConfig.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 -mb-px transition-all ${
                  tab === t.id ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-600'
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
        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-8 text-sm w-full" placeholder="Search templates..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Industry filter — only for campaign tab */}
      {tab === 'campaign' && industries.length > 2 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {industries.map(ind => (
            <button key={ind} onClick={() => setIndustryFilter(ind)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                industryFilter === ind ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {ind === 'all' ? `All (${templates.length})` : ind}
            </button>
          ))}
        </div>
      )}

      {/* Video hint */}
      {tab === 'video' && (
        <div className="mb-5 p-3 rounded-xl border border-blue-500/20 bg-blue-500/6 flex items-center gap-3">
          <Film size={14} className="text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">These are narrative structures for your human creative. Start a concept in <Link to="/concept-studio" className="underline hover:no-underline">Concept Studio</Link> to brief your creator.</p>
        </div>
      )}
      {tab === 'audio' && (
        <div className="mb-5 p-3 rounded-xl border border-green-500/20 bg-green-500/6 flex items-center gap-3">
          <Music size={14} className="text-green-400 shrink-0" />
          <p className="text-xs text-green-300">Use these as your starting brief in <Link to="/audio-studio" className="underline hover:no-underline">Audio Studio</Link>. Our team will tailor every detail to your brand.</p>
        </div>
      )}

      {tab === 'campaign' && loadingTemplates ? (
        <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-purple-500" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tab === 'campaign' && filteredTemplates.map(t => (
            <CampaignCard key={t.id} t={t} userId={userId} onDelete={deleteTemplate} search={search} />
          ))}
          {tab === 'video' && videoTemplates.map(t => <VideoCard key={t.id} t={t} search={search} />)}
          {tab === 'audio' && audioTemplates.map(t => <AudioCard key={t.id} t={t} search={search} />)}
        </div>
      )}

      {tab === 'campaign' && !loadingTemplates && filteredTemplates.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Zap size={30} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-800 mb-1">No templates in this category</p>
          {userId && (
            <p className="text-sm">Save a campaign as a template from <Link to="/campaigns" className="text-purple-600 hover:underline">your campaigns</Link>.</p>
          )}
        </div>
      )}
    </>
  )
}

export default function Templates() {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated) {
    return <DashboardLayout><TemplatesGrid userId={user?.id} /></DashboardLayout>
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
