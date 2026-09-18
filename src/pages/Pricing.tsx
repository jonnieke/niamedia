import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Zap, Film, Users, ChevronDown, ChevronUp, Music } from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const WHATSAPP_URL = 'https://wa.me/254751822556?text=Hi%2C%20I%20was%20looking%20at%20your%20pricing%20—%20which%20option%20fits%20my%20business%3F'

const VIDEO_LADDER = [
  { label: '15 seconds', use: 'TikTok, Reels, Stories', price: '5,000' },
  { label: '30 seconds', use: 'Standard commercial', price: '8,000' },
  { label: '60 seconds', use: 'Campaign film', price: '15,000' },
  { label: '90 seconds', use: 'Extended brand story', price: '20,000' },
  { label: '3 min+', use: 'Infomercial / documentary', price: '60,000' },
]

const faqs = [
  { q: 'What do I actually get for one credit?', a: 'One full campaign kit: social captions for every platform, a video script, WhatsApp broadcast copy, poster copy, a 7-day content calendar — plus the HD promotional poster in 3 AI-designed styles.' },
  { q: 'Is there a free tier?', a: 'Yes. You can generate a demo campaign and poster preview from the homepage without an account. After signing up, your free credit unlocks one full campaign kit including the HD poster in 3 styles.' },
  { q: 'How long does video production take?', a: 'Standard: 3–5 business days. 48-hour rush: +25%. 24-hour rush: +50%. Timelines depend on asset availability and scope.' },
  { q: 'Do I own the content?', a: 'Yes — 100%. All content transfers to you fully on delivery. For custom videos, a Certificate of AI Origin is issued.' },
  { q: 'What is Managed Marketing?', a: 'Our team plans, produces, and delivers your campaigns every month — posters, videos, and copy with human quality control. Packages start at KES 15,000/month; one-off campaign kits from KES 5,000.' },
  { q: 'How do I pay?', a: 'M-Pesa, Visa, or Mastercard through PesaPal secure checkout. For video production, you pay a 70% deposit to reserve your creative producer and start production, and the remaining 30% balance after you approve your watermarked video preview.' },
]

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { user } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from("profiles").select("credits").eq("id", user.id).single()
      .then(({ data }) => { if (data) setCredits(data.credits) })
  }, [user])

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <PublicHeader />

      {credits !== null && credits > 0 && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-purple-200 bg-purple-50">
            <div className="flex items-center gap-2 min-w-0">
              <Zap size={14} className="text-purple-600 shrink-0" />
              <p className="text-sm text-purple-800 font-medium">
                You have <strong>{credits} credit{credits !== 1 ? "s" : ""}</strong> remaining — no need to buy more yet.
              </p>
            </div>
            <Link to="/new-campaign"
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
              Use Credits
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-16 pb-10 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 mt-6">
          Three ways to work with us
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base">
          Start free, pay per video, or let our team run your marketing. M-Pesa accepted on everything.
        </p>
      </section>

      {/* The three paths */}
      <section className="max-w-5xl mx-auto px-4 mb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* AI Campaigns */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#ede9fe' }}>
              <Zap size={20} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">AI Campaigns</h2>
            <p className="text-xs text-gray-500 mb-4">Generate your own ads, posters & WhatsApp copy — instantly.</p>
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-gray-900">KES 500</span>
              <span className="text-sm text-gray-400"> / campaign</span>
              <p className="text-xs text-emerald-600 font-semibold mt-1">First campaign + HD poster free</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                'Captions, scripts & WhatsApp copy',
                'HD poster in 3 AI styles',
                '7-day content calendar',
                'English or Kiswahili',
                'Going monthly? KES 2,500/mo for 15 campaigns',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={13} className="text-purple-500 shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link to="/register" className="block text-center py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              Start Free
            </Link>
          </div>

          {/* Video Production — highlighted */}
          <div className="bg-white rounded-2xl border border-emerald-300 ring-1 ring-emerald-200 p-7 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
              MOST POPULAR
            </span>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#d1fae5' }}>
              <Film size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Video Production</h2>
            <p className="text-xs text-gray-500 mb-4">A professional commercial for your business, produced by us.</p>
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-gray-900">KES 5,000</span>
              <span className="text-sm text-gray-400"> (15s Standard)</span>
              <p className="text-xs text-gray-400 mt-1">Clear standard pricing by length below</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                '15 seconds to 3+ minutes',
                'AI visuals, voiceover & music',
                '70% deposit to start / 30% on delivery',
                '2 revision rounds included',
                'Full commercial rights on delivery',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link to="/quote" className="block text-center py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
              Get an Instant Quote
            </Link>
          </div>

          {/* Managed Marketing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#dbeafe' }}>
              <Users size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Managed Marketing</h2>
            <p className="text-xs text-gray-500 mb-4">Our team runs your campaigns every month — you run your business.</p>
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-gray-900">KES 15,000</span>
              <span className="text-sm text-gray-400"> / month</span>
              <p className="text-xs text-gray-400 mt-1">One-off campaign kits from KES 5,000</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                'Monthly campaigns, posters & videos',
                'Human creative direction',
                'Monthly planning call & report',
                'Scales to KES 60,000/mo full service',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={13} className="text-blue-500 shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link to="/package-request" className="block text-center py-3 rounded-xl text-sm font-bold border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all">
              Request a Package
            </Link>
          </div>
        </div>

        {/* Audio one-liner */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Music size={13} className="text-emerald-600" />
          Also: jingles & professional voice overs from <strong className="text-gray-700">KES 1,500</strong> —
          <Link to="/register" className="font-semibold text-purple-700 hover:underline">order in Audio Studio</Link>
        </div>
      </section>

      {/* Video price ladder */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-gray-900">Video pricing by length</h2>
              <p className="text-xs text-gray-400 mt-0.5">Final price depends on platforms, delivery speed & add-ons</p>
            </div>
            <Link to="/quote" className="text-xs font-bold text-emerald-700 hover:underline">Price my exact video →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {VIDEO_LADDER.map(({ label, use, price }) => (
              <div key={label} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{use}</p>
                </div>
                <span className="text-sm font-bold text-gray-800 whitespace-nowrap">KES {price}</span>
              </div>
            ))}
          </div>
          <div className="px-6 py-3.5 bg-gray-50 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span><strong className="text-gray-700">Standard</strong> 3–5 business days</span>
            <span><strong className="text-orange-600">48-hr rush</strong> +25%</span>
            <span><strong className="text-red-600">24-hr rush</strong> +50%</span>
            <span><strong className="text-gray-700">Subtitles</strong> +KES 500</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 mb-16">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6 text-center">Frequently asked questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                {openFaq === i ? <ChevronUp size={15} className="text-gray-400 shrink-0" /> : <ChevronDown size={15} className="text-gray-400 shrink-0" />}
              </button>
              {openFaq === i && <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-extrabold text-gray-900 mb-2">Not sure which option fits?</h2>
          <p className="text-sm text-gray-500 mb-5">Tell us what you're promoting and your budget — we'll recommend the right one in minutes.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: '#25d366' }}>
              WhatsApp Us
            </a>
            <Link to="/quote"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              Get an Instant Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
