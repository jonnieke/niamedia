import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, MessageSquare, ChevronDown, ChevronRight, Send, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Portal {
  id: string
  client_name: string
  welcome_message: string
  brand_color: string
  logo_url: string | null
  hide_branding: boolean
}

interface Campaign {
  id: string
  title: string
  type: string
  content: string
  metadata: Record<string, string>
  created_at: string
}

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
  campaign_id: string | null
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getContentPreview(content: string, key: string): string {
  try {
    const parsed = JSON.parse(content)
    if (key === 'strategy') return parsed?.strategy?.keyMessage ?? ''
    if (key === 'whatsapp') return parsed?.whatsapp?.broadcast ?? ''
    if (key === 'instagram') return parsed?.captions?.instagram ?? ''
    if (key === 'facebook') return parsed?.captions?.facebook ?? ''
    return parsed?.strategy?.keyMessage ?? ''
  } catch { return '' }
}

export default function PortalView() {
  const { token } = useParams<{ token: string }>()
  const [portal, setPortal] = useState<Portal | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [commenterName, setCommenterName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentCampaignId, setCommentCampaignId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [commentSent, setCommentSent] = useState(false)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      // Load portal
      const { data: p, error: pErr } = await supabase
        .from('client_portals')
        .select('id, client_name, welcome_message, brand_color, logo_url, hide_branding')
        .eq('portal_token', token)
        .eq('is_active', true)
        .single()

      if (pErr || !p) { setError('Portal not found or link has expired.'); setLoading(false); return }
      setPortal(p as Portal)

      // Load campaigns via portal_campaigns join
      const { data: pcData } = await supabase
        .from('portal_campaigns')
        .select('campaign_id, campaigns(id, title, type, content, metadata, created_at)')
        .eq('portal_id', p.id)

      const cList = (pcData ?? [])
        .map(pc => pc.campaigns as unknown as Campaign)
        .filter(Boolean)
      setCampaigns(cList)

      // Load comments
      const { data: cData } = await supabase
        .from('portal_comments')
        .select('*')
        .eq('portal_id', p.id)
        .order('created_at', { ascending: false })
      setComments((cData ?? []) as Comment[])

      setLoading(false)
    }
    load()
  }, [token])

  const submitComment = async () => {
    if (!portal || !commenterName.trim() || !commentText.trim()) return
    setSubmitting(true)
    const { data } = await supabase.from('portal_comments').insert({
      portal_id: portal.id,
      campaign_id: commentCampaignId,
      author_name: commenterName.trim(),
      content: commentText.trim(),
    }).select().single()
    setSubmitting(false)
    if (data) {
      setComments(prev => [data as Comment, ...prev])
      setCommentText('')
      setCommentCampaignId(null)
      setCommentSent(true)
      setTimeout(() => setCommentSent(false), 3000)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={24} className="animate-spin text-purple-500" />
    </div>
  )

  if (error || !portal) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="font-semibold text-gray-800 mb-2">{error || 'Portal not found'}</p>
        <a href="/" className="text-purple-600 text-sm hover:underline">← Go to Nia Media</a>
      </div>
    </div>
  )

  const color = portal.brand_color

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {portal.logo_url ? (
            <img src={portal.logo_url} alt="Logo" className="h-8 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: color }}>
                {portal.client_name.charAt(0)}
              </div>
              <span className="font-bold text-gray-900 text-sm">{portal.client_name}</span>
            </div>
          )}
          {!portal.hide_branding && (
            <a href="https://niamedia.co.ke" target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600">
              Powered by Nia Media
            </a>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Campaign Materials</h1>
          {portal.welcome_message && (
            <p className="text-gray-500 leading-relaxed">{portal.welcome_message}</p>
          )}
        </div>

        {/* Campaigns */}
        {campaigns.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No campaigns have been shared yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {campaigns.map(campaign => {
              const isExp = expanded === campaign.id
              const meta = campaign.metadata as Record<string, string> ?? {}
              const preview = getContentPreview(campaign.content, 'strategy')
              const campComments = comments.filter(c => c.campaign_id === campaign.id)

              return (
                <div key={campaign.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExp ? null : campaign.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: color }}>
                      {campaign.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{campaign.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmt(campaign.created_at)}{meta.industry ? ` · ${meta.industry}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {campComments.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-blue-500">
                          <MessageSquare size={11} /> {campComments.length}
                        </span>
                      )}
                      {isExp ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {isExp && (
                    <div className="border-t border-gray-100 p-5 space-y-4">
                      {/* Content sections */}
                      {[
                        { key: 'strategy', label: 'Key Message' },
                        { key: 'whatsapp', label: 'WhatsApp Message' },
                        { key: 'instagram', label: 'Instagram Caption' },
                        { key: 'facebook', label: 'Facebook Caption' },
                      ].map(sec => {
                        const text = getContentPreview(campaign.content, sec.key)
                        if (!text) return null
                        return (
                          <div key={sec.key} className="rounded-xl border border-gray-200 p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{sec.label}</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{text}</p>
                          </div>
                        )
                      })}

                      {/* Campaign comments */}
                      {campComments.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Comments</p>
                          <div className="space-y-2">
                            {campComments.map(c => (
                              <div key={c.id} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                <p className="text-xs font-semibold text-blue-700 mb-0.5">{c.author_name}</p>
                                <p className="text-sm text-gray-700">{c.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Leave a comment on this campaign */}
                      <button
                        onClick={() => setCommentCampaignId(campaign.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        <MessageSquare size={11} /> Leave a comment on this campaign
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* General comment / feedback form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-bold text-gray-900 mb-1">
            {commentCampaignId
              ? `Comment on: ${campaigns.find(c => c.id === commentCampaignId)?.title}`
              : 'Leave feedback'}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {commentCampaignId ? 'Your comment will be sent directly to the team.' : 'General feedback or questions go straight to the team.'}
            {commentCampaignId && (
              <button onClick={() => setCommentCampaignId(null)} className="ml-2 text-purple-600 hover:underline">
                Switch to general
              </button>
            )}
          </p>

          {commentSent ? (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <Check size={16} /> Comment sent! The team has been notified.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Your name</label>
                <input className="input" value={commenterName} onChange={e => setCommenterName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="label">Comment or feedback</label>
                <textarea className="input" rows={3} value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="e.g. Love the Instagram caption — can we make the CTA more direct?" />
              </div>
              <button onClick={submitComment} disabled={!commenterName.trim() || !commentText.trim() || submitting}
                className="btn-primary text-sm px-5 py-2.5 gap-1.5 disabled:opacity-50"
                style={{ background: color }}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
