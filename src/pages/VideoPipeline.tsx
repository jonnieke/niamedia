import { useState, useEffect } from 'react'
import { Plus, X, ChevronRight, CheckCircle, Clock, Film, Edit3, Eye, Package, FileText } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STAGES = [
  { id: 'brief',         label: 'Brief',         icon: FileText,    color: '#6b7280' },
  { id: 'preproduction', label: 'Pre-production', icon: Edit3,       color: '#f59e0b' },
  { id: 'filming',       label: 'Filming',        icon: Film,        color: '#2563eb' },
  { id: 'editing',       label: 'Editing',        icon: Edit3,       color: '#7c3aed' },
  { id: 'review',        label: 'Client Review',  icon: Eye,         color: '#db2777' },
  { id: 'delivered',     label: 'Delivered',      icon: Package,     color: '#059669' },
]

interface VideoJob {
  id: string
  title: string
  client_name: string
  client_email: string
  stage: string
  budget: number
  currency: string
  due_date: string
  notes: string
  created_at: string
}

function StageTag({ stage }: { stage: string }) {
  const s = STAGES.find(x => x.id === stage) ?? STAGES[0]
  const Icon = s.icon
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.color + '18' }}>
      <Icon size={9} />
      {s.label}
    </span>
  )
}

function fmt(n: number, currency = 'KES') {
  return `${currency} ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function VideoPipeline() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<VideoJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<VideoJob | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', client_name: '', client_email: '',
    budget: '', currency: 'KES', due_date: '', notes: '',
  })

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('video_jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setJobs((data ?? []) as VideoJob[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const save = async () => {
    if (!user || !form.title) return
    setSaving(true)
    const { error } = await supabase.from('video_jobs').insert({
      user_id: user.id, ...form,
      budget: form.budget ? Number(form.budget) : null,
      stage: 'brief',
    })
    if (!error) { setShowModal(false); load() }
    setSaving(false)
  }

  const advanceStage = async (job: VideoJob) => {
    const idx = STAGES.findIndex(s => s.id === job.stage)
    if (idx >= STAGES.length - 1) return
    const nextStage = STAGES[idx + 1].id
    await supabase.from('video_jobs').update({ stage: nextStage, updated_at: new Date().toISOString() }).eq('id', job.id)
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, stage: nextStage } : j))
    if (selected?.id === job.id) setSelected({ ...job, stage: nextStage })
  }

  // Group by stage for kanban view
  const byStage: Record<string, VideoJob[]> = {}
  STAGES.forEach(s => { byStage[s.id] = [] })
  jobs.forEach(j => { if (byStage[j.stage]) byStage[j.stage].push(j) })

  const activeJobs = jobs.filter(j => j.stage !== 'delivered').length
  const delivered = jobs.filter(j => j.stage === 'delivered').length

  return (
    <DashboardLayout>
      <div className="max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="section-tag">Video Services</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Production Pipeline</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm gap-2">
            <Plus size={15} /> New Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-glow p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active jobs</p>
            <p className="text-2xl font-bold text-gray-900">{activeJobs}</p>
          </div>
          <div className="card-glow p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Delivered</p>
            <p className="text-2xl font-bold" style={{ color: '#059669' }}>{delivered}</p>
          </div>
          <div className="card-glow p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">In review</p>
            <p className="text-2xl font-bold" style={{ color: '#db2777' }}>{byStage['review'].length}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-sm py-16">Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div className="card-glow p-12 text-center">
            <Film size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-3">No video jobs yet</p>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm gap-2">
              <Plus size={14} /> Create first job
            </button>
          </div>
        ) : (
          /* Kanban board */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {STAGES.map(stage => {
                const Icon = stage.icon
                const stageJobs = byStage[stage.id]
                return (
                  <div key={stage.id} className="w-56 shrink-0">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Icon size={13} style={{ color: stage.color }} />
                      <span className="text-xs font-semibold text-gray-600">{stage.label}</span>
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {stageJobs.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {stageJobs.map(job => (
                        <div key={job.id}
                          onClick={() => setSelected(job)}
                          className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all">
                          <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{job.title}</p>
                          {job.client_name && <p className="text-xs text-gray-400">{job.client_name}</p>}
                          <div className="flex items-center justify-between mt-2">
                            {job.budget ? (
                              <span className="text-[10px] font-medium text-gray-500">{fmt(job.budget, job.currency)}</span>
                            ) : <span />}
                            {job.due_date && (
                              <span className="text-[10px] text-gray-400">
                                {new Date(job.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {stageJobs.length === 0 && (
                        <div className="border-2 border-dashed border-gray-100 rounded-xl h-16 flex items-center justify-center">
                          <span className="text-xs text-gray-300">Empty</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Job detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-96 h-full bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 truncate">{selected.title}</h2>
              <button onClick={() => setSelected(null)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stage progress */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Stage</p>
                <div className="space-y-2">
                  {STAGES.map((stage, i) => {
                    const currentIdx = STAGES.findIndex(s => s.id === selected.stage)
                    const done = i < currentIdx
                    const active = stage.id === selected.stage
                    const Icon = done ? CheckCircle : active ? Clock : stage.icon
                    return (
                      <div key={stage.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${active ? 'border' : ''}`}
                        style={active ? { borderColor: stage.color + '40', background: stage.color + '08' } : {}}>
                        <Icon size={14} style={{ color: done ? '#059669' : active ? stage.color : '#d1d5db' }} />
                        <span className={`text-sm font-medium ${done ? 'text-emerald-600 line-through' : active ? 'text-gray-900' : 'text-gray-300'}`}>
                          {stage.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                {selected.client_name && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Client</p>
                    <p className="text-sm text-gray-800 font-medium">{selected.client_name}</p>
                    {selected.client_email && <p className="text-xs text-gray-500">{selected.client_email}</p>}
                  </div>
                )}
                {selected.budget && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Budget</p>
                    <p className="text-sm font-semibold text-gray-900">{fmt(selected.budget, selected.currency)}</p>
                  </div>
                )}
                {selected.due_date && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Due date</p>
                    <p className="text-sm text-gray-800">{new Date(selected.due_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{selected.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {selected.stage !== 'delivered' && (
              <div className="p-5 border-t border-gray-100">
                <button onClick={() => advanceStage(selected)}
                  className="w-full btn-primary text-sm gap-2 justify-center">
                  Advance to {STAGES[STAGES.findIndex(s => s.id === selected.stage) + 1]?.label}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Video Job</h2>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Project title *</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Kilele Bakery — Launch Ad" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Client name</label>
                  <input className="input" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client name" />
                </div>
                <div>
                  <label className="label">Client email</label>
                  <input className="input" type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} placeholder="client@email.com" />
                </div>
                <div>
                  <label className="label">Budget (KES)</label>
                  <input className="input" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. 50000" />
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Brief / notes</label>
                <textarea className="input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What's the concept? Key message? Deliverables?" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={save} disabled={saving || !form.title} className="btn-primary text-sm disabled:opacity-40">
                {saving ? 'Creating…' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
