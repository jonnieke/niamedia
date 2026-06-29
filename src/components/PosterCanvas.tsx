import { useRef, useEffect, useState, useCallback } from 'react'
import { Download, Sparkles, ImageIcon, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
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

/* ── Pure-canvas poster renderer (no AI image dependency) ─────── */
function drawPoster(canvas: HTMLCanvasElement, opts: DrawOptions) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width   // 768
  const H = canvas.height  // 1024

  ctx.clearRect(0, 0, W, H)

  /* ── Backgrounds ── */
  if (opts.style === 'bold') {
    ctx.fillStyle = '#09090b'
    ctx.fillRect(0, 0, W, H)

    // Purple radial top-right
    const r1 = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.75)
    r1.addColorStop(0, 'rgba(124,58,237,0.55)')
    r1.addColorStop(0.5, 'rgba(109,40,217,0.15)')
    r1.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = r1
    ctx.fillRect(0, 0, W, H)

    // Blue radial bottom-left
    const r2 = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.65)
    r2.addColorStop(0, 'rgba(37,99,235,0.40)')
    r2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = r2
    ctx.fillRect(0, 0, W, H)

    // Subtle dot grid
    ctx.fillStyle = 'rgba(255,255,255,0.035)'
    for (let x = 24; x < W; x += 48) {
      for (let y = 24; y < H; y += 48) {
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill()
      }
    }

    // Diagonal accent line cluster top-right
    ctx.save()
    ctx.strokeStyle = 'rgba(167,139,250,0.12)'
    ctx.lineWidth = 1
    for (let i = 0; i < 6; i++) {
      const offset = i * 22
      ctx.beginPath(); ctx.moveTo(W - 160 + offset, 0); ctx.lineTo(W + offset, 160); ctx.stroke()
    }
    ctx.restore()

  } else if (opts.style === 'minimal') {
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, W, H)

    // Soft purple wash top
    const topWash = ctx.createLinearGradient(0, 0, 0, 260)
    topWash.addColorStop(0, 'rgba(124,58,237,0.07)')
    topWash.addColorStop(1, 'rgba(124,58,237,0)')
    ctx.fillStyle = topWash
    ctx.fillRect(0, 0, W, 260)

    // Left accent bar
    const leftBar = ctx.createLinearGradient(0, 0, 0, H)
    leftBar.addColorStop(0, '#7c3aed')
    leftBar.addColorStop(0.55, '#2563eb')
    leftBar.addColorStop(1, 'rgba(37,99,235,0.15)')
    ctx.fillStyle = leftBar
    ctx.fillRect(0, 0, 9, H)

    // Bottom light band
    const bottomBand = ctx.createLinearGradient(0, H - 140, 0, H)
    bottomBand.addColorStop(0, 'rgba(124,58,237,0)')
    bottomBand.addColorStop(1, 'rgba(124,58,237,0.06)')
    ctx.fillStyle = bottomBand
    ctx.fillRect(0, H - 140, W, 140)

  } else {
    // Vibrant
    const bg = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, H)
    bg.addColorStop(0, '#3b0764')
    bg.addColorStop(0.38, '#1e3a8a')
    bg.addColorStop(0.72, '#065f46')
    bg.addColorStop(1, '#1e1b4b')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Soft radial centre highlight
    const hl = ctx.createRadialGradient(W / 2, H * 0.28, 0, W / 2, H * 0.28, W * 0.6)
    hl.addColorStop(0, 'rgba(255,255,255,0.14)')
    hl.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = hl
    ctx.fillRect(0, 0, W, H)

    // Diagonal texture lines
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.045)'
    ctx.lineWidth = 1.5
    for (let i = -H; i < W + H; i += 44) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke()
    }
    ctx.restore()
  }

  /* ── Text colour palette per style ── */
  const dark = opts.style === 'minimal'
  const headlineColor = dark ? '#0f172a' : '#ffffff'
  const subColor = dark ? 'rgba(71,85,105,0.9)' : 'rgba(255,255,255,0.78)'
  const offerColor = opts.style === 'vibrant' ? '#fbbf24' : opts.style === 'minimal' ? '#7c3aed' : '#fbbf24'

  /* ── Business name ── */
  ctx.fillStyle = dark ? '#7c3aed' : 'rgba(255,255,255,0.85)'
  ctx.font = `700 15px Inter, -apple-system, sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(opts.businessName.toUpperCase(), 36, 52)

  // niamedia badge top-right
  ctx.fillStyle = dark ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.35)'
  ctx.font = `400 11px Inter, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('niamedia.co.ke', W - 36, 52)
  ctx.textAlign = 'left'

  // Thin separator line under header
  ctx.strokeStyle = dark ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(36, 68); ctx.lineTo(W - 36, 68); ctx.stroke()

  /* ── Offer pill ── */
  const hasOffer = opts.offerText?.trim()
  let textY = H - 280

  if (hasOffer) {
    ctx.font = `700 12px Inter, sans-serif`
    const pillText = opts.offerText.toUpperCase()
    const pillW = Math.min(ctx.measureText(pillText).width + 32, W - 72)
    const pillH = 30

    ctx.fillStyle = offerColor + '22'
    roundRect(ctx, 36, textY - 22, pillW, pillH, 15)
    ctx.fill()
    ctx.strokeStyle = offerColor + '70'
    ctx.lineWidth = 1
    roundRect(ctx, 36, textY - 22, pillW, pillH, 15)
    ctx.stroke()

    ctx.fillStyle = offerColor
    ctx.fillText(pillText, 52, textY + 2)
    textY += 52
  }

  /* ── Headline ── */
  ctx.fillStyle = headlineColor
  const hSize = opts.headline.length > 50 ? 38 : opts.headline.length > 35 ? 44 : 52
  ctx.font = `800 ${hSize}px Inter, -apple-system, sans-serif`
  const finalY = wrapText(ctx, opts.headline, 36, textY, W - 72, hSize + 10)

  /* ── Subheadline ── */
  ctx.fillStyle = subColor
  ctx.font = `400 19px Inter, -apple-system, sans-serif`
  wrapText(ctx, opts.subheadline, 36, finalY + 22, W - 72, 28)

  /* ── CTA button ── */
  const btnY = H - 100
  const btnH = 52
  ctx.font = `700 16px Inter, sans-serif`
  const btnW = Math.min(ctx.measureText(opts.cta).width + 64, 310)

  if (opts.style === 'vibrant') {
    ctx.fillStyle = '#fbbf24'
  } else if (opts.style === 'minimal') {
    ctx.fillStyle = '#7c3aed'
  } else {
    const btnGrad = ctx.createLinearGradient(36, 0, 36 + btnW, 0)
    btnGrad.addColorStop(0, '#7c3aed')
    btnGrad.addColorStop(1, '#2563eb')
    ctx.fillStyle = btnGrad
  }
  roundRect(ctx, 36, btnY, btnW, btnH, 26)
  ctx.fill()

  ctx.fillStyle = opts.style === 'vibrant' ? '#1e1b4b' : '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(opts.cta, 36 + btnW / 2, btnY + 32)
  ctx.textAlign = 'left'

  /* ── WhatsApp number ── */
  if (opts.whatsappNumber) {
    ctx.fillStyle = dark ? 'rgba(71,85,105,0.7)' : 'rgba(255,255,255,0.5)'
    ctx.font = `400 13px Inter, sans-serif`
    ctx.fillText(`wa.me/${opts.whatsappNumber.replace(/\D/g, '')}`, 36, H - 36)
  }

  /* ── Watermark ── */
  if (opts.watermark) {
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = dark ? '#000' : '#fff'
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

export default function PosterCanvas({ form, content }: Props) {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeStyle, setActiveStyle] = useState<Style>('bold')
  const [downloading, setDownloading] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)

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

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    document.fonts.ready.then(() => drawPoster(canvas, opts))
  }, [activeStyle, opts.headline, opts.subheadline, opts.offerText, opts.cta, opts.businessName, opts.watermark, opts.whatsappNumber]) // eslint-disable-line react-hooks/exhaustive-deps

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
        </div>

        {/* Style picker */}
        <div className="flex gap-2">
          {STYLES.map(s => (
            <button key={s.id} onClick={() => setActiveStyle(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeStyle === s.id
                  ? 'border-purple-500 bg-purple-500/10 text-purple-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full lg:w-64 space-y-4 shrink-0">
        <div className="card-glow p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-purple-500" />
            <p className="text-sm font-bold text-gray-900">Your Poster</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Instant professional poster with your campaign copy. Switch styles, then download as PNG — ready for WhatsApp Status, Instagram, or print.
          </p>

          <button
            onClick={downloadPoster}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
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
            For professional print or large-format display, send the design direction above to a graphic designer.
          </p>
        </div>
      </div>
    </div>
  )
}
