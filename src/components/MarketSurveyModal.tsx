import { useState, useId } from 'react'
import { Star, X, CheckCircle2, Sparkles, Send, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  sourcePage?: string
}

const BOTTLENECK_OPTIONS = [
  'Affordable video production',
  'Consistent social posting',
  'WhatsApp lead conversion & follow-ups',
  'High agency/videographer costs',
  'Graphic & poster design quality',
  'Writing persuasive Kenyan sales copy',
]

const DESIRED_SERVICE_OPTIONS = [
  'Done-For-You TikTok & Reels videos',
  '24/7 WhatsApp AI Sales Bot',
  'On-site Camera & Drone Filming in Nairobi',
  'Kenyan Influencer Matchmaking',
  'Full Monthly Social Media Management',
  'Paid Meta/Google Ad Campaigns',
]

const BUDGET_OPTIONS = [
  'Under KES 5,000 / mo',
  'KES 5,000 – 15,000 / mo',
  'KES 15,000 – 50,000 / mo',
  'KES 50,000+ / mo',
]

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Struggling with marketing hurdles',
  2: 'Need significant improvements',
  3: 'Getting by / average results',
  4: 'Doing well, ready to accelerate',
  5: 'Exceptional / ambitious growth',
}

export default function MarketSurveyModal({ isOpen, onClose, sourcePage = 'modal' }: Props) {
  const { user } = useAuth()
  const formId = useId()

  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [primaryChallenge, setPrimaryChallenge] = useState<string>('Affordable video production')
  const [desiredServices, setDesiredServices] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState<string>('KES 5,000 – 15,000 / mo')
  const [feedbackText, setFeedbackText] = useState<string>('')
  const [bizName, setBizName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [email, setEmail] = useState<string>(user?.email || '')

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)

  if (!isOpen) return null

  const toggleDesiredService = (service: string) => {
    setDesiredServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      user_id: user?.id || null,
      rating,
      primary_challenge: primaryChallenge,
      desired_services: desiredServices,
      budget_range: budgetRange,
      feedback_text: feedbackText.trim() || null,
      business_name: bizName.trim() || null,
      contact_name: user?.name || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      source_page: sourcePage,
    }

    try {
      const { error } = await supabase.from('market_surveys').insert(payload)
      if (error) {
        console.warn('Direct survey insert failed, storing locally:', error.message)
      }

      // Best effort admin notification
      try {
        void supabase.rpc('notify_admins', {
          p_type: 'survey',
          p_title: `Market Survey: ${rating}★ from ${bizName.trim() || 'Kenyan Business'}`,
          p_body: `Gap: ${primaryChallenge} | Wants: ${desiredServices.join(', ') || 'Feedback'} | Budget: ${budgetRange}`,
          p_action_url: '/admin',
        })
      } catch {}

      // Save to localStorage for client tracking
      try {
        const history = JSON.parse(localStorage.getItem('nia_market_surveys') || '[]')
        history.push({ ...payload, submitted_at: new Date().toISOString() })
        localStorage.setItem('nia_market_surveys', JSON.stringify(history))
      } catch {}

      setSubmitted(true)
    } catch (err) {
      console.error('Survey submission error:', err)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{ background: 'rgba(5, 5, 20, 0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-purple-100 overflow-hidden my-6"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Decorative Top Accent */}
        <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb, #10b981)' }} />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="p-8 text-center py-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.25))', border: '1px solid rgba(16,185,129,0.4)' }}
            >
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Asante Sana! Thank you!</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
              Your feedback directly shapes our roadmap. We review every survey to build the exact video and marketing tools Kenyan businesses need most.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
            >
              Back to Nia Media <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-purple-700 bg-purple-100 mb-2">
                <Sparkles size={12} />
                <span>CUSTOMER MARKET SURVEY & RATING</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Help Us Identify Gaps in the Market
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">
                Tell us what is holding your business back and which marketing services you need most. Takes 60 seconds.
              </p>
            </div>

            {/* 1. Star Rating */}
            <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100 text-center">
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">
                How satisfied are you with available marketing options in Kenya?
              </label>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map(star => {
                  const active = (hoverRating || rating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                      />
                    </button>
                  )
                })}
              </div>
              <p className="text-xs font-semibold text-purple-800 mt-1">
                {RATING_DESCRIPTIONS[hoverRating || rating]}
              </p>
            </div>

            {/* 2. Primary Bottleneck */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                What is your biggest marketing bottleneck today?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BOTTLENECK_OPTIONS.map(opt => {
                  const selected = primaryChallenge === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrimaryChallenge(opt)}
                      className={`text-left text-xs p-2.5 rounded-xl border transition-all ${
                        selected
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Desired Services (Market Gap) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Which services would you buy tomorrow if Nia Media offered them?
              </label>
              <p className="text-[11px] text-gray-400 mb-2.5">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {DESIRED_SERVICE_OPTIONS.map(service => {
                  const selected = desiredServices.includes(service)
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleDesiredService(service)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}{service}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. Budget Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                What is your ideal monthly marketing budget?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BUDGET_OPTIONS.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudgetRange(b)}
                    className={`text-xs py-2 px-2 text-center rounded-xl border transition-all ${
                      budgetRange === b
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Open Feedback / Missing Feature */}
            <div>
              <label htmlFor={`${formId}-feedback`} className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                What is the #1 missing feature or service for your business?
              </label>
              <textarea
                id={`${formId}-feedback`}
                rows={2}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Tell us what tool, creative format, or pricing structure would help you win more customers..."
                className="w-full text-xs rounded-xl border border-gray-200 p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* 6. Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Business Name (optional)</label>
                <input
                  type="text"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  placeholder="e.g. Ruaka Cafe"
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">WhatsApp Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 text-gray-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white shadow-md shadow-purple-500/25 hover:opacity-95 transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting Insights...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Submit Feedback & Star Rating
                  </>
                )}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-2">
                Your feedback is confidential and directly drives our feature development.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
