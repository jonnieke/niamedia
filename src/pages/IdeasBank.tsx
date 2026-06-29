import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb, Plus, Star, Trash2, Archive, Wand2, ArrowRight,
  Loader2, Sparkles, X, Check, Pencil,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import CreativeAssistant from '../components/CreativeAssistant'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Idea {
  id: string
  title: string
  industry: string
  angle: string
  target_audience: string
  offer: string
  platforms: string[]
  notes: string
  status: string
  source: string
  favorite: boolean
  created_at: string
}

const STATUSES = ['Draft', 'Selected', 'In Campaign', 'Archived']
const STATUS_COLOR: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Selected: 'bg-blue-50 text-blue-700',
  'In Campaign': 'bg-purple-50 text-purple-700',
  Archived: 'bg-gray-100 text-gray-400',
}

const EMPTY = { title: '', industry: '', angle: '', target_audience: '', offer: '', notes: '', platforms: [] as string[] }

function ideaToParams(idea: Idea | typeof EMPTY): string {
  const p = new URLSearchParams()
  if (idea.title) p.set('product_name', idea.title)
  if (idea.industry) p.set('industry', idea.industry)
  if (idea.target_audience) p.set('target_audience', idea.target_audience)
  if (idea.offer) p.set('offer', idea.offer)
  if (idea.angle) p.set('notes', idea.angle)
  return p.toString()
}

