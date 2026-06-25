import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2, ArrowRight, ArrowLeft, Send, AlertCircle,
  Palette, Heart, Users, Mic2, User2, Layers, Star,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

// ─── Step definitions ─────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Theme Colors',   icon: Palette },
  { id: 2, label: 'Mood & Tone',    icon: Heart },
  { id: 3, label: 'Target Market',  icon: Users },
  { id: 4, label: 'Voice & Sound',  icon: Mic2 },
  { id: 5, label: 'Visual Style',   icon: Layers },
  { id: 6, label: 'Avatars',        icon: User2 },
  { id: 7, label: 'Review & Submit',icon: Star },
]

// ─── Data ─────────────────────────────────────────────────────────
const COLOR_PALETTES = [
  { id: 'golden',    name: 'Golden Hour',    colors: ['#1a0e00','#3d2100','#c97d30','#f5c86e','#fff9f0'], desc: 'Warm, premium, trustworthy' },
  { id: 'ocean',     name: 'Ocean Deep',     colors: ['#020e1a','#05254d','#1a6fa6','#38bdf8','#e0f7ff'], desc: 'Corporate, calm, credible' },
  { id: 'midnight',  name: 'Midnight Brand', colors: ['#08080f','#14142b','#5b21b6','#a78bfa','#f3f0ff'], desc: 'Premium, modern, tech-forward' },
  { id: 'earth',     name: 'Kenyan Earth',   colors: ['#0d0800','#2c1500','#8b4513','#d4856a','#fdf0e8'], desc: 'Cultural, authentic, grounded' },
  { id: 'forest',    name: 'Forest & Life',  colors: ['#010e04','#052e10','#15803d','#4ade80','#f0fdf4'], desc: 'Natural, health, sustainability' },
  { id: 'dusk',      name: 'City Dusk',      colors: ['#090909','#1a0a1e','#7c1d6f','#f472b6','#fdf2f8'], desc: 'Bold, fashion, entertainment' },
  { id: 'chrome',    name: 'Chrome & Steel', colors: ['#0a0a0a','#1c1c1c','#404040','#a3a3a3','#f5f5f5'], desc: 'Minimal, architectural, luxury' },
  { id: 'sunrise',   name: 'Nairobi Sunrise',colors: ['#0a0500','#1f0f00','#c2410c','#fb923c','#fff7ed'], desc: 'Energetic, local, vibrant' },
]

const MOODS = [
  { id: 'cinematic',    label: 'Cinematic',    emoji: '🎬', desc: 'Epic, dramatic, large scale. Award-show energy.' },
  { id: 'warm',         label: 'Warm & Human', emoji: '🌿', desc: 'Real people, real emotion, trust-building.' },
  { id: 'bold',         label: 'Bold & Direct',emoji: '⚡', desc: 'No-nonsense. Statement-making. Attention-grabbing.' },
  { id: 'luxury',       label: 'Luxury',       emoji: '✨', desc: 'Aspirational, refined, quiet confidence.' },
  { id: 'playful',      label: 'Playful',      emoji: '🎉', desc: 'Fun, youthful, high energy. Shareability first.' },
  { id: 'documentary',  label: 'Documentary',  emoji: '📽️', desc: 'Raw, real, story-first. Authentic footage.' },
  { id: 'corporate',    label: 'Corporate',    emoji: '🏢', desc: 'Professional, structured, data-confident.' },
  { id: 'emotional',    label: 'Emotional',    emoji: '💛', desc: 'Touches the heart. Stays in memory.' },
]

