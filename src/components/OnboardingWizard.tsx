import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Building2, Phone, Palette, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const industries = [
  'Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO',
  'Restaurant', 'Travel', 'Retail', 'Health & Wellness',
  'Events', 'Professional Services', 'Faith & Community', 'Other',
]

const templates = [
  { icon: '🏠', label: 'Real Estate Listing', industry: 'Real Estate', objective: 'Generate property enquiries and site visit bookings', tone: 'Professional' },
  { icon: '🍽️', label: 'Restaurant Promo', industry: 'Restaurant', objective: 'Drive walk-in customers and food delivery orders', tone: 'Friendly' },
  { icon: '📚', label: 'School Admission', industry: 'Education', objective: 'Generate admission enquiries and open day visits', tone: 'Professional' },
  { icon: '🛒', label: 'Product Launch', industry: 'Retail', objective: 'Launch a new product and drive first sales', tone: 'Bold' },
  { icon: '💆', label: 'Wellness & Beauty', industry: 'Health & Wellness', objective: 'Book appointments and grow loyal clientele', tone: 'Friendly' },
  { icon: '🎉', label: 'Event Promotion', industry: 'Events', objective: 'Sell tickets and build event awareness', tone: 'Youthful' },
  { icon: '💼', label: 'Professional Service', industry: 'Professional Services', objective: 'Generate qualified leads and consultation bookings', tone: 'Professional' },
  { icon: '✈️', label: 'Travel & Tours', industry: 'Travel', objective: 'Drive tour bookings and travel enquiries', tone: 'Emotional' },
]

interface Props {
  onDismiss: () => void
}

export default function OnboardingWizard({ onDismiss }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1 fields
  const [bizName, setBizName] = useState('')
  const [industry, setIndustry] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Step 2
  const [chosenTemplate, setChosenTemplate] = useState<typeof templates[0] | null>(null)

  const dismiss = () => {
    localStorage.setItem('onboarding_dismissed', '1')
    onDismiss()
  }

  const saveBrandKit = async () => {
    if (!user || !bizName.trim() || !industry) return
    setSaving(true)
    await supabase.from('brand_kits').upsert({
      user_id: user.id,
      business_name: bizName.trim(),
      industry,
      whatsapp: whatsapp.trim(),
      primary_color: '#7c3aed',
      secondary_color: '#2563eb',
      phone: whatsapp.trim(),
      website: '',
      preferred_tone: 'Friendly',
      target_customer: '',
      business_description: '',
    }, { onConflict: 'user_id' })
    setSaving(false)
    setStep(1)
  }

  const launch = () => {
    if (!chosenTemplate) return
    const params = new URLSearchParams({
      industry: chosenTemplate.industry,
      objective: chosenTemplate.objective,
      tone: chosenTemplate.tone,
    })
    if (bizName) params.set('business_name', bizName)
    localStorage.setItem('onboarding_dismissed', '1')
    onDismiss()
    navigate(`/new-campaign?${params.toString()}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#ffffff' }}>

        {/* Header */}
        <div className="relative px-7 pt-7 pb-5" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <button onClick={dismiss} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-white" />
            <span className="text-white/80 text-sm font-semibold">Quick setup — 60 seconds</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1">
            {step === 0 ? 'Tell us about your business' : step === 1 ? 'Pick a campaign type' : 'You\'re ready to go!'}
          </h2>
          <p className="text-white/70 text-sm">
            {step === 0 ? 'We\'ll personalise every campaign to your brand from the start.'
              : step === 1 ? 'Choose the closest match — you can adjust everything next.'
              : 'Nia will generate a full campaign kit in about 30 seconds.'}
          </p>

          {/* Step indicators */}
          <div className="flex gap-2 mt-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1 rounded-full flex-1 transition-all"
                style={{ background: i <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  <Building2 size={11} className="inline mr-1" /> Business name
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="e.g. Sunrise Homes"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  <Palette size={11} className="inline mr-1" /> Industry
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {industries.map(ind => (
                    <button key={ind} type="button" onClick={() => setIndustry(ind)}
                      className="text-xs px-2 py-2 rounded-lg border text-left transition-all"
                      style={{
                        borderColor: industry === ind ? '#7c3aed' : '#e5e7eb',
                        background: industry === ind ? '#ede9fe' : '#fff',
                        color: industry === ind ? '#6d28d9' : '#374151',
                        fontWeight: industry === ind ? 600 : 400,
                      }}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  <Phone size={11} className="inline mr-1" /> WhatsApp number <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="e.g. 0712 345 678"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {templates.map(t => (
                <button key={t.label} type="button" onClick={() => setChosenTemplate(t)}
                  className="relative text-left px-3.5 py-3 rounded-xl border transition-all"
                  style={{
                    borderColor: chosenTemplate?.label === t.label ? '#7c3aed' : '#e5e7eb',
                    background: chosenTemplate?.label === t.label ? '#ede9fe' : '#fafafa',
                  }}>
                  {chosenTemplate?.label === t.label && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#7c3aed' }}>
                      <Check size={9} className="text-white" />
                    </span>
                  )}
                  <span className="text-lg block mb-1">{t.icon}</span>
                  <span className="text-xs font-semibold text-gray-800 block leading-snug">{t.label}</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">{t.industry}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5 space-y-2">
                <Row label="Business" value={bizName || '—'} />
                <Row label="Industry" value={industry || '—'} />
                <Row label="Campaign type" value={chosenTemplate?.label ?? '—'} />
                <Row label="Objective" value={chosenTemplate?.objective ?? '—'} />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                You'll fill in the offer, target audience, and CTA on the next screen. Nia does the rest.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex items-center justify-between gap-3">
          <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Skip setup
          </button>
          {step === 0 && (
            <button
              onClick={saveBrandKit}
              disabled={!bizName.trim() || !industry || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              {saving ? 'Saving…' : 'Next'} <ArrowRight size={14} />
            </button>
          )}
          {step === 1 && (
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button
                onClick={() => chosenTemplate && setStep(2)}
                disabled={!chosenTemplate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button
                onClick={launch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
                <Sparkles size={14} /> Generate my first campaign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
