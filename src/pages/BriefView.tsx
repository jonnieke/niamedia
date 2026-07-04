import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Loader2, CheckCircle2, RefreshCw, Film, Music, Eye,
  Mic, Palette, AlertCircle, MessageSquare, Clock,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from '../components/ui/Logo'

interface ShotItem {
  scene: number
  duration: string
  visual: string
  audio: string
}

interface VideoBrief {
  id: string
  token: string
  created_at: string
  business_name: string
  video_length: string
  platforms: string[]
  what_to_promote: string | null
  script: string | null
  shot_list: ShotItem[]
  music_mood: string | null
  voiceover_notes: string | null
  visual_style: string | null
  status: string
  client_feedback: string | null
  approved_at: string | null
}

export default function BriefView() {
  const { token } = useParams<{ token: string }>()
  const [brief, setBrief] = useState<VideoBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) return
    const load = () =>
      supabase.from('video_briefs').select('*').eq('token', token).single()
        .then(({ data, error: err }) => {
          if (err || !data) { setError('Brief not found.'); setLoading(false); return }
          setBrief(data as VideoBrief)
          setLoading(false)
        })
    load()

    // Poll while generating
    const interval = setInterval(async () => {
      const { data } = await supabase.from('video_briefs').select('*').eq('token', token).single()
      if (data && data.status !== 'generating') {
        setBrief(data as VideoBrief)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [token])

  const respond = async (action: 'approved' | 'revision_requested') => {
    if (!brief) return
    if (action === 'revision_requested' && !feedback.trim()) return
    setSubmitting(true)
    await supabase.from('video_briefs').update({
      status: action,
      client_feedback: feedback.trim() || null,
      ...(action === 'approved' ? { approved_at: new Date().toISOString() } : {}),
    }).eq('token', token)
    setBrief(prev => prev ? {
      ...prev,
      status: action,
      client_feedback: feedback.trim() || null,
      approved_at: action === 'approved' ? new Date().toISOString() : prev.approved_at,
    } : prev)
    // Notify admin via in-app notification + email
    supabase.rpc('notify_admins', {
      p_type: action === 'approved' ? 'success' : 'warning',
      p_title: action === 'approved'
        ? `Brief approved — ${brief.business_name}`
        : `Revision requested — ${brief.business_name}`,
      p_body: action === 'approved'
        ? `${brief.video_length} brief approved. Production can start immediately.`
        : `Client requested changes: ${feedback.trim() || 'No details provided.'}`,
      p_action_url: `/brief/${token}`,
    })
    supabase.functions.invoke('send-client-email', {
      body: {
        type: action === 'approved' ? 'brief_approved_admin' : 'revision_requested_admin',
        to: 'hello@niamedia.co.ke',
        businessName: brief.business_name,
        videoLength: brief.video_length,
        clientFeedback: feedback.trim() || null,
        briefToken: token,
      },
    })
    setDone(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={24} className="animate-spin text-purple-500" />
    </div>
  )

  if (error || !brief) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <AlertCircle size={40} className="text-gray-300 mb-4" />
      <p className="text-sm text-gray-500">{error || 'Brief not found.'}</p>
    </div>
  )

  const isGenerating = brief.status === 'generating'
  const isReady = brief.status === 'ready'
  const isApproved = brief.status === 'approved'
  const isRevision = brief.status === 'revision_requested'

  const shotList: ShotItem[] = Array.isArray(brief.shot_list) ? brief.shot_list : []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Production Brief</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Header card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#7c3aed' }}>
            Video Commercial Production Brief
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900">{brief.business_name}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
            <span>{brief.video_length} video</span>
            {brief.platforms.length > 0 && <span>{brief.platforms.join(' · ')}</span>}
            <span>Created {new Date(brief.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          {/* Status badges */}
          {isApproved && (
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 size={16} />
              Brief approved — production is underway!
            </div>
          )}
          {isRevision && (
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-600">
              <RefreshCw size={15} />
              Revision requested — our team will update this brief shortly.
            </div>
          )}
        </div>

        {/* Generating state */}
        {isGenerating && (
          <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
            <Loader2 size={28} className="animate-spin mx-auto mb-4" style={{ color: '#7c3aed' }} />
            <p className="text-sm font-semibold text-gray-700">Generating your production brief...</p>
            <p className="text-xs text-gray-400 mt-1">This usually takes about 10 seconds.</p>
          </div>
        )}

        {!isGenerating && brief.script && (
          <>
            {/* Script */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Film size={15} style={{ color: '#7c3aed' }} /> Video Script
              </h2>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                {brief.script}
              </pre>
            </div>

            {/* Shot list */}
            {shotList.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Eye size={15} style={{ color: '#7c3aed' }} /> Shot List
                </h2>
                <div className="space-y-3">
                  {shotList.map((shot, i) => (
                    <div key={i} className="flex gap-4 p-3.5 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                      <div className="shrink-0 text-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: '#7c3aed' }}>
                          {shot.scene}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{shot.duration}</p>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Visual</p>
                        <p className="text-sm text-gray-800">{shot.visual}</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">Audio</p>
                        <p className="text-sm text-gray-600">{shot.audio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Style cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              {brief.music_mood && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Music size={14} style={{ color: '#7c3aed' }} />
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Music</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{brief.music_mood}</p>
                </div>
              )}
              {brief.voiceover_notes && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic size={14} style={{ color: '#7c3aed' }} />
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Voiceover</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{brief.voiceover_notes}</p>
                </div>
              )}
              {brief.visual_style && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={14} style={{ color: '#7c3aed' }} />
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Visual Style</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{brief.visual_style}</p>
                </div>
              )}
            </div>

            {/* Approval */}
            {isReady && !done && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-sm font-bold text-gray-700 mb-1">Review this brief</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Read through the script and shot list above. If everything looks good, approve to start production. If you'd like changes, describe them below.
                </p>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-purple-400 mb-4"
                  rows={3}
                  placeholder="Optional feedback or changes you'd like (only needed if requesting a revision)..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => respond('approved')}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                    style={{ background: submitting ? '#9ca3af' : '#059669' }}>
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve — Start Production
                  </button>
                  <button
                    onClick={() => respond('revision_requested')}
                    disabled={submitting || !feedback.trim()}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'transparent',
                      border: '1px solid #d1d5db',
                      color: feedback.trim() ? '#374151' : '#9ca3af',
                    }}>
                    <RefreshCw size={13} />
                    Request Changes
                  </button>
                </div>
              </div>
            )}

            {done && isApproved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-emerald-800">Brief approved! Production begins within 24 hours.</p>
                <p className="text-xs text-emerald-600 mt-1">Our team will keep you updated via WhatsApp.</p>
              </div>
            )}

            {done && isRevision && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                <Clock size={24} className="text-amber-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-amber-800">Revision request received!</p>
                <p className="text-xs text-amber-600 mt-1">We'll update this brief and notify you within 4 hours.</p>
              </div>
            )}

            {/* Prior feedback */}
            {isRevision && brief.client_feedback && !done && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-1">Your feedback</p>
                <p className="text-sm text-amber-800">{brief.client_feedback}</p>
                <p className="text-xs text-amber-600 mt-2">Our team is reviewing this. Check back soon.</p>
              </div>
            )}
          </>
        )}

        {/* Footer contact */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <MessageSquare size={15} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Questions about the brief?</p>
              <p className="text-xs text-gray-500">Our team is on WhatsApp</p>
            </div>
          </div>
          <a href={`https://wa.me/254751822556?text=${encodeURIComponent(`Hi, I have a question about the production brief for ${brief.business_name}.`)}`}
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: '#25d366' }}>
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  )
}