const AGE_GROUPS = ['13–17', '18–24', '25–34', '35–44', '45–54', '55+']
const LOCATIONS   = ['Nairobi CBD', 'Westlands / Parklands', 'Nairobi Suburbs', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Pan-Kenya', 'East Africa']
const INTERESTS   = ['Business & Finance', 'Real Estate', 'Family & Home', 'Tech & Innovation', 'Health & Fitness', 'Food & Lifestyle', 'Fashion & Beauty', 'Education & Career', 'Travel & Tourism', 'Entertainment']
const INCOMES     = ['Budget (Under KES 30K/mo)', 'Middle (KES 30–80K/mo)', 'Upper-middle (KES 80–200K/mo)', 'Affluent (KES 200K+/mo)']

const VOICE_GENDERS   = [{ id: 'female', label: 'Female' }, { id: 'male', label: 'Male' }, { id: 'both', label: 'Mix of both' }, { id: 'none', label: 'No narrator' }]
const VOICE_ACCENTS   = ['Kenyan English', 'Nigerian English', 'South African English', 'British English', 'American English', 'Kiswahili', 'Sheng / Code-switch']
const VOICE_TONES     = ['Authoritative & Confident', 'Warm & Friendly', 'Energetic & Exciting', 'Calm & Reassuring', 'Playful & Fun', 'Inspirational & Motivating', 'Storytelling & Narrative']
const MUSIC_GENRES    = ['Afro-soul / Acoustic', 'Afro-beat / Afro-fusion', 'Orchestral / Cinematic', 'Electronic / Modern', 'Jazz / Lo-fi', 'Gospel / Inspirational', 'No music (silence or ASMR)']

const VISUAL_STYLES = [
  { id: 'cinematic',   label: 'Cinematic Live Action', emoji: '🎥', desc: 'Real actors, locations, professional filming. High-end commercial look.' },
  { id: '3d',          label: '3D Animation',           emoji: '🧊', desc: 'Fully rendered 3D world. Characters, products, environments.' },
  { id: '2d',          label: '2D Illustration',         emoji: '✏️', desc: 'Hand-drawn or vector animated. Expressive and brand-flexible.' },
  { id: 'realistic',   label: 'Realistic Avatar-Led',   emoji: '🧑', desc: 'Photo-realistic AI avatars. Human delivery, no casting needed.' },
  { id: 'documentary', label: 'Documentary Style',       emoji: '📹', desc: 'Raw, handheld. Authentic interviews and real environments.' },
  { id: 'mixed',       label: 'Mixed Media',            emoji: '🎨', desc: 'Live action + motion graphics + animation combined.' },
]

const AVATAR_STYLES = [
  { id: 'none',        label: 'No Avatar',           emoji: '🚫', desc: 'Voiceover only — no on-screen presenter.' },
  { id: 'realistic',   label: 'Realistic Human',     emoji: '👤', desc: 'Photo-real AI-generated presenter. Looks like a real person.' },
  { id: 'illustrated', label: 'Illustrated Character',emoji: '🎨', desc: 'Branded illustrated character. Custom to your brand.' },
  { id: '3d',          label: '3D Character',        emoji: '🧊', desc: 'Full 3D animated character. Cinematic and modern.' },
  { id: 'abstract',    label: 'Abstract / Logo Anim',emoji: '💫', desc: 'No human form — animated brand identity or abstract shapes.' },
]

// ─── State shape ──────────────────────────────────────────────────
interface PreProductionState {
  palette: string
  moods: string[]
  ages: string[]
  locations: string[]
  interests: string[]
  income: string
  voiceGender: string
  voiceAccent: string
  voiceTone: string
  musicGenre: string
  visualStyle: string
  avatarStyle: string
}

const initial: PreProductionState = {
  palette: '', moods: [], ages: [], locations: [], interests: [],
  income: '', voiceGender: '', voiceAccent: '', voiceTone: '', musicGenre: '',
  visualStyle: '', avatarStyle: '',
}

// ─── Sub-components ────────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        active ? 'text-white border-purple-500/60 bg-purple-500/20' : 'text-gray-500 border-gray-200 bg-white/3 hover:border-white/20 hover:text-white'
      }`}>
      {children}
    </button>
  )
}

function StepCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
      {children}
    </div>
  )
}

// ─── Step components ───────────────────────────────────────────────
function Step1({ state, setState }: { state: PreProductionState; setState: (s: Partial<PreProductionState>) => void }) {
  return (
    <StepCard title="Theme Colors" desc="Choose a colour palette that defines the visual world of your production.">
      <div className="grid sm:grid-cols-2 gap-3">
        {COLOR_PALETTES.map(p => (
          <button key={p.id} onClick={() => setState({ palette: p.id })}
            className={`p-4 rounded-2xl border text-left transition-all ${
              state.palette === p.id ? 'border-purple-500/60 bg-purple-500/8' : 'border-gray-200 bg-white/2 hover:border-gray-300'
            }`}>
            <div className="flex gap-1.5 mb-3">
              {p.colors.map((c, i) => (
                <div key={i} className="h-6 flex-1 rounded-md" style={{ background: c }} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </div>
              {state.palette === p.id && <CheckCircle2 size={16} className="text-purple-400 shrink-0" />}
            </div>
          </button>
        ))}
      </div>
    </StepCard>
  )
}

function Step2({ state, setState }: { state: PreProductionState; setState: (s: Partial<PreProductionState>) => void }) {
  const toggle = (id: string) => setState({ moods: state.moods.includes(id) ? state.moods.filter(m => m !== id) : [...state.moods, id] })
  return (
    <StepCard title="Mood & Tone" desc="Select up to 3 moods that describe how the production should feel.">
      <div className="grid sm:grid-cols-2 gap-3">
        {MOODS.map(m => (
          <button key={m.id} onClick={() => toggle(m.id)}
            disabled={!state.moods.includes(m.id) && state.moods.length >= 3}
            className={`p-4 rounded-2xl border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              state.moods.includes(m.id) ? 'border-purple-500/60 bg-purple-500/8' : 'border-gray-200 bg-white/2 hover:border-gray-300'
            }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{m.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">{m.label}</p>
                  {state.moods.includes(m.id) && <CheckCircle2 size={14} className="text-purple-400" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </StepCard>
  )
}

