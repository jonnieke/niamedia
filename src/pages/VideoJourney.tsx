import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight, ArrowLeft, Check, Sparkles, Loader2, Edit3, RefreshCw,
  CheckCircle2, ChevronUp, ChevronDown, Trash2, Image as ImageIcon,
  Send, Palette, Film,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VideoStyle {
  id: string
  name: string
  emoji: string
  desc: string
  gradient: string
  accent: string
  palette: string[]
  falStyle: 'bold' | 'minimal' | 'vibrant'
}

interface Scene {
  id: string
  number: number
  title: string
  timecode: string
  visual: string
  audio: string
  vo: string
  onScreen?: string
  editing: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const VIDEO_STYLES: VideoStyle[] = [
  {
    id: 'cinematic',
    name: 'Cinematic Realistic',
    emoji: '🎬',
    desc: 'Deep shadows, dramatic lighting, film-grade colour grading. Emotional and immersive.',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
    accent: '#818cf8',
    palette: ['#1e1b4b', '#312e81', '#4338ca', '#a5b4fc'],
    falStyle: 'bold',
  },
  {
    id: 'cartoon',
    name: 'Cartoon / Animated',
    emoji: '✏️',
    desc: 'Bold outlines, flat vivid colours, playful high-energy look. Great for youth brands.',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    accent: '#f0abfc',
    palette: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981'],
    falStyle: 'vibrant',
  },
  {
    id: 'bold-graphic',
    name: 'Bold Graphic',
    emoji: '🔲',
    desc: 'High contrast, strong typography, powerful geometry. Every frame a statement.',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #dc2626 100%)',
    accent: '#fca5a5',
    palette: ['#0f172a', '#dc2626', '#f97316', '#fbbf24'],
    falStyle: 'bold',
  },
  {
    id: 'documentary',
    name: 'Documentary',
    emoji: '📷',
    desc: 'Raw authenticity, natural light, real people. Builds deep trust and credibility.',
    gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
    accent: '#fcd34d',
    palette: ['#78350f', '#b45309', '#d97706', '#fbbf24'],
    falStyle: 'minimal',
  },
  {
    id: 'luxury',
    name: 'Luxury Brand',
    emoji: '✨',
    desc: 'Gold tones, slow cinema, aspirational lifestyle. For premium, high-ticket offers.',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #92400e 100%)',
    accent: '#fbbf24',
    palette: ['#1c1917', '#44403c', '#92400e', '#fbbf24'],
    falStyle: 'minimal',
  },
  {
    id: 'minimal',
    name: 'Minimal / Clean',
    emoji: '🤍',
    desc: 'White space, soft tones, understated elegance. Professional services and wellness.',
    gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    accent: '#7c3aed',
    palette: ['#f8fafc', '#e2e8f0', '#94a3b8', '#7c3aed'],
    falStyle: 'minimal',
  },
]

const FORMAT_OPTIONS = [
  { id: 'commercial-15', label: '15s Commercial', duration: '15 seconds' },
  { id: 'commercial-30', label: '30s Commercial', duration: '30 seconds' },
  { id: 'commercial-60', label: '60s Brand Film', duration: '60 seconds' },
  { id: 'documentary', label: 'Mini Documentary', duration: '3–5 min' },
]

const STEPS = ['Style', 'Script', 'Scenes', 'Mood Board', 'Storyboard', 'Sign Off']
const STEP_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2']

// ─── Style card image preview ──────────────────────────────────────────────────

function StyleCardImage({ style, imageUrl, loading }: {
  style: VideoStyle
  imageUrl?: string
  loading: boolean
}) {
  if (imageUrl) {
    return (
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        <img
          src={imageUrl}
          alt={style.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }} />
        <span className="absolute top-2.5 left-3 text-lg leading-none drop-shadow-lg">{style.emoji}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative aspect-video overflow-hidden" style={{ background: style.gradient }}>
        <div className="absolute inset-0 animate-pulse opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin opacity-30" style={{ color: style.accent }} />
        </div>
      </div>
    )
  }

  // Fallback if generation failed
  return (
    <div className="relative aspect-video overflow-hidden flex items-center justify-center" style={{ background: style.gradient }}>
      <span className="text-5xl opacity-25">{style.emoji}</span>
    </div>
  )
}



// ─── Step 0: Style Picker ───────────────────────────────────────────────────────

