import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Link } from 'react-router-dom'

import {

  Film, CheckCircle2, ArrowRight, Clock, Zap,

  Phone, Building2, MessageSquare, ChevronRight, Star, Mic, Loader2, Paperclip, Sparkles, Trash2, Lock, FileText,

} from 'lucide-react'

import PublicHeader from '../components/layout/PublicHeader'

import { supabase } from '../lib/supabase'

import { SECONDARY_NIA_CTA } from '../lib/cta'

import { trackEvent } from '../lib/analytics'
import MarketSurveyModal from '../components/MarketSurveyModal'
import QuotationPrintModal from '../components/QuotationPrintModal'

/* Pricing logic */

const LENGTHS = [
  { id: '15s', label: '15 seconds', desc: 'Quick hook - TikTok, Reels, Stories', price: 5000 },
  { id: '30s', label: '30 seconds', desc: 'Standard commercial - all platforms',  price: 8000 },
  { id: '60s', label: '60 seconds', desc: 'Campaign film - full story arc',        price: 15000 },
  { id: '90s', label: '90 seconds', desc: 'Extended brand story',                  price: 20000 },
  { id: '3m+', label: '3 min+',     desc: 'Infomercial / mini-documentary',        price: 60000 },
]

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook',  label: 'Facebook' },
  { id: 'whatsapp',  label: 'WhatsApp' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'linkedin',  label: 'LinkedIn' },
]

const INDUSTRIES = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO',
  'Restaurant', 'Travel', 'Retail', 'Health & Wellness',
  'Events', 'Professional Services', 'Faith & Community', 'Other',
]

const RUSH = [
  { id: 'standard', label: 'Standard',   desc: '3-5 business days', mult: 1.0 },
  { id: '48h',      label: '48-hr rush', desc: '+25% fee',           mult: 1.25 },
  { id: '24h',      label: '24-hr rush', desc: '+50% fee',           mult: 1.5 },
]

function calcPrice(
  lengthId: string,
  platforms: string[],
  rush: string,
  subtitles: boolean,
): { min: number; max: number; total: number } {
  const base = LENGTHS.find(l => l.id === lengthId) ?? LENGTHS[1]
  const rushMult = RUSH.find(r => r.id === rush)?.mult ?? 1
  const platformMult = platforms.includes('youtube') ? 1.15 : 1
  const multiMult = platforms.length >= 3 ? 1.1 : 1
  const sub = subtitles ? 500 : 0
  const total = Math.round(base.price * rushMult * platformMult * multiMult + sub)

  return {
    min: total,
    max: total,
    total,
  }
}

/* Sub-components */

