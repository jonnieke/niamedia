import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  X, Check, CheckCircle2, Sparkles, Film, Zap, Mic, Shield,
  ArrowRight, DollarSign, HelpCircle, Layers, Award, AlertCircle
} from 'lucide-react'

export interface PackageCompareModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPackage?: (packageId: 'startup_hook' | '30s') => void
  currentCurrency?: 'KES' | 'USD'
}

export default function PackageCompareModal({
  isOpen,
  onClose,
  onSelectPackage,
  currentCurrency = 'KES',
}: PackageCompareModalProps) {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState<'KES' | 'USD'>(currentCurrency)

  useEffect(() => {
    setCurrency(currentCurrency)
  }, [currentCurrency])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleChoose = (pkgId: 'startup_hook' | '30s') => {
    if (onSelectPackage) {
      onSelectPackage(pkgId)
      onClose()
    } else {
      navigate(`/quote?length=${pkgId}`)
      onClose()
    }
  }

  const COMPARISON_ROWS = [
    {
      feature: 'Primary Target & Use Case',
      tier2k: 'Startups, micro-shops & side-hustlers testing social proof',
      tier8k: 'Growth SMEs, corporate brands & high-converting paid ad campaigns',
      highlight: true,
    },
    {
      feature: 'Voiceover Narration',
      tier2k: 'Automated AI voiceover or text-led motion typography',
      tier8k: 'Professional Human Studio Voice Artist (Kenyan English, Swahili, Sheng, US/UK)',
      highlight: true,
    },
    {
      feature: 'Visual Production Style',
      tier2k: 'Kinetic social motion & stock b-roll templates',
      tier8k: 'Choice of Cinematic Live-Action, Custom 2D Vectors, or 3D/AI photorealism',
      highlight: true,
    },
    {
      feature: 'Creative Direction & Sound',
      tier2k: 'Automated algorithmic assembly',
      tier8k: 'Dedicated Creative Director, human script polish & studio SFX mastering',
      highlight: false,
    },
    {
      feature: 'Aspect Ratios & Master',
      tier2k: '1x 9:16 Vertical Video (TikTok, Reels, WhatsApp)',
      tier8k: '4K/1080p Master (Choice of 9:16 Vertical, 16:9 Landscape, or 1:1 Square)',
      highlight: false,
    },
    {
      feature: 'Matching Promotional Poster',
      tier2k: '1x Standard social poster',
      tier8k: '1x Premium high-resolution graphic poster kit (feed, status, print flyer)',
      highlight: false,
    },
    {
      feature: 'Revision Rounds',
      tier2k: '1 Minor text/caption adjustment',
      tier8k: '2 Full production revision rounds (voice pacing, music mix, visual timing)',
      highlight: true,
    },
    {
      feature: 'Turnaround Time',
      tier2k: '24–48 hours',
      tier8k: '48–72 hours (Rush 24h available)',
      highlight: false,
    },
    {
      feature: 'Commercial Advertising Rights',
      tier2k: 'Organic social media posts & WhatsApp status',
      tier8k: '100% Worldwide Commercial Broadcast Rights (Meta Ads, YouTube Ads, TV)',
      highlight: true,
    },
    {
      feature: 'Payment Milestones',
      tier2k: '100% full prepayment upfront',
      tier8k: '70% Deposit to start · 30% Balance after approving watermarked cut',
      highlight: true,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#0c0916] border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accents */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/10 bg-white/[0.02]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30 mb-2">
              <Sparkles size={13} className="text-amber-400" />
              <span>TRANSPARENT TIER COMPARISON</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              KES 2,000 vs KES 8,000: Which Fits Your Business?
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-xl">
              We created both packages to serve different business stages. Here is exactly what is included in each so you can pick the right fit with total confidence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency toggle */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setCurrency('KES')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currency === 'KES' ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                KES
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  currency === 'USD' ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Side-by-Side Summary Cards */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 bg-gradient-to-b from-white/[0.01] to-black/30">
          
          {/* 2K Tier Card */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 flex flex-col justify-between hover:border-purple-400/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-white/70">
                  BOOTSTRAP &amp; TESTING
                </span>
                <span className="text-xs text-white/40 font-mono">Entry Package</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">30s Startup Social Hook</h3>
              <p className="text-xs text-white/60 mt-1">
                Fast kinetic video for small businesses and founders testing audience response.
              </p>

              <div className="my-5 p-4 rounded-xl bg-black/40 border border-white/5 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-white">
                    {currency === 'KES' ? 'KES 2,000' : '$15 USD'}
                  </span>
                  <span className="text-xs text-white/40 block mt-0.5">
                    {currency === 'KES' ? '~ $15 USD' : 'KES 2,000'}
                  </span>
                </div>
                <span className="text-[11px] text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  100% Prepayment
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-white/80">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>AI Voiceover or Text-led:</strong> Fast algorithmic speech or animated typography.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>9:16 Vertical Video:</strong> Optimized for TikTok, Instagram Reels, and WhatsApp Status.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>1 Matching Branded Poster:</strong> High-res graphic for WhatsApp feeds.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Organic Usage Rights:</strong> Great for social media feeds &amp; stories.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleChoose('startup_hook')}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Select 30s Startup Hook ({currency === 'KES' ? 'KES 2,000' : '$15'})</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 8K Tier Card (Featured) */}
          <div className="rounded-2xl bg-gradient-to-b from-purple-950/40 via-purple-900/20 to-black/40 border-2 border-purple-500/60 p-6 flex flex-col justify-between shadow-[0_0_35px_rgba(168,85,247,0.25)] relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-purple-500 to-indigo-500 text-white tracking-wider shadow">
              FLAGSHIP COMMERCIAL TIER
            </span>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  STUDIO BROADCAST QUALITY
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Most Popular
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">30s Standard Commercial (Minimum)</h3>
              <p className="text-xs text-white/70 mt-1">
                Full-scale broadcast commercial directed for serious ROI, customer conversion, and paid ads.
              </p>

              <div className="my-5 p-4 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-amber-300">
                    {currency === 'KES' ? 'KES 8,000' : '$65 USD'}
                  </span>
                  <span className="text-xs text-white/50 block mt-0.5">
                    {currency === 'KES' ? '~ $65 USD' : 'KES 8,000'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 block">
                    70/30 Milestone Safe
                  </span>
                  <span className="text-[10px] text-white/50 block mt-0.5">
                    {currency === 'KES' ? '70% Deposit: KES 5,600' : '70% Deposit: $45.50'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-white/90">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Human Studio Voiceover:</strong> Pro Kenyan English, Swahili Sanifu, Sheng, or US/UK voice artists.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Custom Style Production:</strong> Cinematic Live-Action, Custom 2D Animation, or Photoreal 3D.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Dedicated Creative Direction:</strong> Script polishing, music licensing, and audio sound engineering.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>2 Full Revision Rounds:</strong> We adjust voice pacing, volume, and visual timing until you approve.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>100% Commercial Rights:</strong> Authorized for Meta Ad Manager, Google Ads, TV &amp; YouTube ads.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-purple-500/30">
              <button
                type="button"
                onClick={() => handleChoose('30s')}
                className="w-full py-3.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border border-purple-400/30"
              >
                <span>Select 30s Standard Commercial ({currency === 'KES' ? 'KES 8,000' : '$65'})</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>

        {/* Detailed Feature Breakdown Table */}
        <div className="p-6 sm:p-8 border-t border-white/10 bg-black/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-4">
            Feature-By-Feature Breakdown:
          </h4>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Deliverable / Capability</th>
                  <th className="py-3 px-4 font-bold text-white/70">30s Startup Hook (KES 2,000 / $15)</th>
                  <th className="py-3 px-4 font-bold text-amber-300">30s Standard Commercial (KES 8,000 / $65)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      row.highlight ? 'bg-purple-950/15' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-white/90">
                      {row.feature}
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {row.tier2k}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>{row.tier8k}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reassurance Callout for Larger Budgets */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-950/40 via-[#100a28] to-indigo-950/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <Shield size={15} className="text-purple-400" />
              <span>Have a larger marketing budget or need multi-platform campaigns?</span>
            </h4>
            <p className="text-xs text-white/60 max-w-xl">
              Agencies typically charge KES 50k–150k for this level of production. We streamline workflows so you get high-end TV &amp; digital commercials at 80% lower cost. We also produce 60s (KES 15k), 90s (KES 20k), and full brand documentaries (KES 60k).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleChoose('30s')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow"
            >
              Configure Standard Commercial
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
