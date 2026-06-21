import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Send, Upload, Loader2, CheckCircle2, Film, Clock } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const INDUSTRIES = ['Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO', 'Restaurant', 'Travel', 'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Faith & Community', 'Other']
const LENGTHS = ['15 seconds', '30 seconds', '60 seconds', '90 seconds']
const FORMATS = ['9:16 (Vertical)', '1:1 (Square)', '16:9 (Landscape)']
const PLATFORMS = ['WhatsApp', 'TikTok', 'Instagram', 'Facebook', 'YouTube']
const LANGUAGES = ['English', 'Kiswahili', 'Sheng', 'Other']
const MUSIC_STYLES = ['Afrobeat', 'Afro-pop', 'Corporate / Ambient', 'Gospel / Worship', 'Hip-hop', 'Classical', 'No music']
const BUDGET_RANGES = ['KES 3,500 – 5,000', 'KES 7,500 – 15,000', 'KES 25,000 – 60,000', 'Not sure yet']

interface LocationState {
  form?: { business_name?: string; industry?: string; product_name?: string }
  script?: string
}

export default function VideoRequest() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const state = (location.state ?? {}) as LocationState

  const [form, setForm] = useState({
    campaign_title: state.form?.product_name ?? '',
    business_name: state.form?.business_name ?? '',
    industry: state.form?.industry ?? '',
    script: state.script ?? '',
    length: '30 seconds',
    format: '9:16 (Vertical)',
    platform: 'Instagram',
    voiceover: true,
    language: 'English',
    music_style: 'Afrobeat',
    delivery_speed: 'standard',
    budget_range: 'KES 7,500 – 15,000',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

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
      voiceover: form.voiceover,
      language: form.language,
      music_style: form.music_style,
      delivery_speed: form.delivery_speed,
      budget_range: form.budget_range,
      notes: form.notes,
      status: 'new',
    })
    setSubmitting(false)
    if (dbErr) { setError('Failed to submit. Please try again.'); return }
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
        <button onClick={() => navigate('/campaigns')}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          Back to Campaigns
        </button>
      </div>
    </DashboardLayout>
  )

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-purple-400 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-700 mb-1.5'

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Film size={18} className="text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Request Video Production</h1>
        </div>
        <p className="text-sm text-gray-500">Fill in the details below and Nia Media will produce your video. We'll confirm scope, timeline, and payment before starting.</p>
      </div>

      {/* Pricing guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Quick Promo Video', price: 'KES 3,500 – 5,000', note: '15s or 30s, fast turnaround' },
          { label: 'Campaign Video', price: 'KES 7,500 – 15,000', note: 'Up to 60s, multiple scenes' },
          { label: 'Premium Brand Video', price: 'KES 25,000 – 60,000', note: '2–5 min, full production' },
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
            <div className="flex items-center justify-between">
              <span className={labelCls + ' mb-0'}>Voice-Over Required?</span>
              <button onClick={() => set('voiceover', !form.voiceover)}
                className={`w-11 h-6 rounded-full relative transition-colors ${form.voiceover ? 'bg-purple-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.voiceover ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
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
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Send size={15} /> Submit Video Request</>}
          </button>
          <p className="text-center text-xs text-gray-400">We'll confirm scope and payment before production begins.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
