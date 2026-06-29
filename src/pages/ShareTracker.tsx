import { useEffect, useState, FormEvent } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { CheckCircle, Loader2, ChevronDown, ChevronUp, Sparkles, Phone, ArrowRight, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LandingPage {
  headline: string
  subheadline: string
  benefits: string[]
  cta: string
  faqs: { question: string; answer: string }[]
}

interface CampaignData {
  id: string
  title: string
  industry: string
  businessName: string
  whatsappNumber: string
  landingPage: LandingPage | null
  strategy: { angle: string; painPoint: string; keyMessage: string; cta: string } | null
  createdAt: string
}

export default function ShareTracker() {
  const { token } = useParams<{ token: string }>()
  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadDone, setLeadDone] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }

    Promise.all([
      supabase.functions.invoke('track-share', { body: { token, eventType: 'view' } }),
      supabase.functions.invoke('get-shared-campaign', { body: { token } }),
    ]).then(([, { data, error }]) => {
      if (error || !data || data.error) {
        setNotFound(true)
      } else {
        setCampaign(data as CampaignData)
      }
      setLoading(false)
    })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <Loader2 size={24} className="animate-spin text-purple-500" />
      </div>
    )
  }

  if (notFound || !campaign) return <Navigate to="/" replace />

  const submitLead = async (e: FormEvent) => {
    e.preventDefault()
    if (!leadPhone.trim() || leadLoading || leadDone) return
    setLeadLoading(true)
    await supabase.functions.invoke('capture-lead', {
      body: { token, name: leadName, phone: leadPhone, email: leadEmail },
    })
    setLeadDone(true)
    setLeadLoading(false)
  }

  const lp = campaign.landingPage
  const initial = campaign.businessName.charAt(0).toUpperCase()

  const waLink = campaign.whatsappNumber
    ? `https://wa.me/${campaign.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I saw your campaign and I'm interested. Can you tell me more?`)}`
    : null

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Nav bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              {initial}
            </div>
            <span className="font-semibold text-gray-900 text-sm truncate">{campaign.businessName}</span>
          </div>
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#25d366' }}>
              <Phone size={12} /> WhatsApp Us
            </a>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
            style={{ background: 'rgba(124,58,237,0.07)', borderColor: 'rgba(124,58,237,0.2)', color: '#7c3aed' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            {campaign.industry}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            {lp?.headline ?? campaign.title}
          </h1>
          {lp?.subheadline && (
            <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
              {lp.subheadline}
            </p>
          )}

          {/* Primary CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
                <Phone size={16} />
                {lp?.cta ?? 'Get in Touch on WhatsApp'}
              </a>
            ) : (
              lp?.cta && (
                <span className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                  {lp.cta}
                </span>
              )
            )}
          </div>
        </div>

        {/* Benefits */}
        {lp?.benefits && lp.benefits.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Why choose us</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {lp.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Strategy context — show if no landing page data */}
        {!lp && campaign.strategy && (
          <section className="mb-12 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">About This Offer</p>
            <p className="text-gray-700 leading-relaxed">{campaign.strategy.keyMessage}</p>
            {campaign.strategy.cta && (
              <p className="mt-4 text-sm font-semibold text-purple-600">{campaign.strategy.cta}</p>
            )}
          </section>
        )}

        {/* Lead capture form */}
        <section className="mb-12 rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <div className="px-6 py-8">
            {leadDone ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <p className="text-white font-bold text-lg mb-1">You're on the list!</p>
                <p className="text-white/70 text-sm">{campaign.businessName} will be in touch shortly.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Get in touch</h2>
                <p className="text-white/70 text-sm mb-6">Leave your details and {campaign.businessName} will contact you directly.</p>
                <form onSubmit={submitLead} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50 transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number *"
                    value={leadPhone}
                    onChange={e => setLeadPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email address (optional)"
                    value={leadEmail}
                    onChange={e => setLeadEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!leadPhone.trim() || leadLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-purple-700 font-bold text-sm disabled:opacity-60 hover:bg-white/90 transition-colors"
                  >
                    {leadLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {leadLoading ? 'Sending…' : 'Send my details'}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        {/* FAQs */}
        {lp?.faqs && lp.faqs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {lp.faqs.map((faq, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-800 pr-4">{faq.question}</span>
                    {openFaq === i
                      ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                      : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        {waLink && (
          <section className="text-center py-10 px-6 rounded-3xl mb-12"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.07), rgba(37,99,235,0.05))', border: '1px solid rgba(124,58,237,0.12)' }}>
            <p className="text-xl font-bold text-gray-900 mb-2">{lp?.cta ?? 'Ready to get started?'}</p>
            <p className="text-sm text-gray-500 mb-6">Chat with {campaign.businessName} directly on WhatsApp.</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: '#25d366', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }}>
              <Phone size={16} />
              Chat on WhatsApp
            </a>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            Campaign created with <span className="font-semibold text-gray-500">Nia Media</span> — AI marketing for Kenyan SMBs
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
            <Sparkles size={12} />
            Create your own campaign free
            <ArrowRight size={12} />
          </Link>
        </div>
      </footer>
    </div>
  )
}
