import { useRef, useEffect, useState, useCallback } from 'react'
import { Download, Sparkles, ImageIcon, Loader2, Lock, Check } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import BuyCreditsModal from './BuyCreditsModal'
import { CampaignFormData, GeneratedContent } from '../types'

/* ── Text helpers ──────────────────────────────────────────────── */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxWidth: number, lineHeight: number,
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
  whatsappNumber?: string
}

/* Cover-fit an image onto the canvas */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const scale = Math.max(W / img.width, H / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
}

/* Gradient fallback while the AI background loads (or if it fails) */
function drawFallbackBg(ctx: CanvasRenderingContext2D, style: Style, W: number, H: number) {
  if (style === 'bold') {
    ctx.fillStyle = '#09090b'
    ctx.fillRect(0, 0, W, H)
    const r1 = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.75)
    r1.addColorStop(0, 'rgba(124,58,237,0.55)')
    r1.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = r1
    ctx.fillRect(0, 0, W, H)
  } else if (style === 'minimal') {
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#292524')
    bg.addColorStop(1, '#44403c')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
  } else {
    const bg = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, H)
    bg.addColorStop(0, '#3b0764')
    bg.addColorStop(0.5, '#1e3a8a')
    bg.addColorStop(1, '#065f46')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
  }
}

/* ── Poster renderer: AI photo background + campaign copy ──────── */
function drawPoster(canvas: HTMLCanvasElement, opts: DrawOptions, bg: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width   // 768
  const H = canvas.height  // 1024

  ctx.clearRect(0, 0, W, H)

  /* ── Background: AI image or gradient fallback ── */
  if (bg) {
    drawCover(ctx, bg, W, H)
  } else {
    drawFallbackBg(ctx, opts.style, W, H)
  }

  /* ── Legibility scrims (always over photo) ── */
  const top = ctx.createLinearGradient(0, 0, 0, H * 0.32)
  top.addColorStop(0, 'rgba(0,0,0,0.72)')
  top.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, W, H * 0.32)

  const bottom = ctx.createLinearGradient(0, H * 0.45, 0, H)
  bottom.addColorStop(0, 'rgba(0,0,0,0)')
  bottom.addColorStop(0.55, 'rgba(0,0,0,0.55)')
  bottom.addColorStop(1, 'rgba(0,0,0,0.85)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, H * 0.45, W, H * 0.55)

  /* ── Per-style accent ── */
  const accent = opts.style === 'vibrant' ? '#fbbf24' : opts.style === 'minimal' ? '#e7e5e4' : '#a78bfa'

  /* ── Business name ── */
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `700 15px Inter, -apple-system, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(opts.businessName.toUpperCase(), 36, 52)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `400 11px Inter, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('niamedia.co.ke', W - 36, 52)
  ctx.textAlign = 'left'

  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(36, 68); ctx.lineTo(W - 36, 68); ctx.stroke()

  /* ── Offer pill ── */
  const offerLine = (opts.offerText ?? '').split('\n')[0].replace(/^[•\-\s]+/, '').trim()
  const offer = offerLine.length > 60 ? `${offerLine.slice(0, 57).trimEnd()}…` : offerLine
  let textY = H - 300

  if (offer) {
    ctx.font = `700 13px Inter, sans-serif`
    const pillText = offer.toUpperCase()
    const pillW = Math.min(ctx.measureText(pillText).width + 36, W - 72)
    const pillH = 32

    ctx.fillStyle = opts.style === 'minimal' ? 'rgba(255,255,255,0.92)' : '#fbbf24'
    roundRect(ctx, 36, textY - 22, pillW, pillH, 16)
    ctx.fill()

    ctx.fillStyle = '#451a03'
    ctx.fillText(pillText, 54, textY)
    textY += 56
  }

  /* ── Headline ── */
  ctx.fillStyle = '#ffffff'
  const hSize = opts.headline.length > 50 ? 38 : opts.headline.length > 35 ? 44 : 52
  ctx.font = `800 ${hSize}px Inter, -apple-system, sans-serif`
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 14
  const finalY = wrapText(ctx, opts.headline, 36, textY, W - 72, hSize + 10)
  ctx.shadowBlur = 0

  /* ── Subheadline ── */
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `400 19px Inter, -apple-system, sans-serif`
  wrapText(ctx, opts.subheadline, 36, finalY + 22, W - 72, 28)

  /* ── CTA button ── */
  const btnY = H - 104
  const btnH = 52
  ctx.font = `700 16px Inter, sans-serif`
  const btnW = Math.min(ctx.measureText(opts.cta).width + 64, 310)

  if (opts.style === 'vibrant') {
    ctx.fillStyle = '#fbbf24'
  } else if (opts.style === 'minimal') {
    ctx.fillStyle = '#ffffff'
  } else {
    const btnGrad = ctx.createLinearGradient(36, 0, 36 + btnW, 0)
    btnGrad.addColorStop(0, '#7c3aed')
    btnGrad.addColorStop(1, '#2563eb')
    ctx.fillStyle = btnGrad
  }
  roundRect(ctx, 36, btnY, btnW, btnH, 26)
  ctx.fill()

  ctx.fillStyle = opts.style === 'bold' ? '#ffffff' : '#1c1917'
  ctx.textAlign = 'center'
  ctx.fillText(opts.cta, 36 + btnW / 2, btnY + 32)
  ctx.textAlign = 'left'

  /* ── WhatsApp number ── */
  if (opts.whatsappNumber) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = `400 13px Inter, sans-serif`
    ctx.fillText(`wa.me/${opts.whatsappNumber.replace(/\D/g, '')}`, 36, H - 30)
  }

  /* ── Accent corner mark ── */
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, 6, 96)

  /* ── Watermark ── */
  if (opts.watermark) {
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#fff'
    ctx.font = `700 26px Inter, sans-serif`
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 6)
    ctx.textAlign = 'center'
    for (let i = -3; i <= 3; i++) ctx.fillText('SAMPLE  ·  niamedia.co.ke', 0, i * 110)
    ctx.restore()
  }
}

