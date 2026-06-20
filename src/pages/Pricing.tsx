import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Zap, Film, Music, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'

type ServiceTab = 'campaigns' | 'video' | 'audio'

const CHECK = ({ purple }: { purple?: boolean }) => (
  <CheckCircle2 size={13} className={purple ? 'text-purple-400 shrink-0' : 'text-gray-500 shrink-0'} />
)

const faqs = [
  { q: 'Do I own the content?', a: 'Yes — 100%. All content (video, audio, copy) is AI-generated and copyright-free. Full rights transfer to you upon payment. A Certificate of AI Origin is issued for every video and audio project.' },
  { q: 'Can I use the content on any platform?', a: 'Absolutely. Radio, TV, Instagram, TikTok, YouTube, Facebook, WhatsApp, billboards, in-store screens — your content, your rules.' },
  { q: 'How long does production take?', a: 'Campaign copy: instant. Video projects: 3–5 business days per iteration. Audio (jingles, VO, radio spots): 3–5 business days. Rush delivery is available at a premium.' },
  { q: 'What are the revision limits?', a: 'Starter Pack video projects include 2 iterations. Growth and Business packs include unlimited revisions within the project scope. Audio orders include 2 revision rounds.' },
  { q: 'Can I order audio without a video package?', a: 'Yes — Audio Studio is completely standalone with separate billing. You can order a jingle, VO, or radio spot without any other package.' },
  { q: 'Is there a subscription?', a: 'Campaign copy packs can be monthly (Growth/Business). Video and audio projects are one-time per order — you pay per project, no recurring fees unless you choose monthly campaign content.' },
]

const campaignPlans = [
  {
    label: 'Starter Pack', price: 5000, period: 'one-time', popular: false,
    features: ['1 video ad script', '2 poster copy concepts', '3 social captions', '1 WhatsApp sales message', 'Campaign direction notes'],
    cta: 'Request Starter Pack',
  },
  {
    label: 'Growth Pack', price: 30000, period: 'per month', popular: true,
    features: ['8 social media post ideas', '4 video ad scripts', 'Captions for all platforms', 'WhatsApp campaign copy', 'Monthly content direction', 'Priority support'],
    cta: 'Choose Growth Pack',
  },
  {
    label: 'Business Pack', price: 60000, period: 'per month', popular: false,
    features: ['12 video ad concepts', '20 social media ideas', 'Full campaign strategy', 'Landing page copy', 'Monthly creative review', 'Dedicated account manager'],
    cta: 'Talk to Us',
  },
]

const videoPlans = [
  {
    label: 'Starter Film', price: 5000, period: 'one-time', popular: false,
    features: ['15s or 30s commercial', 'AI-generated footage', '1 voice style', '2 revision iterations', 'Cinematic or 2D style', 'Certificate of AI Origin'],
    cta: 'Order Starter Film',
    tag: '15–30s',
  },
  {
    label: 'Growth Film', price: 30000, period: 'one-time', popular: true,
    features: ['Up to 60s commercial or brand film', 'Multiple scenes & transitions', '3 visual style options', '2 revision iterations', 'Custom music bed', 'Certificate of AI Origin', 'Rush delivery available'],
    cta: 'Order Growth Film',
    tag: 'Up to 60s',
  },
  {
    label: 'Business Film', price: 60000, period: 'one-time', popular: false,
    features: ['2–5 min documentary or brand film', 'Full pre-production workflow', 'Avatar & narration selection', '2 revision iterations', 'Afro-fusion or international score', 'Certificate of AI Origin', 'Rush delivery included'],
    cta: 'Request Business Film',
    tag: '2–5 min',
  },
]

const audioPlans = [
  {
    label: 'Jingle', prices: [{ label: '15s', price: 2000 }, { label: '30s', price: 3500 }, { label: '60s', price: 5500 }],
    features: ['Brand melody + tagline', 'Custom voice selection', 'Kenyan / Swahili / English mix', '2 revision rounds', 'AI-generated — zero copyright', 'Certificate of AI Origin'],
    cta: 'Order Jingle',
    color: '#8b5cf6',
  },
  {
    label: 'Voice Over', prices: [{ label: '30s', price: 1500 }, { label: '60s', price: 2500 }, { label: '2 min', price: 4000 }],
    features: ['Professional AI voice read', '6 accent / gender options', 'Script editing included', '2 revision rounds', 'AI-generated — zero copyright', 'Certificate of AI Origin'],
    cta: 'Order Voice Over',
    color: '#3b82f6',
  },
  {
    label: 'Radio Spot', prices: [{ label: '15s', price: 3500 }, { label: '30s', price: 5500 }, { label: '60s', price: 8000 }],
    features: ['Full produced radio commercial', 'SFX + music bed + VO', 'Broadcast-ready master', '2 revision rounds', 'AI-generated — zero copyright', 'Certificate of AI Origin'],
    cta: 'Order Radio Spot',
    color: '#10b981',
  },
]

