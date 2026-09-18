import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, Upload, Loader2, CheckCircle2, Film, Clock, Sparkles } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import CreativeAssistant, { CreativeAssistantButton } from '../components/CreativeAssistant'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { getBookingPath } from '../lib/booking'
import { trackEvent } from '../lib/analytics'

const INDUSTRIES = ['Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO', 'Restaurant', 'Travel', 'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Faith & Community', 'Other']
const LENGTHS = ['15 seconds', '30 seconds', '60 seconds', '90 seconds', '3+ minutes (Infomercial)']
const FORMATS = ['9:16 (Vertical)', '1:1 (Square)', '16:9 (Landscape)']
const PLATFORMS = ['WhatsApp', 'TikTok', 'Instagram', 'Facebook', 'YouTube']
const LANGUAGES = ['English', 'Kiswahili', 'Sheng', 'Other']
const MUSIC_STYLES = ['Afrobeat', 'Afro-pop', 'Corporate / Ambient', 'Gospel / Worship', 'Hip-hop', 'Classical', 'No music']
const BUDGET_RANGES = ['KES 5,000 (15s standard)', 'KES 8,000 (30s standard)', 'KES 15,000 (60s standard)', 'KES 20,000 – 60,000 (Extended/Doc)', 'KES 60,000+', 'Not sure yet']

interface LocationState {
  form?: { business_name?: string; industry?: string; product_name?: string }
  script?: string
}

