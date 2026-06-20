import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic, MicOff, ImagePlus, Type, Sparkles, RefreshCw,
  Download, ArrowRight, X, Film, Tv, BookOpen,
  ChevronDown, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { ScriptFormat, GeneratedConcept } from '../lib/generateConcept'
import { supabase } from '../lib/supabase'

const FORMAT_OPTIONS: { id: ScriptFormat; label: string; icon: typeof Film; duration: string; desc: string }[] = [
  { id: 'commercial-15', label: '15s Commercial', icon: Tv,       duration: '15 seconds', desc: 'Hook, punch, CTA.' },
  { id: 'commercial-30', label: '30s Commercial', icon: Tv,       duration: '30 seconds', desc: 'Full brand story.' },
  { id: 'commercial-60', label: '60s Brand Film', icon: Film,     duration: '60 seconds', desc: 'Cinematic & emotional.' },
  { id: 'documentary',   label: 'Mini Doco',      icon: BookOpen, duration: '3–5 min',    desc: 'Depth & authenticity.' },
  { id: 'short-film',    label: 'Short Film',     icon: Film,     duration: '5–10 min',   desc: 'Narrative & character.' },
]

const VOICE_DEMOS = [
  'Real estate investment property in Karen, Nairobi. Target young professionals. Goal: generate site visits.',
  'New SACCO loan product with low interest. Target small business owners in Mombasa. Friendly and trustworthy.',
  'Online tutoring platform for CBC curriculum. Primary school students. Parents are the decision maker.',
  'New coastal resort opening in Watamu. Luxury but accessible. Target Nairobi middle class, age 28–45.',
  'Restaurant chain launching a delivery service. Fast food, Kenyan flavours. Target urban millennials.',
]

