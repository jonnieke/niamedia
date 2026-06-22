import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Film, Music, Mic, Radio, Clock, CheckCircle,
  AlertCircle, Loader2, Eye, ChevronRight, Package,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type ProjectStatus = 'queued' | 'in-production' | 'ready-for-review' | 'revision-requested' | 'accepted' | 'delivered'

interface UnifiedProject {
  id: string
  title: string
  type: string
  package: string
  status: ProjectStatus
  creatorName: string
  deliverableThumb?: string
  maxIterations: number
  revisionCount: number
  createdAt: string
  source: 'project' | 'audio'
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  queued:               { label: 'Queued',             color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: Clock },
  'in-production':      { label: 'In Production',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Loader2 },
  'ready-for-review':   { label: 'Ready for Review',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: Eye },
  'revision-requested': { label: 'Revision Requested', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: AlertCircle },
  accepted:             { label: 'Accepted',           color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: CheckCircle },
  delivered:            { label: 'Delivered',          color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: CheckCircle },
}

const TYPE_ICON: Record<string, typeof Film> = {
  'video-commercial': Film, 'brand-film': Film, documentary: Film,
  jingle: Music, voiceover: Mic, 'radio-spot': Radio,
}

const PIPELINE: ProjectStatus[] = ['queued', 'in-production', 'ready-for-review', 'revision-requested', 'accepted', 'delivered']

function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, color, bg, icon: Icon } = STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ color, background: bg }}>
      <Icon size={11} className={status === 'in-production' ? 'animate-spin' : ''} />
      {label}
    </span>
  )
}

function PipelineBar({ current }: { current: ProjectStatus }) {
  const steps = ['queued', 'in-production', 'ready-for-review', 'accepted', 'delivered'] as ProjectStatus[]
  const idx = steps.indexOf(current === 'revision-requested' ? 'ready-for-review' : current)
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full transition-all ${
            i < idx ? 'bg-purple-500' : i === idx ? 'bg-purple-400 ring-2 ring-purple-500/40' : 'bg-gray-100'
          }`} />
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-8 transition-all ${i < idx ? 'bg-purple-500' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: UnifiedProject; onClick: () => void }) {
  const Icon = TYPE_ICON[project.type] || Film
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/2 hover:border-gray-300 hover:bg-gray-50 transition-all overflow-hidden cursor-pointer group"
      onClick={onClick}>
      <div className="relative h-36 bg-gray-50 overflow-hidden">
        {project.deliverableThumb ? (
          <img src={project.deliverableThumb} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={36} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent" />
        <div className="absolute top-3 right-3"><StatusBadge status={project.status} /></div>
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/50 text-xs text-gray-600">
            <Icon size={11} />
            {project.type.replace(/-/g, ' ')}
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-white font-semibold text-sm mb-1 line-clamp-1">{project.title}</p>
        <p className="text-xs text-gray-500 mb-3">{project.package} &middot; {project.creatorName}</p>
        <PipelineBar current={project.status} />
        {project.revisionCount > 0 && (
          <div className="mt-3 text-xs text-gray-500">Iteration {project.revisionCount}/{project.maxIterations}</div>
        )}
        {project.status === 'ready-for-review' && (
          <div className="mt-3 flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
            <Eye size={12} /> Action required — review now
            <ChevronRight size={12} className="ml-auto" />
          </div>
        )}
        {project.status === 'revision-requested' && (
          <div className="mt-3 flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
            <AlertCircle size={12} /> Revision in progress
          </div>
        )}
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [projects, setProjects] = useState<UnifiedProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('projects').select('*, project_revisions(id)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('audio_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([{ data: projData }, { data: audioData }]) => {
      const mapped: UnifiedProject[] = []

      ;(projData ?? []).forEach((p: Record<string, unknown>) => {
        const revisions = Array.isArray(p.project_revisions) ? p.project_revisions : []
        mapped.push({
          id: p.id as string,
          title: p.title as string,
          type: p.type as string,
          package: p.package as string,
          status: p.status as ProjectStatus,
          creatorName: (p.creator_name as string) ?? 'Nia Media Team',
          deliverableThumb: p.deliverable_thumb as string | undefined,
          maxIterations: (p.max_iterations as number) ?? 3,
          revisionCount: revisions.length,
          createdAt: p.created_at as string,
          source: 'project',
        })
      })

      ;(audioData ?? []).forEach((a: Record<string, unknown>) => {
        mapped.push({
          id: a.id as string,
          title: a.title as string,
          type: a.audio_type as string,
          package: a.package as string,
          status: a.status as ProjectStatus,
          creatorName: 'Nia Audio Studio',
          maxIterations: 2,
          revisionCount: 0,
          createdAt: a.created_at as string,
          source: 'audio',
        })
      })

      mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setProjects(mapped)
      setLoading(false)
    })
  }, [user])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const actionable = projects.filter(p => p.status === 'ready-for-review')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="text-purple-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="section-tag">My Projects</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Production Pipeline</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track your concepts from queue to delivery.</p>
          </div>
          <button onClick={() => navigate('/concept-studio')} className="btn-primary text-sm px-4 py-2">
            + New Concept
          </button>
        </div>

        {actionable.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/8 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.25)' }}>
              <Eye size={18} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {actionable.length} project{actionable.length > 1 ? 's' : ''} ready for your review
              </p>
              <p className="text-purple-300 text-xs">Accept, request changes, or decline — your feedback drives the next step.</p>
            </div>
            <button onClick={() => navigate(`/projects/${actionable[0].id}/review`)}
              className="btn-primary text-xs px-4 py-2 shrink-0">
              Review Now <ChevronRight size={13} className="inline" />
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['all', ...PIPELINE] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                filter === s ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {s === 'all' ? `All (${projects.length})` : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package size={36} className="mx-auto mb-3 opacity-30" />
            {projects.length === 0
              ? <>
                  <p className="font-medium text-gray-800 mb-1">No projects yet</p>
                  <p className="text-sm mb-5">Commission your first campaign or audio order to get started.</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button onClick={() => navigate('/concept-studio')}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                      Start a Video Concept
                    </button>
                    <button onClick={() => navigate('/audio-studio')} className="btn-secondary text-sm px-5 py-2.5">
                      Order Audio
                    </button>
                  </div>
                </>
              : <p>No projects in this status.</p>
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p}
                onClick={() => p.source === 'project' ? navigate(`/projects/${p.id}/review`) : undefined} />
            ))}
          </div>
        )}

        <div className="mt-8 p-4 rounded-xl border border-gray-200 bg-white/2 text-xs text-gray-500 flex gap-3">
          <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
          <p>All delivered content is AI-generated. Zero third-party copyright. Full ownership rights transfer to your account upon acceptance and payment confirmation. A Certificate of AI Origin is auto-issued on delivery.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

