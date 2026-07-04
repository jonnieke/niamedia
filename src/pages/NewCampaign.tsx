import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Sparkles, Loader2, Check, Zap,
  MessageSquare, Send, Globe, Target, Users, Radio, BookOpen,
  TrendingUp, Lightbulb, AlertCircle, RefreshCw, X,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { CampaignFormData } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

/* ── Constants ───────────────────────────────────────────────── */
const INDUSTRIES = ['Real Estate','Hospitality','Education','Fintech / SACCO','Restaurant','Travel','Retail','Health & Wellness','Events','Professional Services','Faith & Community','Other']
const OBJECTIVES = ['Get leads','Sell product','Promote offer','Increase bookings','Launch product','Grow social media','Drive WhatsApp enquiries']
const TONES = ['Professional','Friendly','Bold','Luxury','Youthful','Emotional','Direct sales']
const PLATFORMS = ['Facebook','Instagram','TikTok','YouTube Shorts','WhatsApp','LinkedIn']
const CTAS = ['Call now','WhatsApp us','Book now','Apply today','Visit website','Send message','Shop now','Get a quote']
const LOCATIONS = ['Nairobi CBD','Westlands / Parklands','Karen / Langata','Kilimani / Lavington','Mombasa','Kisumu','Nakuru','Kenya-wide','East Africa','Global']
const CAMPAIGN_TYPES = [
  { id: 'social', label: 'Social Media', icon: Globe, desc: 'Captions, hooks, hashtags' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, desc: 'Broadcasts & messages' },
  { id: 'video', label: 'Video Concept', icon: Radio, desc: 'Script & shot list' },
  { id: 'article', label: 'Article / SEO', icon: BookOpen, desc: 'Blog + keyword strategy' },
  { id: 'full', label: 'Full Mix', icon: Sparkles, desc: 'Everything above' },
]

const empty: CampaignFormData = {
  business_name: '', industry: '', product_name: '', objective: '',
  target_audience: '', location: '', offer: '', tone: 'Professional',
  platforms: [], cta: '', notes: '', whatsapp_number: '', business_url: '',
}

/* ── Types ───────────────────────────────────────────────────── */
interface ResearchInsights {
  marketContext: string
  messagingAngles: { title: string; description: string; hook: string }[]
  seoKeywords: string[]
  platformTips: { platform: string; tip: string }[]
  competitorWatch: string
  budgetNote: string
  advisoryNote: string
}

interface PastCampaign { id: string; title: string; created_at: string }

/* ── Step indicator ──────────────────────────────────────────── */
const STEPS = ['Business', 'Goal', 'Audience', 'Channels', 'Research']

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              done ? 'text-white' : active ? 'text-white' : 'text-gray-400 border-2 border-gray-200'
            }`} style={done || active ? { background: done ? '#059669' : 'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}}>
              {done ? <Check size={12} /> : idx}
            </div>
            <span className={`text-xs font-medium truncate ${active ? 'text-gray-900' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ml-1 ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

/* ── Nia mini chat ───────────────────────────────────────────── */
function NiaPanel({ step, form, onUpdate, userId }: {
  step: number
  form: CampaignFormData
  onUpdate: (updates: Partial<CampaignFormData>) => void
  userId: string | undefined
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'nia'; text: string }[]>([
    { role: 'nia', text: "Hey! Describe your business or campaign in your own words — I'll fill in the details for you." }
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nia-wizard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ message: trimmed, currentForm: form, step, userId }),
      })
      const data = await res.json() as { message: string; updates: Partial<CampaignFormData> }
      setMessages(prev => [...prev, { role: 'nia', text: data.message }])
      if (data.updates && Object.keys(data.updates).length > 0) {
        onUpdate(data.updates)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'nia', text: 'Something went wrong — try again!' }])
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ maxHeight: 420 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-white text-sm font-semibold flex-1">Ask Nia</span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-sm px-3 py-2 rounded-2xl leading-relaxed ${
                  m.role === 'user' ? 'text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`} style={m.role === 'user' ? { background: 'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-purple-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-purple-400"
              placeholder="e.g. I sell wedding cakes in Westlands..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Send size={13} className="text-white" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
        {open ? <X size={18} className="text-white" /> : <MessageSquare size={18} className="text-white" />}
      </button>
    </div>
  )
}

