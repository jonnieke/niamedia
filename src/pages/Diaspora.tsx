import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/layout/PublicHeader'
import {
  Globe, CreditCard, Sparkles, Film, CheckCircle2, Shield, Clock,
  ArrowRight, MessageSquare, ChevronDown, Check, Star, ExternalLink,
  Plane, Building2, Utensils, ShoppingBag, Laptop
} from 'lucide-react'

const WHATSAPP_DIASPORA_URL =
  'https://wa.me/254751822556?text=Hi%2C%20I%20am%20a%20Diaspora%20client%20and%20need%20a%20commercial%20for%20my%20business%20in%20Kenya'

const DIASPORA_TIERS = [
  { id: 'startup_hook', label: '30s Social Hook', usd: 15, kes: 2000, desc: 'Kinetic typography + voiceover + poster for social campaigns & startups' },
  { id: '30s', label: '30s Standard Commercial', usd: 65, kes: 8000, desc: 'Flagship standard commercial for Instagram, TikTok, WhatsApp & Facebook' },
  { id: '60s', label: '60s Full Brand Story', usd: 120, kes: 15000, desc: 'Complete brand narrative, problem/solution & direct conversion CTA' },
  { id: '90s', label: '90s Deep Story', usd: 160, kes: 20000, desc: 'Extended product, luxury real estate or service demonstration' },
  { id: '3m+', label: '3m+ Brand Film', usd: 480, kes: 60000, desc: 'Corporate mini-documentary & institutional pitch for diaspora investors' },
]

const DIASPORA_INDUSTRIES = [
  {
    icon: Building2,
    title: 'Luxury Airbnbs & Real Estate',
    desc: 'Showcase your apartments in Kilimani, Westlands, or the Coast with crisp walkthroughs that drive bookings from international travelers & diaspora returns.',
  },
  {
    icon: Utensils,
    title: 'Restaurants, Lounges & Nightlife',
    desc: 'Capture the authentic Nairobi energy, golden-hour dining, and cocktail experiences to fill tables every weekend.',
  },
  {
    icon: ShoppingBag,
    title: 'Kenyan Retailing & Boutiques',
    desc: 'Showcase fashion, cosmetics, and packaged goods with studio product close-ups and high-converting social hooks.',
  },
  {
    icon: Laptop,
    title: 'Fintech, SACCOs & Tech Platforms',
    desc: '2D motion graphics and app UI walkthroughs that explain complex platforms simply to customers and partners.',
  },
]

const DIASPORA_FAQS = [
  {
    q: 'How does remote commercial video production work if I am abroad?',
    a: 'You never need to travel to Nairobi. You submit your brief online in 60 seconds (or voice-note us on WhatsApp). Our Nairobi team handles the creative direction, scriptwriting, voice talent, and filming/animation. We send you an interactive watermarked preview link on our delivery portal with 2 revision rounds included. Once approved, you pay the 30% milestone balance and download your clean 4K master.',
  },
  {
    q: 'Can I pay with international credit or debit cards in USD?',
    a: 'Yes! We accept all major international Visa and Mastercard credit and debit cards through PesaPal. You are charged directly in USD or KES without foreign exchange penalties or requiring an M-Pesa account.',
  },
  {
    q: 'What accents and languages can you record for our commercials?',
    a: 'We offer professional studio-recorded Kenyan English, Swahili (Kiswahili Sanifu), Urban Sheng, North American (US) English, British (UK) English, and Global Neutral voiceovers to match your exact audience.',
  },
  {
    q: 'What is your turnaround time across international time zones?',
    a: 'Standard delivery is 48 to 72 hours. Need it urgently for a launch or weekend event? We offer an expedited 24-hour rush service (+50%).',
  },
  {
    q: 'Do I get promotional posters alongside my video?',
    a: 'Yes! Every commercial video project includes a matching high-resolution graphic poster designed for your WhatsApp broadcast, Instagram feed, or print marketing.',
  },
]