function PlanCard({ plan, purple }: { plan: typeof campaignPlans[0]; purple?: boolean }) {
  return (
    <div className={`relative rounded-2xl p-7 flex flex-col ${
      plan.popular
        ? 'border border-purple-500/40'
        : 'border border-gray-200 bg-white/2'
    }`}
      style={plan.popular ? { background: 'linear-gradient(145deg, rgba(139,92,246,0.12), rgba(59,130,246,0.06))' } : {}}>
      {plan.popular && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-gray-900 whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>Most Popular</span>
          </div>
        </>
      )}
      <p className={`text-xs font-bold uppercase tracking-widest mb-4 mt-2 ${plan.popular ? 'text-purple-400' : 'text-gray-500'}`}>{plan.label}</p>
      <p className="text-3xl font-extrabold text-white mb-0.5">KES {plan.price.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mb-6">{plan.period}</p>
      <div className="space-y-2.5 mb-8 flex-1">
        {plan.features.map(f => (
          <div key={f} className="flex items-center gap-2.5">
            <CHECK purple={plan.popular} />
            <span className="text-sm text-gray-600">{f}</span>
          </div>
        ))}
      </div>
      <Link to="/package-request" className={plan.popular ? 'btn-primary w-full text-center text-sm' : 'btn-secondary w-full text-center text-sm'}>
        {plan.cta}
      </Link>
    </div>
  )
}

function VideoCard({ plan }: { plan: typeof videoPlans[0] }) {
  return (
    <div className={`relative rounded-2xl p-7 flex flex-col border ${
      plan.popular ? 'border-purple-500/40' : 'border-gray-200 bg-white/2'
    }`}
      style={plan.popular ? { background: 'linear-gradient(145deg, rgba(139,92,246,0.12), rgba(59,130,246,0.06))' } : {}}>
      {plan.popular && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-gray-900 whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>Most Popular</span>
          </div>
        </>
      )}
      <div className="flex items-center justify-between mt-2 mb-4">
        <p className={`text-xs font-bold uppercase tracking-widest ${plan.popular ? 'text-purple-400' : 'text-gray-500'}`}>{plan.label}</p>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-gray-200 text-gray-500">{plan.tag}</span>
      </div>
      <p className="text-3xl font-extrabold text-white mb-0.5">KES {plan.price.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mb-6">one-time project</p>
      <div className="space-y-2.5 mb-8 flex-1">
        {plan.features.map(f => (
          <div key={f} className="flex items-center gap-2.5">
            <CHECK purple={plan.popular} />
            <span className="text-sm text-gray-600">{f}</span>
          </div>
        ))}
      </div>
      <Link to="/login" className={plan.popular ? 'btn-primary w-full text-center text-sm' : 'btn-secondary w-full text-center text-sm'}>
        {plan.cta}
      </Link>
    </div>
  )
}

