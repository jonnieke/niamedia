import { useState } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, Loader2, Play, Star } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { supabase } from '../lib/supabase'

const INDUSTRIES = [
  'Real Estate', 'Restaurant & Food', 'Retail & Fashion', 'Health & Wellness',
  'Education', 'Fintech & SACCO', 'Events & Entertainment', 'Faith & Community',
  'Hospitality & Tourism', 'Professional Services', 'Agribusiness', 'Other',
]

const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'WhatsApp', 'LinkedIn', 'TV']

const LENGTHS = [
  { value: '15s', label: '15 seconds', desc: 'TikTok / Reel — fast, punchy' },
  { value: '30s', label: '30 seconds', desc: 'Most popular — social + TV' },
  { value: '60s', label: '60 seconds', desc: 'Full story — explainer or brand' },
  { value: '2min', label: '2 minutes', desc: 'Deep-dive — testimonial or demo' },
]

const TONES = ['Bold & Exciting', 'Professional & Trust-building', 'Warm & Friendly', 'Humorous & Relatable', 'Inspirational', 'Urgent & Promotional']

const BUDGETS = [
  { value: 'under-30k', label: 'Under KES 30,000', desc: 'Short social commercial' },
  { value: '30k-60k', label: 'KES 30,000 – 60,000', desc: 'Standard video package' },
  { value: '60k-120k', label: 'KES 60,000 – 120,000', desc: 'Full production + poster' },
  { value: '120k+', label: 'KES 120,000+', desc: 'Premium or multi-video' },
]

const TIMELINES = [
  { value: 'urgent', label: '1 week', desc: 'Rush — we prioritise your project' },
  { value: 'standard', label: '2 weeks', desc: 'Our standard turnaround' },
  { value: 'relaxed', label: '1 month+', desc: 'No rush — best quality focus' },
]

const STEPS = ['Your Business', 'The Video', 'Creative Brief', 'Timeline & Budget']

