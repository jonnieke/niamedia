import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Copy, Save, RefreshCw, Download, Check, Zap, Loader2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { CampaignFormData, GeneratedContent } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const tabs = ['Strategy', 'Video Script', 'Poster Copy', 'Captions', 'WhatsApp', 'Landing Page']

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

function Block({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <CopyButton text={content} />
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  )
}

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

  useEffect(() => {
    if (id) {
      // Load saved campaign from DB
      supabase.from('campaigns').select('*').eq('id', id).single().then(({ data, error }) => {
        if (error || !data) { setLoadError('Campaign not found.'); return }
        setForm(data.metadata as CampaignFormData)
        try { setContent(JSON.parse(data.content ?? '')) } catch { setLoadError('Could not parse campaign content.') }
        setSaved(true)
        setSavedId(id)
      })
      return
    }

    // Load from navigation state (fresh generation)
    const state = location.state as { form: CampaignFormData; content: GeneratedContent } | null
    if (!state?.form || !state?.content) {
      navigate('/new-campaign')
      return
    }
    setForm(state.form)
    setContent(state.content)
  }, [id, location.state, navigate])

  const handleSave = async () => {
    if (!content || !form || !user) return
    setSaving(true)
    const payload = {
      user_id: user.id,
      title: form.product_name,
      type: form.industry,
      content: JSON.stringify(content),
      metadata: form,
    }
    if (savedId && !id) {
      // update existing draft
      await supabase.from('campaigns').update(payload).eq('id', savedId)
    } else if (!savedId) {
      const { data } = await supabase.from('campaigns').insert(payload).select('id').single()
      if (data?.id) setSavedId(data.id)
    }
    setSaving(false)
    setSaved(true)
  }

  const handleRegenerate = async () => {
    if (!form) return
    setRegenerating(true)
    setSaved(false)
    const { data, error } = await supabase.functions.invoke('generate-campaign', { body: form })
    setRegenerating(false)
    if (!error && data && !data.error) setContent(data)
  }

  const exportTxt = () => {
    if (!content || !form) return
    const parts = [
      `CAMPAIGN: ${form.product_name}`,
      `Business: ${form.business_name} | Industry: ${form.industry}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '', '--- STRATEGY ---',
      `Angle: ${content.strategy.angle}`,
      `Pain Point: ${content.strategy.painPoint}`,
      `Key Message: ${content.strategy.keyMessage}`,
      '', '--- VIDEO SCRIPT ---',
      `Hook: ${content.videoScript.hook}`,
      `Scene 1: ${content.videoScript.scene1}`,
      `Scene 2: ${content.videoScript.scene2}`,
      `Scene 3: ${content.videoScript.scene3}`,
      `CTA: ${content.videoScript.callToAction}`,
      `Visuals: ${content.videoScript.visualDirection}`,
      '', '--- POSTER COPY ---',
      `Headline: ${content.posterCopy.headline}`,
      `Subheadline: ${content.posterCopy.subheadline}`,
      `Offer: ${content.posterCopy.offerText}`,
      `CTA: ${content.posterCopy.cta}`,
      '', '--- CAPTIONS ---',
      `Facebook:\n${content.captions.facebook}`,
      `Instagram:\n${content.captions.instagram}`,
      `TikTok:\n${content.captions.tiktok}`,
      `LinkedIn:\n${content.captions.linkedin}`,
      '', '--- WHATSAPP ---',
      `Status: ${content.whatsapp.status}`,
      `Broadcast:\n${content.whatsapp.broadcast}`,
      `Reply:\n${content.whatsapp.reply}`,
      '', '--- LANDING PAGE ---',
      `Headline: ${content.landingPage.headline}`,
      `Subheadline: ${content.landingPage.subheadline}`,
      `Benefits:\n${content.landingPage.benefits.map(b => `• ${b}`).join('\n')}`,
    ].join('\n')
    const blob = new Blob([parts], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.product_name.replace(/\s+/g, '_')}_campaign.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loadError) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-400">{loadError}</p>
        <button onClick={() => navigate('/campaigns')} className="btn-secondary text-sm">Back to Campaigns</button>
      </div>
    </DashboardLayout>
  )

  if (!content || !form) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Loading campaign content…
        </div>
      </div>
    </DashboardLayout>
  )

  const tabContent = [
    <div key="s" className="space-y-4">
      <Block label="Campaign Angle" content={content.strategy.angle} />
      <Block label="Pain Point Addressed" content={content.strategy.painPoint} />
      <Block label="Key Message" content={content.strategy.keyMessage} />
      <div className="rounded-xl border border-white/8 p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Recommended Platforms</p>
        <div className="flex flex-wrap gap-2">
          {content.strategy.platforms.map(p => (
            <span key={p} className="px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>{p}</span>
          ))}
        </div>
      </div>
      <Block label="Call to Action" content={content.strategy.cta} />
    </div>,

    <div key="v" className="space-y-4">
      <Block label="Hook (Opening)" content={content.videoScript.hook} />
      <Block label="Scene 1" content={content.videoScript.scene1} />
      <Block label="Scene 2" content={content.videoScript.scene2} />
      <Block label="Scene 3" content={content.videoScript.scene3} />
      <Block label="Call to Action" content={content.videoScript.callToAction} />
      <Block label="Visual Direction" content={content.videoScript.visualDirection} />
    </div>,

    <div key="p" className="space-y-4">
      <Block label="Headline" content={content.posterCopy.headline} />
      <Block label="Subheadline" content={content.posterCopy.subheadline} />
      <Block label="Offer Text" content={content.posterCopy.offerText} />
      <Block label="CTA" content={content.posterCopy.cta} />
      <Block label="Design Direction" content={content.posterCopy.designDirection} />
    </div>,

    <div key="c" className="space-y-4">
      <Block label="Facebook" content={content.captions.facebook} />
      <Block label="Instagram" content={content.captions.instagram} />
      <Block label="TikTok" content={content.captions.tiktok} />
      <Block label="LinkedIn" content={content.captions.linkedin} />
    </div>,

    <div key="w" className="space-y-4">
      <Block label="WhatsApp Status" content={content.whatsapp.status} />
      <Block label="Broadcast Message" content={content.whatsapp.broadcast} />
      <Block label="Reply Message" content={content.whatsapp.reply} />
    </div>,

    <div key="l" className="space-y-4">
      <Block label="Headline" content={content.landingPage.headline} />
      <Block label="Subheadline" content={content.landingPage.subheadline} />
      <div className="rounded-xl border border-white/8 p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Benefits</p>
        <ul className="space-y-2.5">
          {content.landingPage.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
              <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>{i + 1}</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <Block label="CTA" content={content.landingPage.cta} />
      <div className="rounded-xl border border-white/8 p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">FAQs</p>
        <div className="space-y-4">
          {content.landingPage.faqs.map((faq, i) => (
            <div key={i} className="border-b border-white/6 last:border-0 pb-4 last:pb-0">
              <p className="text-sm font-semibold text-white mb-1.5">{faq.question}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
  ]

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-purple-400" />
            <h1 className="text-2xl font-bold text-white">{form.product_name}</h1>
          </div>
          <p className="text-sm text-gray-500">{form.business_name} · {form.industry}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRegenerate} disabled={regenerating}
            className="btn-secondary text-xs gap-1.5 disabled:opacity-50">
            {regenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {regenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button onClick={handleSave} disabled={saving || (saved && !!savedId)}
            className="btn-secondary text-xs gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
          </button>
          <button onClick={exportTxt} className="btn-primary text-xs gap-1.5 px-4 py-2">
            <Download size={12} /> Export TXT
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-white/6">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
              activeTab === i
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {tabContent[activeTab]}
    </DashboardLayout>
  )
}
