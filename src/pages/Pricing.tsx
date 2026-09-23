import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Zap, Film, Users, ChevronDown, ChevronUp, Music } from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import PackageCompareModal from '../components/PackageCompareModal'

const WHATSAPP_URL = 'https://wa.me/254751822556?text=Hi%2C%20I%20was%20looking%20at%20your%20pricing%20—%20which%20option%20fits%20my%20business%3F'

const VIDEO_LADDER = [
  { label: '30s Startup Social Hook', use: 'TikTok, Reels, Stories (Startups & Small Biz)', price: '2,000', usd: '$15' },
  { label: '30 seconds Standard', use: 'Standard broadcast commercial (Minimum Duration)', price: '8,000', usd: '$65' },
  { label: '60 seconds Campaign', use: 'Full campaign film & narrative arc', price: '15,000', usd: '$120' },
  { label: '90 seconds Deep Story', use: 'Extended brand & product demonstration', price: '20,000', usd: '$160' },
  { label: '3 min+ Brand Documentary', use: 'Infomercial / institutional documentary', price: '60,000', usd: '$480' },
]

const faqs = [
  { q: 'What is an AI Campaign and what outputs do I receive?', a: 'An AI Campaign is an instant, software-generated marketing kit. For KES 500 (~$5 USD), you receive 3 high-resolution branded posters in different visual styles, a 30-second high-converting video script with hook variations, social captions with hashtags for all major platforms, ready-to-send WhatsApp broadcast copy, and a 7-day content schedule. It is generated in under 60 seconds with 100% commercial rights.' },
  { q: 'What is the difference between the KES 2,000 and KES 8,000 packages?', a: 'The KES 2,000 (~$15) Startup Hook is an entry package for micro-businesses testing social traction (30s vertical 9:16 video with kinetic typography and automated speech). The KES 8,000 (~$65) package is our flagship standard commercial: it includes a dedicated human studio voiceover artist (Kenyan, Swahili, Sheng, or US/UK), custom cinematic or 2D animation directing, sound mastering, 2 revision rounds, and 100% worldwide commercial broadcast rights for paid ads and TV.' },
  { q: 'What is your minimum commercial video duration?', a: 'Our minimum commercial duration is 30 seconds. For standard custom-directed commercials with Kenyan voice talent and 2 revision rounds, 30s starts at KES 8,000 ($65 USD). For early-stage startups and small businesses, we also offer our 30s Startup Social Hook package at KES 2,000 ($15 USD).' },
  { q: 'Can I order if I am outside Kenya?', a: 'Yes! We produce commercials for businesses across East Africa, the UK, the US, and globally. You can pay securely with international Visa or Mastercard (or M-Pesa), toggle between KES and USD, and choose from authentic Kenyan English, Swahili, Sheng, US English, UK English, or Global Neutral voiceovers.' },
  { q: 'How long does video production take?', a: 'Standard turnaround is 48 to 72 hours (3–5 business days). Need it faster? 48-hour rush is +25% and 24-hour rush is +50%.' },
  { q: 'Do I own the content and commercial rights?', a: 'Yes — 100%. All video files, promotional posters, and copy transfer to you with complete worldwide broadcast and commercial advertising rights upon final milestone delivery.' },
  { q: 'What is the Video & Poster Retainer?', a: 'Our creative team produces, edits, and delivers fresh commercial videos and branded promotional posters for your business every month. The Starter tier is KES 15,000/month (2 commercial videos + 2 branded posters), with savings of up to 20% on high-volume plans up to KES 60,000/month.' },
  { q: 'How does payment work?', a: 'M-Pesa, Visa, or Mastercard through PesaPal secure checkout. For video production, you pay a 70% deposit to reserve your creative team and start production, and the remaining 30% milestone balance after you review and approve your watermarked video preview.' },
]

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
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
          Start free, order a single commercial video, or subscribe to monthly video & poster packs. M-Pesa accepted on everything.
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
              <span className="text-3xl font-extrabold text-gray-900">KES 8,000</span>
              <span className="text-sm text-gray-400"> (30s Standard Min.)</span>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Startup Social Hook available from KES 2,000 (~$15)</p>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                'Minimum duration: 30 seconds',
                'Kenyan, Swahili, Sheng, or Global US/UK voiceovers',
                'Free matching promotional poster included',
                '70% deposit to start / 30% on delivery',
                '2 revision rounds & 100% global commercial rights',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link to="/quote" className="block text-center py-3 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
              Request a Video Commercial
            </Link>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="mt-3 text-xs font-bold text-emerald-800 hover:text-emerald-950 text-center flex items-center justify-center gap-1 cursor-pointer py-1"
            >
              <span>Compare 2K vs 8K differences</span>
              <span className="text-emerald-600">→</span>
            </button>
          </div>

          {/* Video & Poster Retainer */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 flex flex-col">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#dbeafe' }}>
              <Users size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Video &amp; Content Retainer</h2>
            <p className="text-xs text-gray-500 mb-4">Fresh commercial videos and branded posters produced for your business on a monthly or quarterly pass.</p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-gray-900">KES 15,000</span>
              <span className="text-sm text-gray-400"> / month</span>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Monthly Starter
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Termly Pass: KES 38k (Save 15%)
                </span>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {[
                '2 commercial videos produced every month (30s standard duration)',
                '2 matching branded promotional posters for WhatsApp & social feeds',
                'Professional Kenyan or Global human studio voiceovers included',
                '2 revision rounds per deliverable & 100% worldwide broadcast rights',
                'Quarterly Termly Pass available with 15% upfront cash savings',
                'Growth & Scale tiers available up to KES 60k/month',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={13} className="text-blue-500 shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Link to="/package-request" className="block text-center py-3 rounded-xl text-sm font-bold border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all">
              Request Retainer / Termly Pass
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Compare 2K vs 8K Tiers
              </button>
              <Link to="/quote" className="text-xs font-bold text-emerald-700 hover:underline">Price my exact video →</Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {VIDEO_LADDER.map(({ label, use, price, usd }) => (
              <div key={label} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{use}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800 whitespace-nowrap">KES {price}</span>
                  <span className="text-xs text-gray-400 block font-normal">~{usd} USD</span>
                </div>
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

      <PackageCompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  )
}
