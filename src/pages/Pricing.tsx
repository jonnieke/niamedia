import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Zap, Film, ChevronDown, ChevronUp } from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const CHECK = () => <CheckCircle2 size={13} className="text-purple-500 shrink-0 mt-0.5" />

const faqs = [
  { q: 'What is the difference between DIY and Managed?', a: 'DIY means you use the platform to generate your own campaign copy, posters, scripts, and WhatsApp messages. Managed means Nia Media\'s team reviews, packages, and polishes your campaigns for you — you still get AI-generated content, but with human quality control.' },
  { q: 'Do I own the content?', a: 'Yes — 100%. All AI-generated content transfers to you fully. For custom videos, a Certificate of AI Origin is issued.' },
  { q: 'How long does video production take?', a: 'Standard: 3–5 business days. 48-hour rush: available at +25%. 24-hour rush: +50%. Timelines depend on asset availability and scope.' },
  { q: 'Can I buy credits without a subscription?', a: 'Yes. You can buy a single campaign credit for KES 500 and generate one full campaign including captions, script, poster copy, and WhatsApp copy.' },
  { q: 'What platforms are supported?', a: 'Instagram, Facebook, TikTok, YouTube, WhatsApp, LinkedIn — all covered in every campaign generation.' },
  { q: 'Is there a free tier?', a: 'Yes. You can preview the AI output from the homepage without an account. After signing up, you get one free campaign to try the full platform.' },
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
      <section className="py-16 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base">
          Generate campaign assets yourself, or let Nia Media's team handle it. Custom videos available on request.
        </p>
      </section>

      {/* DIY Platform */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)' }}>
            <Zap size={16} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">DIY Platform</h2>
            <p className="text-xs text-gray-500">Generate campaigns, posters, scripts, and WhatsApp copy yourself — instantly.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Free Preview', price: 'KES 0', period: '', features: ['1 demo campaign (homepage)', 'See AI output before signing up', 'No credit card required'], cta: 'Try Free Demo', href: '/#demo', highlight: false },
            { label: 'Campaign Credits', price: 'KES 500', period: '/ credit', features: ['Full campaign kit per credit', 'WhatsApp broadcast + status', '7-day calendar + follow-ups', '5 credits KES 2,000 · 12 for 4,000'], cta: 'Buy Credits', href: '/register', highlight: false },
            { label: 'Starter Monthly', price: 'KES 999', period: '/month', features: ['5 campaigns/month', '1 brand kit', 'WhatsApp + social content', 'Basic exports'], cta: 'Start Starter', href: '/register', highlight: false },
          ].map(p => (
            <div key={p.label} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{p.label}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-extrabold text-gray-900">{p.price}</span>
                {p.period && <span className="text-sm text-gray-400 mb-0.5">{p.period}</span>}
              </div>
              <ul className="space-y-2 my-4 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-2 text-xs text-gray-600"><CHECK />{f}</li>)}
              </ul>
              <Link to={p.href} className="mt-auto block text-center py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-all">{p.cta}</Link>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {[
            { label: 'Growth Monthly', price: 'KES 2,500', period: '/month', features: ['15 campaigns/month', 'Ideas Bank + Nia Assistant', '7-day calendars + follow-ups', 'Brand Kit (3 brands)', 'Priority generation'], popular: true },
            { label: 'Business Monthly', price: 'KES 5,000', period: '/month', features: ['40 campaigns/month', '5 brand kits', 'Team access (up to 3 users)', 'Poster export + priority support', 'Extra campaigns KES 150 each'], popular: false },
          ].map(p => (
            <div key={p.label} className={`bg-white rounded-2xl border p-6 flex flex-col ${p.popular ? 'border-purple-300 ring-1 ring-purple-200' : 'border-gray-200'}`}>
              {p.popular && <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest mb-3" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>MOST POPULAR</span>}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{p.label}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-extrabold text-gray-900">{p.price}</span>
                <span className="text-sm text-gray-400 mb-0.5">{p.period}</span>
              </div>
              <ul className="space-y-2 my-4 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-2 text-xs text-gray-600"><CHECK />{f}</li>)}
              </ul>
              <Link to="/register" className="mt-auto block text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>Get Started</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Managed Campaigns */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(37,99,235,0.08)' }}>
            <Zap size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Managed Campaigns</h2>
            <p className="text-xs text-gray-500">Nia Media's team reviews, packages, and delivers polished campaign kits for you.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Done-for-You Starter', price: 'KES 5,000', period: 'one-time', features: ['1 full campaign kit', '2 poster concepts', 'WhatsApp message pack', 'Human review'] },
            { label: 'Managed Growth', price: 'KES 15,000', period: '/month', features: ['4 campaigns/month', '4 posters', '4 short video scripts', 'Monthly planning call'] },
            { label: 'Managed Business', price: 'KES 30,000', period: '/month', features: ['8 campaigns/month', '8 posters', '2 short videos or reels', 'Competitor tracking + monthly report'] },
            { label: 'Premium Managed', price: 'KES 60,000', period: '/month', features: ['Full campaign support', 'Video/audio creative direction', 'Priority production', 'Monthly strategy report'] },
          ].map(p => (
            <div key={p.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">{p.label}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-xl font-extrabold text-gray-900">{p.price}</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">{p.period}</p>
              <ul className="space-y-1.5 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-2 text-xs text-gray-600"><CHECK />{f}</li>)}
              </ul>
              <Link to="/package-request" className="mt-4 block text-center py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-all">Request Package</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Videos */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(5,150,105,0.08)' }}>
            <Film size={16} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Custom Video Production</h2>
            <p className="text-xs text-gray-500">Generate your script, then let Nia Media turn it into a polished video.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Quick Promo Video', price: 'KES 3,500 – 5,000', tag: '15s or 30s', features: ['Fast-cut commercial', 'AI visuals + voiceover', 'Social media ready', '2 revision rounds', 'Certificate of AI Origin'] },
            { label: 'Campaign Video', price: 'KES 7,500 – 15,000', tag: 'Up to 60s', features: ['Multi-scene commercial', 'Custom music bed', '3 visual style options', '2 revision rounds', 'Certificate of AI Origin'], popular: true },
            { label: 'Premium Brand Video', price: 'KES 25,000 – 60,000', tag: '2–5 minutes', features: ['Documentary or brand film', 'Full pre-production workflow', 'Avatar & narration selection', 'Afro-fusion score', 'Certificate of AI Origin'] },
          ].map(p => (
            <div key={p.label} className={`bg-white rounded-2xl border p-6 flex flex-col ${(p as { popular?: boolean }).popular ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-200'}`}>
              {(p as { popular?: boolean }).popular && <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest mb-3" style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}>MOST POPULAR</span>}
              <span className="inline-flex self-start px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 mb-2">{p.tag}</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{p.label}</p>
              <p className="text-xl font-extrabold text-gray-900 mb-3">{p.price}</p>
              <ul className="space-y-2 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-2 text-xs text-gray-600"><CHECK />{f}</li>)}
              </ul>
              <Link to="/request-video" className="mt-4 block text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>Request This Video</Link>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-3 flex flex-wrap gap-6 text-xs text-gray-500">
          <span><strong className="text-gray-700">Standard delivery</strong> — 3 to 5 business days, included</span>
          <span><strong className="text-orange-600">48-hour rush</strong> — +25% on video price</span>
          <span><strong className="text-red-600">24-hour rush</strong> — +50% on video price</span>
        </div>
      </section>

      {/* Production add-ons */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(217,119,6,0.08)' }}>
            <Zap size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Add-ons after you generate</h2>
            <p className="text-xs text-gray-500">Turn any campaign into finished assets — add these on demand.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Turn into a poster', price: 'from KES 300' },
            { label: 'Human polish / rewrite', price: 'KES 500' },
            { label: 'Campaign setup support', price: 'from KES 2,000' },
            { label: 'Turn into a short video', price: 'from KES 3,500' },
          ].map(a => (
            <div key={a.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">{a.label}</p>
              <p className="text-xs font-bold text-amber-600">{a.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 mb-20">
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
    </div>
  )
}