const EMPTY = {
  business_name: '', contact_name: '', phone: '', email: '', industry: '',
  video_length: '30s', platforms: [] as string[], what_to_promote: '',
  delivery_speed: 'standard', include_poster: false, include_subtitles: false,
  target_audience: '', offer_hook: '', call_to_action: '', tone: 'Bold & Exciting',
  reference_urls: '' as string, extra_notes: '',
  budget_range: '30k-60k', timeline: 'standard',
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all"
      style={checked
        ? { background: 'rgba(124,58,237,0.1)', border: '1.5px solid #7c3aed', color: '#7c3aed' }
        : { background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#6b7280' }}>
      <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
        style={{ background: checked ? '#7c3aed' : '#e5e7eb' }}>
        {checked && <CheckCircle size={12} style={{ color: '#fff' }} />}
      </span>
      {label}
    </button>
  )
}

export default function ClientOnboarding() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof typeof EMPTY, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function togglePlatform(p: string) {
    set('platforms', form.platforms.includes(p)
      ? form.platforms.filter(x => x !== p)
      : [...form.platforms, p])
  }

  function canNext() {
    if (step === 0) return form.business_name.trim() && form.contact_name.trim() && form.phone.trim()
    if (step === 1) return form.video_length && form.platforms.length > 0 && form.what_to_promote.trim()
    if (step === 2) return true
    if (step === 3) return form.budget_range && form.timeline
    return true
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const refs = form.reference_urls.split('\n').map(s => s.trim()).filter(Boolean)
      const { error: err } = await supabase.from('client_intakes').insert({
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        industry: form.industry || null,
        video_length: form.video_length,
        platforms: form.platforms,
        what_to_promote: form.what_to_promote.trim(),
        delivery_speed: form.delivery_speed,
        include_poster: form.include_poster,
        include_subtitles: form.include_subtitles,
        target_audience: form.target_audience.trim() || null,
        offer_hook: form.offer_hook.trim() || null,
        call_to_action: form.call_to_action.trim() || null,
        tone: form.tone,
        reference_urls: refs,
        extra_notes: form.extra_notes.trim() || null,
        budget_range: form.budget_range,
        timeline: form.timeline,
      })
      if (err) throw err

      // Notify admins
      await supabase.rpc('notify_admins', {
        p_type: 'action',
        p_title: `New intake — ${form.business_name.trim()}`,
        p_body: `${form.video_length} · ${form.platforms.join(', ')} · ${form.budget_range} budget`,
        p_action_url: '/admin',
      })

      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    const waMsg = encodeURIComponent(
      `Hi Nia Media! I just submitted my project brief for *${form.business_name}*. Looking forward to hearing from you!`
    )
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <CheckCircle size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Brief received!</h1>
          <p className="text-gray-600 mb-2 leading-relaxed">
            Thank you, <strong>{form.contact_name.split(' ')[0]}</strong>. We've received your project brief for <strong>{form.business_name}</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-8">Our team will review your brief and send a custom proposal within <strong>24 hours</strong>. You'll hear from us on WhatsApp or email.</p>

          <a href={`https://wa.me/254751822556?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm mb-4 w-full justify-center"
            style={{ background: '#25d366' }}>
            Message Us on WhatsApp
          </a>
          <a href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-gray-600 font-semibold text-sm border border-gray-200 hover:bg-gray-50 transition-all w-full justify-center">
            Back to Home
          </a>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {['Brief reviewed', 'Proposal sent', 'Production starts'].map((s, i) => (
              <div key={s} className="text-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs font-bold text-white"
                  style={{ background: i === 0 ? '#7c3aed' : '#e5e7eb', color: i === 0 ? '#fff' : '#9ca3af' }}>
                  {i + 1}
                </div>
                <p className="text-[11px] font-semibold text-gray-500">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <Logo size="sm" />
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Back to home</a>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Hero */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
            <Star size={11} /> Free — No sign-up required
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
            Start your video project
          </h1>
          <p className="text-gray-500 text-sm">Fill in your brief below. We'll send a custom proposal within 24 hours.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 px-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={i < step
                    ? { background: '#7c3aed', color: '#fff' }
                    : i === step
                    ? { background: '#7c3aed', color: '#fff', boxShadow: '0 0 0 3px rgba(124,58,237,0.2)' }
                    : { background: '#e5e7eb', color: '#9ca3af' }}>
                  {i < step ? <CheckCircle size={13} /> : i + 1}
                </div>
                <span className="text-[10px] font-semibold mt-1 text-center leading-tight hidden sm:block"
                  style={{ color: i <= step ? '#7c3aed' : '#9ca3af' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-0.5 flex-1 mx-1 rounded-full transition-all"
                  style={{ background: i < step ? '#7c3aed' : '#e5e7eb' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.04), rgba(37,99,235,0.04))' }}>
            <h2 className="text-base font-bold text-gray-900">{STEPS[step]}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>

          <div className="px-6 py-6 space-y-5">

            {/* Step 0: Business */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Business / Brand Name *</label>
                    <input value={form.business_name} onChange={e => set('business_name', e.target.value)}
                      className="input-field w-full" placeholder="e.g. Zuri Apartments" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Your Name *</label>
                    <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                      className="input-field w-full" placeholder="James Kariuki" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone / WhatsApp *</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                      className="input-field w-full" placeholder="+254 7xx xxx xxx" type="tel" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email <span className="font-normal text-gray-400">(optional)</span></label>
                    <input value={form.email} onChange={e => set('email', e.target.value)}
                      className="input-field w-full" placeholder="james@yourbusiness.co.ke" type="email" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Industry</label>
                    <select value={form.industry} onChange={e => set('industry', e.target.value)} className="input-field w-full">
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Step 1: The Video */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Video Length *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LENGTHS.map(l => (
                      <button key={l.value} type="button" onClick={() => set('video_length', l.value)}
                        className="p-3 rounded-xl border text-left transition-all"
                        style={form.video_length === l.value
                          ? { background: 'rgba(124,58,237,0.08)', border: '1.5px solid #7c3aed' }
                          : { border: '1.5px solid #e5e7eb' }}>
                        <p className="text-xs font-bold" style={{ color: form.video_length === l.value ? '#7c3aed' : '#111' }}>{l.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{l.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Platforms * <span className="font-normal text-gray-400">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <Toggle key={p} label={p} checked={form.platforms.includes(p)} onChange={() => togglePlatform(p)} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">What are you promoting? *</label>
                  <textarea value={form.what_to_promote} onChange={e => set('what_to_promote', e.target.value)}
                    rows={3} className="input-field w-full resize-none"
                    placeholder="e.g. Our new 2-bedroom apartments in Westlands starting at KES 4.5M. We want to attract young professionals." />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Toggle label="Include poster design" checked={form.include_poster} onChange={v => set('include_poster', v)} />
                  <Toggle label="Add subtitles" checked={form.include_subtitles} onChange={v => set('include_subtitles', v)} />
                </div>
              </>
            )}

            {/* Step 2: Creative Brief */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Target Audience</label>
                  <input value={form.target_audience} onChange={e => set('target_audience', e.target.value)}
                    className="input-field w-full"
                    placeholder="e.g. Nairobi women aged 25–40 interested in healthy food" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Your Main Offer / Hook</label>
                  <textarea value={form.offer_hook} onChange={e => set('offer_hook', e.target.value)}
                    rows={2} className="input-field w-full resize-none"
                    placeholder="e.g. Buy 2 get 1 free this weekend only. First 50 customers get a free delivery." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Call to Action</label>
                  <input value={form.call_to_action} onChange={e => set('call_to_action', e.target.value)}
                    className="input-field w-full"
                    placeholder="e.g. Call 0712 345 678 · Visit our website · Walk in today" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Tone / Style</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TONES.map(t => (
                      <button key={t} type="button" onClick={() => set('tone', t)}
                        className="px-3 py-2 rounded-xl border text-xs font-semibold text-center transition-all"
                        style={form.tone === t
                          ? { background: 'rgba(124,58,237,0.08)', border: '1.5px solid #7c3aed', color: '#7c3aed' }
                          : { border: '1.5px solid #e5e7eb', color: '#6b7280' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Reference Videos / Links <span className="font-normal text-gray-400">(one per line, optional)</span>
                  </label>
                  <textarea value={form.reference_urls} onChange={e => set('reference_urls', e.target.value)}
                    rows={2} className="input-field w-full resize-none text-xs"
                    placeholder="https://youtube.com/watch?v=...&#10;https://tiktok.com/@brand/video/..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Anything else we should know?</label>
                  <textarea value={form.extra_notes} onChange={e => set('extra_notes', e.target.value)}
                    rows={2} className="input-field w-full resize-none"
                    placeholder="Special requirements, brand colours, must-include phrases, things to avoid..." />
                </div>
              </>
            )}

            {/* Step 3: Timeline & Budget */}
            {step === 3 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Approximate Budget</label>
                  <div className="space-y-2">
                    {BUDGETS.map(b => (
                      <button key={b.value} type="button" onClick={() => set('budget_range', b.value)}
                        className="w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all"
                        style={form.budget_range === b.value
                          ? { background: 'rgba(124,58,237,0.08)', border: '1.5px solid #7c3aed' }
                          : { border: '1.5px solid #e5e7eb' }}>
                        <div>
                          <p className="text-sm font-bold" style={{ color: form.budget_range === b.value ? '#7c3aed' : '#111' }}>{b.label}</p>
                          <p className="text-[11px] text-gray-400">{b.desc}</p>
                        </div>
                        {form.budget_range === b.value && <CheckCircle size={16} style={{ color: '#7c3aed' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">When do you need the video?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIMELINES.map(t => (
                      <button key={t.value} type="button" onClick={() => set('timeline', t.value)}
                        className="p-3 rounded-xl border text-center transition-all"
                        style={form.timeline === t.value
                          ? { background: 'rgba(124,58,237,0.08)', border: '1.5px solid #7c3aed' }
                          : { border: '1.5px solid #e5e7eb' }}>
                        <p className="text-xs font-bold" style={{ color: form.timeline === t.value ? '#7c3aed' : '#111' }}>{t.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl p-4 text-xs space-y-1.5"
                  style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <p className="font-bold text-gray-700 mb-2">Your brief summary</p>
                  {[
                    ['Business', form.business_name],
                    ['Video', `${form.video_length} — ${form.platforms.join(', ')}`],
                    ['Promoting', form.what_to_promote.substring(0, 60) + (form.what_to_promote.length > 60 ? '…' : '')],
                    ['Tone', form.tone],
                    ['Budget', BUDGETS.find(b => b.value === form.budget_range)?.label ?? '—'],
                    ['Timeline', TIMELINES.find(t => t.value === form.timeline)?.label ?? '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-gray-400 w-20 shrink-0">{k}:</span>
                      <span className="text-gray-700 font-medium">{v}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-red-500 text-xs text-center">{error}</p>
                )}
              </>
            )}
          </div>

          {/* Footer nav */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                <ChevronLeft size={14} /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting || !canNext()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Play size={13} /> Submit Brief</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          We respond within 24 hours · WhatsApp:{' '}
          <a href="https://wa.me/254751822556" className="text-purple-500 hover:underline">0751 822 556</a>
        </p>
      </div>
    </div>
  )
}
