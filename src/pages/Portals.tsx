import { useState, useEffect } from 'react'
import {
  Plus, Loader2, X, Check, Copy, Link2, Trash2, ExternalLink,
  MessageSquare, ChevronDown, ChevronRight, FolderOpen,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Portal {
  id: string
  client_name: string
  client_email: string | null
  portal_token: string
  brand_color: string
  welcome_message: string
  hide_branding: boolean
  is_active: boolean
  created_at: string
}

interface PortalCampaign {
  id: string
  campaign_id: string
  campaigns: { title: string }
}

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
  campaign_id: string | null
}

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed']

export default function Portals() {
  const { user } = useAuth()
  const [portals, setPortals] = useState<Portal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [portalCampaigns, setPortalCampaigns] = useState<Record<string, PortalCampaign[]>>({})
  const [portalComments, setPortalComments] = useState<Record<string, Comment[]>>({})
  const [allCampaigns, setAllCampaigns] = useState<{ id: string; title: string }[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  // Create form
  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftColor, setDraftColor] = useState('#7c3aed')
  const [draftWelcome, setDraftWelcome] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    if (!user) return
    const [portalsRes, campRes] = await Promise.all([
      supabase.from('client_portals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id, title').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setPortals((portalsRes.data ?? []) as Portal[])
    setAllCampaigns((campRes.data ?? []) as { id: string; title: string }[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const loadPortalDetails = async (portalId: string) => {
    const [campRes, commentRes] = await Promise.all([
      supabase.from('portal_campaigns').select('id, campaign_id, campaigns(title)').eq('portal_id', portalId),
      supabase.from('portal_comments').select('*').eq('portal_id', portalId).order('created_at', { ascending: false }).limit(20),
    ])
    setPortalCampaigns(prev => ({ ...prev, [portalId]: (campRes.data ?? []) as unknown as PortalCampaign[] }))
    setPortalComments(prev => ({ ...prev, [portalId]: (commentRes.data ?? []) as Comment[] }))
  }

  const toggleExpand = async (portalId: string) => {
    if (expanded === portalId) { setExpanded(null); return }
    setExpanded(portalId)
    if (!portalCampaigns[portalId]) await loadPortalDetails(portalId)
  }

  const createPortal = async () => {
    if (!user || !draftName.trim()) return
    setCreating(true)
    const { data } = await supabase.from('client_portals').insert({
      user_id: user.id,
      client_name: draftName.trim(),
      client_email: draftEmail.trim() || null,
      brand_color: draftColor,
      welcome_message: draftWelcome.trim(),
    }).select().single()
    setCreating(false)
    if (data) {
      setPortals(prev => [data as Portal, ...prev])
      setDraftName(''); setDraftEmail(''); setDraftWelcome(''); setDraftColor('#7c3aed')
      setShowCreate(false)
      setExpanded(data.id)
      setPortalCampaigns(prev => ({ ...prev, [data.id]: [] }))
      setPortalComments(prev => ({ ...prev, [data.id]: [] }))
    }
  }

  const deletePortal = async (portal: Portal) => {
    if (!confirm(`Delete portal for ${portal.client_name}?`)) return
    await supabase.from('client_portals').delete().eq('id', portal.id)
    setPortals(prev => prev.filter(p => p.id !== portal.id))
    if (expanded === portal.id) setExpanded(null)
  }

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/portal/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const addCampaign = async (portalId: string, campaignId: string) => {
    const { data } = await supabase.from('portal_campaigns').insert({ portal_id: portalId, campaign_id: campaignId })
      .select('id, campaign_id, campaigns(title)').single()
    if (data) {
      setPortalCampaigns(prev => ({ ...prev, [portalId]: [...(prev[portalId] ?? []), data as unknown as PortalCampaign] }))
    }
  }

  const removeCampaign = async (portalId: string, linkId: string) => {
    await supabase.from('portal_campaigns').delete().eq('id', linkId)
    setPortalCampaigns(prev => ({ ...prev, [portalId]: prev[portalId].filter(c => c.id !== linkId) }))
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <span className="section-tag">Client Portals</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Client Portals</h1>
            <p className="text-gray-500 text-sm mt-0.5">Share campaigns with clients in a branded, private portal.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2.5 gap-1.5">
            <Plus size={15} /> New Portal
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-purple-500" /></div>
        ) : portals.length === 0 && !showCreate ? (
          <div className="text-center py-20">
            <Link2 size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="font-semibold text-gray-800 mb-2">No client portals yet</p>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              Create a portal for each client. Add their campaigns to it and share the link.
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-5 py-2.5 gap-1.5">
              <Plus size={15} /> Create your first portal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {portals.map(portal => {
              const isExpanded = expanded === portal.id
              const camps = portalCampaigns[portal.id] ?? []
              const comments = portalComments[portal.id] ?? []
              const addedIds = new Set(camps.map(c => c.campaign_id))

              return (
                <div key={portal.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  {/* Portal header row */}
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: portal.brand_color }}>
                      {portal.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{portal.client_name}</p>
                      <p className="text-xs text-gray-500">{portal.client_email ?? 'No email'} · {camps.length ?? '?'} campaigns</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyLink(portal.portal_token)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          copied === portal.portal_token ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700'
                        }`}>
                        {copied === portal.portal_token ? <Check size={12} /> : <Copy size={12} />}
                        {copied === portal.portal_token ? 'Copied!' : 'Copy link'}
                      </button>
                      <a href={`/portal/${portal.portal_token}`} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-300">
                        <ExternalLink size={13} />
                      </a>
                      <button onClick={() => deletePortal(portal)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200">
                        <Trash2 size={13} />
                      </button>
                      <button onClick={() => toggleExpand(portal.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: campaigns + comments */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-5">
                      {/* Campaigns */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Campaigns in this portal</p>
                        <div className="space-y-2 mb-3">
                          {camps.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No campaigns added yet.</p>
                          )}
                          {camps.map(c => (
                            <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                <FolderOpen size={13} className="text-purple-400" />
                                <span className="text-sm text-gray-700">{(c.campaigns as unknown as { title: string })?.title ?? 'Campaign'}</span>
                              </div>
                              <button onClick={() => removeCampaign(portal.id, c.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors">
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <select
                          className="input text-sm"
                          value=""
                          onChange={e => { if (e.target.value) addCampaign(portal.id, e.target.value) }}>
                          <option value="">+ Add a campaign…</option>
                          {allCampaigns.filter(c => !addedIds.has(c.id)).map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      {/* Comments */}
                      {comments.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Client comments ({comments.length})
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {comments.map(comment => (
                              <div key={comment.id} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-xs font-semibold text-blue-700">{comment.author_name}</span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(comment.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portal link row */}
                      <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                        <Link2 size={14} className="text-purple-400 shrink-0" />
                        <p className="text-xs text-purple-700 font-mono truncate flex-1">
                          {window.location.origin}/portal/{portal.portal_token}
                        </p>
                        <button onClick={() => copyLink(portal.portal_token)} className="text-purple-600 hover:text-purple-800 shrink-0">
                          {copied === portal.portal_token ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create portal modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Create Client Portal</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Client name *</label>
                <input className="input" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="e.g. Acme Hotels" />
              </div>
              <div>
                <label className="label">Client email (optional)</label>
                <input className="input" type="email" value={draftEmail} onChange={e => setDraftEmail(e.target.value)} placeholder="client@example.com" />
              </div>
              <div>
                <label className="label">Welcome message</label>
                <textarea className="input" rows={2} value={draftWelcome}
                  onChange={e => setDraftWelcome(e.target.value)}
                  placeholder="e.g. Here are the campaign materials we've prepared for you." />
              </div>
              <div>
                <label className="label">Portal accent colour</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setDraftColor(c)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${draftColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm px-4 py-2 flex-1">Cancel</button>
              <button onClick={createPortal} disabled={!draftName.trim() || creating}
                className="btn-primary text-sm px-4 py-2 gap-1.5 flex-1 disabled:opacity-50">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