function ScriptDisplay({ concept }: { concept: GeneratedConcept }) {
  const divider = '─'.repeat(52)

  return (
    <div className="font-mono text-[13px] leading-relaxed text-gray-200 space-y-0">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-purple-400 font-bold text-xs tracking-widest uppercase mb-1">Nia Media — Concept Brief</p>
        <p className="text-gray-600 text-[11px]">{divider}</p>
      </div>

      <div className="space-y-1 mb-4">
        <p><span className="text-gray-500">TITLE     </span><span className="text-white font-bold">{concept.title}</span></p>
        <p><span className="text-gray-500">FORMAT    </span>{concept.format}</p>
        <p><span className="text-gray-500">DURATION  </span>{concept.duration}</p>
        <p><span className="text-gray-500">GENERATED </span>{new Date(concept.generatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <p className="text-gray-600 text-[11px] mb-4">{divider}</p>

      {/* Logline */}
      <div className="mb-4">
        <p className="text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-2">LOGLINE</p>
        <p className="text-gray-300 italic leading-snug">"{concept.logline}"</p>
      </div>

      <p className="text-gray-600 text-[11px] mb-4">{divider}</p>

      {/* Synopsis */}
      <div className="mb-4">
        <p className="text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-2">SYNOPSIS</p>
        {concept.synopsis.split('\n\n').map((para, i) => (
          <p key={i} className="text-gray-300 mb-2 leading-snug">{para}</p>
        ))}
      </div>

      <p className="text-gray-600 text-[11px] mb-4">{divider}</p>

      {/* Scenes */}
      <div className="mb-4">
        <p className="text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-3">SCENE BREAKDOWN</p>
        <div className="space-y-5">
          {concept.scenes.map((scene) => (
            <div key={scene.number}>
              <p className="text-white font-bold mb-1">
                SCENE {scene.number} — {scene.title.toUpperCase()}
                <span className="text-gray-500 font-normal ml-2">[{scene.timecode}]</span>
              </p>
              <div className="pl-3 border-l border-white/10 space-y-1">
                <p><span className="text-blue-400">VISUAL  </span><span className="text-gray-300">{scene.visual}</span></p>
                <p><span className="text-amber-400">AUDIO   </span><span className="text-gray-300">{scene.audio}</span></p>
                <p><span className="text-emerald-400">VO      </span><span className="text-gray-200">{scene.vo}</span></p>
                {scene.onScreen && (
                  <p><span className="text-purple-400">SUPER   </span><span className="text-gray-300">{scene.onScreen}</span></p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-gray-600 text-[11px] mb-4">{divider}</p>

      {/* Cast */}
      <div className="mb-4">
        <p className="text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-2">CAST & VOICE NOTES</p>
        {concept.castNotes.split('\n').map((line, i) => (
          <p key={i} className="text-gray-300 leading-snug">{line}</p>
        ))}
      </div>

      <p className="text-gray-600 text-[11px] mb-4">{divider}</p>

      {/* Production notes */}
      <div className="mb-2">
        <p className="text-purple-400 text-[11px] font-bold uppercase tracking-widest mb-2">PRODUCTION NOTES</p>
        <p><span className="text-gray-500">STYLE     </span><span className="text-gray-300">{concept.productionNotes.recommendedStyle}</span></p>
        <p><span className="text-gray-500">MOOD      </span><span className="text-gray-300">{concept.productionNotes.mood}</span></p>
        <p><span className="text-gray-500">COLOUR    </span><span className="text-gray-300">{concept.productionNotes.colorDirection}</span></p>
        <p><span className="text-gray-500">MUSIC     </span><span className="text-gray-300">{concept.productionNotes.musicDirection}</span></p>
      </div>

      <p className="text-gray-600 text-[11px] mt-4">{divider}</p>
      <p className="text-center text-gray-600 text-[11px] mt-1">Generated by Nia Media AI — niamedia.co</p>
    </div>
  )
}

export default function ConceptStudio() {
  const [inputTab, setInputTab] = useState<'text' | 'voice' | 'images'>('text')
  const [textInput, setTextInput] = useState('')
  const [format, setFormat] = useState<ScriptFormat>('commercial-30')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [images, setImages] = useState<{ name: string; url: string }[]>([])
  const [concept, setConcept] = useState<GeneratedConcept | null>(null)
  const [loading, setLoading] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const activeInput = inputTab === 'voice' ? voiceTranscript : inputTab === 'text' ? textInput : images.map(i => i.name).join(', ')
  const canGenerate = activeInput.trim().length > 10 || images.length > 0

  const handleGenerate = async () => {
    const raw = inputTab === 'voice' ? voiceTranscript
      : inputTab === 'images' ? `Visual concept based on uploaded references: ${images.map(i => i.name).join(', ')}${textInput ? '. ' + textInput : ''}`
      : textInput
    if (!raw.trim()) return
    setLoading(true)
    setGenerateError('')
    const { data, error } = await supabase.functions.invoke('generate-concept', {
      body: { brief: raw, format },
    })
    if (error || data?.error) {
      setGenerateError(error?.message ?? data?.error ?? 'Generation failed')
      setLoading(false)
      return
    }
    setConcept(data as GeneratedConcept)
    setLoading(false)
  }

  const handleDownload = () => {
    if (!concept) return
    const divider = '─'.repeat(52)
    const lines = [
      `NIA MEDIA — CONCEPT BRIEF`,
      divider,
      `TITLE     ${concept.title}`,
      `FORMAT    ${concept.format}`,
      `DURATION  ${concept.duration}`,
      `GENERATED ${new Date(concept.generatedAt).toLocaleString('en-GB')}`,
      '',
      divider,
      'LOGLINE',
      `"${concept.logline}"`,
      '',
      divider,
      'SYNOPSIS',
      concept.synopsis,
      '',
      divider,
      'SCENE BREAKDOWN',
      ...concept.scenes.flatMap(s => [
        '',
        `SCENE ${s.number} — ${s.title.toUpperCase()} [${s.timecode}]`,
        `  VISUAL  ${s.visual}`,
        `  AUDIO   ${s.audio}`,
        `  VO      ${s.vo}`,
        ...(s.onScreen ? [`  SUPER   ${s.onScreen}`] : []),
      ]),
      '',
      divider,
      'CAST & VOICE NOTES',
      concept.castNotes,
      '',
      divider,
      'PRODUCTION NOTES',
      `  STYLE   ${concept.productionNotes.recommendedStyle}`,
      `  MOOD    ${concept.productionNotes.mood}`,
      `  COLOUR  ${concept.productionNotes.colorDirection}`,
      `  MUSIC   ${concept.productionNotes.musicDirection}`,
      '',
      divider,
      'Generated by Nia Media AI — niamedia.co',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${concept.title.replace(/\s+/g, '_')}_concept.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false)
      const demo = VOICE_DEMOS[Math.floor(Math.random() * VOICE_DEMOS.length)]
      setVoiceTranscript(demo)
    } else {
      setIsRecording(true)
      setVoiceTranscript('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      setImages(prev => [...prev, { name: file.name, url }])
    })
  }

  const selectedFormat = FORMAT_OPTIONS.find(f => f.id === format)!

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Concept Studio</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' }}>
              FREE TIER
            </span>
          </div>
          <p className="text-sm text-gray-500">Spin any idea into a professional script concept. Push to development when you're ready.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT: Input panel ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Input type tabs */}
          <div className="card-glow p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Idea</p>
            <div className="flex rounded-xl overflow-hidden border border-white/8 mb-4">
              {(['text', 'voice', 'images'] as const).map(tab => (
                <button key={tab} onClick={() => setInputTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold capitalize transition-all ${
                    inputTab === tab ? 'text-white bg-purple-500/20 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {tab === 'text'   && <Type size={13} />}
                  {tab === 'voice'  && <Mic size={13} />}
                  {tab === 'images' && <ImagePlus size={13} />}
                  {tab}
                </button>
              ))}
            </div>

            {/* Text input */}
            {inputTab === 'text' && (
              <textarea
                className="input resize-none text-sm min-h-[140px]"
                placeholder="Describe your idea, product, business, or story you want to tell... (e.g. 'A real estate company in Ruaka targeting young professionals — 2-bedroom apartments from KES 6.5M')"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
              />
            )}

            {/* Voice input */}
            {inputTab === 'voice' && (
              <div className="space-y-3">
                <button onClick={handleVoiceToggle}
                  className={`w-full py-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${
                    isRecording
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-white/10 bg-white/3 hover:border-purple-500/30'
                  }`}>
                  {isRecording ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                        <MicOff size={22} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-400">Recording... tap to stop</p>
                        <div className="flex items-center gap-1 justify-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-1 rounded-full bg-red-400 animate-pulse"
                              style={{ height: `${8 + Math.random() * 16}px`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
                        <Mic size={22} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Tap to record your idea</p>
                        <p className="text-xs text-gray-500 mt-0.5">Speak naturally — describe your business and goal</p>
                      </div>
                    </>
                  )}
                </button>
                {voiceTranscript && (
                  <div className="rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-400">Transcribed</p>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{voiceTranscript}</p>
                    <button onClick={() => setVoiceTranscript('')} className="text-xs text-gray-500 hover:text-white mt-2 transition-colors">Clear</button>
                  </div>
                )}
              </div>
            )}

            {/* Image input */}
            {inputTab === 'images' && (
              <div className="space-y-3">
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                <button onClick={() => fileRef.current?.click()}
                  className="w-full py-6 rounded-xl border border-dashed border-white/15 bg-white/2 hover:border-purple-500/40 hover:bg-purple-500/5 flex flex-col items-center gap-2 transition-all">
                  <ImagePlus size={22} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Upload reference images</p>
                    <p className="text-xs text-gray-500 mt-0.5">Mood board, product shots, inspiration — PNG / JPG</p>
                  </div>
                </button>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length > 0 && (
                  <div className="rounded-xl p-3 border border-white/8 bg-white/3">
                    <p className="text-xs text-gray-400 font-semibold mb-1">Add context (optional)</p>
                    <textarea className="input resize-none text-xs min-h-[60px]" placeholder="Describe the mood or message these images represent..." value={textInput} onChange={e => setTextInput(e.target.value)} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Format selector */}
          <div className="card-glow p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Output Format</p>
            <div className="space-y-1.5">
              {FORMAT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setFormat(opt.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    format === opt.id
                      ? 'border-purple-500/40 bg-purple-500/10'
                      : 'border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4'
                  }`}>
                  <opt.icon size={15} className={format === opt.id ? 'text-purple-400' : 'text-gray-500'} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${format === opt.id ? 'text-purple-200' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.duration} · {opt.desc}</p>
                  </div>
                  {format === opt.id && <CheckCircle2 size={13} className="text-purple-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={!canGenerate || loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: canGenerate ? '0 0 24px rgba(139,92,246,0.4)' : 'none' }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Writing your concept...</> : <><Sparkles size={16} /> Spin Concept</>}
          </button>

          {generateError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400">{generateError}</div>
          )}

          {!canGenerate && !loading && (
            <p className="text-xs text-gray-600 text-center">Add at least a sentence describing your idea to continue.</p>
          )}
        </div>

        {/* ── RIGHT: Output panel ── */}
        <div className="lg:col-span-3">
          {!concept && !loading && (
            <div className="card-glow p-10 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <p className="text-base font-bold text-white mb-2">Your concept will appear here</p>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">Describe your idea on the left — text, voice, or images — and hit Spin Concept to generate a professional script in seconds.</p>
              <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-sm">
                {['Commercial', 'Documentary', 'Short Film'].map(t => (
                  <div key={t} className="px-3 py-2 rounded-xl border border-white/6 text-xs text-gray-500 text-center">{t}</div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="card-glow p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 animate-pulse"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))' }}>
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <p className="text-base font-bold text-white mb-2">Spinning your concept...</p>
              <p className="text-sm text-gray-500">Writing scenes, crafting your narrative, structuring your brief.</p>
              <div className="mt-6 space-y-2 w-full max-w-xs">
                {['Analysing your brief', 'Detecting industry & tone', 'Writing scene breakdown', 'Finalising production notes'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 text-xs text-gray-600">
                    <Loader2 size={11} className="animate-spin shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {concept && !loading && (
            <div className="card-glow overflow-hidden">
              {/* Script header bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6"
                style={{ background: 'rgba(139,92,246,0.06)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <p className="text-xs font-bold text-white">{concept.title}</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-purple-400 bg-purple-500/15">{concept.format}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 border border-white/8 bg-white/3 hover:border-white/15 transition-all">
                    <Download size={11} />
                    Download
                  </button>
                  <button onClick={() => setConcept(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 border border-white/8 bg-white/3 hover:border-white/15 transition-all">
                    <RefreshCw size={11} />
                    Spin Again
                  </button>
                </div>
              </div>

              {/* Script content */}
              <div className="p-6 max-h-[620px] overflow-y-auto">
                <ScriptDisplay concept={concept} />
              </div>

              {/* Action footer */}
              <div className="px-5 py-4 border-t border-white/6"
                style={{ background: 'rgba(10,10,20,0.6)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">Ready to bring this to life?</p>
                    <p className="text-xs text-gray-500 mt-0.5">Push to development — a creator picks this up after you select your package.</p>
                  </div>
                  <button onClick={() => setShowPaywall(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shrink-0 transition-all"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
                    Push to Development <ArrowRight size={14} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <AlertCircle size={10} className="text-gray-600" />
                  <p className="text-[11px] text-gray-600">Concept generation and download are free. Production requires a paid package.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Paywall modal ── */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-lg card-glow p-7 relative">
            <button onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={15} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))' }}>
                <ArrowRight size={22} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Push "{concept?.title}" to Development</h2>
              <p className="text-sm text-gray-500">Choose your package and a creator will pick up your concept within 24 hours.</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { name: 'Starter Pack', price: 'KES 5,000', desc: 'Script refinement + 1 video ad concept + poster copy', badge: null },
                { name: 'Growth Pack', price: 'KES 30,000 /mo', desc: 'Full pre-production + 4 ad variations + revisions', badge: 'Most Popular' },
                { name: 'Business Pack', price: 'KES 60,000 /mo', desc: 'Full production bundle + avatars + landing page copy', badge: null },
              ].map(pkg => (
                <Link key={pkg.name}
                  to={`/package-request?concept=${encodeURIComponent(concept?.title || '')}&format=${concept?.format || ''}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-purple-500/40 bg-white/3 hover:bg-purple-500/8 transition-all group">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{pkg.name}</p>
                      {pkg.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>{pkg.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{pkg.desc}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-white">{pkg.price}</p>
                    <p className="text-[10px] text-purple-400 group-hover:underline">Select →</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8">
              <AlertCircle size={13} className="text-amber-400 shrink-0" />
              <p className="text-xs text-gray-400">Your concept is saved automatically. You can return and push it to development any time.</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
