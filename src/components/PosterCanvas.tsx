import { useRef, useEffect, useState, useCallback } from 'react'
import { Loader2, Download, Unlock, RefreshCw, Sparkles, ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BuyCreditsModal from './BuyCreditsModal'
import { CampaignFormData, GeneratedContent } from '../types'

/* ── Canvas drawing helpers ──────────────────────────────────── */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  let curY = y
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trimEnd(), x, curY)
      line = word + ' '
      curY += lineHeight
    } else {
      line = test
    }
  }
  if (line.trim()) ctx.fillText(line.trimEnd(), x, curY)
  return curY
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

type Style = 'bold' | 'minimal' | 'vibrant'

interface DrawOptions {
  style: Style
  watermark: boolean
  businessName: string
  headline: string
  subheadline: string
  offerText: string
  cta: string
}

function drawPoster(
  canvas: HTMLCanvasElement,
  bgImage: HTMLImageElement,
  opts: DrawOptions,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width   // 768
  const H = canvas.height  // 1024

  // 1 — Background
  ctx.drawImage(bgImage, 0, 0, W, H)

  // 2 — Style-tinted overlay (vibrant only)
  if (opts.style === 'vibrant') {
    const vibGrad = ctx.createLinearGradient(0, 0, W, H)
    vibGrad.addColorStop(0, 'rgba(109,40,217,0.18)')
    vibGrad.addColorStop(1, 'rgba(29,78,216,0.18)')
    ctx.fillStyle = vibGrad
    ctx.fillRect(0, 0, W, H)
  }
  if (opts.style === 'minimal') {
    ctx.fillStyle = 'rgba(248,250,252,0.12)'
    ctx.fillRect(0, 0, W, H)
  }

  // 3 — Top bar
  const topGrad = ctx.createLinearGradient(0, 0, 0, 80)
  topGrad.addColorStop(0, 'rgba(0,0,0,0.65)')
  topGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 80)

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `bold 15px Inter, -apple-system, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(opts.businessName.toUpperCase(), 28, 36)

  // niamedia badge top-right
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `11px Inter, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('niamedia.co.ke', W - 28, 36)
  ctx.textAlign = 'left'

  // 4 — Bottom gradient overlay
  const bottomGrad = ctx.createLinearGradient(0, H * 0.42, 0, H)
  if (opts.style === 'minimal') {
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)')
    bottomGrad.addColorStop(0.45, 'rgba(15,23,42,0.72)')
    bottomGrad.addColorStop(1, 'rgba(15,23,42,0.94)')
  } else {
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)')
    bottomGrad.addColorStop(0.35, 'rgba(0,0,0,0.72)')
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.93)')
  }
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, H * 0.42, W, H * 0.58)

  // 5 — Offer pill (optional)
  const hasOffer = opts.offerText && opts.offerText.trim()
  let textStartY = H - 230
  if (hasOffer) {
    const offerColor = opts.style === 'vibrant' ? '#fbbf24' : opts.style === 'minimal' ? '#818cf8' : '#fbbf24'
    ctx.font = `bold 13px Inter, sans-serif`
    const offerMetrics = ctx.measureText(opts.offerText.toUpperCase())
    const pillW = offerMetrics.width + 28
    const pillH = 28
    const pillX = 28
    const pillY = textStartY - 8

    // Offer pill background
    ctx.fillStyle = offerColor + '25'
    roundRect(ctx, pillX, pillY - pillH + 6, pillW, pillH, 14)
    ctx.fill()
    ctx.strokeStyle = offerColor + '60'
    ctx.lineWidth = 1
    roundRect(ctx, pillX, pillY - pillH + 6, pillW, pillH, 14)
    ctx.stroke()

    ctx.fillStyle = offerColor
    ctx.fillText(opts.offerText.toUpperCase(), pillX + 14, pillY + 2)
    textStartY += 46
  }

  // 6 — Headline
  ctx.fillStyle = '#ffffff'
  const headlineSize = opts.headline.length > 40 ? 40 : opts.headline.length > 28 ? 46 : 52
  ctx.font = `bold ${headlineSize}px Inter, -apple-system, sans-serif`
  const finalHeadlineY = wrapText(ctx, opts.headline, 28, textStartY, W - 56, headlineSize + 8)

  // 7 — Subheadline
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.font = `19px Inter, -apple-system, sans-serif`
  wrapText(ctx, opts.subheadline, 28, finalHeadlineY + 18, W - 56, 26)

  // 8 — CTA button
  const ctaBtnY = H - 72
  const ctaBtnH = 48
  const ctaText = opts.cta
  ctx.font = `bold 16px Inter, sans-serif`
  const ctaW = Math.min(ctx.measureText(ctaText).width + 56, 280)
  const ctaX = 28

  if (opts.style === 'vibrant') {
    const grad = ctx.createLinearGradient(ctaX, 0, ctaX + ctaW, 0)
    grad.addColorStop(0, '#7c3aed')
    grad.addColorStop(1, '#2563eb')
    ctx.fillStyle = grad
  } else if (opts.style === 'minimal') {
    ctx.fillStyle = '#ffffff'
  } else {
    ctx.fillStyle = '#7c3aed'
  }
  roundRect(ctx, ctaX, ctaBtnY, ctaW, ctaBtnH, 24)
  ctx.fill()

  ctx.fillStyle = opts.style === 'minimal' ? '#1e1b4b' : '#ffffff'
  ctx.font = `bold 16px Inter, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(ctaText, ctaX + ctaW / 2, ctaBtnY + 30)
  ctx.textAlign = 'left'

  // 9 — Watermark (if locked)
  if (opts.watermark) {
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 28px Inter, sans-serif`
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 6)
    ctx.textAlign = 'center'
    for (let i = -3; i <= 3; i++) {
      ctx.fillText('SAMPLE  ·  niamedia.co.ke', 0, i * 110)
    }
    ctx.restore()
  }
}