/* ── Main wizard ─────────────────────────────────────────────── */
export default function NewCampaign() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CampaignFormData & { campaign_type?: string }>({ ...empty })
  const [returning, setReturning] = useState<{ filled: boolean; pastCampaigns: PastCampaign[] } | null>(null)
  const [research, setResearch] = useState<ResearchInsights | null>(null)
  const [selectedAngle, setSelectedAngle] = useState(0)
  const [researchLoading, setResearchLoading] = useState(false)
  const [researchError, setResearchError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [error, setError] = useState('')

  const GEN_STEPS = ['Reading your brief…','Running market research…','Crafting your strategy…','Writing your campaign…','Finalising…']

  const update = (patch: Partial<CampaignFormData & { campaign_type?: string }>) =>
    setForm(prev => ({ ...prev, ...patch }))

  /* Load brand kit + past campaigns */
  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('brand_kits').select('business_name,industry,preferred_tone,target_customer,whatsapp_number,website_url').eq('user_id', user.id).single(),
      supabase.from('campaigns').select('id,business_name,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    ]).then(([brand, camps]) => {
      const b = brand.data
      const pastCampaigns = (camps.data ?? []).map(c => ({ id: c.id, title: c.business_name, created_at: c.created_at }))
      if (b) {
        setForm(prev => ({
          ...prev,
          business_name: searchParams.get('business') || prev.business_name || b.business_name || '',
          industry: searchParams.get('industry') || prev.industry || b.industry || '',
          tone: searchParams.get('tone') || prev.tone || b.preferred_tone || 'Professional',
          target_audience: prev.target_audience || b.target_customer || '',
          whatsapp_number: prev.whatsapp_number || b.whatsapp_number || '',
          business_url: prev.business_url || b.website_url || '',
        }))
      }
      setReturning({ filled: !!b, pastCampaigns })
    })
  }, [user])

  /* Pre-fill from template URL params */
  useEffect(() => {
    const objective = searchParams.get('objective')
    const tone = searchParams.get('tone')
    if (objective) update({ objective })
    if (tone) update({ tone })
  }, [])

  const togglePlatform = (p: string) =>
    update({ platforms: form.platforms.includes(p) ? form.platforms.filter(x => x !== p) : [...form.platforms, p] })

  const canAdvance = () => {
    if (step === 1) return !!form.business_name && !!form.industry && !!form.product_name
    if (step === 2) return !!form.objective && !!form.offer
    if (step === 3) return !!form.target_audience
    if (step === 4) return form.platforms.length > 0 && !!form.tone
    return true
  }

  const runResearch = async () => {
    setResearchLoading(true)
    setResearchError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campaign-research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ ...form }),
      })
      const data = await res.json() as ResearchInsights
      setResearch(data)
    } catch {
      setResearchError('Research failed — you can still generate your campaign.')
    }
    setResearchLoading(false)
  }

  const next = () => {
    if (step === 4) { setStep(5); runResearch(); return }
    setStep(s => s + 1)
  }

  const generateCampaign = async () => {
    if (!user) return
    setGenerating(true); setError('')

    // Enrich notes with research insights
    const researchContext = research ? [
      `MARKET CONTEXT: ${research.marketContext}`,
      research.messagingAngles[selectedAngle]
        ? `PREFERRED MESSAGING ANGLE: "${research.messagingAngles[selectedAngle].title}" — ${research.messagingAngles[selectedAngle].description}. Hook: ${research.messagingAngles[selectedAngle].hook}`
        : '',
      research.seoKeywords?.length ? `TARGET KEYWORDS: ${research.seoKeywords.join(', ')}` : '',
      research.competitorWatch ? `COMPETITIVE CONTEXT: ${research.competitorWatch}` : '',
      research.advisoryNote ? `STRATEGIC NOTE: ${research.advisoryNote}` : '',
    ].filter(Boolean).join('\n') : ''

    const enrichedForm = {
      ...form,
      notes: [form.notes, researchContext].filter(Boolean).join('\n\n'),
    }

    const ticker = setInterval(() => setGenStep(s => Math.min(s + 1, GEN_STEPS.length - 1)), 1800)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ form: enrichedForm, language: 'en', userId: user.id }),
      })

      if (!res.ok) throw new Error('Generation failed')
      const result = await res.json()
      clearInterval(ticker)
      navigate('/campaign-results', { state: { campaign: result, form: enrichedForm } })
    } catch (e) {
      clearInterval(ticker)
      setError(e instanceof Error ? e.message : 'Generation failed')
      setGenerating(false); setGenStep(0)
    }
  }

  /* ── Generating overlay ────────────────────────────────────── */
  if (generating) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Sparkles size={28} className="text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Building your campaign</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-sm">{GEN_STEPS[genStep]}</p>
          <div className="flex gap-2">
            {GEN_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= genStep ? 'w-8' : 'w-3 bg-gray-200'}`}
                style={i <= genStep ? { background: 'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="section-tag">Campaign Builder</span>
            {returning?.filled && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Brand loaded ✓
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
          <p className="text-sm text-gray-500 mt-0.5">Answer a few questions — or just describe it to Nia below.</p>
        </div>

        <StepBar current={step} />

        {/* Past campaigns (returning users, step 1 only) */}
        {step === 1 && returning && returning.pastCampaigns.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl border border-purple-100 bg-purple-50">
            <p className="text-xs font-bold text-purple-700 mb-2">Continue a past campaign</p>
            <div className="flex gap-2 flex-wrap">
              {returning.pastCampaigns.map(c => (
                <button key={c.id}
                  onClick={() => navigate(`/campaigns/${c.id}`)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:border-purple-400 transition-all">
                  {c.title || 'Campaign'} →
                </button>
              ))}
              <button onClick={() => setForm({ ...empty })}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700">
                Start fresh
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Business ──────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="card-glow p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Your Business</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Business name *</label>
                  <input className="input" value={form.business_name}
                    onChange={e => update({ business_name: e.target.value })}
                    placeholder="e.g. Kilele Bakery" />
                </div>
                <div>
                  <label className="label">Industry *</label>
                  <select className="input" value={form.industry} onChange={e => update({ industry: e.target.value })}>
                    <option value="">Select industry…</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">What are you promoting? *</label>
                  <input className="input" value={form.product_name}
                    onChange={e => update({ product_name: e.target.value })}
                    placeholder="e.g. Wedding cakes, 3-bedroom apartment, SACCO membership" />
                </div>
                <div>
                  <label className="label">Your unique edge <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input className="input" value={form.notes}
                    onChange={e => update({ notes: e.target.value })}
                    placeholder="e.g. Only bakery in Westlands open 24/7, free delivery over 5km" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Goal ──────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="card-glow p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Campaign Goal</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">What do you want to achieve? *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {OBJECTIVES.map(obj => (
                      <button key={obj} onClick={() => update({ objective: obj })}
                        className={`text-xs font-medium px-3 py-2.5 rounded-xl border text-left transition-all ${
                          form.objective === obj
                            ? 'border-purple-400 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        <Target size={11} className="mb-1 opacity-60" />
                        <br />{obj}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Your offer or hook *</label>
                  <input className="input" value={form.offer}
                    onChange={e => update({ offer: e.target.value })}
                    placeholder="e.g. 30% off this weekend, Free tasting session, No deposit required" />
                  <p className="text-xs text-gray-400 mt-1">What makes someone stop scrolling right now?</p>
                </div>
                <div>
                  <label className="label">Call to action</label>
                  <select className="input" value={form.cta} onChange={e => update({ cta: e.target.value })}>
                    <option value="">Select CTA…</option>
                    {CTAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Audience ──────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="card-glow p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Your Audience</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Who are you talking to? *</label>
                  <textarea className="input" rows={3} value={form.target_audience}
                    onChange={e => update({ target_audience: e.target.value })}
                    placeholder="e.g. Brides-to-be aged 25–38, working professionals planning a wedding in Nairobi in 2026" />
                  <p className="text-xs text-gray-400 mt-1">Be as specific as you can — this shapes every word of the campaign.</p>
                </div>
                <div>
                  <label className="label">Where are they?</label>
                  <select className="input" value={form.location} onChange={e => update({ location: e.target.value })}>
                    <option value="">Select location…</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">WhatsApp / contact number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input className="input" value={form.whatsapp_number ?? ''}
                    onChange={e => update({ whatsapp_number: e.target.value })}
                    placeholder="e.g. 254712345678" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Channels ──────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="card-glow p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Campaign Format</h2>
              <div className="space-y-5">
                <div>
                  <label className="label">Campaign type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {CAMPAIGN_TYPES.map(ct => {
                      const Icon = ct.icon
                      const active = form.campaign_type === ct.id
                      return (
                        <button key={ct.id} onClick={() => update({ campaign_type: ct.id })}
                          className={`text-left px-3 py-3 rounded-xl border transition-all ${
                            active ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <Icon size={14} className={active ? 'text-purple-600 mb-1' : 'text-gray-400 mb-1'} />
                          <p className={`text-xs font-semibold ${active ? 'text-purple-700' : 'text-gray-700'}`}>{ct.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{ct.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="label">Platforms *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PLATFORMS.map(p => (
                      <button key={p} onClick={() => togglePlatform(p)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                          form.platforms.includes(p)
                            ? 'border-purple-400 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>{p}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Tone *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TONES.map(t => (
                      <button key={t} onClick={() => update({ tone: t })}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                          form.tone === t
                            ? 'border-purple-400 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Research & Strategy ───────────────────── */}
        {step === 5 && (
          <div className="space-y-4">
            {researchLoading && (
              <div className="card-glow p-8 text-center">
                <Loader2 size={24} className="animate-spin text-purple-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">Researching your market…</p>
                <p className="text-sm text-gray-500">Analysing trends, angles, and keywords for your campaign</p>
              </div>
            )}

            {researchError && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700 flex-1">{researchError}</p>
                <button onClick={runResearch} className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1">
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {research && (
              <>
                {/* Market context */}
                <div className="card-glow p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-purple-500" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Market Context</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{research.marketContext}</p>
                </div>

                {/* Messaging angles */}
                <div className="card-glow p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-purple-500" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pick your messaging angle</p>
                  </div>
                  <div className="space-y-2">
                    {research.messagingAngles.map((angle, i) => (
                      <button key={i} onClick={() => setSelectedAngle(i)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedAngle === i
                            ? 'border-purple-400 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                            selectedAngle === i ? 'border-purple-500' : 'border-gray-300'
                          }`}>
                            {selectedAngle === i && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold mb-0.5 ${selectedAngle === i ? 'text-purple-700' : 'text-gray-800'}`}>
                              {angle.title}
                            </p>
                            <p className="text-xs text-gray-500 mb-1.5">{angle.description}</p>
                            <p className="text-xs italic text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                              "{angle.hook}"
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SEO keywords */}
                {research.seoKeywords?.length > 0 && (
                  <div className="card-glow p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Target Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {research.seoKeywords.map(kw => (
                        <span key={kw} className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform tips */}
                {research.platformTips?.length > 0 && (
                  <div className="card-glow p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Platform Strategy</p>
                    <div className="space-y-2">
                      {research.platformTips.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="font-semibold text-gray-800 shrink-0 w-24">{t.platform}</span>
                          <span className="text-gray-600">{t.tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advisory note */}
                {(research.competitorWatch || research.advisoryNote) && (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Strategic Advisory</p>
                    {research.competitorWatch && <p className="text-sm text-amber-800 mb-1">⚡ {research.competitorWatch}</p>}
                    {research.advisoryNote && <p className="text-sm text-amber-800">💡 {research.advisoryNote}</p>}
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        )}

        {/* ── Nav buttons ───────────────────────────────────── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button onClick={next} disabled={!canAdvance()}
              className="btn-primary text-sm px-6 py-2.5 gap-2 disabled:opacity-40">
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={generateCampaign}
              disabled={generating || researchLoading}
              className="btn-primary text-sm px-6 py-2.5 gap-2 disabled:opacity-50">
              {generating
                ? <><Loader2 size={14} className="animate-spin" /> Building…</>
                : <><Zap size={14} /> Build My Campaign</>}
            </button>
          )}
        </div>
      </div>

      {/* Floating Nia chat — steps 1-4 */}
      {step < 5 && (
        <NiaPanel step={step} form={form} onUpdate={update} userId={user?.id} />
      )}
    </DashboardLayout>
  )
}