function Step3({ state, setState }: { state: PreProductionState; setState: (s: Partial<PreProductionState>) => void }) {
  const toggleAge = (a: string) => setState({ ages: state.ages.includes(a) ? state.ages.filter(x => x !== a) : [...state.ages, a] })
  const toggleLoc = (l: string) => setState({ locations: state.locations.includes(l) ? state.locations.filter(x => x !== l) : [...state.locations, l] })
  const toggleInt = (i: string) => setState({ interests: state.interests.includes(i) ? state.interests.filter(x => x !== i) : [...state.interests, i] })
  return (
    <StepCard title="Target Market" desc="Define exactly who this production is for.">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Age Groups</p>
          <div className="flex flex-wrap gap-2">{AGE_GROUPS.map(a => <Chip key={a} active={state.ages.includes(a)} onClick={() => toggleAge(a)}>{a}</Chip>)}</div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Primary Locations</p>
          <div className="flex flex-wrap gap-2">{LOCATIONS.map(l => <Chip key={l} active={state.locations.includes(l)} onClick={() => toggleLoc(l)}>{l}</Chip>)}</div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Interests & Lifestyle</p>
          <div className="flex flex-wrap gap-2">{INTERESTS.map(i => <Chip key={i} active={state.interests.includes(i)} onClick={() => toggleInt(i)}>{i}</Chip>)}</div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Income Level</p>
          <div className="flex flex-wrap gap-2">{INCOMES.map(i => <Chip key={i} active={state.income === i} onClick={() => setState({ income: i })}>{i}</Chip>)}</div>
        </div>
      </div>
    </StepCard>
  )
}

