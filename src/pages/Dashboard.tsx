import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart2, BookOpen, CheckCircle2, FolderOpen,
  Lightbulb, Loader2, Palette, Plus, Sparkles, Video, Zap,
  Eye, MousePointerClick, TrendingUp,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import CreativeAssistant from '../components/CreativeAssistant'
import OnboardingWizard from '../components/OnboardingWizard'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface RecentCampaign {
  id: string
  title: string
  type: string
  created_at: string
}

interface RecentIdea {
  id: string
  title: string
  industry: string
  status: string
  favorite: boolean
}

interface LeadSummary {
  total: number
  new: number
  interested: number
  converted: number
  pipelineValue: number
  wonValue: number
  conversionRate: number
}
interface LeadRecord {
  status: string
  estimated_value: number
}

interface RequestSummary {
  total: number
  active: number
}

interface CampaignPerf {
  id: string
  title: string
  views: number
  clicks: number
  shares: number
}

function greeting(name: string) {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${salutation}, ${name.split(' ')[0]}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
  })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [showAssistant, setShowAssistant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<number | null>(null)
  const [hasBrandKit, setHasBrandKit] = useState(false)
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([])
  const [recentIdeas, setRecentIdeas] = useState<RecentIdea[]>([])
  const [leadSummary, setLeadSummary] = useState<LeadSummary>({ total: 0, new: 0, interested: 0, converted: 0, pipelineValue: 0, wonValue: 0, conversionRate: 0 })
  const [requestSummary, setRequestSummary] = useState<RequestSummary>({ total: 0, active: 0 })
  const [topCampaigns, setTopCampaigns] = useState<CampaignPerf[]>([])
  const [smartTip, setSmartTip] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    Promise.all([
      supabase.from('profiles').select('credits').eq('id', user.id).single(),
      supabase.from('brand_kits').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('campaigns').select('id, title, type, created_at, metadata').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('ideas').select('id, title, industry, status, favorite').eq('user_id', user.id).order('favorite', { ascending: false }).order('created_at', { ascending: false }).limit(5),
      supabase.from('leads').select('status, estimated_value, campaign_id').eq('user_id', user.id),
      supabase.from('video_requests').select('status').eq('user_id', user.id),
      supabase.from('campaign_shares').select('campaign_id, views, clicks').eq('user_id', user.id),
    ]).then(([profileRes, brandKitRes, campaignsRes, ideasRes, leadsRes, requestsRes, sharesRes]) => {
      setCredits(profileRes.data?.credits ?? null)
      setHasBrandKit(Boolean(brandKitRes.data))
      const campaigns = (campaignsRes.data ?? []) as (RecentCampaign & { metadata?: Record<string, unknown> })[]
      setRecentCampaigns(campaigns.slice(0, 5))

      // Aggregate share stats + leads per campaign
      const shareRows = sharesRes.data ?? []
      const leadsRaw = leadsRes.data ?? []
      const leadsByCampaign = new Map<string, number>()
      for (const l of leadsRaw) {
        if (l.campaign_id) leadsByCampaign.set(l.campaign_id, (leadsByCampaign.get(l.campaign_id) ?? 0) + 1)
      }

      if (shareRows.length > 0 || leadsByCampaign.size > 0) {
        const statsMap = new Map<string, { views: number; clicks: number; shares: number }>()
        for (const row of shareRows) {
          const prev = statsMap.get(row.campaign_id) ?? { views: 0, clicks: 0, shares: 0 }
          statsMap.set(row.campaign_id, { views: prev.views + (row.views ?? 0), clicks: prev.clicks + (row.clicks ?? 0), shares: prev.shares + 1 })
        }
        const perf: CampaignPerf[] = campaigns
          .filter(c => statsMap.has(c.id) || leadsByCampaign.has(c.id))
          .map(c => ({ id: c.id, title: c.title, ...(statsMap.get(c.id) ?? { views: 0, clicks: 0, shares: 0 }) }))
          .sort((a, b) => (b.views + b.clicks * 2) - (a.views + a.clicks * 2))
          .slice(0, 3)
        setTopCampaigns(perf)

        // Smart tip: find which tone/industry drives most leads
        const toneLeads = new Map<string, number>()
        for (const c of campaigns) {
          const tone = (c.metadata?.tone as string) || ''
          if (tone) toneLeads.set(tone, (toneLeads.get(tone) ?? 0) + (leadsByCampaign.get(c.id) ?? 0))
        }
        const topTone = [...toneLeads.entries()].sort((a, b) => b[1] - a[1])[0]
        const topPerf = perf[0]
        if (topTone && topTone[1] > 0) {
          setSmartTip(`Your *${topTone[0]}* tone campaigns are generating the most leads. Consider using it on your next campaign.`)
        } else if (topPerf && topPerf.views > 5) {
          setSmartTip(`"${topPerf.title}" is your top-performing campaign with ${topPerf.views} views. Share it again to get more leads.`)
        }
      }
      setRecentIdeas((ideasRes.data ?? []) as RecentIdea[])

      const leads = (leadsRes.data ?? []) as LeadRecord[]
      const converted = leads.filter(l => l.status === 'Converted')
      const pipelineLeads = leads.filter(l => !['Lost', 'Converted'].includes(l.status))
      setLeadSummary({
        total: leads.length,
        new: leads.filter(l => l.status === 'New').length,
        interested: leads.filter(l => l.status === 'Interested').length,
        converted: converted.length,
        pipelineValue: pipelineLeads.reduce((s, l) => s + (l.estimated_value || 0), 0),
        wonValue: converted.reduce((s, l) => s + (l.estimated_value || 0), 0),
        conversionRate: leads.length ? Math.round((converted.length / leads.length) * 100) : 0,
      })

      const requests = requestsRes.data ?? []
      setRequestSummary({
        total: requests.length,
        active: requests.filter(r => !['delivered', 'cancelled'].includes((r.status ?? '').toLowerCase())).length,
      })
      setLoading(false)
    })
  }, [user])

  const isNewUser = !loading && recentCampaigns.length === 0 && recentIdeas.length === 0 && !hasBrandKit
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('onboarding_dismissed') !== '1'
  )

  const nextAction = !hasBrandKit
    ? { label: 'Add Brand Kit', desc: 'Teach Nia how your business should sound before you generate.', to: '/brand-kit' }
    : recentIdeas.length === 0
      ? { label: 'Save your first idea', desc: 'Use Nia to sharpen an idea before you build a campaign.', to: '/ideas' }
      : recentCampaigns.length === 0
        ? { label: 'Generate your first campaign', desc: 'Turn one promising idea into a full campaign kit.', to: '/new-campaign' }
        : requestSummary.total === 0
          ? { label: 'Request poster or video production', desc: 'Turn your best campaign into polished execution assets.', to: '/request-video' }
          : { label: 'Review your latest campaigns', desc: 'Refine, export, and turn more outputs into leads.', to: '/campaigns' }

  return (
    <DashboardLayout>
      {showAssistant && <CreativeAssistant onClose={() => setShowAssistant(false)} />}
      {isNewUser && showOnboarding && <OnboardingWizard onDismiss={() => setShowOnboarding(false)} />}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
              {user ? greeting(user.name) : 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-500">
              Your campaign workspace for ideas, WhatsApp-first execution, and creative production requests.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {credits !== null && (
              <Link
                to={credits > 0 ? '/new-campaign' : '/pricing'}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border"
                style={{
                  background: credits > 0 ? '#ede9fe' : '#fff7ed',
                  borderColor: credits > 0 ? '#c4b5fd' : '#fdba74',
                  color: credits > 0 ? '#6d28d9' : '#c2410c',
                }}
              >
                {credits} credit{credits !== 1 ? 's' : ''} remaining
              </Link>
            )}
            <button
              onClick={() => setShowAssistant(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
            >
              <Sparkles size={15} />
              Talk to Nia
            </button>
            <Link to="/new-campaign" className="btn-primary text-sm px-4 py-2.5 gap-2">
              <Plus size={15} />
              Create Campaign
            </Link>
          </div>
        </div>

        {isNewUser && (
          <div
            className="mb-6 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #0b001f 0%, #060012 100%)', border: '1px solid rgba(167,139,250,0.25)' }}
          >
            <div className="flex-1">
              <p className="text-lg font-bold text-white mb-1">Start simple: idea first, campaign next.</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Add your brand kit, sharpen an idea with Nia, generate your first campaign kit, then request a poster or video if you need polished production.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link to="/brand-kit" className="btn-secondary text-sm px-4 py-2.5">Add Brand Kit</Link>
              <button
                onClick={() => setShowAssistant(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                Talk to Nia
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Zap, label: 'Credit balance', value: credits === null ? '...' : String(credits), sub: 'Campaign generation fuel', color: '#7c3aed', bg: '#ede9fe' },
            { icon: FolderOpen, label: 'Campaigns', value: String(recentCampaigns.length), sub: 'Recent campaign history', color: '#2563eb', bg: '#dbeafe' },
            { icon: Lightbulb, label: 'Saved ideas', value: String(recentIdeas.length), sub: 'Promising concepts to build from', color: '#d97706', bg: '#ffedd5' },
            { icon: BarChart2, label: 'Leads tracked', value: String(leadSummary.total), sub: `${leadSummary.converted} converted so far`, color: '#059669', bg: '#d1fae5' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  <card.icon size={18} style={{ color: card.color }} />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{card.sub}</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 leading-none">
                {loading ? <span className="text-gray-300">...</span> : card.value}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">Suggested next action</p>
                  <p className="text-xs text-gray-500">What will move your business forward fastest right now?</p>
                </div>
                <BookOpen size={16} className="text-purple-500" />
              </div>
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-purple-900">{nextAction.label}</p>
                  <p className="text-xs text-purple-700 mt-0.5">{nextAction.desc}</p>
                </div>
                <Link to={nextAction.to} className="btn-primary text-xs px-4 py-2 gap-1.5">
                  Go there <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Recent campaigns</p>
                    <p className="text-xs text-gray-500">Your latest generated campaign kits.</p>
                  </div>
                  <Link to="/campaigns" className="text-xs font-semibold text-purple-700 hover:underline">View all</Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 size={18} className="animate-spin text-purple-500" /></div>
                ) : recentCampaigns.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-gray-500 mb-4">No campaigns yet.</p>
                    <Link to="/new-campaign" className="btn-primary text-xs px-4 py-2 gap-1.5">
                      <Plus size={12} /> Generate first campaign
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentCampaigns.map(campaign => (
                      <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50 text-purple-700">
                          <FolderOpen size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{campaign.title}</p>
                          <p className="text-xs text-gray-500">{campaign.type || 'Campaign'} - {formatDate(campaign.created_at)}</p>
                        </div>
                        <ArrowRight size={13} className="text-gray-300 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Saved ideas</p>
                    <p className="text-xs text-gray-500">Creative angles worth turning into campaigns.</p>
                  </div>
                  <Link to="/ideas" className="text-xs font-semibold text-purple-700 hover:underline">Open Ideas Bank</Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 size={18} className="animate-spin text-purple-500" /></div>
                ) : recentIdeas.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-gray-500 mb-4">No ideas saved yet.</p>
                    <button onClick={() => setShowAssistant(true)} className="btn-primary text-xs px-4 py-2 gap-1.5">
                      <Sparkles size={12} /> Brainstorm with Nia
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentIdeas.map(idea => (
                      <Link key={idea.id} to="/ideas" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-700">
                          <Lightbulb size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{idea.title}</p>
                          <p className="text-xs text-gray-500">
                            {idea.industry || 'General'} - {idea.status}
                            {idea.favorite ? ' - Favourite' : ''}
                          </p>
                        </div>
                        <ArrowRight size={13} className="text-gray-300 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Leads & pipeline</p>
                  <p className="text-xs text-gray-500">Track business outcomes, not just content output.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Total leads', value: String(leadSummary.total) },
                  { label: 'Conversion %', value: `${leadSummary.conversionRate}%` },
                  { label: 'Open pipeline', value: loading ? '...' : `KES ${(leadSummary.pipelineValue / 1000).toFixed(0)}K` },
                  { label: 'Revenue won', value: loading ? '...' : `KES ${(leadSummary.wonValue / 1000).toFixed(0)}K` },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                    <p className="text-[11px] font-semibold text-gray-500">{item.label}</p>
                    <p className="text-lg font-extrabold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <Link to="/leads" className="btn-secondary w-full text-sm py-2.5">Open Lead Tracker</Link>
            </div>

            {topCampaigns.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-purple-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Campaign performance</p>
                    <p className="text-xs text-gray-500">Views and clicks from your shared links.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topCampaigns.map(c => (
                    <Link key={c.id} to={`/campaigns/${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{c.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Eye size={10} /> {c.views}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-500">
                            <MousePointerClick size={10} /> {c.clicks}
                          </span>
                        </div>
                      </div>
                      <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#2563eb)', width: `${Math.min(100, (c.views / (topCampaigns[0].views || 1)) * 100)}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/campaigns" className="btn-secondary w-full text-xs py-2 mt-3">View all campaigns</Link>
              </div>
            )}

            {/* Smart tip */}
            {smartTip && (
              <div className="rounded-2xl border px-4 py-4 flex items-start gap-3"
                style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(37,99,235,0.04))', borderColor: 'rgba(124,58,237,0.15)' }}>
                <TrendingUp size={15} className="text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-purple-700 mb-0.5">What's working</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {smartTip.split('*').map((part, i) =>
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Video size={16} className="text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Production requests</p>
                  <p className="text-xs text-gray-500">Poster and video support after campaign generation.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <p className="text-[11px] font-semibold text-gray-500">Total requests</p>
                  <p className="text-xl font-extrabold text-gray-900">{loading ? '...' : requestSummary.total}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <p className="text-[11px] font-semibold text-gray-500">Active now</p>
                  <p className="text-xl font-extrabold text-gray-900">{loading ? '...' : requestSummary.active}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/request-video" className="btn-primary flex-1 text-sm py-2.5">Request production</Link>
                <Link to="/requests" className="btn-secondary flex-1 text-sm py-2.5">Track requests</Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-purple-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Recommended setup</p>
                  <p className="text-xs text-gray-500">A smoother path for new users.</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Add Brand Kit', done: hasBrandKit, to: '/brand-kit', icon: Palette },
                  { label: 'Talk to Nia', done: recentIdeas.length > 0, to: '/ideas', icon: Sparkles },
                  { label: 'Generate first campaign', done: recentCampaigns.length > 0, to: '/new-campaign', icon: Plus },
                  { label: 'Request poster or video', done: requestSummary.total > 0, to: '/request-video', icon: Video },
                ].map(step => (
                  <Link key={step.label} to={step.to} className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.done ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-700'}`}>
                      <step.icon size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                    </div>
                    <span className={`text-[10px] font-bold ${step.done ? 'text-emerald-600' : 'text-purple-700'}`}>
                      {step.done ? 'Done' : 'Next'}
                    </span>
                  </Link>
                ))}
              </div>
              <Link to="/pricing" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:underline">
                View pricing and campaign credits <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
