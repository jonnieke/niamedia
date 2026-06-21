import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type VideoRequestStatus = 'new' | 'in-production' | 'delivered' | 'cancelled'

interface VideoRequest {
  id: string
  title: string
  business_name: string
  industry: string
  budget_range: string
  delivery_speed: string
  status: VideoRequestStatus
  created_at: string
  length?: string
  format?: string
  platform?: string
  notes?: string
}

const STATUS_CONFIG: Record<VideoRequestStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  'new':           { label: 'Submitted',     color: '#2563eb', bg: '#eff6ff', Icon: Clock },
  'in-production': { label: 'In Production', color: '#d97706', bg: '#fffbeb', Icon: Film },
  'delivered':     { label: 'Delivered',     color: '#059669', bg: '#ecfdf5', Icon: CheckCircle2 },
  'cancelled':     { label: 'Cancelled',     color: '#dc2626', bg: '#fef2f2', Icon: XCircle },
}

const DELIVERY_LABELS: Record<string, string> = {
  'standard': '3-5 business days',
  '48h': '48-hour rush',
  '24h': '24-hour rush',
}

const TIMELINE_STEPS: VideoRequestStatus[] = ['new', 'in-production', 'delivered']

function StatusBadge({ status }: { status: VideoRequestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['new']
  const { Icon } = cfg
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function RequestRow({ req }: { req: VideoRequest }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(req.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

  const stepIndex = TIMELINE_STEPS.indexOf(req.status)
  const isCancelled = req.status === 'cancelled'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{req.title || req.business_name}</span>
            <StatusBadge status={req.status} />
          </div>
          <p className="text-xs text-gray-400">{req.business_name} &middot; {req.industry} &middot; {date}</p>
        </div>
        {expanded
          ? <ChevronUp size={15} className="text-gray-400 shrink-0" />
          : <ChevronDown size={15} className="text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Budget',   value: req.budget_range || 'TBC' },
              { label: 'Delivery', value: DELIVERY_LABELS[req.delivery_speed] || req.delivery_speed },
              { label: 'Length',   value: req.length || '-' },
              { label: 'Format',   value: req.format || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xs font-medium text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {req.notes && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-gray-700 leading-relaxed">{req.notes}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Progress</p>
            {isCancelled ? (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <XCircle size={13} /> This request was cancelled. Contact us to re-open.
              </p>
            ) : (
              <div className="flex items-center">
                {TIMELINE_STEPS.map((step, i) => {
                  const cfg = STATUS_CONFIG[step]
                  const isDone = stepIndex >= i
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all"
                          style={{
                            borderColor: isDone ? cfg.color : '#e5e7eb',
                            background: isDone ? cfg.bg : '#f9fafb',
                            color: isDone ? cfg.color : '#9ca3af',
                          }}>
                          {i + 1}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-center leading-tight">{cfg.label}</p>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className="h-0.5 flex-1 mb-4 mx-1"
                          style={{ background: stepIndex > i ? '#bbf7d0' : '#e5e7eb' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyVideoRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<VideoRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('video_requests')
      .select('id, title, business_name, industry, budget_range, delivery_speed, status, created_at, length, format, platform, notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRequests((data ?? []) as VideoRequest[])
        setLoading(false)
      })
  }, [user?.id])

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Film size={18} className="text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">My Video Requests</h1>
          </div>
          <p className="text-sm text-gray-500">Track the status of your video production requests.</p>
        </div>
        <button
          onClick={() => navigate('/request-video')}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          + New Request
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))' }}>
            <Film size={28} className="text-purple-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No video requests yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">Submit your first video production request and track its progress here.</p>
          <button
            onClick={() => navigate('/request-video')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            Request a Video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => <RequestRow key={req.id} req={req} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