function Step4({ state, setState }: { state: PreProductionState; setState: (s: Partial<PreProductionState>) => void }) {
  return (
    <StepCard title="Voice & Sound" desc="Define the audio personality of your production.">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Narrator Voice</p>
          <div className="grid grid-cols-2 gap-2">
            {VOICE_GENDERS.map(g => (
              <button key={g.id} onClick={() => setState({ voiceGender: g.id })}
                className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                  state.voiceGender === g.id ? 'border-purple-500/60 bg-purple-500/15 text-purple-300' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-white'
                }`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Accent / Language</p>
          <div className="flex flex-wrap gap-2">{VOICE_ACCENTS.map(a => <Chip key={a} active={state.voiceAccent === a} onClick={() => setState({ voiceAccent: a })}>{a}</Chip>)}</div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Narration Tone</p>
          <div className="flex flex-wrap gap-2">{VOICE_TONES.map(t => <Chip key={t} active={state.voiceTone === t} onClick={() => setState({ voiceTone: t })}>{t}</Chip>)}</div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Music Direction</p>
          <div className="flex flex-wrap gap-2">{MUSIC_GENRES.map(m => <Chip key={m} active={state.musicGenre === m} onClick={() => setState({ musicGenre: m })}>{m}</Chip>)}</div>
        </div>
      </div>
    </StepCard>
  )
}

function Step5({ state, setState }: { state: PreProductionState; setState: (s: Partial<PreProductionState>) => void }) {
  return (
    <StepCard title="Visual Style" desc="How should this production look? This defines the entire production approach.">
      <div className="grid sm:grid-cols-2 gap-3">
        {VISUAL_STYLES.map(s => (
          <button key={s.id} onClick={() => setState({ visualStyle: s.id })}
            className={`p-5 rounded-2xl border text-left transition-all ${
              state.visualStyle === s.id ? 'border-purple-500/60 bg-purple-500/8' : 'border-gray-200 bg-white/2 hover:border-gray-300'
            }`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{s.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">{s.label}</p>
                  {state.visualStyle === s.id && <CheckCircle2 size={14} className="text-purple-400" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{s.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </StepCard>
  )
}

function Step6({ state, setState }: { state: PreProductionState; setState: (s: Partial<PreProductionState>) => void }) {
  return (
    <StepCard title="Avatars" desc="Will your production feature an on-screen presenter or character?">
      <div className="grid sm:grid-cols-2 gap-3">
        {AVATAR_STYLES.map(a => (
          <button key={a.id} onClick={() => setState({ avatarStyle: a.id })}
            className={`p-5 rounded-2xl border text-left transition-all ${
              state.avatarStyle === a.id ? 'border-purple-500/60 bg-purple-500/8' : 'border-gray-200 bg-white/2 hover:border-gray-300'
            }`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{a.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">{a.label}</p>
                  {state.avatarStyle === a.id && <CheckCircle2 size={14} className="text-purple-400" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{a.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </StepCard>
  )
}

function Step7({ state, conceptTitle }: { state: PreProductionState; conceptTitle: string }) {
  const palette = COLOR_PALETTES.find(p => p.id === state.palette)
  const selectedMoods = MOODS.filter(m => state.moods.includes(m.id))
  const visualStyle = VISUAL_STYLES.find(v => v.id === state.visualStyle)
  const avatarStyle = AVATAR_STYLES.find(a => a.id === state.avatarStyle)

  const rows = [
    { label: 'Concept', value: conceptTitle || 'Untitled Concept' },
    { label: 'Colour Palette', value: palette?.name || '—' },
    { label: 'Mood', value: selectedMoods.map(m => m.label).join(', ') || '—' },
    { label: 'Ages', value: state.ages.join(', ') || '—' },
    { label: 'Locations', value: state.locations.join(', ') || '—' },
    { label: 'Interests', value: state.interests.join(', ') || '—' },
    { label: 'Income', value: state.income || '—' },
    { label: 'Narrator', value: [VOICE_GENDERS.find(g => g.id === state.voiceGender)?.label, state.voiceAccent, state.voiceTone].filter(Boolean).join(' · ') || '—' },
    { label: 'Music', value: state.musicGenre || '—' },
    { label: 'Visual Style', value: visualStyle?.label || '—' },
    { label: 'Avatar Style', value: avatarStyle?.label || '—' },
  ]

  return (
    <StepCard title="Review & Submit" desc="Confirm your pre-production brief before it goes to your creator.">
      <div className="card p-5 mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Production Brief Summary</p>
        <div className="space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <p className="text-xs text-gray-600 w-28 shrink-0 pt-0.5">{label}</p>
              <p className="text-sm text-white">{value}</p>
            </div>
          ))}
        </div>
        {palette && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Colour Palette Preview</p>
            <div className="flex gap-1.5 h-6">
              {palette.colors.map((c, i) => <div key={i} className="flex-1 rounded-md" style={{ background: c }} />)}
            </div>
          </div>
        )}
      </div>
      <div className="rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Ready to go to production</p>
            <p className="text-xs text-gray-500 mt-0.5">Once you submit, your creator receives this brief and will reach out within 24 hours to begin production.</p>
          </div>
        </div>
      </div>
    </StepCard>
  )
}

// ─── Main page ─────────────────────────────────────────────────────
export default function PreProduction() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const conceptTitle = params.get('concept') || 'Your Concept'
  const [step, setStep] = useState(1)
  const [state, setStateRaw] = useState<PreProductionState>(initial)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const setState = (partial: Partial<PreProductionState>) => setStateRaw(prev => ({ ...prev, ...partial }))

  const handleSubmit = async () => {
    setSubmitError('')
    setSubmitting(true)
    const { data: brandKit } = await supabase
      .from('brand_kits')
      .select('business_name, phone, whatsapp')
      .eq('user_id', user?.id ?? '')
      .maybeSingle()
    const { error } = await supabase.from('package_requests').insert({
      user_id: user?.id ?? null,
      name: user?.name || '',
      business: brandKit?.business_name || conceptTitle,
      phone: brandKit?.phone || brandKit?.whatsapp || '',
      email: user?.email || '',
      industry: '',
      service: 'video-production',
      brief: { conceptTitle, ...state },
      timeline: '',
      budget: '',
    })
    setSubmitting(false)
    if (error) {
      setSubmitError(error.message)
    } else {
      setSubmitted(true)
    }
  }

  const stepProps = { state, setState }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))' }}>
            <CheckCircle2 size={36} className="text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Brief Submitted!</h1>
          <p className="text-gray-500 mb-2">Your pre-production brief for <span className="text-white font-semibold">"{conceptTitle}"</span> has been sent to your creator.</p>
          <p className="text-sm text-gray-500 mb-8">Expect a response within 24 hours. You'll receive updates via email and on your dashboard.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/dashboard" className="btn-secondary px-6 py-2.5 text-sm">Back to Dashboard</Link>
            <Link to="/concept-studio" className="btn-primary px-6 py-2.5 text-sm">New Concept <ArrowRight size={14} /></Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Link to="/concept-studio" className="hover:text-purple-400 transition-colors">Concept Studio</Link>
          <span>/</span>
          <span className="text-white">Pre-Production</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Pre-Production Setup</h1>
        <p className="text-sm text-gray-500 mt-1">"{conceptTitle}" — define the look, feel, and voice of your production.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">

        {/* Sidebar stepper */}
        <div className="lg:col-span-1">
          <div className="card-glow p-4 sticky top-8">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-1">Phases</p>
            <div className="space-y-1">
              {STEPS.map((s, i) => {
                const done = step > s.id
                const active = step === s.id
                return (
                  <button key={s.id} onClick={() => done && setStep(s.id)}
                    disabled={!done && !active}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      active ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                      : done  ? 'text-gray-600 hover:bg-gray-50 cursor-pointer'
                      : 'text-gray-600 cursor-not-allowed'
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      done ? 'bg-emerald-500/20 text-emerald-400' : active ? 'bg-purple-500/30 text-purple-300' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {done ? <CheckCircle2 size={14} /> : s.id}
                    </div>
                    <div>
                      <p className="text-xs leading-tight">{s.label}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {/* Progress */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
                <span>Progress</span>
                <span>{Math.round(((step - 1) / STEPS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${((step - 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="card-glow p-7 mb-4">
            {step === 1 && <Step1 {...stepProps} />}
            {step === 2 && <Step2 {...stepProps} />}
            {step === 3 && <Step3 {...stepProps} />}
            {step === 4 && <Step4 {...stepProps} />}
            {step === 5 && <Step5 {...stepProps} />}
            {step === 6 && <Step6 {...stepProps} />}
            {step === 7 && <Step7 state={state} conceptTitle={conceptTitle} />}
          </div>

          {/* Navigation */}
          {submitError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              <AlertCircle size={13} /> {submitError}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 bg-white/3 hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowLeft size={15} /> Back
            </button>

            <p className="text-xs text-gray-600">Step {step} of {STEPS.length}</p>

            {step < STEPS.length ? (
              <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 16px rgba(139,92,246,0.35)' }}>
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 20px rgba(16,185,129,0.35)' }}>
                <Send size={15} /> {submitting ? 'Submitting...' : 'Submit to Creator'}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