export default function VideoRequest() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const state = (location.state ?? {}) as LocationState
  const [showNia, setShowNia] = useState(false)

  const [form, setForm] = useState({
    campaign_title: state.form?.product_name ?? '',
    business_name: state.form?.business_name ?? '',
    industry: state.form?.industry ?? '',
    script: state.script ?? '',
    length: '30 seconds',
    format: '9:16 (Vertical)',
    platform: 'Instagram',
    voiceoverMode: 'ai',
    language: 'English',
    music_style: 'Afrobeat',
    needPoster: true,
    needJingle: false,
    needSubtitles: true,
    delivery_speed: 'standard',
    budget_range: 'KES 7,500 – 15,000',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const estimate = useMemo(() => {
    const lengthMap: Record<string, { min: number; max: number; label: string }> = {
      '15 seconds': { min: 3500, max: 5000, label: '15s starter' },
      '30 seconds': { min: 5000, max: 8000, label: '30s promo' },
      '60 seconds': { min: 7500, max: 15000, label: '60s campaign film' },
      '90 seconds': { min: 12000, max: 20000, label: '90s extended story' },
      '3+ minutes (Infomercial)': { min: 25000, max: 60000, label: '3+ min infomercial' },
    }
    const voiceoverDelta: Record<string, { min: number; max: number }> = {
      ai: { min: 0, max: 0 },
      human: { min: 2000, max: 5000 },
      none: { min: -1000, max: -500 },
    }
    const addonMap = {
      needPoster: { min: 300, max: 1000 },
      needJingle: { min: 5000, max: 12000 },
      needSubtitles: { min: 1000, max: 2500 },
    }
    const base = lengthMap[form.length] ?? lengthMap['30 seconds']
    const vo = voiceoverDelta[form.voiceoverMode as keyof typeof voiceoverDelta] ?? voiceoverDelta.ai
    const selectedAddons = (['needPoster', 'needJingle', 'needSubtitles'] as const).filter(k => Boolean((form as Record<string, unknown>)[k]))
    const addonRange = selectedAddons.reduce((acc, key) => {
      const delta = addonMap[key]
      return { min: acc.min + delta.min, max: acc.max + delta.max }
    }, { min: 0, max: 0 })
    const rushMultiplier = form.delivery_speed === '24h' ? 1.5 : form.delivery_speed === '48h' ? 1.25 : 1
    const min = Math.round((base.min + vo.min + addonRange.min) * rushMultiplier)
    const max = Math.round((base.max + vo.max + addonRange.max) * rushMultiplier)
    const fmt = (n: number) => `KES ${n.toLocaleString('en-KE')}`
    const voiceoverLabel = form.voiceoverMode === 'human' ? 'Human voiceover' : form.voiceoverMode === 'none' ? 'No voiceover' : 'AI voiceover'
    return {
      title: `${base.label} – ${voiceoverLabel}${selectedAddons.length ? ' – with add-ons' : ''}`,
      range: `${fmt(min)} – ${fmt(max)}`,
      lengthLabel: base.label,
      voiceoverLabel,
      addons: selectedAddons.map(key => key === 'needPoster' ? 'Poster pack' : key === 'needJingle' ? 'Jingle' : 'Subtitles'),
      delivery: form.delivery_speed === '24h' ? '24-hour rush' : form.delivery_speed === '48h' ? '48-hour rush' : 'Standard delivery',
    }
  }, [form.delivery_speed, form.length, form.needJingle, form.needPoster, form.needSubtitles, form.voiceoverMode])

  const handleSubmit = async () => {
    if (!form.business_name.trim() || !form.script.trim()) {
      setError('Business name and video script are required.')
      return
    }
    setSubmitting(true)
    setError('')
    const { error: dbErr } = await supabase.from('video_requests').insert({
      user_id: user?.id,
      business_name: form.business_name,
      industry: form.industry,
      title: form.campaign_title || form.business_name,
      script: form.script,
      length: form.length,
      format: form.format,
      platform: form.platform,
      voiceover: form.voiceoverMode !== 'none',
      language: form.language,
      music_style: form.music_style,
      delivery_speed: form.delivery_speed,
      budget_range: form.budget_range,
      notes: [form.notes.trim(), `Quote snapshot: ${estimate.title}`, `Estimated range: ${estimate.range}`, `Voiceover: ${estimate.voiceoverLabel}`, estimate.addons.length ? `Add-ons: ${estimate.addons.join(', ')}` : '', `Delivery: ${estimate.delivery}`].filter(Boolean).join('\n'),
      status: 'new',
    })
    setSubmitting(false)
    if (dbErr) {
      setError('Failed to submit. Please try again.')
      trackEvent('video_request_submit_failed', { reason: 'db_error' })
      return
    }
    trackEvent('video_request_submit_success', {
      length: form.length, delivery_speed: form.delivery_speed, budget_range: form.budget_range,
      voiceover_mode: form.voiceoverMode, industry: form.industry,
    })

    // Fire-and-forget: confirmation email to user + admin SMS
    supabase.functions.invoke('notify-video-request', {
      body: {
        user_email: user?.email,
        user_name: user?.name ?? user?.email,
        business_name: form.business_name,
        title: form.campaign_title || form.business_name,
        budget_range: form.budget_range,
        delivery_speed: form.delivery_speed,
        industry: form.industry,
      },
    }).catch(() => {/* non-blocking */})

    setDone(true)
  }

  if (done) return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <CheckCircle2 size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Received</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Your video request has been received. Nia Media will review the script and contact you with confirmation within 24 hours.
        </p>
        <button onClick={() => navigate('/requests')}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          Track My Requests
        </button>
      </div>
    </DashboardLayout>
  )

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-purple-400 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5'

  return (
    <DashboardLayout>
      {showNia && <CreativeAssistant onClose={() => setShowNia(false)} />}
      <div className="mb-6">
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Fast-track video brief</p>
            <p className="text-sm text-emerald-900">Already know what you need? Request the commercial now or talk to Nia first if you want help shaping the idea.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(getBookingPath('video', { priority: 'urgent' }))} className="px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-200 text-emerald-800 bg-white">Request a Video Commercial</button>
            <button type="button" onClick={() => navigate('/?assistant=1')} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>Talk to Nia</button>
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Film size={18} className="text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Request a Video Commercial</h1>
            </div>
            <p className="text-sm text-gray-500">Fill in the details below and Nia Media will produce your video. We'll confirm scope, timeline, and payment before starting.</p>
          </div>
          <CreativeAssistantButton onClick={() => setShowNia(true)} label="Talk to Nia" />
        </div>
      </div>

      {/* Pricing guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Standard Promo Video', price: 'KES 5,000', note: '15s fast commercial turnaround' },
          { label: 'Campaign Video', price: 'KES 15,000', note: 'Up to 60s, multiple scenes' },
          { label: 'Premium Brand Video', price: 'KES 60,000', note: '2–5 min, full production' },
        ].map(p => (
          <div key={p.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs font-semibold text-gray-900">{p.label}</p>
            <p className="text-sm font-bold text-purple-700 mt-0.5">{p.price}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{p.note}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mb-8 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><Clock size={12} /> Standard 3–5 days — included</span>
        <span>48 hours — +25%</span>
        <span>24 hours — +50%</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-100">Campaign Details</h3>
            <div>
              <label className={labelCls}>Campaign / Video Title</label>
              <input className={inputCls} placeholder="e.g. Ramadan Promo 2025" value={form.campaign_title} onChange={e => set('campaign_title', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Business Name *</label>
              <input className={inputCls} placeholder="Your business name" value={form.business_name} onChange={e => set('business_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Industry</label>
              <select className={inputCls} value={form.industry} onChange={e => set('industry', e.target.value)}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-100">Video Specs</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Length</label>
                <select className={inputCls} value={form.length} onChange={e => set('length', e.target.value)}>
                  {LENGTHS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Format</label>
                <select className={inputCls} value={form.format} onChange={e => set('format', e.target.value)}>
                  {FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Primary Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => set('platform', p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.platform === p ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Language</label>
                <select className={inputCls} value={form.language} onChange={e => set('language', e.target.value)}>
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Music Style</label>
                <select className={inputCls} value={form.music_style} onChange={e => set('music_style', e.target.value)}>
                  {MUSIC_STYLES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Voice-over style</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'ai', label: 'AI voiceover', note: 'Fastest and cost-efficient' },
                  { id: 'human', label: 'Human voiceover', note: 'Warm, premium narration' },
                  { id: 'none', label: 'No voiceover', note: 'Visual-only or text-led edit' },
                ].map(o => (
                  <button key={o.id} type="button" onClick={() => set('voiceoverMode', o.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${form.voiceoverMode === o.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <p className="text-sm font-semibold text-gray-900">{o.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{o.note}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Add-ons</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: 'needPoster', label: 'Poster + promo pack' },
                  { key: 'needJingle', label: 'Custom jingle' },
                  { key: 'needSubtitles', label: 'Subtitles / captions' },
                ].map(o => (
                  <button key={o.key} type="button" onClick={() => set(o.key, !(form as unknown as Record<string, boolean>)[o.key])}
                    className={`rounded-xl border p-3 text-left transition-all ${(form as unknown as Record<string, boolean>)[o.key] ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <p className="text-sm font-semibold text-gray-900">{o.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{o.key === 'needPoster' ? 'KES 500' : o.key === 'needJingle' ? 'KES 5,000' : 'KES 1,000'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-100">Delivery & Budget</h3>
            <div>
              <label className={labelCls}>Delivery Speed</label>
              <div className="space-y-2">
                {[
                  { id: 'standard', label: 'Standard (3–5 business days)', note: 'Included' },
                  { id: '48h', label: '48-Hour Rush', note: '+25%' },
                  { id: '24h', label: '24-Hour Rush', note: '+50%' },
                ].map(d => (
                  <label key={d.id} onClick={() => set('delivery_speed', d.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${form.delivery_speed === d.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm text-gray-700">{d.label}</span>
                    <span className={`text-xs font-semibold ${d.id === 'standard' ? 'text-gray-400' : 'text-orange-600'}`}>{d.note}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Budget Range</label>
              <select className={inputCls} value={form.budget_range} onChange={e => set('budget_range', e.target.value)}>
                {BUDGET_RANGES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-900 p-5 text-white shadow-xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Quote preview</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold">{estimate.range}</p>
                <p className="text-xs text-gray-300 mt-1">{estimate.title}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400 uppercase tracking-widest">Delivery</p>
                <p className="text-sm font-semibold">{estimate.delivery}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-200">
              <div className="rounded-xl bg-white/5 px-3 py-2">Length: {estimate.lengthLabel}</div>
              <div className="rounded-xl bg-white/5 px-3 py-2">Voice-over: {estimate.voiceoverLabel}</div>
              <div className="rounded-xl bg-white/5 px-3 py-2">Add-ons: {estimate.addons.length ? estimate.addons.join(', ') : 'None selected yet'}</div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => navigate(getBookingPath('video'))} className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-900">Request a Video Commercial</button>
              <button type="button" onClick={() => navigate('/?assistant=1')} className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white">Talk to Nia</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-100">Video Script *</h3>
            <p className="text-xs text-gray-400">Paste your generated script or write one from scratch. The more detail, the better the result.</p>
            <textarea
              className={inputCls + ' resize-none min-h-[200px]'}
              placeholder="Hook: ...\nScene 1: ...\nScene 2: ...\nCTA: ..."
              value={form.script}
              onChange={e => set('script', e.target.value)}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-100">Assets (Optional)</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <Upload size={20} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Logo, photos, or existing footage</p>
              <p className="text-[11px] text-gray-300 mt-1">Share via WhatsApp or email after submitting</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <label className={labelCls}>Additional Notes</label>
            <textarea
              className={inputCls + ' resize-none min-h-[100px]'}
              placeholder="Any specific requirements, references, colors, or things to avoid..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {error && <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-600">{error}</div>}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Sparkles size={15} /> Request a Video Commercial</>}
          </button>
          <p className="text-center text-xs text-gray-400">We'll confirm scope and payment before production begins.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
