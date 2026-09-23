import { useState, useEffect } from 'react'
import {
  Film, Link2, CheckCircle, Clock, Truck, Trophy,
  Plus, ChevronRight, Loader2, X, ExternalLink,
  AlertCircle, Calendar, DollarSign, Send, MessageCircle,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'

type ProjectStatus = 'in_production' | 'review' | 'delivered' | 'completed' | 'cancelled'

interface Project {
  id: string
  token: string
  proposal_id: string | null
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  video_length: string | null
  platforms: string[]
  status: ProjectStatus
  editor_notes: string | null
  deliverable_url: string | null
  deliverable_label: string | null
  thumbnail_url: string | null
  final_price: number | null
  deposit_paid: number | null
  balance_due: number | null
  balance_paid_at: string | null
  due_date: string | null
  delivered_at: string | null
  completed_at: string | null
  created_at: string
}

const STAGES: { key: ProjectStatus; label: string; icon: typeof Film; color: string; bg: string }[] = [
  { key: 'in_production', label: 'In Production', icon: Film, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  { key: 'review', label: 'Client Review', icon: Clock, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  { key: 'delivered', label: 'Delivered', icon: Truck, color: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
  { key: 'completed', label: 'Completed', icon: Trophy, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  { key: 'cancelled', label: 'Cancelled', icon: X, color: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
]

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin

export default function Production() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | ProjectStatus>('all')
  const [modal, setModal] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null })
  const [createModal, setCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notifying, setNotifying] = useState<string | null>(null)

  const [form, setForm] = useState({
    business_name: '', contact_name: '', email: '', phone: '',
    video_length: '', platforms: '',
    final_price: '', deposit_paid: '',
    due_date: '',
    deliverable_url: '', deliverable_label: '',
    editor_notes: '',
    proposal_id: '',
  })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProjects(data as Project[])
    setLoading(false)
  }

  const filtered = tab === 'all' ? projects : projects.filter(p => p.status === tab)

  async function updateStatus(id: string, status: ProjectStatus) {
    const patch: Record<string, unknown> = { status }
    if (status === 'delivered') patch.delivered_at = new Date().toISOString()
    if (status === 'completed') patch.completed_at = new Date().toISOString()
    await supabase.from('projects').update(patch).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  async function saveProject() {
    setSaving(true)
    const finalPrice = parseFloat(form.final_price) || null
    const depositPaid = parseFloat(form.deposit_paid) || null
    const balanceDue = finalPrice && depositPaid ? finalPrice - depositPaid : finalPrice
    const payload = {
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      video_length: form.video_length.trim() || null,
      platforms: form.platforms.split(',').map(s => s.trim()).filter(Boolean),
      final_price: finalPrice,
      deposit_paid: depositPaid,
      balance_due: balanceDue,
      due_date: form.due_date || null,
      deliverable_url: form.deliverable_url.trim() || null,
      deliverable_label: form.deliverable_label.trim() || null,
      editor_notes: form.editor_notes.trim() || null,
      proposal_id: form.proposal_id.trim() || null,
    }
    if (modal.project) {
      await supabase.from('projects').update(payload).eq('id', modal.project.id)
      setProjects(prev => prev.map(p => p.id === modal.project!.id ? { ...p, ...payload } : p))
      setModal({ open: false, project: null })
    } else {
      const { data } = await supabase.from('projects').insert(payload).select().single()
      if (data) setProjects(prev => [data as Project, ...prev])
      setCreateModal(false)
    }
    setSaving(false)
  }

  function openEdit(project: Project) {
    setForm({
      business_name: project.business_name,
      contact_name: project.contact_name ?? '',
      email: project.email ?? '',
      phone: project.phone ?? '',
      video_length: project.video_length ?? '',
      platforms: project.platforms?.join(', ') ?? '',
      final_price: project.final_price?.toString() ?? '',
      deposit_paid: project.deposit_paid?.toString() ?? '',
      due_date: project.due_date ?? '',
      deliverable_url: project.deliverable_url ?? '',
      deliverable_label: project.deliverable_label ?? '',
      editor_notes: project.editor_notes ?? '',
      proposal_id: project.proposal_id ?? '',
    })
    setModal({ open: true, project })
  }

  function openCreate() {
    setForm({ business_name: '', contact_name: '', email: '', phone: '', video_length: '', platforms: '', final_price: '', deposit_paid: '', due_date: '', deliverable_url: '', deliverable_label: '', editor_notes: '', proposal_id: '' })
    setCreateModal(true)
  }

  async function notifyClient(project: Project) {
    if (!project.deliverable_url) return
    setNotifying(project.id)
    if (project.email) {
      await supabase.functions.invoke('send-client-email', {
        body: {
          type: 'video_delivered',
          to: project.email,
          name: project.contact_name ?? project.business_name,
          businessName: project.business_name,
          deliverableLabel: project.deliverable_label ?? 'Your video',
          deliverableUrl: project.deliverable_url,
          projectToken: project.token,
          balanceDue: project.balance_due,
        },
      })
    }
    await updateStatus(project.id, 'delivered')
    if (project.phone) {
      const phoneNum = project.phone.replace(/\D/g, '').replace(/^0/, '254')
      const clientName = project.contact_name || project.business_name
      const msg = `Hi ${clientName}! 🎬 Your commercial video preview for *${project.business_name}* is ready for your review!\n\nReview the preview cut and approve final master delivery here:\n🔗 ${APP_URL}/delivery/${project.token}\n\nQuestions or revision notes? Just reply right here!`
      window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`, '_blank')
    }
    setNotifying(null)
  }

  const counts = {
    all: projects.length,
    in_production: projects.filter(p => p.status === 'in_production').length,
    review: projects.filter(p => p.status === 'review').length,
    delivered: projects.filter(p => p.status === 'delivered').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  }

  const ProjectForm = () => (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto px-6 py-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Business Name *</label>
          <input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
            className="input-field w-full" placeholder="Onfon Mobile Ltd" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Name</label>
          <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
            className="input-field w-full" placeholder="James Kariuki" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="input-field w-full" placeholder="james@onfon.co.ke" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="input-field w-full" placeholder="+254 7xx xxx xxx" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Video Length</label>
          <input value={form.video_length} onChange={e => setForm(f => ({ ...f, video_length: e.target.value }))}
            className="input-field w-full" placeholder="30 seconds" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Platforms (comma-separated)</label>
          <input value={form.platforms} onChange={e => setForm(f => ({ ...f, platforms: e.target.value }))}
            className="input-field w-full" placeholder="TikTok, Instagram, WhatsApp" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Final Price (KES)</label>
          <input
            type="number"
            value={form.final_price}
            onChange={e => {
              const val = e.target.value
              const num = parseFloat(val)
              if (!isNaN(num) && num > 0) {
                const dep70 = Math.round(num * 0.7)
                setForm(f => ({ ...f, final_price: val, deposit_paid: dep70.toString() }))
              } else {
                setForm(f => ({ ...f, final_price: val }))
              }
            }}
            className="input-field w-full"
            placeholder="15000"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Deposit Paid (70% standard)</label>
          <input
            type="number"
            value={form.deposit_paid}
            onChange={e => setForm(f => ({ ...f, deposit_paid: e.target.value }))}
            className="input-field w-full"
            placeholder="10500"
          />
        </div>
        {form.final_price && parseFloat(form.final_price) > 0 && (
          <div className="col-span-2 p-2.5 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between text-xs">
            <span className="text-purple-700 font-medium">Standard Milestone (70 / 30):</span>
            <span className="text-purple-900 font-bold">
              70% Deposit: KES {Math.round(parseFloat(form.final_price) * 0.7).toLocaleString()} · 30% Balance: KES {Math.round(parseFloat(form.final_price) * 0.3).toLocaleString()}
            </span>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Due Date</label>
          <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            className="input-field w-full" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Deliverable URL (final video)</label>
          <input value={form.deliverable_url} onChange={e => setForm(f => ({ ...f, deliverable_url: e.target.value }))}
            className="input-field w-full" placeholder="https://drive.google.com/..." />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Deliverable Label</label>
          <input value={form.deliverable_label} onChange={e => setForm(f => ({ ...f, deliverable_label: e.target.value }))}
            className="input-field w-full" placeholder="Final Cut — 30s TikTok" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Editor Notes</label>
          <textarea value={form.editor_notes} onChange={e => setForm(f => ({ ...f, editor_notes: e.target.value }))}
            className="input-field w-full resize-none" rows={2} placeholder="Internal notes for the editor..." />
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Production Board</h1>
            <p className="text-sm text-gray-500 mt-0.5">{projects.length} active projects</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={14} /> New Project
          </button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {STAGES.map(s => (
            <div key={s.key} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.bg }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-gray-900">{counts[s.key]}</p>
                <p className="text-xs text-gray-500 leading-none">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'all', label: `All (${counts.all})` },
            ...STAGES.map(s => ({ key: s.key, label: `${s.label} (${counts[s.key]})` })),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={tab === t.key
                ? { background: '#7c3aed', color: '#fff' }
                : { background: '#f3f4f6', color: '#374151' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Project cards */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-purple-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Film size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No projects here yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(project => {
              const stage = STAGES.find(s => s.key === project.status) ?? STAGES[0]
              const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'completed'
              const balanceDue = project.balance_due ?? 0
              const balancePaid = Boolean(project.balance_paid_at)
              return (
                <div key={project.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                          style={{ background: stage.bg, color: stage.color }}>
                          <stage.icon size={10} /> {stage.label}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        )}
                        {balanceDue > 0 && !balancePaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700">
                            <DollarSign size={10} /> KES {balanceDue.toLocaleString()} due
                          </span>
                        )}
                        {balancePaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700">
                            <CheckCircle size={10} /> Paid in full
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{project.business_name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        {project.contact_name && <span>{project.contact_name}</span>}
                        {project.video_length && <span>· {project.video_length}</span>}
                        {project.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> Due {new Date(project.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      {project.platforms?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.platforms.map(p => (
                            <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600">{p}</span>
                          ))}
                        </div>
                      )}
                      {project.deliverable_url && (
                        <a href={project.deliverable_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] text-purple-600 hover:underline font-semibold">
                          <Link2 size={10} /> {project.deliverable_label ?? 'View deliverable'}
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      {/* Stage actions */}
                      {project.status === 'in_production' && (
                        <button onClick={() => updateStatus(project.id, 'review')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all">
                          <ChevronRight size={12} /> Send for Review
                        </button>
                      )}
                      {project.status === 'review' && project.deliverable_url && (
                        <button
                          disabled={notifying === project.id}
                          onClick={() => notifyClient(project)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-cyan-200 text-cyan-700 hover:bg-cyan-50 transition-all disabled:opacity-50">
                          {notifying === project.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          Notify & Deliver
                        </button>
                      )}
                      {project.status === 'delivered' && (
                        <button onClick={() => updateStatus(project.id, 'completed')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition-all">
                          <Trophy size={12} /> Mark Complete
                        </button>
                      )}

                      {/* Client delivery page */}
                      <a href={`/delivery/${project.token}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-purple-200 hover:text-purple-600 transition-all">
                        <ExternalLink size={12} /> Client Page
                      </a>

                      {/* 1-Click WhatsApp Client Dispatcher */}
                      {project.phone && (() => {
                        const phoneNum = project.phone.replace(/\D/g, '').replace(/^0/, '254')
                        const clientName = project.contact_name || project.business_name
                        const trackingUrl = `${APP_URL}/delivery/${project.token}`
                        const isReviewReady = project.status === 'review' || project.status === 'delivered'
                        const msg = isReviewReady
                          ? `Hi ${clientName}! 🎬 Your commercial video preview for *${project.business_name}* is ready for your review!\n\nReview the watermarked preview cut and approve final master delivery here:\n🔗 ${trackingUrl}\n\nQuestions or revision notes? Just reply right here!`
                          : `Hi ${clientName}! 🎬 Your commercial video for *${project.business_name}* is active in our production pipeline.\n\nYou can track the live production milestones and concept roadmap here:\n🔗 ${trackingUrl}\n\nWe'll notify you as soon as your preview cut is ready!`
                        return (
                          <a
                            href={`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-all"
                            title="Send tracking / preview link to client via WhatsApp"
                          >
                            <MessageCircle size={12} /> WhatsApp Client
                          </a>
                        )
                      })()}

                      {/* Edit */}
                      <button onClick={() => openEdit(project)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-all">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create modal */}
        {createModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">New Project</h2>
                <button onClick={() => setCreateModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <ProjectForm />
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setCreateModal(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                <button disabled={saving || !form.business_name.trim()} onClick={saveProject}
                  className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {modal.open && modal.project && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Edit Project</h2>
                <button onClick={() => setModal({ open: false, project: null })}><X size={18} className="text-gray-400" /></button>
              </div>
              <ProjectForm />
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setModal({ open: false, project: null })} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                <button disabled={saving || !form.business_name.trim()} onClick={saveProject}
                  className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : 'Update Project'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