export default function IdeasBank() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [showAssistant, setShowAssistant] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    if (!user) return
    setLoading(true)
    supabase.from('ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setIdeas((data ?? []) as Idea[])
        setLoading(false)
      })
  }

  useEffect(load, [user])

  const industries = useMemo(
    () => Array.from(new Set(ideas.map(i => i.industry).filter(Boolean))).sort(),
    [ideas],
  )

  const openNew = () => {
    setEditingId(null)
    setDraft(EMPTY)
    setShowForm(true)
  }

  const openEdit = (idea: Idea) => {
    setEditingId(idea.id)
    setDraft({
      title: idea.title,
      industry: idea.industry,
      angle: idea.angle,
      target_audience: idea.target_audience,
      offer: idea.offer,
      notes: idea.notes,
      platforms: idea.platforms ?? [],
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setDraft(EMPTY)
  }

  const toggleFavorite = async (idea: Idea) => {
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, favorite: !i.favorite } : i))
    await supabase.from('ideas').update({ favorite: !idea.favorite }).eq('id', idea.id)
  }

  const setStatus = async (idea: Idea, status: string) => {
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status } : i))
    await supabase.from('ideas').update({ status, updated_at: new Date().toISOString() }).eq('id', idea.id)
  }

  const remove = async (idea: Idea) => {
    setIdeas(prev => prev.filter(i => i.id !== idea.id))
    await supabase.from('ideas').delete().eq('id', idea.id)
  }

  const saveDraft = async () => {
    if (!user || !draft.title.trim()) return
    setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('ideas').update({
        ...draft,
        updated_at: new Date().toISOString(),
      }).eq('id', editingId)
      setSaving(false)
      if (!error) {
        closeForm()
        load()
      }
      return
    }

    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      ...draft,
      source: 'Manual',
      status: 'Draft',
    })
    setSaving(false)
    if (!error) {
      closeForm()
      load()
    }
  }

  const filtered = ideas.filter(idea => {
    const statusMatch = statusFilter === 'all' || idea.status === statusFilter
    const industryMatch = industryFilter === 'all' || idea.industry === industryFilter
    return statusMatch && industryMatch
  })
  const sorted = [...filtered].sort((a, b) => Number(b.favorite) - Number(a.favorite))

  return (
    <DashboardLayout>
      {showAssistant && <CreativeAssistant onClose={() => { setShowAssistant(false); load() }} />}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <span className="section-tag">Ideas Bank</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Your creative ideas</h1>
            <p className="text-gray-500 text-sm mt-0.5">Save strong ideas here, refine them, then turn the best ones into full campaigns.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssistant(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 transition-colors"
            >
              <Sparkles size={15} /> Ask Nia
            </button>
            <button onClick={openNew} className="btn-primary text-sm px-4 py-2.5 gap-1.5">
              <Plus size={15} /> New Idea
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-[auto_auto_1fr] gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', ...STATUSES]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                  statusFilter === s ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {s === 'all' ? `All (${ideas.length})` : s}
              </button>
            ))}
          </div>
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            className="input text-sm max-w-[220px]"
          >
            <option value="all">All industries</option>
            {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
          </select>
          <div className="text-sm text-gray-500 self-center md:text-right">
            {sorted.length} idea{sorted.length !== 1 ? 's' : ''} shown
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-purple-500" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <Lightbulb size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-800 mb-1">No ideas yet</p>
            <p className="text-sm text-gray-500 mb-5">Brainstorm with Nia, or add an idea manually and shape it into a campaign later.</p>
            <button onClick={() => setShowAssistant(true)} className="btn-primary text-sm px-5 py-2.5 gap-1.5">
              <Sparkles size={15} /> Brainstorm with Nia
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map(idea => (
              <div key={idea.id} className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-all flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{idea.title}</p>
                  <button onClick={() => toggleFavorite(idea)} className="shrink-0">
                    <Star size={15} className={idea.favorite ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'} />
                  </button>
                </div>
                {idea.angle && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{idea.angle}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3 text-[10px]">
                  {idea.industry && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{idea.industry}</span>}
                  {idea.platforms?.slice(0, 3).map(p => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">{p}</span>
                  ))}
                  <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 font-medium">via {idea.source}</span>
                </div>
                {idea.offer && <p className="text-xs text-gray-500 mb-3">Offer: {idea.offer}</p>}

                <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <select
                    value={idea.status}
                    onChange={e => setStatus(idea, e.target.value)}
                    className={`text-[11px] font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer ${STATUS_COLOR[idea.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <button
                      onClick={() => openEdit(idea)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil size={13} />
                    </button>
                    {idea.status !== 'Archived' && (
                      <button
                        onClick={() => setStatus(idea, 'Archived')}
                        title="Archive"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Archive size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => remove(idea)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => navigate(`/new-campaign?${ideaToParams(idea)}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                    >
                      <Wand2 size={11} /> Campaign <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit idea' : 'New idea'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Title</label>
                <input className="input" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Weekend nyama choma special" />
              </div>
              <div>
                <label className="label">Industry</label>
                <input className="input" value={draft.industry} onChange={e => setDraft(d => ({ ...d, industry: e.target.value }))} placeholder="e.g. Restaurant" />
              </div>
              <div>
                <label className="label">Campaign angle</label>
                <textarea className="input" rows={2} value={draft.angle} onChange={e => setDraft(d => ({ ...d, angle: e.target.value }))} placeholder="The hook or positioning" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Target audience</label>
                  <input className="input" value={draft.target_audience} onChange={e => setDraft(d => ({ ...d, target_audience: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Offer</label>
                  <input className="input" value={draft.offer} onChange={e => setDraft(d => ({ ...d, offer: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={3} value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Poster direction, WhatsApp angle, objections, or production notes" />
              </div>
            </div>
            <div className="flex justify-between gap-2 mt-5 flex-wrap">
              <button
                onClick={() => navigate(`/new-campaign?${ideaToParams(draft)}`)}
                className="btn-secondary text-sm px-4 py-2"
                disabled={!draft.title.trim()}
              >
                Use as brief
              </button>
              <div className="flex gap-2">
                <button onClick={closeForm} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                <button onClick={saveDraft} disabled={!draft.title.trim() || saving} className="btn-primary text-sm px-4 py-2 gap-1.5 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {editingId ? 'Save changes' : 'Save idea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