/* ── Component ────────────────────────────────────────────────── */
interface Props { form: CampaignFormData; content: GeneratedContent }

const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: 'bold', label: 'Bold', desc: 'Dark & dramatic' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean editorial' },
  { id: 'vibrant', label: 'Vibrant', desc: 'Bold colour' },
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default function PosterCanvas({ form, content }: Props) {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeStyle, setActiveStyle] = useState<Style>('bold')
  const [downloading, setDownloading] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [bgImages, setBgImages] = useState<Partial<Record<Style, HTMLImageElement>>>({})
  const [previewLoading, setPreviewLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const posterContext = {
    industry: form.industry,
    business_name: form.business_name,
    product_name: form.product_name,
    location: form.location,
    offer: form.offer,
    tone: form.tone,
    target_audience: form.target_audience,
    design_direction: content.posterCopy.designDirection,
  }

  /* Free AI background preview (bold style) on mount */
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-poster`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
          },
          body: JSON.stringify(posterContext),
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.images?.bold && !cancelled) {
          const img = await loadImage(data.images.bold)
          if (!cancelled) setBgImages(prev => ({ ...prev, bold: img }))
        }
      } catch {} finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Unlock: 1 credit → 3 high-res AI styles */
  const unlockStyles = async () => {
    if (unlocking) return
    setUnlocking(true); setUnlockError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setUnlockError('Please sign in again to unlock.'); return }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-poster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...posterContext, unlock: true }),
      })
      if (res.status === 402) { setShowBuyModal(true); return }
      if (!res.ok) throw new Error('unlock failed')
      const data = await res.json()
      const entries = await Promise.all(
        (['bold', 'minimal', 'vibrant'] as Style[])
          .filter(s => data?.images?.[s])
          .map(async s => [s, await loadImage(data.images[s])] as const)
      )
      setBgImages(prev => {
        const next = { ...prev }
        for (const [s, img] of entries) next[s] = img
        return next
      })
      setUnlocked(true)
    } catch {
      setUnlockError('Could not unlock — please try again.')
    } finally {
      setUnlocking(false)
    }
  }

  const opts: DrawOptions = {
    style: activeStyle,
    watermark: !user,
    businessName: form.business_name || 'Your Business',
    headline: content.posterCopy.headline || 'Your Campaign Headline',
    subheadline: content.posterCopy.subheadline || '',
    offerText: content.posterCopy.offerText || '',
    cta: content.posterCopy.cta || 'Get In Touch',
    whatsappNumber: form.whatsapp_number,
  }

  const activeBg = bgImages[activeStyle] ?? null

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    document.fonts.ready.then(() => drawPoster(canvas, opts, activeBg))
  }, [activeStyle, activeBg, opts.headline, opts.subheadline, opts.offerText, opts.cta, opts.businessName, opts.watermark, opts.whatsappNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { draw() }, [draw])

  const downloadPoster = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setDownloading(true)
    const link = document.createElement('a')
    link.download = `${(form.business_name || 'campaign').replace(/\s+/g, '_')}_poster_${activeStyle}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setTimeout(() => setDownloading(false), 800)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {showBuyModal && <BuyCreditsModal onClose={() => setShowBuyModal(false)} />}

      {/* Canvas preview */}
      <div className="flex-1 flex flex-col items-center gap-4 w-full">
        <div className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ width: '100%', maxWidth: 340 }}>
          <canvas
            ref={canvasRef}
            width={768} height={1024}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          {previewLoading && !activeBg && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
              <Loader2 size={11} className="animate-spin" /> AI scene loading…
            </div>
          )}
        </div>

        {/* Style picker */}
        <div className="flex gap-2">
          {STYLES.map(s => {
            const hasAiBg = !!bgImages[s.id]
            return (
              <button key={s.id} onClick={() => setActiveStyle(s.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  activeStyle === s.id
                    ? 'border-purple-500 bg-purple-500/10 text-purple-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {s.label}
                {hasAiBg
                  ? <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={9} className="text-white" /></span>
                  : !unlocked && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center"><Lock size={8} className="text-white" /></span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full lg:w-64 space-y-4 shrink-0">
        <div className="card-glow p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-purple-500" />
            <p className="text-sm font-bold text-gray-900">AI Poster Studio</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            A real AI-generated scene for your business with your campaign copy composed on top — ready for WhatsApp Status, Instagram, or print.
          </p>

          {!unlocked && (
            <button
              onClick={unlockStyles}
              disabled={unlocking}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 mb-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              {unlocking
                ? <><Loader2 size={14} className="animate-spin" /> Generating 3 styles…</>
                : <><Sparkles size={14} /> Unlock 3 HD Styles — 1 credit</>}
            </button>
          )}
          {unlocked && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <Check size={13} className="text-emerald-600 shrink-0" />
              <p className="text-xs font-semibold text-emerald-700">3 HD styles unlocked — switch above</p>
            </div>
          )}
          {unlockError && <p className="text-xs text-red-500 mb-2">{unlockError}</p>}

          <button
            onClick={downloadPoster}
            disabled={downloading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
              unlocked ? 'text-white' : 'text-purple-700 border border-purple-200 bg-purple-50'
            }`}
            style={unlocked ? { background: 'linear-gradient(135deg, #7c3aed, #2563eb)' } : undefined}>
            {downloading
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Download size={14} /> Download PNG</>}
          </button>

          {!user && (
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Sign in to remove watermark
            </p>
          )}
        </div>

        <div className="card-glow p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Poster Copy</p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">Headline</p>
              <p className="text-xs text-gray-800 font-medium leading-snug">{content.posterCopy.headline}</p>
            </div>
            {content.posterCopy.offerText && (
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Offer</p>
                <p className="text-xs text-gray-800 leading-snug">{content.posterCopy.offerText}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-gray-400 mb-0.5">CTA</p>
              <p className="text-xs text-gray-800 font-medium">{content.posterCopy.cta}</p>
            </div>
          </div>
        </div>

        <div className="card-glow p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Design Direction</p>
          <p className="text-xs text-gray-500 leading-relaxed italic">
            "{content.posterCopy.designDirection}"
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <ImageIcon size={13} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Need large-format print or a custom layout? Our design team can take this further —{' '}
            <a href="https://wa.me/254751822556?text=Hi%2C%20I%20need%20a%20professional%20print%20version%20of%20my%20poster"
              target="_blank" rel="noopener noreferrer" className="font-bold underline">
              WhatsApp us
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}