export default function Diaspora() {
  const [selectedDuration, setSelectedDuration] = useState('30s')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const currentTier = DIASPORA_TIERS.find((t) => t.id === selectedDuration) || DIASPORA_TIERS[1]

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-purple-600 selection:text-white">
      <PublicHeader dark={true} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Glow lights */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6 bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Globe size={14} className="text-amber-400" />
            <span>FOR KENYAN DIASPORA IN THE UK, US, CANADA, UAE &amp; EUROPE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Direct Your Business Commercials in Kenya{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
              Without Leaving Your Desk.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            We are your on-ground commercial video production studio in Nairobi. We script, voice, shoot, and deliver broadcast-grade video ads &amp; branded posters with 100% remote review and USD card payments.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/quote?currency=USD"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_35px_rgba(147,51,234,0.5)] transition-all transform hover:-translate-y-0.5 border border-purple-400/30"
            >
              <CreditCard size={16} className="text-amber-300" />
              <span>Get Diaspora Quote in USD ($15–$480)</span>
            </Link>

            <a
              href={WHATSAPP_DIASPORA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all"
            >
              <MessageSquare size={16} />
              <span>WhatsApp Consultation</span>
            </a>
          </div>

          {/* Quick trust metrics */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-14 pt-8 border-t border-white/10 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>48h–72h Studio Turnaround</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-amber-400" />
              <span>Visa / Mastercard in USD or GBP</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-purple-400" />
              <span>70% Deposit / 30% on Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={15} className="text-yellow-400" />
              <span>100% Commercial Broadcast Rights</span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Industries Bento */}
      <section className="py-20 px-6 relative bg-[#090614] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
              POPULAR DIASPORA VENTURES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Built for Businesses You Own &amp; Fund in Kenya
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIASPORA_INDUSTRIES.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-4">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-white/65 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-white/5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Remote production ready
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Interactive USD Rate Calculator */}
      <section className="py-20 px-6 relative bg-gradient-to-b from-[#090614] via-[#120a26] to-[#07050d] border-t border-white/10">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white/[0.03] border border-purple-500/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                DIASPORA RATE CALCULATOR (USD)
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Transparent USD Pricing. Zero Hidden Fees.
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Select your desired video duration to view your exact price and 70% production deposit.
              </p>
            </div>
            <div className="text-right self-start md:self-end">
              <span className="text-xs text-white/40 block">Estimated Total</span>
              <span className="text-3xl font-extrabold text-white">
                ${currentTier.usd} USD
              </span>
              <span className="text-xs text-emerald-400 font-semibold block mt-0.5">
                (70% Deposit to Start: ${Math.round(currentTier.usd * 0.7)} USD)
              </span>
              <span className="text-[10px] text-white/40 block mt-0.5">~KES {currentTier.kes.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
            {DIASPORA_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedDuration(tier.id)}
                className={`p-3 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                  selectedDuration === tier.id
                    ? 'border-purple-500 bg-purple-500/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white">{tier.label}</p>
                  <p className="text-[10px] text-white/40 leading-tight mt-1">{tier.desc}</p>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xs font-extrabold text-amber-300">${tier.usd} USD</span>
                  <span className="text-[10px] font-semibold text-white/50">~KES {tier.kes.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-white/70">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>Scriptwriting Included</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>Kenyan or Global Voiceover</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>Free Matching Poster</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                <span>2 Revision Rounds</span>
              </span>
            </div>

            <Link
              to={`/quote?length=${selectedDuration}&currency=USD`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow"
            >
              Start in USD <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Step Remote Pipeline */}
      <section className="py-20 px-6 relative bg-[#07050d] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
              HOW IT WORKS REMOTELY
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">
              From Concept to Master in 4 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Brief & Scope Lock',
                desc: 'Pick your duration, style, and voiceover online. Pay 70% deposit via Visa/Mastercard ($10 to $336 USD).',
              },
              {
                step: '02',
                title: 'Studio Production',
                desc: 'Our team scripts, voices, shoots, or animates your commercial in Nairobi within 48–72 hours.',
              },
              {
                step: '03',
                title: 'Watermarked Preview',
                desc: 'Watch the preview cut on our interactive delivery portal. 2 revision rounds are included.',
              },
              {
                step: '04',
                title: 'Clear 30% & Launch',
                desc: 'Approve the cut, clear the 30% milestone balance, and download your clean 4K broadcast master.',
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                    {s.step}
                  </span>
                  <h3 className="text-base font-bold text-white mt-3 mb-2">{s.title}</h3>
                  <p className="text-xs text-white/65 leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-purple-400" /> Guaranteed Timeline
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 relative bg-[#090614] border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Diaspora Client FAQ</h2>
          </div>

          <div className="space-y-3">
            {DIASPORA_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-purple-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform text-white/50 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-xs text-white/60 mb-4">Have custom questions about on-ground shooting or multi-location filming?</p>
            <a
              href={WHATSAPP_DIASPORA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Chat directly with our Creative Director on WhatsApp</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 relative bg-gradient-to-b from-[#090614] via-[#150a28] to-[#07050d] border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Upgrade Your Kenyan Business Presence?
          </h2>
          <p className="text-sm text-white/70 max-w-xl mx-auto mb-8">
            Lock in your creative director, voiceover artist, and video production slot today. 70% deposit to start, 30% upon final preview approval.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/quote?currency=USD"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl transition-all"
            >
              <CreditCard size={15} /> Start Your Project in USD
            </Link>
            <a
              href={WHATSAPP_DIASPORA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all"
            >
              <MessageSquare size={15} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