function AudioRow({ plan }: { plan: typeof audioPlans[0] }) {
  const [sel, setSel] = useState(0)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/2 p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
        <p className="text-sm font-bold text-gray-900">{plan.label}</p>
      </div>
      {/* Duration selector */}
      <div className="flex gap-2 my-4">
        {plan.prices.map((p, i) => (
          <button key={p.label} onClick={() => setSel(i)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              sel === i ? 'text-white border-purple-500/50 bg-purple-500/15' : 'border-gray-200 text-gray-500 hover:border-white/20'
            }`}>{p.label}</button>
        ))}
      </div>
      <p className="text-2xl font-extrabold text-white mb-1">KES {plan.prices[sel].price.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mb-5">one-time</p>
      <div className="space-y-2 mb-6 flex-1">
        {plan.features.map(f => (
          <div key={f} className="flex items-center gap-2">
            <CheckCircle2 size={11} style={{ color: plan.color }} className="shrink-0" />
            <span className="text-xs text-gray-600">{f}</span>
          </div>
        ))}
      </div>
      <Link to="/login" className="btn-primary w-full text-center text-sm">{plan.cta}</Link>
    </div>
  )
}

export default function Pricing() {
  const [service, setService] = useState<ServiceTab>('campaigns')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="bg-slate-100 min-h-screen">
      <PublicHeader />
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-tag mb-3 inline-block">Pricing</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">One platform. Three services.</h1>
            <p className="text-base text-gray-500">Campaign copy, video production, and audio — each with its own pricing. Pay for what you need.</p>
          </div>

          {/* Service switcher */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-2 p-1.5 rounded-2xl border border-gray-200 bg-white/3">
              {([
                { id: 'campaigns', icon: Zap,   label: 'Campaign Copy' },
                { id: 'video',     icon: Film,  label: 'Video Production' },
                { id: 'audio',     icon: Music, label: 'Audio Studio' },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setService(id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    service === id
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-200'
                  }`}
                  style={service === id ? { background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' } : {}}>
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Plans */}
          {service === 'campaigns' && (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {campaignPlans.map(p => <PlanCard key={p.label} plan={p} />)}
              </div>
              <p className="text-center text-xs text-gray-600">All campaign packages include AI-powered copy generation. Results vary by industry and audience.</p>
            </>
          )}

          {service === 'video' && (
            <>
              <div className="mb-6 p-4 rounded-xl border border-purple-500/20 bg-purple-500/8 flex items-center gap-3 max-w-2xl mx-auto">
                <Shield size={16} className="text-purple-400 shrink-0" />
                <p className="text-sm text-purple-300">Every video is AI-generated — zero third-party copyright. Certificate of AI Origin issued on delivery. Full rights yours.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {videoPlans.map(p => <VideoCard key={p.label} plan={p} />)}
              </div>
              <p className="text-center text-xs text-gray-600">Human creative oversight on every project. 3–5 business days delivery per iteration.</p>
            </>
          )}

          {service === 'audio' && (
            <>
              <div className="mb-6 p-4 rounded-xl border border-green-500/20 bg-green-500/5 flex items-center gap-3 max-w-2xl mx-auto">
                <Shield size={16} className="text-green-400 shrink-0" />
                <p className="text-sm text-green-300">All audio is AI-generated — broadcast-ready, radio-approved, zero copyright. Separate billing — order audio standalone or with any package.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 mb-4">
                {audioPlans.map(p => <AudioRow key={p.label} plan={p} />)}
              </div>
              <div className="mt-6 p-5 rounded-2xl border border-gray-200 bg-white/2 max-w-2xl mx-auto text-center">
                <p className="text-sm font-bold text-gray-900 mb-1">Need a full radio package?</p>
                <p className="text-xs text-gray-500 mb-4">3 Ã— 30s spots for A/B campaign rotation — KES 14,000</p>
                <Link to="/audio-studio" className="btn-primary text-sm px-6 py-2.5 inline-flex">Order Radio Package</Link>
              </div>
            </>
          )}

          {/* Rights guarantee */}
          <div className="mt-16 grid sm:grid-cols-3 gap-4 text-center">
            {[
              { title: 'Zero Copyright Risk', desc: '100% AI-generated content. No third-party IP, no licensing fees, no takedown risk.' },
              { title: 'Pay Per Project', desc: 'No surprises. One price, one deliverable. Monthly plans for ongoing content only.' },
              { title: 'Rights Transfer', desc: 'Certificate of AI Origin issued on delivery. You own it. Use it anywhere, forever.' },
            ].map(g => (
              <div key={g.title} className="rounded-2xl border border-gray-200 bg-white/2 p-5">
                <p className="text-sm font-bold text-gray-900 mb-2">{g.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white/2 overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:text-purple-300 transition-colors">
                    {faq.q}
                    {openFaq === i ? <ChevronUp size={15} className="text-purple-400 shrink-0" /> : <ChevronDown size={15} className="text-gray-500 shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-200 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center p-10 rounded-3xl border border-gray-200"
            style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to create something great?</h2>
            <p className="text-gray-500 mb-6 text-sm">Start free with Concept Studio — spin your idea into a professional script. No card required.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/register" className="btn-primary px-8 py-3">Get Started Free</Link>
              <Link to="/package-request" className="btn-secondary px-8 py-3">Talk to Us</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

