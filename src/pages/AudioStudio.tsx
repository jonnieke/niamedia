import { useState, useRef } from 'react'
import { Music, Mic, Radio, ChevronRight, Check, Lock, Play, Pause, Clock, Info, Volume2, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type AudioType = 'jingle' | 'voiceover' | 'radio-spot'

interface AudioPackage {
  id: string
  label: string
  price: number
  duration: string
  description: string
  popular?: boolean
}

const PACKAGES: Record<AudioType, AudioPackage[]> = {
  jingle: [
    { id: 'j15', label: 'Jingle 15s', price: 2000, duration: '15 seconds', description: 'Brand melody, hook, tagline â€” perfect for social ads' },
    { id: 'j30', label: 'Jingle 30s', price: 3500, duration: '30 seconds', description: 'Full brand song with verse, hook, and sign-off', popular: true },
    { id: 'j60', label: 'Jingle 60s', price: 5500, duration: '60 seconds', description: 'Extended radio-ready brand anthem with full arrangement' },
  ],
  voiceover: [
    { id: 'vo30', label: 'VO 30s', price: 1500, duration: '30 seconds', description: 'Crisp professional read for digital ads' },
    { id: 'vo60', label: 'VO 60s', price: 2500, duration: '60 seconds', description: 'Long-form explainer or product story', popular: true },
    { id: 'vo120', label: 'VO 2 min', price: 4000, duration: '2 minutes', description: 'Narration, e-learning, documentary-style VO' },
  ],
  'radio-spot': [
    { id: 'rs15', label: 'Radio Spot 15s', price: 3500, duration: '15 seconds', description: 'Quick-fire station ID or promo' },
    { id: 'rs30', label: 'Radio Spot 30s', price: 5500, duration: '30 seconds', description: 'Full produced spot with SFX, VO, music bed', popular: true },
    { id: 'rs60', label: 'Radio Spot 60s', price: 8000, duration: '60 seconds', description: 'Premium broadcast-ready radio commercial' },
    { id: 'rs-pkg', label: 'Radio Package', price: 14000, duration: '3 Ã— 30s spots', description: '3 variations for A/B campaign rotation' },
  ],
}

const MOODS = ['Upbeat & Energetic', 'Warm & Soulful', 'Confident & Bold', 'Calm & Reassuring', 'Playful & Fun', 'Inspirational', 'Corporate & Professional', 'Afro-Fusion']
interface Voice {
  id: string
  label: string
  accent: string
  gender: 'F' | 'M'
  ageGroup: string
  ageTag: string
}

const VOICE_GROUPS: { label: string; emoji: string; voices: Voice[] }[] = [
  {
    label: 'Kids',
    emoji: 'ðŸ§’',
    voices: [
      { id: 'af-child-f', label: 'Girl â€” Bright & Clear', accent: 'AF', gender: 'F', ageGroup: 'Kids', ageTag: '6â€“12' },
      { id: 'af-child-m', label: 'Boy â€” Playful', accent: 'AF', gender: 'M', ageGroup: 'Kids', ageTag: '6â€“12' },
    ],
  },
  {
    label: 'Teens',
    emoji: 'ðŸŽ¤',
    voices: [
      { id: 'af-teen-f', label: 'Teen Girl â€” Energetic', accent: 'AF', gender: 'F', ageGroup: 'Teens', ageTag: '13â€“19' },
      { id: 'af-teen-m', label: 'Teen Boy â€” Confident', accent: 'AF', gender: 'M', ageGroup: 'Teens', ageTag: '13â€“19' },
    ],
  },
  {
    label: 'Young Adults',
    emoji: 'ðŸ‘¤',
    voices: [
      { id: 'km-f', label: 'Kenyan English â€” Female', accent: 'KE', gender: 'F', ageGroup: 'Young Adult', ageTag: '20â€“35' },
      { id: 'km-m', label: 'Kenyan English â€” Male', accent: 'KE', gender: 'M', ageGroup: 'Young Adult', ageTag: '20â€“35' },
      { id: 'sw-f', label: 'Kiswahili â€” Female', accent: 'SW', gender: 'F', ageGroup: 'Young Adult', ageTag: '20â€“35' },
      { id: 'sw-m', label: 'Kiswahili â€” Male', accent: 'SW', gender: 'M', ageGroup: 'Young Adult', ageTag: '20â€“35' },
      { id: 'ng-f', label: 'Nigerian English â€” Female', accent: 'NG', gender: 'F', ageGroup: 'Young Adult', ageTag: '20â€“35' },
      { id: 'sa-m', label: 'South African â€” Male', accent: 'SA', gender: 'M', ageGroup: 'Young Adult', ageTag: '20â€“35' },
    ],
  },
  {
    label: 'Mature',
    emoji: 'ðŸ§‘',
    voices: [
      { id: 'af-mature-f', label: 'Mature â€” Female', accent: 'AF', gender: 'F', ageGroup: 'Mature', ageTag: '35â€“55' },
      { id: 'af-mature-m', label: 'Mature â€” Male', accent: 'AF', gender: 'M', ageGroup: 'Mature', ageTag: '35â€“55' },
    ],
  },
  {
    label: 'Elder',
    emoji: 'ðŸ‘´',
    voices: [
      { id: 'af-elder-f', label: 'Elder â€” Female', accent: 'AF', gender: 'F', ageGroup: 'Elder', ageTag: '55+' },
      { id: 'af-elder-m', label: 'Elder â€” Male', accent: 'AF', gender: 'M', ageGroup: 'Elder', ageTag: '55+' },
    ],
  },
]

const VOICES: Voice[] = VOICE_GROUPS.flatMap(g => g.voices)
const PLATFORMS = ['Radio', 'Instagram', 'Facebook', 'YouTube', 'TikTok', 'TV', 'In-store / PA', 'Podcast']

const typeInfo: Record<AudioType, { icon: typeof Music; label: string; desc: string; color: string }> = {
  jingle: { icon: Music, label: 'Jingle', desc: 'Catchy branded melody with your tagline', color: '#8b5cf6' },
  voiceover: { icon: Mic, label: 'Voice Over', desc: 'Professional read for ads, explainers, docs', color: '#3b82f6' },
  'radio-spot': { icon: Radio, label: 'Radio Spot', desc: 'Fully produced radio-ready commercial', color: '#10b981' },
}

export default function AudioStudio() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [audioType, setAudioType] = useState<AudioType>('jingle')
  const [selectedPkg, setSelectedPkg] = useState<AudioPackage | null>(null)
  const [brief, setBrief] = useState({ business: '', description: '', targetAudience: '', message: '', mood: '', voice: '', platforms: [] as string[], extra: '' })
  const [playing, setPlaying] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [rush, setRush] = useState(false)
  const [previewLoading, setPreviewLoading] = useState<string | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [sampleLoading, setSampleLoading] = useState(false)
  const [sampleUrl, setSampleUrl] = useState<string | null>(null)
  const [samplePlaying, setSamplePlaying] = useState(false)
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null)
  const [paying, setPaying] = useState(false)
  const [briefLoading, setBriefLoading] = useState(false)
  const [aiScript, setAiScript] = useState<string | null>(null)
  const [sampleError, setSampleError] = useState<string | null>(null)

  const fetchVoiceAudio = async (body: Record<string, unknown>): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) throw new Error(`Voice service error: ${res.status}`)
    const data = await res.json() as { audio?: string; error?: string }
    if (data.error) throw new Error(data.error)
    if (!data.audio) throw new Error('No audio returned')
    return data.audio
  }

  const decodeBase64Audio = (base64: string): string => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    return URL.createObjectURL(blob)
  }

  const playVoicePreview = async (voiceId: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    if (previewPlaying === voiceId) { setPreviewPlaying(null); return }

    setPreviewLoading(voiceId)
    try {
      const base64 = await fetchVoiceAudio({ voiceId })
      const url = decodeBase64Audio(base64)
      const audio = new Audio(url)
      previewAudioRef.current = audio
      audio.onended = () => { setPreviewPlaying(null); URL.revokeObjectURL(url) }
      void audio.play()
      setPreviewPlaying(voiceId)
    } catch {
      // Button just stops spinning â€” preview is non-critical
    } finally {
      setPreviewLoading(null)
    }
  }

  const generateSample = async () => {
    if (sampleAudioRef.current) { sampleAudioRef.current.pause(); sampleAudioRef.current = null }
    if (samplePlaying) { setSamplePlaying(false); return }
    if (sampleUrl) { // replay existing sample
      const audio = new Audio(sampleUrl)
      sampleAudioRef.current = audio
      audio.onended = () => setSamplePlaying(false)
      audio.play(); setSamplePlaying(true); return
    }
    setSampleLoading(true)
    setSampleError(null)
    try {
      const sampleText = brief.message.slice(0, 150) || `Welcome to ${brief.business}. ${brief.mood} audio content, brought to you by Nia Media.`
      const base64 = await fetchVoiceAudio({ voiceId: brief.voice, text: sampleText })
      const url = decodeBase64Audio(base64)
      setSampleUrl(url)
      const audio = new Audio(url)
      sampleAudioRef.current = audio
      audio.onended = () => setSamplePlaying(false)
      void audio.play()
      setSamplePlaying(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sample failed'
      setSampleError(msg)
      console.error('Sample error:', msg)
    } finally {
      setSampleLoading(false)
    }
  }

  const generateBrief = async () => {
    if (!brief.business && !brief.message) return
    setBriefLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-brief', {
        body: {
          business: brief.business,
          description: brief.description || undefined,
          targetAudience: brief.targetAudience || undefined,
          audioType,
          packageLabel: selectedPkg?.label,
          mood: brief.mood,
          platforms: brief.platforms,
          existing: brief.message || undefined,
        },
      })
      if (error || !data?.message) throw new Error(error?.message ?? 'AI assist unavailable')
      setBrief(b => ({ ...b, message: data.message as string }))
      if (data.script) setAiScript(data.script as string)
    } catch (err) {
      console.error('Brief generation error:', err)
    } finally {
      setBriefLoading(false)
    }
  }

  const togglePlatform = (p: string) => {
    setBrief(b => ({
      ...b,
      platforms: b.platforms.includes(p) ? b.platforms.filter(x => x !== p) : [...b.platforms, p],
    }))
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <Check size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Brief Submitted!</h2>
          <p className="text-gray-500 max-w-md mb-2">
            Your <strong className="text-white">{selectedPkg?.label}</strong> brief for <strong className="text-white">{brief.business}</strong> is in the queue.
            A Nia Media creative will begin production shortly.
          </p>
          <p className="text-sm text-gray-500 mb-8">You'll be notified by email when your audio is ready for review.</p>
          <div className="flex gap-3">
            <button onClick={() => { setSubmitted(false); setStep(1); setSelectedPkg(null); setAiScript(null); setSampleUrl(null); setBrief({ business: '', description: '', targetAudience: '', message: '', mood: '', voice: '', platforms: [], extra: '' }) }}
              className="btn-secondary text-sm px-5 py-2.5">Order Another</button>
            <a href="/projects" className="btn-primary text-sm px-5 py-2.5">View My Projects</a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="section-tag">Audio Studio</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/15 text-green-400">SEPARATE BILLING</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Jingles, Voice Overs & Radio Spots</h1>
          <p className="text-gray-500 mt-1">Professionally produced audio content â€” AI-generated, 100% copyright-free, all rights yours.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          {['Choose Type', 'Select Package', 'Your Brief', 'Review & Pay'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step > i + 1 ? 'bg-purple-500 text-white' : step === i + 1 ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50' : 'bg-gray-50 text-gray-600'
              }`}>{step > i + 1 ? <Check size={12} /> : i + 1}</div>
              <span className={step === i + 1 ? 'text-white font-medium' : 'text-gray-600'}>{s}</span>
              {i < 3 && <ChevronRight size={14} className="text-gray-700" />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose type */}
        {step === 1 && (
          <div>
            <p className="text-gray-500 mb-4">What kind of audio do you need?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {(Object.keys(typeInfo) as AudioType[]).map(t => {
                const { icon: Icon, label, desc, color } = typeInfo[t]
                return (
                  <button key={t} onClick={() => setAudioType(t)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      audioType === t ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-200 bg-white/3 hover:border-gray-300'
                    }`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${color}25` }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                    <p className="text-white font-semibold mb-1">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                    {audioType === t && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-400">
                        <Check size={12} /> Selected
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setStep(2)} className="btn-primary px-8 py-2.5 text-sm">
              Continue <ChevronRight size={15} className="inline" />
            </button>
          </div>
        )}

        {/* Step 2: Package */}
        {step === 2 && (
          <div>
            <p className="text-gray-500 mb-4">Choose a package for your {typeInfo[audioType].label}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {PACKAGES[audioType].map(pkg => (
                <button key={pkg.id} onClick={() => setSelectedPkg(pkg)}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    selectedPkg?.id === pkg.id ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-200 bg-white/3 hover:border-gray-300'
                  }`}>
                  {pkg.popular && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/25 text-purple-300">POPULAR</span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500">{pkg.duration}</span>
                  </div>
                  <p className="text-white font-semibold mb-1">{pkg.label}</p>
                  <p className="text-xs text-gray-500 mb-3">{pkg.description}</p>
                  <p className="text-lg font-bold" style={{ color: '#8b5cf6' }}>
                    KES {pkg.price.toLocaleString()}
                  </p>
                  {selectedPkg?.id === pkg.id && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-400">
                      <Check size={12} /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>


            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary px-6 py-2.5 text-sm">Back</button>
              <button onClick={() => setStep(3)} disabled={!selectedPkg} className="btn-primary px-8 py-2.5 text-sm disabled:opacity-40">
                Continue <ChevronRight size={15} className="inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Brief */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-gray-500">Tell us about your business and what you need. The more detail, the better the output.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Business / Brand Name *</label>
                <input className="input w-full" placeholder="e.g. Savanna Grill" value={brief.business}
                  onChange={e => setBrief(b => ({ ...b, business: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Target Audience</label>
                <input className="input w-full" placeholder="e.g. Women 25â€“40, small business owners" value={brief.targetAudience}
                  onChange={e => setBrief(b => ({ ...b, targetAudience: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">What does your business do?</label>
              <textarea className="input w-full h-16 resize-none" rows={2}
                placeholder="e.g. We sell affordable ladies fashion online. We offer same-day delivery in Nairobi and Mombasa..."
                value={brief.description} onChange={e => setBrief(b => ({ ...b, description: e.target.value }))} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-gray-500">Voice Style *</label>
                <span className="text-[10px] text-gray-600">Click â–¶ to preview</span>
              </div>
              <div className="space-y-4">
                {VOICE_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <span>{group.emoji}</span>{group.label}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.voices.map(v => {
                        const selected = brief.voice === v.id
                        const loading = previewLoading === v.id
                        const isPlaying = previewPlaying === v.id
                        return (
                          <div key={v.id}
                            onClick={() => setBrief(b => ({ ...b, voice: v.id }))}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              selected ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-200 bg-white/2 hover:border-gray-300'
                            }`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${selected ? 'text-white' : 'text-gray-600'}`}>{v.label}</p>
                              <p className="text-[10px] text-gray-600">{v.gender === 'F' ? 'Female' : 'Male'} Â· Age {v.ageTag}</p>
                            </div>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); void playVoicePreview(v.id) }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                isPlaying ? 'bg-purple-500/30 text-purple-300' : 'bg-white/6 text-gray-500 hover:bg-white/12 hover:text-white'
                              }`}
                              title="Preview voice">
                              {loading ? <Loader2 size={12} className="animate-spin" /> : isPlaying ? <Pause size={12} /> : <Volume2 size={12} />}
                            </button>
                            {selected && <Check size={13} className="text-purple-400 shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500">Key Message / Script Direction *</label>
                <button
                  type="button"
                  onClick={() => void generateBrief()}
                  disabled={briefLoading || (!brief.business && !brief.message)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
                  title={brief.message ? 'Improve with AI' : 'Generate with AI'}>
                  {briefLoading
                    ? <><Loader2 size={11} className="animate-spin" /> Writingâ€¦</>
                    : brief.message
                      ? <><RefreshCw size={11} /> Improve with AI</>
                      : <><Sparkles size={11} /> Free AI Assist</>}
                </button>
              </div>
              <textarea className="input w-full h-28 resize-none" rows={4}
                placeholder="What should the audio communicate? Include tagline, offers, CTA, or any specific phrases to include or avoidâ€¦"
                value={brief.message} onChange={e => setBrief(b => ({ ...b, message: e.target.value }))} />
              {!brief.business && !brief.message && (
                <p className="text-[10px] text-gray-600 mt-1">Fill in your Business Name first, then click AI Assist to auto-generate a direction.</p>
              )}
            </div>

            {/* AI-generated sample script */}
            {aiScript && (() => {
              const cleanScript = aiScript
                .replace(/\[pause\]/gi, 'â€¦')
                .replace(/\[.*?\]/g, '')
                .replace(/\s{2,}/g, ' ')
                .trim()
              return (
                <div className="rounded-2xl border border-purple-500/20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: 'rgba(139,92,246,0.12)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-purple-400" />
                      <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">Sample Script</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiScript(null)}
                      className="text-[10px] text-gray-600 hover:text-gray-500 transition-colors">
                      dismiss
                    </button>
                  </div>
                  <div className="px-4 py-4" style={{ background: 'rgba(139,92,246,0.04)' }}>
                    <div className="border-l-2 border-purple-500/40 pl-4">
                      <p className="text-sm text-gray-200 leading-relaxed">{cleanScript}</p>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-3">
                      AI-generated suggestion â€” our creative team will refine the final production to match your brief.
                    </p>
                  </div>
                </div>
              )
            })()}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Mood / Tone *</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(m => (
                  <button key={m} onClick={() => setBrief(b => ({ ...b, mood: m }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      brief.mood === m ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-gray-200 text-gray-500 hover:border-white/20'
                    }`}>{m}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Where will this be used? (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      brief.platforms.includes(p) ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-gray-200 text-gray-500 hover:border-white/20'
                    }`}>
                    {brief.platforms.includes(p) && <Check size={11} />} {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Additional Notes (optional)</label>
              <textarea className="input w-full h-20 resize-none" rows={3}
                placeholder="Any reference tracks, competitor examples, do-not-say list, language mix (Swahili/English), etc."
                value={brief.extra} onChange={e => setBrief(b => ({ ...b, extra: e.target.value }))} />
            </div>

            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/8 flex gap-3">
              <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">All audio is AI-generated. Zero third-party copyright. All rights transfer to you upon payment confirmation.</p>
            </div>

            {/* Free 5s sample */}
            {brief.voice && brief.message && (
              <div className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Hear a free sample first</p>
                    <p className="text-xs text-gray-500 mt-0.5">We'll read your message in your chosen voice â€” free, no commitment.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void generateSample()}
                    disabled={sampleLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gray-800 transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    {sampleLoading
                      ? <><Loader2 size={13} className="animate-spin" /> Generatingâ€¦</>
                      : samplePlaying
                        ? <><Pause size={13} /> Pause</>
                        : sampleUrl
                          ? <><Play size={13} className="ml-0.5" /> Play Again</>
                          : <><Play size={13} className="ml-0.5" /> Generate Sample</>}
                  </button>
                </div>
                {sampleUrl && !sampleError && (
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${samplePlaying ? 'duration-[8000ms]' : 'duration-300'}`}
                      style={{ width: samplePlaying ? '100%' : '0%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
                  </div>
                )}
                {sampleError && (
                  <p className="text-xs text-red-400 mt-1">{sampleError}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary px-6 py-2.5 text-sm">Back</button>
              <button onClick={() => setStep(4)}
                disabled={!brief.business || !brief.message || !brief.mood || !brief.voice}
                className="btn-primary px-8 py-2.5 text-sm disabled:opacity-40">
                Review Order <ChevronRight size={15} className="inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Pay */}
        {step === 4 && selectedPkg && (
          <div className="space-y-6">
            <p className="text-gray-500">Review your order before payment.</p>

            <div className="rounded-2xl border border-gray-200 bg-white/3 p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Package</p>
                  <p className="text-white font-semibold">{selectedPkg.label}</p>
                  <p className="text-xs text-gray-500">{selectedPkg.duration} â€” {typeInfo[audioType].label}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">KES {selectedPkg.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">One-time</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Business</p>
                  <p className="text-white">{brief.business}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Voice</p>
                  <p className="text-white">{VOICES.find(v => v.id === brief.voice)?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Mood</p>
                  <p className="text-white">{brief.mood}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Platforms</p>
                  <p className="text-white">{brief.platforms.join(', ') || 'â€”'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-0.5">Key Message</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{brief.message}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <Check size={12} /> AI-generated â€” zero copyright issues
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <Check size={12} /> All rights transfer to you on delivery
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <Check size={12} /> Up to 2 revision iterations included
                </div>
              </div>
            </div>

            {/* Rush delivery toggle */}
            <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-all cursor-pointer ${
              rush ? 'border-amber-500/40 bg-amber-500/8' : 'border-gray-200 bg-white/2 hover:border-gray-300'
            }`} onClick={() => setRush(!rush)}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${rush ? 'bg-amber-500/25' : 'bg-gray-50'}`}>
                  <Clock size={17} className={rush ? 'text-amber-400' : 'text-gray-500'} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${rush ? 'text-amber-300' : 'text-white'}`}>24hr Express Delivery</p>
                  <p className="text-xs text-gray-500">Delivered within 24 hours â€” guaranteed or full refund</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-bold ${rush ? 'text-amber-400' : 'text-gray-500'}`}>
                  +KES {Math.round(selectedPkg.price * 0.4).toLocaleString()}
                </span>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${rush ? 'bg-amber-500' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${rush ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="rounded-xl border border-gray-200 bg-white/3 p-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Total payable</p>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  KES {(selectedPkg.price + (rush ? Math.round(selectedPkg.price * 0.4) : 0)).toLocaleString()}
                </p>
                {rush && <p className="text-xs text-amber-400">Includes rush delivery (+40%)</p>}
              </div>
            </div>

            {/* Payment notice */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/8 flex gap-3">
              <Lock size={15} className="text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-300">
                <p className="font-semibold mb-0.5">Secure Payment via M-Pesa / Card</p>
                <p className="text-purple-400">
                  {rush
                    ? 'Production begins immediately after payment. Express delivery: within 24 hours, guaranteed.'
                    : 'Production begins immediately after payment confirmation. Delivery within 3â€“5 business days.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} disabled={paying} className="btn-secondary px-6 py-2.5 text-sm">Back</button>
              <button
                disabled={paying}
                onClick={async () => {
                  setPaying(true)
                  try {
                    const priceKes = selectedPkg.price + (rush ? Math.round(selectedPkg.price * 0.4) : 0)

                    const { data: order, error: orderError } = await supabase
                      .from('audio_orders')
                      .insert({
                        user_id: user?.id,
                        title: `${brief.business} â€” ${selectedPkg.label}`,
                        audio_type: audioType,
                        package: selectedPkg.label,
                        status: 'queued',
                        payment_status: 'pending_payment',
                        rush,
                        brief,
                        price_kes: priceKes,
                      })
                      .select('id')
                      .single()

                    if (orderError || !order) throw new Error('Failed to create order')

                    const { data: checkout, error: checkoutError } = await supabase.functions.invoke('pesapal-checkout', {
                      body: {
                        orderId: order.id,
                        amountKes: priceKes,
                        description: `${brief.business} â€” ${selectedPkg.label}`,
                        callbackUrl: `${window.location.origin}/payment/callback`,
                        email: user?.email ?? '',
                        firstName: user?.name?.split(' ')[0] ?? '',
                        lastName: user?.name?.split(' ').slice(1).join(' ') ?? '',
                      },
                    })

                    if (checkoutError || !checkout?.redirectUrl) throw new Error(checkout?.error ?? 'Payment initiation failed')

                    window.location.href = checkout.redirectUrl as string
                  } catch (err) {
                    console.error('Payment error:', err)
                    setPaying(false)
                  }
                }}
                className="btn-primary px-8 py-2.5 text-sm flex items-center gap-2 disabled:opacity-60">
                {paying
                  ? <><Loader2 size={14} className="animate-spin" /> Redirecting to paymentâ€¦</>
                  : <><Lock size={14} /> Pay KES {(selectedPkg.price + (rush ? Math.round(selectedPkg.price * 0.4) : 0)).toLocaleString()} via PesaPal</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


