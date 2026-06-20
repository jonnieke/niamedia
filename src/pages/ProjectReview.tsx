import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, XCircle, RefreshCw, Play, Pause,
  Download, Shield, Clock, User, FileText, ChevronDown, ChevronUp,
  AlertCircle, Check, Lock, X, Award, Printer, Loader2,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'

type ProjectStatus = 'queued' | 'in-production' | 'ready-for-review' | 'revision-requested' | 'accepted' | 'delivered'

interface Revision {
  id: string
  iteration: number
  notes: string | null
  file_url: string | null
  requested_at: string
}

interface Project {
  id: string
  title: string
  type: string
  package: string
  status: ProjectStatus
  creator_name: string
  deliverable_thumb?: string
  deliverable_url?: string
  max_iterations: number
  brief?: string
  rights?: string
  revisions: Revision[]
}

const STATUS_COLOR: Record<ProjectStatus, string> = {
  queued: '#94a3b8', 'in-production': '#f59e0b',
  'ready-for-review': '#8b5cf6', 'revision-requested': '#3b82f6',
  accepted: '#10b981', delivered: '#10b981',
}

function CertificateModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const certId = `NIA-${project.id.slice(0, 8).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-white/20 transition-colors">
          <X size={14} className="text-white" />
        </button>

        <div className="rounded-2xl border border-white/12 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f0f1e 0%, #0a0a14 100%)' }}>
          <div className="h-2" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981)' }} />
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border-4"
              style={{
                background: 'linear-gradient(135deg, #8b5cf620, #3b82f620)',
                borderColor: 'rgba(139,92,246,0.4)',
                boxShadow: '0 0 40px rgba(139,92,246,0.2)',
              }}>
              <Award size={36} className="text-purple-400" />
            </div>
            <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase mb-1">Certificate of</p>
            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">AI Origin</h2>
            <p className="text-xs text-gray-500 mb-6">Issued by Nia Media Ltd — Nairobi, Kenya</p>

            <div className="rounded-xl border border-gray-200 bg-white/3 p-5 text-left space-y-3 mb-6">
              {[
                { label: 'Project', value: project.title },
                { label: 'Certificate ID', value: certId },
                { label: 'Project Type', value: project.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                { label: 'Package', value: project.package },
                { label: 'Creator', value: project.creator_name },
                { label: 'Issue Date', value: today },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-500 shrink-0">{label}</p>
                  <p className="text-xs font-semibold text-gray-800 text-right truncate">{value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-5 px-2">
              This certifies that all media assets delivered under the above project were created using artificial intelligence tools and original creative work facilitated by Nia Media Ltd. No third-party copyrighted material, stock footage, or licensed audio has been incorporated. All intellectual property rights are hereby exclusively assigned to the subscriber named on this account upon acceptance of the deliverable.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { label: 'Zero 3rd-party IP', color: '#10b981' },
                { label: 'Exclusive Rights', color: '#8b5cf6' },
                { label: 'Commercial Use', color: '#3b82f6' },
              ].map(({ label, color }) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white/2 py-2 px-3 text-center">
                  <Check size={13} className="mx-auto mb-1" style={{ color }} />
                  <p className="text-[10px] font-semibold text-gray-600">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="text-left">
                <div className="h-8 flex items-end mb-0.5">
                  <p className="text-lg font-black italic text-white/60" style={{ fontFamily: 'Georgia, serif' }}>Nia Media</p>
                </div>
                <p className="text-[10px] text-gray-600">Authorised Signatory</p>
                <p className="text-[10px] text-gray-700">Nia Media Ltd</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-600 mb-0.5">Certificate ID</p>
                <p className="text-xs font-mono font-bold text-purple-400">{certId}</p>
              </div>
            </div>
          </div>
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981)' }} />
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={() => window.print()} className="btn-secondary flex-1 py-2.5 text-sm gap-2 flex items-center justify-center">
            <Printer size={14} /> Print / Save PDF
          </button>
          <button onClick={onClose} className="btn-primary flex-1 py-2.5 text-sm gap-2 flex items-center justify-center">
            <Download size={14} /> Continue to Download
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const [playing, setPlaying] = useState(false)
  const [showBrief, setShowBrief] = useState(false)
  const [action, setAction] = useState<'accept' | 'revision' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [watermark, setWatermark] = useState(true)
  const [showCert, setShowCert] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('projects')
      .select('*, project_revisions(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return }
        setProject({
          id: data.id,
          title: data.title,
          type: data.type,
          package: data.package,
          status: data.status as ProjectStatus,
          creator_name: data.creator_name ?? 'Nia Media Team',
          deliverable_thumb: data.deliverable_thumb,
          deliverable_url: data.deliverable_url,
          max_iterations: data.max_iterations ?? 3,
          brief: data.brief,
          rights: data.rights,
          revisions: (data.project_revisions ?? []).sort((a: Revision, b: Revision) => a.iteration - b.iteration),
        })
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="text-purple-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
          <AlertCircle size={36} className="mb-3 opacity-40" />
          <p>Project not found.</p>
          <button onClick={() => navigate('/projects')} className="btn-secondary mt-4 text-sm px-5 py-2">Back to Projects</button>
        </div>
      </DashboardLayout>
    )
  }

  const latestRevision = project.revisions[project.revisions.length - 1]
  const isVideo = ['video-commercial', 'brand-film', 'documentary'].includes(project.type)
  const isAudio = ['jingle', 'voiceover', 'radio-spot'].includes(project.type)
  const canReview = project.status === 'ready-for-review'
  const iterationsUsed = project.revisions.length
  const revisionLeft = project.max_iterations - iterationsUsed > 0

  if (submitted) {
    const messages: Record<NonNullable<typeof action>, { title: string; sub: string; color: string }> = {
      accept: { title: 'Project Accepted!', sub: 'Your final files and Certificate of AI Origin will be delivered to your account within 24 hours.', color: '#10b981' },
      revision: { title: 'Revision Requested', sub: 'Your feedback has been sent to the creative. The next iteration will be delivered within 3-5 business days.', color: '#3b82f6' },
      reject: { title: 'Project Declined', sub: 'Our team has been notified. A refund will be processed according to our policy within 5-7 business days.', color: '#ef4444' },
    }
    const msg = messages[action!]
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: `${msg.color}20`, border: `2px solid ${msg.color}40` }}>
            {action === 'accept' ? <CheckCircle size={36} style={{ color: msg.color }} /> : action === 'revision' ? <RefreshCw size={36} style={{ color: msg.color }} /> : <XCircle size={36} style={{ color: msg.color }} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{msg.title}</h2>
          <p className="text-gray-500 max-w-md mb-8">{msg.sub}</p>
          <button onClick={() => navigate('/projects')} className="btn-primary text-sm px-6 py-2.5">Back to Projects</button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {showCert && <CertificateModal project={project} onClose={() => { setShowCert(false); setSubmitted(true) }} />}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Projects
        </button>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-900/60 border border-gray-200 uppercase tracking-wide">
                {project.type.replace(/-/g, ' ')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{ color: STATUS_COLOR[project.status], background: `${STATUS_COLOR[project.status]}18` }}>
                {project.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{project.package} &middot; Creator: {project.creator_name}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={13} />
            Iteration {iterationsUsed} of {project.max_iterations}
            {!revisionLeft && <span className="text-amber-400 ml-2">(No revisions remaining)</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Preview player */}
            <div className="rounded-2xl border border-gray-200 bg-white/3 overflow-hidden">
              {isVideo && project.deliverable_url ? (
                <div className="relative aspect-video bg-black">
                  {watermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="text-white/15 font-black text-4xl tracking-widest rotate-[-25deg] select-none"
                        style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>
                        NIA MEDIA PREVIEW
                      </div>
                    </div>
                  )}
                  <video className="w-full h-full object-contain" controls={!watermark}
                    src={project.deliverable_url} poster={project.deliverable_thumb} />
                </div>
              ) : isAudio && project.deliverable_url ? (
                <div className="p-8 flex flex-col items-center gap-4">
                  {project.deliverable_thumb && (
                    <img src={project.deliverable_thumb} alt="" className="w-32 h-32 rounded-2xl object-cover opacity-70" />
                  )}
                  <button onClick={() => setPlaying(!playing)}
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    {playing ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
                  </button>
                  <div className="w-full max-w-xs">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: playing ? '35%' : '0%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{project.title}</p>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center text-gray-600">
                  <div className="text-center">
                    <Clock size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Deliverable pending upload</p>
                  </div>
                </div>
              )}

              {(isVideo || isAudio) && project.deliverable_url && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock size={12} /> Preview watermark active — accept to download full quality
                  </div>
                  <button onClick={() => setWatermark(!watermark)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    {watermark ? 'Remove (preview)' : 'Show watermark'}
                  </button>
                </div>
              )}
            </div>

            {/* Creator notes */}
            {latestRevision && (
              <div className="rounded-xl border border-gray-200 bg-white/2 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={13} className="text-purple-400" />
                  <p className="text-xs font-semibold text-gray-800">Creator Notes — Iteration {latestRevision.iteration}</p>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(latestRevision.requested_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{latestRevision.notes ?? '—'}</p>
              </div>
            )}

            {/* Brief toggle */}
            {project.brief && (
              <div className="rounded-xl border border-gray-200 bg-white/2">
                <button onClick={() => setShowBrief(!showBrief)}
                  className="w-full flex items-center justify-between p-4 text-sm text-gray-500 hover:text-white transition-colors">
                  <span className="flex items-center gap-2"><FileText size={14} /> View Original Brief</span>
                  {showBrief ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showBrief && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-gray-600 leading-relaxed">{project.brief}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: action panel */}
          <div className="space-y-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-green-400" />
                <p className="text-xs font-semibold text-green-300">Rights & Ownership</p>
              </div>
              <p className="text-xs text-green-400/80 leading-relaxed">
                {project.rights ?? 'All rights transfer to you upon acceptance and payment confirmation.'}
              </p>
              <div className="mt-3 space-y-1">
                {['AI-generated — zero 3rd-party IP', 'Certificate of AI Origin on delivery', 'Exclusive rights to your account'].map(r => (
                  <div key={r} className="flex items-center gap-1.5 text-xs text-green-400">
                    <Check size={10} /> {r}
                  </div>
                ))}
              </div>
            </div>

            {canReview ? (
              <div className="rounded-2xl border border-gray-200 bg-white/3 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-800 mb-1">Your Decision</p>

                <button onClick={() => setAction(action === 'accept' ? null : 'accept')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${
                    action === 'accept' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-gray-200 text-gray-600 hover:border-green-500/30 hover:text-green-300'
                  }`}>
                  <CheckCircle size={16} className={action === 'accept' ? 'text-green-400' : 'text-gray-500'} />
                  Accept & Download
                </button>

                <button onClick={() => setAction(action === 'revision' ? null : 'revision')}
                  disabled={!revisionLeft}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 ${
                    action === 'revision' ? 'border-blue-500/50 bg-blue-500/10 text-blue-300' : 'border-gray-200 text-gray-600 hover:border-blue-500/30 hover:text-blue-300'
                  }`}>
                  <RefreshCw size={16} className={action === 'revision' ? 'text-blue-400' : 'text-gray-500'} />
                  Request Changes {!revisionLeft && '(used up)'}
                </button>

                <button onClick={() => setAction(action === 'reject' ? null : 'reject')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${
                    action === 'reject' ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-gray-200 text-gray-600 hover:border-red-500/30 hover:text-red-300'
                  }`}>
                  <XCircle size={16} className={action === 'reject' ? 'text-red-400' : 'text-gray-500'} />
                  Decline Project
                </button>

                {(action === 'revision' || action === 'reject') && (
                  <div className="pt-1">
                    <label className="block text-xs text-gray-500 mb-1.5">
                      {action === 'revision' ? 'Describe exactly what to change *' : 'Reason for declining (optional)'}
                    </label>
                    <textarea className="input w-full h-28 resize-none text-sm" rows={4}
                      placeholder={action === 'revision'
                        ? 'Be specific — e.g. "Make the colour palette darker and more premium, increase CTA font size..."'
                        : 'Optional — help us improve...'}
                      value={feedback} onChange={e => setFeedback(e.target.value)} />
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (action === 'accept') {
                      await supabase.from('projects').update({ status: 'accepted' }).eq('id', project.id)
                      setShowCert(true)
                    } else if (action === 'revision') {
                      await supabase.from('projects').update({ status: 'revision-requested' }).eq('id', project.id)
                      await supabase.from('project_revisions').insert({
                        project_id: project.id,
                        iteration: iterationsUsed + 1,
                        notes: feedback,
                      })
                      setSubmitted(true)
                    } else if (action === 'reject') {
                      await supabase.from('projects').update({ status: 'queued' }).eq('id', project.id)
                      setSubmitted(true)
                    }
                  }}
                  disabled={!action || (action === 'revision' && !feedback.trim())}
                  className="w-full btn-primary py-2.5 text-sm disabled:opacity-40">
                  {action === 'accept' ? 'Accept & View Certificate' : action === 'revision' ? 'Submit Revision Request' : action === 'reject' ? 'Confirm Decline' : 'Select an Action'}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white/2 p-4 text-center text-sm text-gray-500">
                <AlertCircle size={20} className="mx-auto mb-2 opacity-40" />
                <p>Review actions are only available when status is <strong className="text-purple-400">Ready for Review</strong>.</p>
                <p className="text-xs mt-1">Current: <em>{project.status.replace(/-/g, ' ')}</em></p>
              </div>
            )}

            {project.status === 'accepted' && project.deliverable_url && (
              <a href={project.deliverable_url} download
                className="w-full flex items-center justify-center gap-2 btn-primary py-2.5 text-sm">
                <Download size={15} /> Download Final File
              </a>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

