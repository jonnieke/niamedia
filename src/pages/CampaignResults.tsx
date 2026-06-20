import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  Copy, Save, RefreshCw, Download, Check, Zap, Loader2,
  Wand2, MessageSquare, Share2, Sparkles,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { CampaignFormData, GeneratedContent } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

/* â"€â"€â"€ Copy button â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="btn-ghost text-xs px-2.5 py-1.5 gap-1.5">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/* â"€â"€â"€ Block — with per-section tweak + optional WhatsApp share â"€ */
interface BlockProps {
  label: string
  content: string
  blockKey: string
  briefContext: string
  showWhatsAppShare?: boolean
  onRefine: (key: string, newContent: string) => void
}

function Block({ label, content, blockKey, briefContext, showWhatsAppShare, onRefine }: BlockProps) {
  const [tweaking, setTweaking] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [waCopied, setWaCopied] = useState(false)

  const handleTweak = async () => {
    if (!feedback.trim() || loading) return
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('refine-section', {
        body: { label, currentContent: content, feedback, briefContext },
      })
      if (!error && data?.refined) {
        onRefine(blockKey, data.refined)
        setFeedback('')
        setTweaking(false)
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(content)}`
    window.open(url, '_blank', 'noopener')
  }

  const copyForWhatsApp = () => {
    navigator.clipboard.writeText(content)
    setWaCopied(true)
    setTimeout(() => setWaCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden transition-all">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200"
        style={{ background: '#f9fafb' }}>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-1">
          {showWhatsAppShare && (
            <>
              <button onClick={shareWhatsApp}
                className="btn-ghost text-xs px-2.5 py-1.5 gap-1.5 text-green-600 hover:text-green-700">
                <MessageSquare size={12} /> Open in WhatsApp
              </button>
              <button onClick={copyForWhatsApp}
                className="btn-ghost text-xs px-2.5 py-1.5 gap-1.5"
                style={{ color: waCopied ? '#34d399' : undefined }}>
                {waCopied ? <Check size={12} /> : <Copy size={12} />}
                {waCopied ? 'Copied' : 'Copy'}
              </button>
            </>
          )}
          {!showWhatsAppShare && <CopyButton text={content} />}
          <button
            onClick={() => { setTweaking(t => !t); setFeedback('') }}
            className={`btn-ghost text-xs px-2.5 py-1.5 gap-1.5 transition-colors ${tweaking ? 'text-purple-700' : ''}`}>
            <Wand2 size={12} /> Tweak
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
      </div>

      {/* Tweak panel */}
      {tweaking && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-200" style={{ background: '#f5f3ff' }}>
          <p className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-widest">How should it change?</p>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-sm"
              placeholder="e.g. make it shorter, add urgency, in Kiswahili, more direct…"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTweak()}
              autoFocus
            />
            <button onClick={handleTweak} disabled={!feedback.trim() || loading}
              className="btn-primary px-4 py-2 text-xs gap-1.5 disabled:opacity-40">
              {loading
                ? <Loader2 size={12} className="animate-spin" />
                : <Sparkles size={12} />}
              {loading ? '' : 'Refine'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Shorter', 'More urgent', 'In Kiswahili', 'More conversational', 'Add a question'].map(s => (
              <button key={s} onClick={() => setFeedback(s)}
                className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-600 hover:border-purple-500/30 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const tabs = ['Strategy', 'Video Script', 'Poster Copy', 'Captions', 'WhatsApp', 'Landing Page']

/* â"€â"€â"€ Main page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
export default function CampaignResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState(0)
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [form, setForm] = useState<CampaignFormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(id ?? null)
  const [regenerating, setRegenerating] = useState(false)
  const [loadError, setLoadError] = useState('')
  // Per-section refinement overrides
  const [refinements, setRefinements] = useState<Record<string, string>>({})
  // Post-save referral nudge
  const [referralCopied, setReferralCopied] = useState(false)
  const [showReferralNudge, setShowReferralNudge] = useState(false)

  useEffect(() => {
    if (id) {
      supabase.from('campaigns').select('*').eq('id', id).single().then(({ data, error }) => {
        if (error || !data) { setLoadError('Campaign not found.'); return }
        setForm(data.metadata as CampaignFormData)
        try { setContent(JSON.parse(data.content ?? '')) } catch { setLoadError('Could not parse campaign content.') }
        setSaved(true)
        setSavedId(id)
      })
      return
    }
    const state = location.state as { form: CampaignFormData; content: GeneratedContent } | null
    if (!state?.form || !state?.content) { navigate('/new-campaign'); return }
    setForm(state.form)
    setContent(state.content)
  }, [id, location.state, navigate])

  // Merge refinements into content for saving
  const getMergedContent = (): GeneratedContent | null => {
    if (!content) return null
    if (Object.keys(refinements).length === 0) return content
    return {
      ...content,
      captions: {
        ...content.captions,
        facebook: refinements['captions.facebook'] ?? content.captions.facebook,
        instagram: refinements['captions.instagram'] ?? content.captions.instagram,
        tiktok: refinements['captions.tiktok'] ?? content.captions.tiktok,
        linkedin: refinements['captions.linkedin'] ?? content.captions.linkedin,
      },
      whatsapp: {
        ...content.whatsapp,
        status: refinements['whatsapp.status'] ?? content.whatsapp.status,
        broadcast: refinements['whatsapp.broadcast'] ?? content.whatsapp.broadcast,
        reply: refinements['whatsapp.reply'] ?? content.whatsapp.reply,
      },
      posterCopy: {
        ...content.posterCopy,
        headline: refinements['posterCopy.headline'] ?? content.posterCopy.headline,
        subheadline: refinements['posterCopy.subheadline'] ?? content.posterCopy.subheadline,
        offerText: refinements['posterCopy.offerText'] ?? content.posterCopy.offerText,
        cta: refinements['posterCopy.cta'] ?? content.posterCopy.cta,
        designDirection: refinements['posterCopy.designDirection'] ?? content.posterCopy.designDirection,
      },
      videoScript: {
        ...content.videoScript,
        hook: refinements['videoScript.hook'] ?? content.videoScript.hook,
        scene1: refinements['videoScript.scene1'] ?? content.videoScript.scene1,
        scene2: refinements['videoScript.scene2'] ?? content.videoScript.scene2,
        scene3: refinements['videoScript.scene3'] ?? content.videoScript.scene3,
        callToAction: refinements['videoScript.callToAction'] ?? content.videoScript.callToAction,
        visualDirection: refinements['videoScript.visualDirection'] ?? content.videoScript.visualDirection,
      },
      strategy: {
        ...content.strategy,
        angle: refinements['strategy.angle'] ?? content.strategy.angle,
        keyMessage: refinements['strategy.keyMessage'] ?? content.strategy.keyMessage,
        painPoint: refinements['strategy.painPoint'] ?? content.strategy.painPoint,
        cta: refinements['strategy.cta'] ?? content.strategy.cta,
      },
    }
  }

  const handleRefine = (key: string, newContent: string) => {
    setRefinements(prev => ({ ...prev, [key]: newContent }))
    setSaved(false)
  }

  const handleSave = async () => {
    const merged = getMergedContent()
    if (!merged || !form || !user) return
    setSaving(true)
    const payload = {
      user_id: user.id,
      title: form.product_name,
      type: form.industry,
      content: JSON.stringify(merged),
      metadata: form,
    }
    if (savedId && !id) {
      await supabase.from('campaigns').update(payload).eq('id', savedId)
    } else if (!savedId) {
      const { data } = await supabase.from('campaigns').insert(payload).select('id').single()
      if (data?.id) setSavedId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setShowReferralNudge(true)
  }

  const handleRegenerate = async () => {
    if (!form) return
    setRegenerating(true)
    setSaved(false)
    setRefinements({})
    const { data, error } = await supabase.functions.invoke('generate-campaign', { body: form })
    setRegenerating(false)
    if (!error && data && !data.error) setContent(data)
  }

  const exportTxt = () => {
    const merged = getMergedContent()
    if (!merged || !form) return
    const parts = [
      `CAMPAIGN: ${form.product_name}`,
      `Business: ${form.business_name} | Industry: ${form.industry}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '', '--- STRATEGY ---',
      `Angle: ${merged.strategy.angle}`,
      `Pain Point: ${merged.strategy.painPoint}`,
      `Key Message: ${merged.strategy.keyMessage}`,
      '', '--- VIDEO SCRIPT ---',
      `Hook: ${merged.videoScript.hook}`,
      `Scene 1: ${merged.videoScript.scene1}`,
      `Scene 2: ${merged.videoScript.scene2}`,
      `Scene 3: ${merged.videoScript.scene3}`,
      `CTA: ${merged.videoScript.callToAction}`,
      `Visuals: ${merged.videoScript.visualDirection}`,
      '', '--- POSTER COPY ---',
      `Headline: ${merged.posterCopy.headline}`,
      `Subheadline: ${merged.posterCopy.subheadline}`,
      `Offer: ${merged.posterCopy.offerText}`,
      `CTA: ${merged.posterCopy.cta}`,
      '', '--- CAPTIONS ---',
      `Facebook:\n${merged.captions.facebook}`,
      `Instagram:\n${merged.captions.instagram}`,
      `TikTok:\n${merged.captions.tiktok}`,
      `LinkedIn:\n${merged.captions.linkedin}`,
      '', '--- WHATSAPP ---',
      `Status: ${merged.whatsapp.status}`,
      `Broadcast:\n${merged.whatsapp.broadcast}`,
      `Reply:\n${merged.whatsapp.reply}`,
      '', '--- LANDING PAGE ---',
      `Headline: ${merged.landingPage.headline}`,
      `Subheadline: ${merged.landingPage.subheadline}`,
      `Benefits:\n${merged.landingPage.benefits.map(b => `• ${b}`).join('\n')}`,
    ].join('\n')
    const blob = new Blob([parts], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.product_name.replace(/\s+/g, '_')}_campaign.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyReferralLink = () => {
    const code = `NIA-${user?.id.slice(0, 6).toUpperCase()}`
    navigator.clipboard.writeText(`https://niamedia.co.ke/join?ref=${code}`)
    setReferralCopied(true)
    setTimeout(() => setReferralCopied(false), 3000)
  }

  if (loadError) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">{loadError}</p>
        <button onClick={() => navigate('/campaigns')} className="btn-secondary text-sm">Back to Campaigns</button>
      </div>
    </DashboardLayout>
  )

  if (!content || !form) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" /> Loading campaign content…
        </div>
      </div>
    </DashboardLayout>
  )

  // Shorthand: use refinement if available, otherwise fall back to original content
  const c = (key: string, val: string) => refinements[key] ?? val
  const briefContext = `${form.business_name} (${form.industry}), promoting ${form.product_name} to ${form.target_audience} in ${form.location}`

  const blockProps = (key: string, val: string, extra?: Partial<BlockProps>) => ({
    blockKey: key,
    content: c(key, val),
    briefContext,
    onRefine: handleRefine,
    ...extra,
  })

  const tabContent = [
    /* Strategy */
    <div key="s" className="space-y-4">
      <Block label="Campaign Angle" {...blockProps('strategy.angle', content.strategy.angle)} />
      <Block label="Pain Point Addressed" {...blockProps('strategy.painPoint', content.strategy.painPoint)} />
      <Block label="Key Message" {...blockProps('strategy.keyMessage', content.strategy.keyMessage)} />
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Recommended Platforms</p>
        <div className="flex flex-wrap gap-2">
          {content.strategy.platforms.map(p => (
            <span key={p} className="px-3 py-1 rounded-full text-xs font-semibold text-gray-800"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>{p}</span>
          ))}
        </div>
      </div>
      <Block label="Call to Action" {...blockProps('strategy.cta', content.strategy.cta)} />
    </div>,

    /* Video Script */
    <div key="v" className="space-y-4">
      <Block label="Hook (Opening)" {...blockProps('videoScript.hook', content.videoScript.hook)} />
      <Block label="Scene 1" {...blockProps('videoScript.scene1', content.videoScript.scene1)} />
      <Block label="Scene 2" {...blockProps('videoScript.scene2', content.videoScript.scene2)} />
      <Block label="Scene 3" {...blockProps('videoScript.scene3', content.videoScript.scene3)} />
      <Block label="Call to Action" {...blockProps('videoScript.callToAction', content.videoScript.callToAction)} />
      <Block label="Visual Direction" {...blockProps('videoScript.visualDirection', content.videoScript.visualDirection)} />
    </div>,

    /* Poster */
    <div key="p" className="space-y-4">
      <Block label="Headline" {...blockProps('posterCopy.headline', content.posterCopy.headline)} />
      <Block label="Subheadline" {...blockProps('posterCopy.subheadline', content.posterCopy.subheadline)} />
      <Block label="Offer Text" {...blockProps('posterCopy.offerText', content.posterCopy.offerText)} />
      <Block label="CTA" {...blockProps('posterCopy.cta', content.posterCopy.cta)} />
      <Block label="Design Direction" {...blockProps('posterCopy.designDirection', content.posterCopy.designDirection)} />
    </div>,

    /* Captions */
    <div key="c" className="space-y-4">
      <Block label="Facebook" {...blockProps('captions.facebook', content.captions.facebook)} />
      <Block label="Instagram" {...blockProps('captions.instagram', content.captions.instagram)} />
      <Block label="TikTok" {...blockProps('captions.tiktok', content.captions.tiktok)} />
      <Block label="LinkedIn" {...blockProps('captions.linkedin', content.captions.linkedin)} />
    </div>,

    /* WhatsApp — with direct share */
    <div key="w" className="space-y-4">
      <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-xs text-gray-600 flex items-center gap-2">
        <MessageSquare size={13} className="text-green-600 shrink-0" />
        Each message has an <span className="text-green-700 font-semibold">Open in WhatsApp</span> button — tap it to send directly from your phone.
      </div>
      <Block label="WhatsApp Status" {...blockProps('whatsapp.status', content.whatsapp.status, { showWhatsAppShare: true })} />
      <Block label="Broadcast Message" {...blockProps('whatsapp.broadcast', content.whatsapp.broadcast, { showWhatsAppShare: true })} />
      <Block label="Reply / Follow-up" {...blockProps('whatsapp.reply', content.whatsapp.reply, { showWhatsAppShare: true })} />
    </div>,

    /* Landing Page */
    <div key="l" className="space-y-4">
      <Block label="Headline" {...blockProps('landingPage.headline', content.landingPage.headline)} />
      <Block label="Subheadline" {...blockProps('landingPage.subheadline', content.landingPage.subheadline)} />
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Benefits</p>
        <ul className="space-y-2.5">
          {content.landingPage.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>{i + 1}</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <Block label="CTA" {...blockProps('landingPage.cta', content.landingPage.cta)} />
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">FAQs</p>
        <div className="space-y-4">
          {content.landingPage.faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
              <p className="text-sm font-semibold text-gray-800 mb-1.5">{faq.question}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
  ]

  const hasRefinements = Object.keys(refinements).length > 0

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-purple-400" />
            <h1 className="text-2xl font-bold text-gray-900">{form.product_name}</h1>
            {hasRefinements && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                style={{ background: '#ede9fe', color: '#7c3aed' }}>
                {Object.keys(refinements).length} section{Object.keys(refinements).length !== 1 ? 's' : ''} tweaked
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{form.business_name} · {form.industry}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleRegenerate} disabled={regenerating}
            className="btn-secondary text-xs gap-1.5 disabled:opacity-50">
            {regenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {regenerating ? 'Regenerating…' : 'Regenerate All'}
          </button>
          <button onClick={handleSave} disabled={saving || (saved && !!savedId && !hasRefinements)}
            className="btn-secondary text-xs gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : saved && !hasRefinements ? <Check size={12} className="text-emerald-400" /> : <Save size={12} />}
            {saving ? 'Saving…' : saved && !hasRefinements ? 'Saved' : hasRefinements ? 'Save Changes' : 'Save'}
          </button>
          <button onClick={exportTxt} className="btn-primary text-xs gap-1.5 px-4 py-2">
            <Download size={12} /> Export TXT
          </button>
        </div>
      </div>

      {/* Tweak hint — first time only */}
      {!saved && (
        <div className="mb-5 p-3.5 rounded-xl border border-purple-200 bg-purple-50 flex items-center gap-3">
          <Wand2 size={14} className="text-purple-600 shrink-0" />
          <p className="text-xs text-gray-600">
            Click <span className="text-purple-700 font-semibold">Tweak</span> on any section to refine it — shorter, more urgent, in Kiswahili, or anything else.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px whitespace-nowrap ${
              activeTab === i
                ? 'border-purple-600 text-purple-700 bg-purple-50/60'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {tabContent[activeTab]}

      {/* Post-save referral nudge */}
      {showReferralNudge && (
        <div className="mt-8 p-5 rounded-2xl border border-purple-200 bg-purple-50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ede9fe' }}>
            <Sparkles size={18} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Campaign saved — nice work!</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Know a business that needs professional ads? Share your referral link and earn <span className="text-purple-700 font-semibold">KES 500 credit</span> for every friend who signs up.
            </p>
          </div>
          <button onClick={copyReferralLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0"
            style={{
              background: referralCopied ? '#d1fae5' : '#ede9fe',
              border: `1px solid ${referralCopied ? '#a7f3d0' : '#c4b5fd'}`,
              color: referralCopied ? '#059669' : '#7c3aed',
            }}>
            {referralCopied ? <Check size={12} /> : <Share2 size={12} />}
            {referralCopied ? 'Link copied!' : 'Copy referral link'}
          </button>
        </div>
      )}
    </DashboardLayout>
  )
}

