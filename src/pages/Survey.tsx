import { useState, useId } from 'react'
import { Link } from 'react-router-dom'
import { Star, CheckCircle2, Sparkles, Send, Loader2, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

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

export default function Survey() {
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
      source_page: 'standalone_survey_page',
    }

    try {
      const { error } = await supabase.from('market_surveys').insert(payload)
      if (error) {
        console.warn('Direct survey insert error:', error.message)
      }

      try {
        void supabase.rpc('notify_admins', {
          p_type: 'survey',
          p_title: `Survey: ${rating}★ from ${bizName.trim() || 'Kenyan Business'}`,
          p_body: `Bottleneck: ${primaryChallenge} | Wanted: ${desiredServices.join(', ') || 'N/A'}`,
          p_action_url: '/admin',
        })
      } catch {}

      try {
        const history = JSON.parse(localStorage.getItem('nia_market_surveys') || '[]')
        history.push({ ...payload, submitted_at: new Date().toISOString() })
        localStorage.setItem('nia_market_surveys', JSON.stringify(history))
      } catch {}

      setSubmitted(true)
    } catch (err) {
      console.error('Submission failed:', err)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <PublicHeader />

      {/* Hero Header */}
      <div className="pt-20 pb-12" style={{ background: 'linear-gradient(145deg, #04000d 0%, #0b001f 60%, #040010 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}
          >
            <Sparkles size={13} style={{ color: '#a78bfa' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#c4b5fd' }}>
              VOICE OF KENYAN BUSINESSES
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Help Us Identify Gaps in the Market
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Tell us what marketing challenges cost your business the most time and money, and what you want built next.
          </p>
        </div>
      </div>

      {/* Survey Container */}
      <div className="max-w-2xl mx-auto px-4 py-10 -mt-6">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-6 md:p-10">
          {submitted ? (
            <div className="text-center py-10">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}
              >
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
                Asante Sana! Your voice is recorded.
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                We analyze every response to develop high-impact video formats and marketing automation tools tailored for Kenya.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/"
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md shadow-purple-500/20"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                >
                  Return to Home
                </Link>
                <Link
                  to="/quote"
                  className="px-6 py-3 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Configure Instant Video Quote
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Star Rating */}
              <div className="rounded-2xl p-6 text-center border border-purple-100 bg-purple-50/50">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-950 mb-3">
                  How satisfied are you with marketing options currently available to your business?
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => {
                    const active = (hoverRating || rating) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          size={34}
                          className={active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                        />
                      </button>
                    )
                  })}
                </div>
                <p className="text-sm font-bold text-purple-900">
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </p>
              </div>

              {/* 2. Bottleneck */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  1. What is your biggest marketing bottleneck?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BOTTLENECK_OPTIONS.map(opt => {
                    const selected = primaryChallenge === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPrimaryChallenge(opt)}
                        className={`text-left text-xs p-3.5 rounded-xl border transition-all ${
                          selected
                            ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-sm ring-1 ring-purple-400'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Desired Services */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                  2. Which services would you buy tomorrow if offered?
                </label>
                <p className="text-xs text-gray-400 mb-3">Select all that apply to your business</p>
                <div className="flex flex-wrap gap-2">
                  {DESIRED_SERVICE_OPTIONS.map(service => {
                    const selected = desiredServices.includes(service)
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleDesiredService(service)}
                        className={`text-xs px-3.5 py-2 rounded-full border transition-all ${
                          selected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
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
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  3. What is your monthly marketing budget?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BUDGET_OPTIONS.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudgetRange(b)}
                      className={`text-xs py-3 px-2 text-center rounded-xl border transition-all ${
                        budgetRange === b
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-sm ring-1 ring-blue-400'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Open Feedback */}
              <div>
                <label htmlFor={`${formId}-missing-feature`} className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  4. What is the #1 missing feature or service for your business?
                </label>
                <textarea
                  id={`${formId}-missing-feature`}
                  rows={3}
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="e.g. A fast way to turn my customer WhatsApp testimonials into short video ads..."
                  className="w-full text-xs rounded-xl border border-gray-200 p-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* 6. Contact Info */}
              <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={e => setBizName(e.target.value)}
                    placeholder="e.g. Apex Autos"
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">WhatsApp Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.co.ke"
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Submitting Insights...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit Market Feedback & Rating
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Confidential research directly informing Nia Media's service roadmap.</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