/* ── Component ───────────────────────────────────────────────── */

interface Props {
  form: CampaignFormData
  content: GeneratedContent
}

const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: 'bold', label: 'Bold', desc: 'Dramatic cinematic' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean editorial' },
  { id: 'vibrant', label: 'Vibrant', desc: 'Rich warm tones' },
]

export default function PosterCanvas({ form, content }: Props) {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'idle' | 'generating' | 'preview' | 'unlocking' | 'unlocked'>('idle')
  const [images, setImages] = useState<Partial<Record<Style, string>>>({})
  const [activeStyle, setActiveStyle] = useState<Style>('bold')
  const [error, setError] = useState('')
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const posterData = {
    businessName: form.business_name,
    headline: content.posterCopy.headline,
    subheadline: content.posterCopy.subheadline,
    offerText: content.posterCopy.offerText ?? '',
    cta: content.posterCopy.cta,
  }

  // Generate preview (watermarked, free, bold only)
  const generatePreview = useCallback(async () => {
    setPhase('generating')
    setError('')
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('generate-poster', {
        body: {
          industry: form.industry, business_name: form.business_name,
          product_name: form.product_name, location: form.location,
          offer: form.offer, tone: form.tone, target_audience: form.target_audience,
          design_direction: form.notes,
          unlock: false,
        },
      })
      if (fnErr || data?.error) throw new Error(data?.error ?? fnErr?.message)
      setImages({ bold: data.images.bold })
      setPhase('preview')
    } catch (e) {
      setError((e as Error).message)
      setPhase('idle')
    }
  }, [form.industry, form.business_name, form.product_name, form.location, form.offer, form.tone, form.target_audience, form.notes])

  // Unlock: spend 1 credit, generate all 3 styles
  const unlock = async () => {
    if (!user) return
    setPhase('unlocking')
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await supabase.functions.invoke('generate-poster', {
        body: {
          industry: form.industry, business_name: form.business_name,
          product_name: form.product_name, location: form.location,
          offer: form.offer, tone: form.tone, target_audience: form.target_audience,
          design_direction: form.notes,
          unlock: true,
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      })
      if (data?.error === 'insufficient_credits') { setShowBuyModal(true); setPhase('preview'); return }
      if (fnErr || data?.error) throw new Error(data?.error ?? fnErr?.message)
      setImages(data.images as Record<Style, string>)
      setActiveStyle('bold')
      setPhase('unlocked')
    } catch (e) {
      setError((e as Error).message)
      setPhase('preview')
    }
  }

  // Draw on canvas whenever the active image or phase changes
  useEffect(() => {
    const canvas = canvasRef.current
    const imgData = images[activeStyle]
    if (!canvas || !imgData) return

    const img = new Image()
    img.onload = () => {
      document.fonts.ready.then(() => {
        drawPoster(canvas, img, {
          style: activeStyle,
          watermark: phase === 'preview',
          ...posterData,
        })
      })
    }
    img.src = imgData
  }, [images, activeStyle, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const downloadPoster = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    const link = document.createElement('a')
    link.download = `${form.business_name.replace(/\s+/g, '_')}_poster_${activeStyle}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setTimeout(() => setDownloading(false), 800)
  }

  // ── Idle state ──────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #ede9fe, #dbeafe)' }}>
          <ImageIcon size={28} style={{ color: '#7c3aed' }} />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Generate Your Campaign Poster</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            AI creates a professional poster background tailored to <strong>{form.industry}</strong>.
            Your headline and CTA are overlaid automatically.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {STYLES.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-900">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={generatePreview} className="btn-primary px-8 py-3 text-sm gap-2">
          <Sparkles size={15} /> Preview My Poster — Free
        </button>
        <p className="text-xs text-gray-400">Preview is free · Unlock 3 styles with 1 credit</p>
      </div>
    )
  }

  // ── Loading states ──────────────────────────────────────────
  if (phase === 'generating' || phase === 'unlocking') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
          <Loader2 size={26} className="text-white animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 mb-1">
            {phase === 'unlocking' ? 'Generating 3 poster styles…' : 'Creating your poster background…'}
          </p>
          <p className="text-sm text-gray-500">
            {phase === 'unlocking' ? 'Bold, Minimal, and Vibrant — takes about 15 seconds' : 'AI is crafting a background for ' + form.industry}
          </p>
        </div>
      </div>
    )
  }

  // ── Preview / Unlocked ──────────────────────────────────────
  const isUnlocked = phase === 'unlocked'

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}

      {/* Canvas */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="relative rounded-2xl overflow-hidden shadow-lg"
          style={{ width: '100%', maxWidth: 340 }}>
          <canvas
            ref={canvasRef}
            width={768}
            height={1024}
            style={{ width: '100%', display: 'block', borderRadius: 16 }}
          />
          {!isUnlocked && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
                SAMPLE PREVIEW
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(124,58,237,0.8)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                Watermarked
              </span>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* Regenerate preview */}
        {phase === 'preview' && (
          <button onClick={generatePreview}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw size={11} /> Try a different background
          </button>
        )}
      </div>

      {/* Controls panel */}
      <div className="w-full lg:w-72 space-y-4">

        {/* Style selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Poster Style</p>
          <div className="space-y-2">
            {STYLES.map(s => {
              const available = isUnlocked || s.id === 'bold'
              const active = activeStyle === s.id
              return (
                <button key={s.id} onClick={() => available && setActiveStyle(s.id)}
                  disabled={!available}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-purple-400 bg-purple-50'
                      : available
                      ? 'border-gray-200 bg-white hover:border-purple-200'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                    <p className="text-[11px] text-gray-400">{s.desc}</p>
                  </div>
                  {!available && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#ede9fe', color: '#7c3aed' }}>Locked</span>
                  )}
                  {active && available && (
                    <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          {isUnlocked ? (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Download</p>
              <button onClick={downloadPoster} disabled={downloading}
                className="btn-primary w-full py-3 text-sm gap-2 disabled:opacity-60">
                {downloading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Download size={14} />}
                {downloading ? 'Preparing…' : `Download ${activeStyle.charAt(0).toUpperCase() + activeStyle.slice(1)} Poster`}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                PNG · 768×1024px · No watermark · Commercial rights yours
              </p>
              <div className="pt-3 border-t border-gray-100">
                <button onClick={generatePreview}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors w-full justify-center">
                  <RefreshCw size={11} /> Regenerate backgrounds
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Unlock Full Poster</p>
              <div className="space-y-2 mb-3">
                {[
                  '3 poster styles (Bold, Minimal, Vibrant)',
                  'No watermark — clean PNG download',
                  '768×1024px · commercial use rights',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: '#d1fae5' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#059669' }} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={unlock}
                className="btn-primary w-full py-3 text-sm gap-2">
                <Unlock size={14} /> Unlock 3 Styles — 1 Credit
              </button>
              <p className="text-[11px] text-gray-400 text-center">= KES 500 · or buy credit pack for more</p>
            </>
          )}
        </div>

        {/* Copy info */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Using your copy</p>
          <p className="text-xs font-semibold text-gray-800 leading-snug">"{content.posterCopy.headline}"</p>
          <p className="text-[11px] text-gray-500">{content.posterCopy.subheadline}</p>
          <div className="pt-2 border-t border-gray-200">
            <p className="text-[10px] text-gray-400">CTA: <span className="font-semibold text-gray-600">{content.posterCopy.cta}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