function StylePicker({ selected, onSelect, styleImages, thumbsLoading }: {
  selected: string
  onSelect: (id: string) => void
  styleImages: Record<string, string>
  thumbsLoading: boolean
}) {
  return (
    <div>
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.15)' }}>
          Step 1 of 6 — Visual Style
        </span>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">What should this feel like?</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">Your style shapes every lighting call, edit cut, and colour grade. Choose the one that fits your brand's personality.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VIDEO_STYLES.map(style => (
          <button key={style.id} onClick={() => onSelect(style.id)} className="text-left group">
            <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${
              selected === style.id
                ? 'ring-2 shadow-xl'
                : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-lg hover:-translate-y-0.5'
            }`}
              style={selected === style.id ? { '--tw-ring-color': style.accent, boxShadow: `0 8px 32px ${style.accent}30` } as React.CSSProperties : undefined}>
              <StyleCardImage style={style} imageUrl={styleImages[style.id]} loading={thumbsLoading} />
              <div className="bg-white px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{style.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{style.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  selected === style.id ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                }`}>
                  {selected === style.id && <Check size={10} className="text-white" />}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 1: Script Generation ──────────────────────────────────────────────────

function ScriptStep({ brief, setBrief, format, setFormat, scenes, onGenerate, generating, error }: {
  brief: string; setBrief: (v: string) => void
  format: string; setFormat: (v: string) => void
  scenes: Scene[]; onGenerate: () => void
  generating: boolean; error: string
}) {
  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: STEP_COLORS[1] }}>Step 2 of 6</p>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Generate your scene script</h2>
        <p className="text-gray-500 text-sm">Describe your idea — Nia writes the full script, broken into scenes.</p>
      </div>

      {scenes.length === 0 ? (
        <div className="max-w-lg mx-auto space-y-4">
          <div>
            <label className="label">Describe your video idea</label>
            <textarea className="input w-full resize-none min-h-[120px] text-sm"
              placeholder="e.g. A real estate brand in Karen targeting young professionals. Show modern apartments, family lifestyle, value for money. End with a site visit CTA."
              value={brief} onChange={e => setBrief(e.target.value)} />
          </div>
          <div>
            <label className="label">Format</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FORMAT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setFormat(opt.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left text-xs transition-all ${
                    format === opt.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
                  }`}>
                  <p className="font-bold">{opt.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{opt.duration}</p>
                </button>
              ))}
            </div>
          </div>
          {error && <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600">{error}</div>}
          <button onClick={onGenerate} disabled={brief.trim().length < 10 || generating}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            {generating
              ? <><Loader2 size={15} className="animate-spin" /> Writing your script...</>
              : <><Sparkles size={15} /> Generate Script with Nia</>}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900">{scenes.length} scenes — review below, edit in the next step</p>
            <button onClick={onGenerate} disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 bg-white transition-all">
              <RefreshCw size={11} className={generating ? 'animate-spin' : ''} /> Regenerate
            </button>
          </div>
          <div className="space-y-3">
            {scenes.map(scene => (
              <div key={scene.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Scene header */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100" style={{ background: '#f8fafc' }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[11px] font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                    {scene.number}
                  </div>
                  <p className="text-xs font-bold text-gray-900 flex-1">{scene.title}</p>
                  <span className="text-[10px] text-gray-400 font-mono">{scene.timecode}</span>
                </div>
                {/* Scene fields */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold tracking-widest w-12 shrink-0 pt-0.5" style={{ color: '#2563eb' }}>VISUAL</span>
                    <p className="text-xs text-gray-500 leading-relaxed">{scene.visual}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold tracking-widest w-12 shrink-0 pt-0.5" style={{ color: '#059669' }}>VO</span>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium italic">"{scene.vo}"</p>
                  </div>
                  {scene.audio && (
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold tracking-widest w-12 shrink-0 pt-0.5" style={{ color: '#d97706' }}>AUDIO</span>
                      <p className="text-xs text-gray-400 leading-relaxed">{scene.audio}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Scene Editor ───────────────────────────────────────────────────────

function SceneEditor({ scenes, setScenes, brief, styleName, onEnhance, enhancingId }: {
  scenes: Scene[]; setScenes: (s: Scene[]) => void
  brief: string; styleName: string
  onEnhance: (id: string) => void; enhancingId: string | null
}) {
  const update = (id: string, patch: Partial<Scene>) =>
    setScenes(scenes.map(s => s.id === id ? { ...s, ...patch } : s))

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...scenes]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setScenes(arr.map((s, i) => ({ ...s, number: i + 1 })))
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: STEP_COLORS[2] }}>Step 3 of 6</p>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Edit your scene cards</h2>
        <p className="text-gray-500 text-sm">Reorder, edit, or ask Nia to enhance any scene. These go directly into production.</p>
      </div>
      <div className="space-y-3">
        {scenes.map((scene, idx) => (
          <div key={scene.id} className={`bg-white rounded-2xl border transition-all ${
            scene.editing ? 'border-emerald-300 shadow-sm' : 'border-gray-200'
          }`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                {scene.number}
              </div>
              <div className="flex-1 min-w-0">
                {scene.editing
                  ? <input className="input text-xs font-bold w-full py-1 px-2 h-7" value={scene.title}
                      onChange={e => update(scene.id, { title: e.target.value })} />
                  : <p className="text-xs font-bold text-gray-900 truncate">{scene.title} <span className="text-gray-400 font-normal">[{scene.timecode}]</span></p>
                }
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(idx, -1)} disabled={idx === 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all">
                  <ChevronUp size={13} />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === scenes.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all">
                  <ChevronDown size={13} />
                </button>
                <button onClick={() => update(scene.id, { editing: !scene.editing })}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                    scene.editing ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}>
                  <Edit3 size={12} />
                </button>
                <button onClick={() => setScenes(scenes.filter(s => s.id !== scene.id).map((s, i) => ({ ...s, number: i + 1 })))}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-3 space-y-2">
              {(['visual', 'vo', 'audio'] as const).map(field => {
                const colors: Record<string, string> = { visual: '#2563eb', vo: '#059669', audio: '#d97706' }
                const labels: Record<string, string> = { visual: 'VISUAL', vo: 'VO', audio: 'AUDIO' }
                return (
                  <div key={field} className="flex gap-2 text-xs">
                    <span className="font-semibold w-14 shrink-0 pt-0.5" style={{ color: colors[field] }}>{labels[field]}</span>
                    {scene.editing
                      ? <textarea className="input flex-1 text-xs resize-none min-h-[40px]"
                          value={scene[field] as string}
                          onChange={e => update(scene.id, { [field]: e.target.value })} />
                      : <span className={`leading-snug ${field === 'vo' ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                          {scene[field] as string}
                        </span>
                    }
                  </div>
                )
              })}
            </div>

            {/* Nia enhance */}
            <div className="px-4 pb-3">
              <button onClick={() => onEnhance(scene.id)} disabled={enhancingId === scene.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed' }}>
                {enhancingId === scene.id
                  ? <><Loader2 size={11} className="animate-spin" /> Nia is enhancing...</>
                  : <><Sparkles size={11} /> Ask Nia to enhance</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Mood Board ─────────────────────────────────────────────────────────

function MoodBoardStep({ style, images, onGenerate, generating, error }: {
  style: VideoStyle; images: string[]
  onGenerate: () => void; generating: boolean; error: string
}) {
  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: STEP_COLORS[3] }}>Step 4 of 6</p>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Approve your mood board</h2>
        <p className="text-gray-500 text-sm">AI-generated reference images and colour palette your production team will use as a visual guide.</p>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: style.gradient }}>
            <span className="text-3xl">{style.emoji}</span>
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Generate your {style.name} mood board</p>
          <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto">4 AI reference images matching your visual style — free, no credits needed.</p>
          {error && (
            <div className="mb-4 mx-auto max-w-sm p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600">
              <strong>Generation failed:</strong> {error}
              {error.toLowerCase().includes('falai') || error.toLowerCase().includes('api') ? (
                <p className="mt-1 text-red-500">Check that FALAI_API_KEY is set in Supabase → Edge Functions → Secrets.</p>
              ) : null}
            </div>
          )}
          <button onClick={onGenerate} disabled={generating}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 mx-auto transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', boxShadow: '0 4px 20px rgba(217,119,6,0.35)' }}>
            <Palette size={15} /> Generate Mood Board
          </button>
        </div>
      ) : generating ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: style.gradient }}>
            <Loader2 size={24} className="text-white animate-spin" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Generating 4 reference images...</p>
          <p className="text-xs text-gray-500">Usually takes 15–25 seconds</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {images.map((src, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                <img src={src} alt={`Mood board ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Colour Palette</p>
            <div className="flex gap-3">
              {style.palette.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl shadow-sm border border-gray-100" style={{ background: c }} />
                  <p className="text-[9px] text-gray-400 font-mono">{c}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onGenerate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 bg-white hover:border-gray-300 transition-all">
            <RefreshCw size={11} /> Regenerate Board
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Storyboard ─────────────────────────────────────────────────────────

function StoryboardStep({ scenes, style, frameImages, onGenerateFrame, generatingFrameId }: {
  scenes: Scene[]; style: VideoStyle
  frameImages: Record<string, string>
  onGenerateFrame: (id: string) => void; generatingFrameId: string | null
}) {
  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: STEP_COLORS[4] }}>Step 5 of 6</p>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Scene storyboard</h2>
        <p className="text-gray-500 text-sm">Generate a reference frame per scene, or skip — your scene cards already carry full production notes.</p>
      </div>
      <div className="space-y-3">
        {scenes.map(scene => (
          <div key={scene.id} className="bg-white rounded-2xl border border-gray-200 flex gap-4 p-4 items-start">
            <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center"
              style={frameImages[scene.id] ? undefined : { background: style.gradient }}>
              {frameImages[scene.id]
                ? <img src={frameImages[scene.id]} alt={`Scene ${scene.number}`} className="w-full h-full object-cover" />
                : generatingFrameId === scene.id
                  ? <Loader2 size={20} className="text-white animate-spin" />
                  : <span className="text-2xl opacity-50">{style.emoji}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 mb-0.5">Scene {scene.number} — {scene.title}</p>
              <p className="text-[11px] text-gray-500 leading-snug mb-3 line-clamp-2">{scene.vo}</p>
              {frameImages[scene.id]
                ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 size={11} /> Frame generated
                  </span>
                : <button onClick={() => onGenerateFrame(scene.id)} disabled={!!generatingFrameId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}>
                    {generatingFrameId === scene.id
                      ? <><Loader2 size={10} className="animate-spin" /> Generating...</>
                      : <><ImageIcon size={10} /> Generate Frame</>}
                  </button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 5: Sign Off ───────────────────────────────────────────────────────────

function SignOffStep({ style, format, brief, scenes, moodImages, onSubmit, submitting }: {
  style: VideoStyle; format: string; brief: string
  scenes: Scene[]; moodImages: string[]
  onSubmit: () => void; submitting: boolean
}) {
  const [signed, setSigned] = useState(false)
  const formatLabel = FORMAT_OPTIONS.find(f => f.id === format)?.label ?? format

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: STEP_COLORS[5] }}>Step 6 of 6</p>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Review & sign off your brief</h2>
        <p className="text-gray-500 text-sm">This package goes to production. Changes after sign-off are counted as revisions.</p>
      </div>

      {/* Brief summary */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
        <div className="p-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0b001f, #06000f)' }}>
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Production Brief</p>
          <p className="text-white font-bold text-sm">Nia Media — Video Production Package</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: style.gradient }}>
              <span className="text-lg">{style.emoji}</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Visual Style</p>
              <p className="text-sm font-bold text-gray-900">{style.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-0.5">Format</p>
              <p className="text-xs font-bold text-gray-900">{formatLabel}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-0.5">Scenes</p>
              <p className="text-xs font-bold text-gray-900">{scenes.length} scene{scenes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {moodImages.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 mb-2">Mood Board ({moodImages.length} images)</p>
              <div className="flex gap-2">
                {moodImages.slice(0, 4).map((src, i) => (
                  <div key={i} className="w-14 h-20 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Creative Brief</p>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{brief}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-2">Scene breakdown</p>
            <div className="space-y-1">
              {scenes.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: STEP_COLORS[2] }}>
                    {s.number}
                  </div>
                  <span className="font-medium text-gray-700">{s.title}</span>
                  <span className="text-gray-400">[{s.timecode}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sign-off checkbox */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <label className="flex items-start gap-3 cursor-pointer" onClick={() => setSigned(!signed)}>
          <div className={`w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
            signed ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'
          }`}>
            {signed && <Check size={11} className="text-white" />}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed select-none">
            I confirm this brief is accurate and approved for production. I understand that changes requested after sign-off are revision requests and may incur additional charges.
          </p>
        </label>
      </div>

      <button onClick={onSubmit} disabled={!signed || submitting}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', boxShadow: signed ? '0 4px 24px rgba(8,145,178,0.35)' : 'none' }}>
        {submitting
          ? <><Loader2 size={15} className="animate-spin" /> Submitting to production...</>
          : <><Send size={15} /> Submit for Production</>}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">Your production manager will contact you within 24 hours with a kickoff date.</p>
    </div>
  )
}

// ─── Main: VideoJourney ─────────────────────────────────────────────────────────

export default function VideoJourney() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('')
  const [brief, setBrief] = useState((location.state as { brief?: string })?.brief ?? '')
  const [format, setFormat] = useState('commercial-30')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [scriptGenerating, setScriptGenerating] = useState(false)
  const [scriptError, setScriptError] = useState('')
  const [enhancingId, setEnhancingId] = useState<string | null>(null)
  const [moodImages, setMoodImages] = useState<string[]>([])
  const [moodGenerating, setMoodGenerating] = useState(false)
  const [moodError, setMoodError] = useState('')
  const [frameImages, setFrameImages] = useState<Record<string, string>>({})
  const [generatingFrameId, setGeneratingFrameId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [userIndustry, setUserIndustry] = useState('Professional Services')
  const [styleImages, setStyleImages] = useState<Record<string, string>>({})
  const [thumbsLoading, setThumbsLoading] = useState(false)


  useEffect(() => {
    setThumbsLoading(true)
    Promise.all(
      VIDEO_STYLES.map(s =>
        supabase.functions.invoke('generate-style-thumb', { body: { style_id: s.id } })
          .then(({ data }) => ({ id: s.id, url: (data?.url as string) ?? '' }))
          .catch(() => ({ id: s.id, url: '' }))
      )
    ).then(results => {
      const imgs: Record<string, string> = {}
      for (const r of results) { if (r.url) imgs[r.id] = r.url }
      setStyleImages(imgs)
      setThumbsLoading(false)
    })
  }, [])

  const style = VIDEO_STYLES.find(s => s.id === selectedStyle) ?? VIDEO_STYLES[0]

  const canContinue = () => {
    if (step === 0) return !!selectedStyle
    if (step === 1) return scenes.length > 0
    return true
  }

  const handleGenerateScript = async () => {
    setScriptGenerating(true)
    setScriptError('')
    const { data, error } = await supabase.functions.invoke('generate-concept', {
      body: { brief, format },
    })
    if (error || data?.error) {
      setScriptError(error?.message ?? data?.error ?? 'Failed to generate script')
      setScriptGenerating(false)
      return
    }
    const mapped: Scene[] = (data.scenes ?? []).map((s: Record<string, string>, i: number) => ({
      id: crypto.randomUUID(),
      number: i + 1,
      title: s.title ?? `Scene ${i + 1}`,
      timecode: s.timecode ?? '',
      visual: s.visual ?? '',
      audio: s.audio ?? '',
      vo: s.vo ?? '',
      onScreen: s.onScreen,
      editing: false,
    }))
    setScenes(mapped)
    setScriptGenerating(false)
  }

  const handleEnhanceScene = async (id: string) => {
    const scene = scenes.find(s => s.id === id)
    if (!scene) return
    setEnhancingId(id)
    const { data } = await supabase.functions.invoke('refine-section', {
      body: {
        label: `Scene ${scene.number} Voice-Over`,
        currentContent: scene.vo,
        feedback: `Make this scene VO more ${style.name} in tone — vivid, punchy, cinematic. Keep same intent.`,
        briefContext: brief,
      },
    })
    if (data?.refined) {
      setScenes(scenes.map(s => s.id === id ? { ...s, vo: data.refined } : s))
    }
    setEnhancingId(null)
  }

  const handleGenerateMoodBoard = async () => {
    if (moodGenerating) return
    setMoodGenerating(true)
    setMoodError('')
    try {
      const falStyles: ('bold' | 'minimal' | 'vibrant')[] = [style.falStyle, 'vibrant', 'minimal', style.falStyle]
      const results = await Promise.all(
        falStyles.map(fs =>
          supabase.functions.invoke('generate-poster', {
            body: { industry: userIndustry, business_name: 'Mood Board', style: fs, unlock: false },
          })
        )
      )
      const firstError = results.find(r => r.error || r.data?.error)
      if (firstError) {
        // FunctionsHttpError hides the body in error.context (the raw Response)
        let msg = firstError.data?.error ?? 'Image generation failed'
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawText = await (firstError.error as any)?.context?.text?.()
          if (rawText) {
            const parsed = JSON.parse(rawText)
            msg = parsed?.error ?? rawText
          }
        } catch { /* fall through */ }
        console.error('[generate-poster] actual error:', msg)
        setMoodError(msg)
        setMoodGenerating(false)
        return
      }
      const imgs = results
        .map(r => r.data?.images?.bold ?? r.data?.images?.minimal ?? r.data?.images?.vibrant ?? '')
        .filter(Boolean)
      setMoodImages(imgs)
    } catch (e) {
      setMoodError((e as Error).message ?? 'Unexpected error')
    }
    setMoodGenerating(false)
  }

  const handleGenerateFrame = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return
    setGeneratingFrameId(sceneId)
    const { data } = await supabase.functions.invoke('generate-poster', {
      body: { industry: userIndustry, business_name: scene.title, style: style.falStyle, unlock: false },
    })
    const img = data?.images?.bold ?? data?.images?.minimal ?? data?.images?.vibrant
    if (img) setFrameImages(prev => ({ ...prev, [sceneId]: img }))
    setGeneratingFrameId(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const formatLabel = FORMAT_OPTIONS.find(f => f.id === format)?.label ?? format
    const typeMap: Record<string, string> = {
      'commercial-15': 'video-commercial',
      'commercial-30': 'video-commercial',
      'commercial-60': 'brand-film',
      'documentary': 'documentary',
    }
    const { error } = await supabase.from('projects').insert({
      user_id: user?.id,
      title: `${style.name} — ${formatLabel}`,
      type: typeMap[format] ?? 'video-commercial',
      package: 'Video Journey',
      status: 'queued',
      creator_name: '',
      max_iterations: 3,
      brief: JSON.stringify({
        style: style.id,
        styleName: style.name,
        format,
        brief,
        sceneCount: scenes.length,
        scenes: scenes.map(s => ({ number: s.number, title: s.title, timecode: s.timecode, vo: s.vo })),
        moodBoardCount: moodImages.length,
        submittedAt: new Date().toISOString(),
      }),
    })
    setSubmitting(false)
    if (!error) navigate('/projects', { state: { submitted: true } })
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Video Journey</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <Film size={10} /> 6-Step Brief
            </span>
          </div>
          <p className="text-sm text-gray-500">Sign off every stage before production begins — zero surprises, fewer revisions.</p>
        </div>
        <button onClick={() => navigate('/concept-studio')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 bg-white hover:border-gray-300 transition-all">
          <ArrowLeft size={12} /> Back to Concept Studio
        </button>
      </div>

      {/* Step progress */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="flex items-start justify-between gap-1 mb-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'text-white' : i === step ? 'text-white' : 'text-gray-400 bg-gray-100'
              }`} style={i <= step ? { background: STEP_COLORS[i] } : undefined}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <p className={`text-[9px] font-semibold text-center ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(step / (STEPS.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, #7c3aed, #2563eb, #059669, #d97706, #dc2626, #0891b2)',
            }} />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        {step === 0 && <StylePicker selected={selectedStyle} onSelect={setSelectedStyle} styleImages={styleImages} thumbsLoading={thumbsLoading} />}
        {step === 1 && (
          <ScriptStep brief={brief} setBrief={setBrief} format={format} setFormat={setFormat}
            scenes={scenes} onGenerate={handleGenerateScript} generating={scriptGenerating} error={scriptError} />
        )}
        {step === 2 && (
          <SceneEditor scenes={scenes} setScenes={setScenes} brief={brief} styleName={style.name}
            onEnhance={handleEnhanceScene} enhancingId={enhancingId} />
        )}
        {step === 3 && (
          <MoodBoardStep style={style} images={moodImages} onGenerate={handleGenerateMoodBoard} generating={moodGenerating} error={moodError} />
        )}
        {step === 4 && (
          <StoryboardStep scenes={scenes} style={style} frameImages={frameImages}
            onGenerateFrame={handleGenerateFrame} generatingFrameId={generatingFrameId} />
        )}
        {step === 5 && (
          <SignOffStep style={style} format={format} brief={brief} scenes={scenes} moodImages={moodImages}
            onSubmit={handleSubmit} submitting={submitting} />
        )}
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:border-gray-300 disabled:opacity-40 transition-all">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3">
            {(step === 3 || step === 4) && (
              <button onClick={() => setStep(s => s + 1)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Skip this step
              </button>
            )}
            <button onClick={() => setStep(s => s + 1)} disabled={!canContinue()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
              style={{ background: `linear-gradient(135deg, ${STEP_COLORS[step]}, ${STEP_COLORS[Math.min(step + 1, 5)]})` }}>
              {step === 4 ? 'Review & Sign Off' : 'Continue'} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