function StepBar({ step }: { step: number }) {

  const steps = ['Video Spec', 'Your Details', 'Confirmed']

  return (

    <div className="flex items-center gap-0 mb-10">

      {steps.map((label, i) => (

        <div key={label} className="flex items-center">

          <div className="flex items-center gap-2">

            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${

              i < step ? 'bg-emerald-500 text-white' :

              i === step ? 'bg-purple-600 text-white' :

              'bg-gray-100 text-gray-400'

            }`}>

              {i < step ? <CheckCircle2 size={14} /> : i + 1}

            </div>

            <span className={`text-sm font-semibold hidden sm:block ${

              i === step ? 'text-gray-900' : 'text-gray-400'

            }`}>{label}</span>

          </div>

          {i < steps.length - 1 && (

            <ChevronRight size={14} className="mx-3 text-gray-300" />

          )}

        </div>

      ))}

    </div>

  )

}

function PricePanel({ min, max, length, rush, platforms, poster, subtitles }: {

  min: number; max: number; length: string; rush: string; platforms: string[]; poster: boolean; subtitles: boolean

}) {

  const rushLabel = RUSH.find(r => r.id === rush)?.label ?? 'Standard'

  const lengthLabel = LENGTHS.find(l => l.id === length)?.label ?? '30 seconds'

  return (

    <div className="rounded-2xl p-6 sticky top-24"

      style={{ background: 'linear-gradient(145deg, #0d0025, #160040)', border: '1px solid rgba(167,139,250,0.25)' }}>

      <p className="text-xs font-bold tracking-widest mb-4" style={{ color: 'rgba(196,181,253,0.6)' }}>STANDARD ESTIMATE</p>

      <div className="mb-6">

        <p className="text-4xl font-extrabold text-white">

          KES {max.toLocaleString()}

        </p>

        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Standard transparent price · Final brief confirmed within 2 hrs</p>

      </div>

      <div className="space-y-2.5 mb-6">

        {[

          { label: 'Video length', val: lengthLabel },

          { label: 'Delivery',     val: rushLabel },

          { label: 'Platforms',    val: platforms.length > 0 ? platforms.map(p => PLATFORMS.find(pl => pl.id === p)?.label).join(', ') : 'Not selected' },

          { label: 'Poster',       val: poster ? 'Included' : 'Not included' },

          { label: 'Subtitles',    val: subtitles ? 'Included (+KES 500)' : 'Not included' },

        ].map(({ label, val }) => (

          <div key={label} className="flex items-start justify-between gap-3">

            <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>

            <span className="text-xs text-right font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{val}</span>

          </div>

        ))}

      </div>

      {/* 70% / 30% Milestone terms */}
      <div className="border-t pt-4 mb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(196,181,253,0.7)' }}>MILESTONE PAYMENT TERMS</p>
        <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>70% Deposit to Start:</span>
            <span className="font-extrabold text-emerald-400">KES {Math.round(max * 0.7).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>30% Balance on Delivery:</span>
            <span className="font-semibold text-white">KES {Math.round(max * 0.3).toLocaleString()}</span>
          </div>
        </div>
        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          🔒 Pay 70% deposit via M-Pesa or Card to begin. Balance payable only after you review and approve the watermarked video cut.
        </p>
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>

        <div className="flex items-center gap-2 mb-3">

          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />

          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Campaign copy included free</span>

        </div>

        <div className="flex items-center gap-2 mb-3">

          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />

          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>AI-generated script before filming</span>

        </div>

        <div className="flex items-center gap-2">

          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />

          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>2 revision rounds included</span>

        </div>

      </div>

      {/* Trust strip */}

      <div className="mt-5 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

        <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: 'rgba(196,181,253,0.45)' }}>TRUSTED BY</p>

        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>

          Onfon Media - Treasured Artifacts - PesaFlix - Ndovu Group - Shekel Coin

        </p>

      </div>

    </div>

  )

}

/* Main */

const SUCCESS_KEY = 'nia_quote_submitted'
const SUCCESS_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours
interface StoredSuccess {
  bizName: string
  waMessage: string
  quoteId?: string
  depositAmount?: number
  totalPrice?: number
  email?: string
  phone?: string
  lengthLabel?: string
  isPaid?: boolean
  ts: number
}

// Restores the success screen after a browser Back/refresh or PesaPal redirect instead of
// silently dropping the customer back to a blank step-0 form.
function readStoredSuccess(): StoredSuccess | null {
  if (typeof window === 'undefined') return null
  const isSubmitted = window.location.search.includes('submitted=1')
  const isPaid = window.location.search.includes('paid=true')
  if (!isSubmitted && !isPaid) return null
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SUCCESS_KEY) ?? 'null')
    if (!parsed?.ts || Date.now() - parsed.ts > SUCCESS_TTL_MS) return null
    if (!parsed.bizName) return null
    if (isPaid) {
      parsed.isPaid = true
    }
    return parsed
  } catch { return null }
}

export default function Quote() {

  const [successData, setSuccessData] = useState(() => readStoredSuccess())
  const [step, setStep] = useState(() => (readStoredSuccess() ? 2 : 0))

  // Step 0 - video spec

  const [length, setLength]     = useState('30s')

  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'tiktok'])

  const [rush, setRush]         = useState('standard')

  const [poster, setPoster]     = useState(true)

  const [subtitles, setSubtitles] = useState(false)

  // Step 1 - contact (pre-filled from the homepage demo when available)
  const demoCtx = (() => {
    try {
      const ctx = JSON.parse(localStorage.getItem('nia_demo_ctx') ?? '{}')
      return typeof ctx === 'object' && ctx !== null ? ctx : {}
    } catch { return {} }
  })()

  const [bizName, setBizName]   = useState<string>(demoCtx.businessName ?? '')

  const [contactName, setContactName] = useState('')

  const [phone, setPhone]       = useState('')

  const [email, setEmail]       = useState('')

  const [industry, setIndustry] = useState<string>(
    INDUSTRIES.includes(demoCtx.industry) ? demoCtx.industry : ''
  )

  const [brief, setBrief] = useState<string>(demoCtx.product ? `Promoting: ${demoCtx.product}` : '')
  const [supportingFiles, setSupportingFiles] = useState<{ id: string; file: File }[]>([])
  const [isListening, setIsListening] = useState(false)
  const [listeningText, setListeningText] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [refining, setRefining] = useState(false)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [showSurvey, setShowSurvey] = useState(false)
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [pesapalLoading, setPesapalLoading] = useState(false)
  const [pesapalError, setPesapalError] = useState('')

  const price = useMemo(() => calcPrice(length, platforms, rush, subtitles), [length, platforms, rush, subtitles])

  const handlePayDeposit = async () => {
    setPesapalLoading(true)
    setPesapalError('')
    try {
      const qId = successData?.quoteId || `quote_${Date.now()}`
      const depositAmt = successData?.depositAmount || Math.round(price.total * 0.7)
      const bName = successData?.bizName || bizName || 'Customer'
      const clientEmail = successData?.email || email || 'billing@niamedia.co.ke'
      const clientPhone = successData?.phone || phone || '0700000000'
      const lenLabel = successData?.lengthLabel || LENGTHS.find(l => l.id === length)?.label || 'Video'

      const { data, error: fnErr } = await supabase.functions.invoke('pesapal-checkout', {
        body: {
          orderId: `quote_${qId}`,
          amountKes: depositAmt,
          description: `70% Deposit for ${bName} (${lenLabel} commercial)`,
          email: clientEmail,
          phone: clientPhone,
          currency: 'KES',
          callbackUrl: `${window.location.origin}/quote?paid=true&quote_id=${qId}`,
        },
      })

      if (fnErr || !data?.redirectUrl) {
        throw new Error(data?.error || fnErr?.message || 'Unable to connect to PesaPal gateway')
      }

      window.location.href = data.redirectUrl
    } catch (err: any) {
      console.error('PesaPal checkout error:', err)
      setPesapalError(err.message || 'Payment initiation failed. Please WhatsApp us to pay directly via Paybill.')
      setPesapalLoading(false)
    }
  }

  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window))
    return () => {
      try {
        recognitionRef.current?.stop?.()
      } catch {
        // ignore cleanup errors
      }
    }
  }, [])

  const togglePlatform = (id: string) =>

    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const briefContext = useMemo(() => {
    const lengthLabel = LENGTHS.find(l => l.id === length)?.label || 'Not set'
    const deliveryLabel = RUSH.find(r => r.id === rush)?.label || 'Not set'
    const fileNames = supportingFiles.map(({ file }) => file.name)
    return [
      `Business: ${bizName || 'Unknown'}`,
      `Industry: ${industry || 'Not set'}`,
      `Video length: ${lengthLabel}`,
      `Platforms: ${platforms.length ? platforms.join(', ') : 'Not set'}`,
      `Delivery: ${deliveryLabel}`,
      `Supporting files: ${fileNames.length ? fileNames.join(', ') : 'None'}`,
    ].join('\n')
  }, [bizName, industry, length, platforms, rush, supportingFiles])

  const appendBrief = useCallback((text: string) => {
    const cleaned = text.trim()
    if (!cleaned) return
    setBrief(prev => {
      const base = prev.trim()
      if (!base) return cleaned
      return `${base.replace(/\s+$/, '')} ${cleaned}`
    })
  }, [])

  const handleSupportingFiles = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return
    const next = Array.from(fileList).map(file => ({ id: `${file.name}-${file.lastModified}-${file.size}`, file }))
    setSupportingFiles(prev => {
      const seen = new Set(prev.map(item => item.id))
      return [...prev, ...next.filter(item => !seen.has(item.id))]
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const removeSupportingFile = useCallback((id: string) => {
    setSupportingFiles(prev => prev.filter(item => item.id !== id))
  }, [])

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // ignore stop errors
    }
    recognitionRef.current = null
    transcriptRef.current = ''
    setListeningText('')
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!speechSupported || isListening) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    transcriptRef.current = ''
    setListeningText('')
    setIsListening(true)

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (const result of Array.from(event.results) as any[]) {
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) final += transcript
        else interim += transcript
      }
      const cleanedFinal = final.trim()
      transcriptRef.current = cleanedFinal || transcriptRef.current
      setListeningText((interim || cleanedFinal).trim())
    }

    recognition.onend = () => {
      const transcript = transcriptRef.current.trim()
      if (transcript) appendBrief(transcript)
      recognitionRef.current = null
      transcriptRef.current = ''
      setListeningText('')
      setIsListening(false)
    }

    recognition.onerror = () => {
      recognitionRef.current = null
      transcriptRef.current = ''
      setListeningText('')
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [appendBrief, isListening, speechSupported])

  const handleMicClick = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  const refineBrief = useCallback(async () => {
    const currentBrief = brief.trim()
    setError('')

    // Nia needs something to work with — otherwise the AI returns a
    // "tell me about your business" reply straight into the brief field.
    if (currentBrief.length < 12 && !(bizName.trim() && industry)) {
      setError('Give Nia something to work with first — fill in your business name and industry above, or type a sentence about what you\'re promoting.')
      return
    }

    setRefining(true)

    const prompt = currentBrief
      ? `Rewrite this quote brief for a video commercial so it is clearer, sharper, and more conversion-focused. Return only the improved brief as plain prose sentences — no markdown, no asterisks, no headers, no bullet points, and no intro. ${briefContext}. Current brief: ${currentBrief}`
      : `Write a strong quote brief for a video commercial. Return only the improved brief as plain prose sentences — no markdown, no asterisks, no headers, no bullet points, and no intro. ${briefContext}.`

    try {
      const invocation = supabase.functions.invoke('chat-agent', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          voiceEnabled: false,
          userContext: {
            businessName: bizName || undefined,
            industry: industry || undefined,
            videoLength: LENGTHS.find(l => l.id === length)?.label || undefined,
            platforms,
            deliverySpeed: RUSH.find(r => r.id === rush)?.label || undefined,
            attachments: supportingFiles.map(({ file }) => file.name),
          },
        },
      })
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30000))
      const { data, error: fnError } = await Promise.race([invocation, timeout])

      const rawReply = typeof data?.reply === 'string' ? data.reply.trim() : ''
      if (fnError || !rawReply) throw new Error(fnError?.message || 'AI assist unavailable')

      // If the model asks for more info instead of writing the brief,
      // don't overwrite the user's field with it.
      if (/^(i can't|i cannot|i need|i'm sorry|sorry|to write)/i.test(rawReply) || /without knowing/i.test(rawReply)) {
        setError('Nia needs a bit more detail — add what you\'re promoting or your offer, then try again.')
        return
      }

      // Strip stray markdown the model may add — this field is plain text.
      const reply = rawReply
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^[-*]\s+/gm, '')

      setBrief(reply)
      trackEvent('nia_assistant_refine_success', {
        cta_location: 'quote_details',
        had_existing_brief: Boolean(currentBrief),
        attachment_count: supportingFiles.length,
      })
    } catch (err) {
      console.error('Quote brief refinement failed:', err)
      setError('Nia Assist could not refine the brief right now. Please try again in a moment — or just write it in your own words, that works too.')
      trackEvent('nia_assistant_refine_failed', { cta_location: 'quote_details' })
    } finally {
      setRefining(false)
    }
  }, [brief, briefContext, bizName, industry, length, platforms, rush, supportingFiles])

  const submit = async () => {
    if (!bizName.trim() || !phone.trim()) { setError('Business name and phone number are required.'); return }

    setError('')
    setSubmitting(true)

    // Everything below is wrapped so an unexpected throw (network drop,
    // storage hiccup) can never leave the button stuck on "Submitting...".
    try {
      const attachmentNotes: string[] = []
      for (const item of supportingFiles) {
        try {
          const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
          const path = `quote-requests/${uniqueId}-${safeName}`
          const { error: uploadErr } = await supabase.storage.from('brand-assets').upload(path, item.file, {
            upsert: false,
            contentType: item.file.type || 'application/octet-stream',
          })

          if (uploadErr) {
            attachmentNotes.push(`${item.file.name} (attached file)`)
            continue
          }

          const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
          attachmentNotes.push(`${item.file.name}: ${data.publicUrl}`)
        } catch {
          attachmentNotes.push(`${item.file.name} (attached file)`)
        }
      }

      const supportingText = attachmentNotes.length
        ? `\n\nSupporting files:\n${attachmentNotes.map(note => `- ${note}`).join('\n')}`
        : ''

      const whatToPromote = `${brief.trim() || 'Will share details'}${supportingText}`

      const generatedQuoteId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `q_${Date.now()}`

      const { error: dbErr } = await supabase.from('quote_requests').insert({
        id:               generatedQuoteId,
        business_name:    bizName.trim(),
        contact_name:     contactName.trim() || null,
        phone:            phone.trim(),
        email:            email.trim() || null,
        industry:         industry || null,
        video_length:     length,
        platforms,
        what_to_promote:  whatToPromote || null,
        delivery_speed:   rush,
        include_poster:   poster,
        include_subtitles: subtitles,
        price_min:        price.min,
        price_max:        price.max,
        status:           'new',
      })

      if (dbErr) {
        console.error('Quote submit failed:', dbErr)
        trackEvent('quote_submit_failed', { reason: 'db_error' })
        setError('Something went wrong. Please try again or WhatsApp us directly.')
        return
      }

      // Best-effort side effects — never allowed to block the success screen
      try {
        void supabase.rpc('notify_admins', {
          p_type: 'action',
          p_title: `New quote - ${bizName.trim()}`,
          p_body: `${length} video - ${platforms.join(', ')} - KES ${price.total.toLocaleString()} (Standard)`,
          p_action_url: '/admin',
        })
        trackEvent('quote_submit_success', { video_length: length, platform_count: platforms.length, rush, poster, subtitles, attachment_count: supportingFiles.length })
      } catch {}

      // Persist so a browser Back or refresh restores the confirmation
      // instead of dropping the customer back to a blank form.
      const lengthLabel = LENGTHS.find(l => l.id === length)?.label || length
      const depositAmount = Math.round(price.total * 0.7)
      const submitted: StoredSuccess = {
        bizName: bizName.trim(),
        waMessage,
        quoteId: generatedQuoteId,
        depositAmount,
        totalPrice: price.total,
        email: email.trim(),
        phone: phone.trim(),
        lengthLabel,
        ts: Date.now()
      }
      try {
        sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(submitted))
        window.history.replaceState(null, '', '/quote?submitted=1')
      } catch {}
      setSuccessData(submitted)
      setStep(2)
    } catch (err) {
      console.error('Quote submit failed:', err)
      trackEvent('quote_submit_failed', { reason: 'unexpected_error' })
      setError('Something went wrong. Please try again or WhatsApp us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  /* WhatsApp pre-fill for the prospect to message Nia Media */

  const waMessage = encodeURIComponent(

    `Hi Nia Media, I need a video commercial.\n\nBusiness: ${bizName}\nLength: ${LENGTHS.find(l => l.id === length)?.label}\nPlatforms: ${platforms.join(', ')}\nDelivery: ${RUSH.find(r => r.id === rush)?.label}\nBudget: KES ${price.total.toLocaleString()} (Standard package)\n\nSupporting files: ${supportingFiles.length ? supportingFiles.map(({ file }) => file.name).join(', ') : 'None'}\n\nWhat I am promoting: ${brief || 'Will share details'}\n\nContact: ${phone}`

  )

  return (

    <div className="min-h-screen" style={{ background: '#f8fafc' }}>

      <PublicHeader />

      {/* Hero band */}

      <div className="pt-16" style={{ background: 'linear-gradient(145deg, #04000d 0%, #0b001f 55%, #040010 100%)' }}>

        <div className="max-w-5xl mx-auto px-6 py-14 text-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"

            style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}>

            <Film size={12} style={{ color: '#a78bfa' }} />

            <span className="text-xs font-bold tracking-widest" style={{ color: "#c4b5fd" }}>VIDEO COMMERCIAL - INSTANT QUOTE</span>

          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">

            How much does your video cost?

          </h1>

          <p className="text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>

            Pick your spec below and get an instant price estimate - no account, no calls, no waiting.

          </p>

          {/* Social proof pills */}

          <div className="flex flex-wrap justify-center gap-4 mt-6">

            {[

              { icon: Clock, text: '3-5 day delivery' },

              { icon: Star, text: '8+ brands served' },

              { icon: Zap, text: 'AI script included' },

            ].map(({ icon: Icon, text }) => (

              <div key={text} className="flex items-center gap-1.5">

                <Icon size={12} style={{ color: 'rgba(196,181,253,0.7)' }} />

                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{text}</span>

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* Form area */}

      <div className="max-w-5xl mx-auto px-6 py-12">

        {step < 2 && <StepBar step={step} />}

        {step === 2 ? (

          /* Success */

          <div className="max-w-lg mx-auto text-center py-8">

            {window.location.search.includes('paid=true') || successData?.isPaid ? (
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 size={36} className="text-emerald-500" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-3">
                  🎉 70% Deposit Received via PesaPal
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Production Slot Locked In!</h2>
                <p className="text-gray-600 mb-6 leading-relaxed max-w-md mx-auto text-sm">
                  Thank you, <strong className="text-gray-900">{successData?.bizName ?? bizName}</strong>! Your 70% deposit is confirmed and your creative producer has been scheduled.
                </p>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '2px solid rgba(124,58,237,0.25)' }}>
                  <CheckCircle2 size={32} className="text-purple-600" />
                </div>

                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Quote request received</h2>

                <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                  We have your brief, <strong className="text-gray-900">{successData?.bizName ?? bizName}</strong>. You can lock in your production queue immediately with a 70% deposit or chat with our team on WhatsApp first.
                </p>

                {/* Instant PesaPal 70% Deposit Checkout */}
                <div className="max-w-md mx-auto mb-6 p-5 rounded-2xl text-left shadow-lg border relative overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #09031a 0%, #150833 100%)', borderColor: 'rgba(124,58,237,0.35)' }}>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Lock In Production Now</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      70% Deposit Model
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <p className="text-xs text-purple-200/70">70% Milestone Deposit to Start</p>
                      <p className="text-2xl font-black text-white">
                        KES {(successData?.depositAmount || Math.round(price.total * 0.7)).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-purple-200/50">Total Standard Price</p>
                      <p className="text-sm font-semibold text-purple-200/80">
                        KES {(successData?.totalPrice || price.total).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-200/60 leading-relaxed mb-4">
                    Pay securely via M-Pesa, Visa, or Mastercard. The 30% balance (KES {Math.round((successData?.totalPrice || price.total) * 0.3).toLocaleString()}) is only payable after you review and approve your watermarked video preview.
                  </p>

                  {pesapalError && (
                    <p className="text-xs text-rose-300 mb-3 bg-rose-500/20 p-2.5 rounded-lg border border-rose-500/30">
                      {pesapalError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handlePayDeposit}
                    disabled={pesapalLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-extrabold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}
                  >
                    {pesapalLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Connecting to PesaPal...
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        Pay 70% Deposit (KES {(successData?.depositAmount || Math.round(price.total * 0.7)).toLocaleString()})
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2.5 mt-3 text-[10px] text-purple-200/50 font-medium">
                    <span>🔒 M-Pesa</span>
                    <span>•</span>
                    <span>Visa</span>
                    <span>•</span>
                    <span>Mastercard</span>
                    <span>•</span>
                    <span>PesaPal Secure Checkout</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 max-w-md mx-auto mb-4">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">or communicate via WhatsApp</span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>
              </div>
            )}

            {/* Official Quotation & Print Action */}
            <div className="max-w-md mx-auto mb-3">
              <button
                type="button"
                onClick={() => setShowQuotationModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all cursor-pointer shadow-sm"
              >
                <FileText size={15} />
                <span>View / Print Official Quotation (PDF)</span>
              </button>
            </div>

            <a href={`https://wa.me/254751822556?text=${successData?.waMessage ?? waMessage}`}

              target="_blank" rel="noopener noreferrer"

              className="inline-flex items-center justify-center gap-2.5 w-full max-w-md mx-auto px-8 py-4 rounded-2xl text-sm font-bold text-white mb-4 transition-all"

              style={{ background: '#25d366', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}>

              <MessageSquare size={16} /> Send Brief on WhatsApp

            </a>

            <p className="text-xs text-gray-400 mb-8">

              Opens WhatsApp with your brief pre-filled - just tap Send.

            </p>

            {/* 70% Deposit Milestone info */}
            <div className="max-w-md mx-auto mb-5 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Milestone Terms</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200/60 text-emerald-800">70% / 30% Milestone Model</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Standard price is <strong>KES {price.total.toLocaleString()}</strong>. Your 70% deposit of <strong>KES {Math.round(price.total * 0.7).toLocaleString()}</strong> reserves your creative team and production schedule. Balance of <strong>KES {Math.round(price.total * 0.3).toLocaleString()} (30%)</strong> is paid upon delivery approval.
              </p>
            </div>

            {/* Customer Survey Callout */}
            <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl border border-purple-200 bg-purple-50 flex items-center justify-between gap-3 text-left">
              <div>
                <p className="text-xs font-bold text-purple-950">Help us identify gaps in the market</p>
                <p className="text-[11px] text-purple-700">Rate your experience and tell us what tools you need next.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSurvey(true)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                ★ Rate & Survey
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto">

              <Link to="/book?service=video"

                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all"

                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>

                Book a Creative Call <ArrowRight size={13} />

              </Link>

              <Link to="/book?priority=urgent"

                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-fuchsia-700 border border-fuchsia-200 bg-fuchsia-50 hover:bg-fuchsia-100 transition-all">

                Fast-track Booking <ArrowRight size={13} />

              </Link>

              <Link to={SECONDARY_NIA_CTA.href}

                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all">

                {SECONDARY_NIA_CTA.label}

              </Link>

            </div>

            {/* What happens next (ported from the retired /start page) */}
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md mx-auto">
              {['Brief reviewed', 'Quote confirmed on WhatsApp', 'Production starts'].map((s, i) => (
                <div key={s} className="text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-bold"
                    style={{ background: i === 0 ? '#7c3aed' : '#e5e7eb', color: i === 0 ? '#fff' : '#9ca3af' }}>
                    {i + 1}
                  </div>
                  <p className="text-[11px] font-semibold text-gray-500 leading-tight">{s}</p>
                </div>
              ))}
            </div>

          </div>

        ) : (

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">

            {/* Left: form steps */}

            <div>

              {step === 0 && (

                <div className="space-y-8">

                  {/* Video length */}

                  <div>

                    <h2 className="text-base font-bold text-gray-900 mb-4">Video length</h2>

                    <div className="space-y-2.5">

                      {LENGTHS.map(l => (

                        <button type="button" key={l.id} onClick={() => setLength(l.id)}

                          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all"

                          style={{

                            borderColor: length === l.id ? '#7c3aed' : '#e5e7eb',

                            background: length === l.id ? '#faf5ff' : '#fff',

                          }}>

                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"

                            style={{ borderColor: length === l.id ? '#7c3aed' : '#d1d5db' }}>

                            {length === l.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#7c3aed' }} />}

                          </div>

                          <div className="flex-1">

                            <p className="text-sm font-semibold text-gray-900">{l.label}</p>

                            <p className="text-xs text-gray-500">{l.desc}</p>

                          </div>

                          <p className="text-xs font-bold shrink-0" style={{ color: length === l.id ? '#7c3aed' : '#6b7280' }}>
                            KES {l.price.toLocaleString()}
                          </p>

                        </button>

                      ))}

                    </div>

                  </div>

                  {/* Platforms */}

                  <div>

                    <h2 className="text-base font-bold text-gray-900 mb-1">Target platforms</h2>

                    <p className="text-xs text-gray-500 mb-3">Select all that apply. YouTube adds 15%, 3+ platforms adds 10%.</p>

                    <div className="flex flex-wrap gap-2">

                      {PLATFORMS.map(p => {

                        const active = platforms.includes(p.id)

                        return (

                          <button type="button" key={p.id} onClick={() => togglePlatform(p.id)}

                            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all"

                            style={{

                              borderColor: active ? '#7c3aed' : '#e5e7eb',

                              background: active ? '#ede9fe' : '#fff',

                              color: active ? '#6d28d9' : '#374151',

                            }}>

                            {p.label}

                          </button>

                        )

                      })}

                    </div>

                  </div>

                  {/* Delivery speed */}

                  <div>

                    <h2 className="text-base font-bold text-gray-900 mb-3">Delivery speed</h2>

                    <div className="grid grid-cols-3 gap-2.5">

                      {RUSH.map(r => (

                        <button type="button" key={r.id} onClick={() => setRush(r.id)}

                          className="flex flex-col items-center px-3 py-3.5 rounded-xl border text-center transition-all"

                          style={{

                            borderColor: rush === r.id ? '#7c3aed' : '#e5e7eb',

                            background: rush === r.id ? '#faf5ff' : '#fff',

                          }}>

                          <p className="text-sm font-bold" style={{ color: rush === r.id ? '#7c3aed' : '#111827' }}>{r.label}</p>

                          <p className="text-[11px] text-gray-400 mt-0.5">{r.desc}</p>

                        </button>

                      ))}

                    </div>

                  </div>

                  {/* Add-ons */}

                  <div>

                    <h2 className="text-base font-bold text-gray-900 mb-3">Add-ons</h2>

                    <div className="space-y-2.5">

                      {[

                        { key: 'poster', label: 'Promo poster', desc: 'Print-ready + digital (A3, 1:1, 9:16)', val: poster, set: setPoster, price: 'Included free' },

                        { key: 'subs',   label: 'Subtitles',    desc: 'Burned-in captions for silent viewing',  val: subtitles, set: setSubtitles, price: '+KES 500' },

                      ].map(({ key, label, desc, val, set, price: addonPrice }) => (

                        <button type="button" key={key} onClick={() => set(!val)}

                          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all"

                          style={{ borderColor: val ? '#059669' : '#e5e7eb', background: val ? '#f0fdf4' : '#fff' }}>

                          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all"

                            style={{ background: val ? '#059669' : '#f3f4f6', border: `2px solid ${val ? '#059669' : '#d1d5db'}` }}>

                            {val && <CheckCircle2 size={11} className="text-white" />}

                          </div>

                          <div className="flex-1">

                            <p className="text-sm font-semibold text-gray-900">{label}</p>

                            <p className="text-xs text-gray-500">{desc}</p>

                          </div>

                          <p className="text-xs font-bold shrink-0" style={{ color: val ? '#059669' : '#6b7280' }}>{addonPrice}</p>

                        </button>

                      ))}

                    </div>

                  </div>

                  <button type="button" onClick={() => setStep(1)}

                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white transition-all"

                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>

                    Continue - Enter Your Details <ArrowRight size={15} />

                  </button>

                </div>

              )}

              {step === 1 && (

                <div className="space-y-5">

                  <div className="grid sm:grid-cols-2 gap-4">

                    <div>

                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">

                        <Building2 size={10} className="inline mr-1" /> Business name *

                      </label>

                      <input

                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"

                        placeholder="e.g. Sunrise Homes"

                        value={bizName} onChange={e => setBizName(e.target.value)} autoFocus

                      />

                    </div>

                    <div>

                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">

                        Your name

                      </label>

                      <input

                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"

                        placeholder="e.g. Jane Wanjiru"

                        value={contactName} onChange={e => setContactName(e.target.value)}

                      />

                    </div>

                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">

                    <div>

                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">

                        <Phone size={10} className="inline mr-1" /> WhatsApp number *

                      </label>

                      <input

                        type="tel"

                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"

                        placeholder="0712 345 678"

                        value={phone} onChange={e => setPhone(e.target.value)}

                      />

                    </div>

                    <div>

                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">

                        Email (optional)

                      </label>

                      <input

                        type="email"

                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"

                        placeholder="you@company.com"

                        value={email} onChange={e => setEmail(e.target.value)}

                      />

                    </div>

                  </div>

                  <div>

                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Industry</label>

                    <div className="flex flex-wrap gap-2">

                      {INDUSTRIES.map(ind => (

                        <button type="button" key={ind} onClick={() => setIndustry(industry === ind ? '' : ind)}

                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"

                          style={{

                            borderColor: industry === ind ? '#7c3aed' : '#e5e7eb',

                            background: industry === ind ? '#ede9fe' : '#fff',

                            color: industry === ind ? '#6d28d9' : '#374151',

                          }}>

                          {ind}

                        </button>

                      ))}

                    </div>

                  </div>

                  <div>

                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">

                      What are you promoting?

                    </label>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

                      <textarea
                        rows={4}
                        className="w-full resize-none border-0 p-0 text-sm leading-6 text-gray-800 focus:outline-none focus:ring-0"
                        placeholder="e.g. 2BR apartments in Westlands from KES 6.5M. Target: young professionals. Key message: own your dream home."
                        value={brief} onChange={e => setBrief(e.target.value)}
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleMicClick}
                          disabled={!speechSupported}
                          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Mic size={14} /> {isListening ? 'Listening...' : 'Add voice note'}
                        </button>

                        <button
                          type="button"
                          onClick={refineBrief}
                          disabled={refining}
                          className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {refining ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          {brief.trim() ? 'Refine with Nia Assist' : 'Draft with Nia Assist'}
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Paperclip size={14} /> Attach files
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,application/pdf,.doc,.docx,.txt,.ppt,.pptx"
                          onChange={e => handleSupportingFiles(e.target.files)}
                          className="hidden"
                        />
                      </div>

                      {listeningText && <p className="mt-2 text-xs text-sky-600">Voice note: {listeningText}</p>}

                      {refining && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                          <Loader2 size={12} className="animate-spin" /> Nia is writing your brief — takes 10–20 seconds…
                        </p>
                      )}

                      {supportingFiles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {supportingFiles.map(item => (
                            <div
                              key={item.id}
                              className="inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600"
                            >
                              <span className="truncate max-w-[220px]">{item.file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeSupportingFile(item.id)}
                                className="text-gray-400 transition-colors hover:text-red-500"
                                aria-label={`Remove ${item.file.name}`}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="mt-3 text-xs text-gray-400">The more detail you give, the sharper your quote and faster we can start.</p>
                    </div>

                  </div>
                  {error && (

                    <p className="text-sm text-red-500 font-medium">{error}</p>

                  )}

                  <div className="flex gap-3 pt-2">

                    <button type="button" onClick={() => setStep(0)}

                      className="px-5 py-3.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">

                      Back

                    </button>

                    <button type="button" onClick={submit} disabled={submitting}

                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"

                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>

                      {submitting ? 'Submitting...' : <><MessageSquare size={15} /> Send My Brief - Get Quote</>}

                    </button>

                  </div>

                  <p className="text-center text-xs text-gray-400">

                    No spam. Your details are only used to prepare and send your quote.

                  </p>

                </div>

              )}

            </div>

            {/* Right: live price panel */}

            <PricePanel

              min={price.min} max={price.max}

              length={length} rush={rush} platforms={platforms}

              poster={poster} subtitles={subtitles}

            />

          </div>

        )}

      </div>

      <MarketSurveyModal isOpen={showSurvey} onClose={() => setShowSurvey(false)} sourcePage="quote_success" />

      <QuotationPrintModal
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        data={{
          quoteId: successData?.quoteId,
          businessName: successData?.bizName || bizName || 'Valued Client',
          contactName: contactName,
          phone: successData?.phone || phone,
          email: successData?.email || email,
          videoLength: successData?.lengthLabel || LENGTHS.find(l => l.id === length)?.label || '30s',
          platforms,
          deliverySpeed: rush,
          standardPrice: successData?.totalPrice || price.total,
          depositAmount: successData?.depositAmount || Math.round(price.total * 0.7),
          balanceAmount: Math.round((successData?.totalPrice || price.total) * 0.3),
          isPaid: Boolean(window.location.search.includes('paid=true') || successData?.isPaid),
        }}
      />

    </div>

  )
}
