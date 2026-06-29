import { useEffect, useState, FormEvent } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Sparkles, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SectionFeedback { comment: string; flag: 'ok' | 'change' | '' }

interface ReviewData {
  reviewId: string
  reviewToken: string
  currentStatus: string
  existingFeedback: {
    reviewerName: string
    overallComment: string
    sectionFeedback: Record<string, SectionFeedback>
  }
  campaign: {
    title: string
    businessName: string
    industry: string
    content: Record<string, unknown> | null
  }
}

const SECTIONS = [
  { key: 'strategy', label: 'Campaign Strategy', path: (c: Record<string, unknown>) => `Angle: ${(c.strategy as Record<string,string>)?.angle}\n\nKey Message: ${(c.strategy as Record<string,string>)?.keyMessage}\n\nPain Point: ${(c.strategy as Record<string,string>)?.painPoint}` },
  { key: 'whatsapp', label: 'WhatsApp Copy', path: (c: Record<string, unknown>) => `BROADCAST:\n${(c.whatsapp as Record<string,string>)?.broadcast}\n\nSTATUS:\n${(c.whatsapp as Record<string,string>)?.status}\n\nREPLY:\n${(c.whatsapp as Record<string,string>)?.reply}` },
  { key: 'captions', label: 'Social Media Captions', path: (c: Record<string, unknown>) => `FACEBOOK:\n${(c.captions as Record<string,string>)?.facebook}\n\nINSTAGRAM:\n${(c.captions as Record<string,string>)?.instagram}\n\nTIKTOK:\n${(c.captions as Record<string,string>)?.tiktok}` },
  { key: 'posterCopy', label: 'Poster Copy', path: (c: Record<string, unknown>) => `HEADLINE: ${(c.posterCopy as Record<string,string>)?.headline}\nSUBHEADLINE: ${(c.posterCopy as Record<string,string>)?.subheadline}\nOFFER: ${(c.posterCopy as Record<string,string>)?.offerText}\nCTA: ${(c.posterCopy as Record<string,string>)?.cta}` },
  { key: 'videoScript', label: 'Video Script', path: (c: Record<string, unknown>) => `HOOK: ${(c.videoScript as Record<string,string>)?.hook}\n\nSCENE 1: ${(c.videoScript as Record<string,string>)?.scene1}\n\nSCENE 2: ${(c.videoScript as Record<string,string>)?.scene2}\n\nSCENE 3: ${(c.videoScript as Record<string,string>)?.scene3}\n\nCTA: ${(c.videoScript as Record<string,string>)?.callToAction}` },
]

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expanded, setExpanded] = useState<string | null>('strategy')

  // Reviewer form
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [overallComment, setOverallComment] = useState('')
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, SectionFeedback>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'approved' | 'changes_requested' | null>(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    supabase.functions.invoke('get-campaign-review', { body: { token } })
      .then(({ data: res, error }) => {
        if (error || !res || res.error) { setNotFound(true) }
        else {
          setData(res as ReviewData)
          if (res.currentStatus !== 'pending') {
            setAlreadyReviewed(true)
            setSubmitStatus(res.currentStatus as 'approved' | 'changes_requested')
            setReviewerName(res.existingFeedback.reviewerName)
            setOverallComment(res.existingFeedback.overallComment)
            setSectionFeedback(res.existingFeedback.sectionFeedback ?? {})
          }
        }
        setLoading(false)
      })
  }, [token])

  const setSectionFlag = (key: string, flag: 'ok' | 'change' | '') =>
    setSectionFeedback(prev => ({ ...prev, [key]: { ...prev[key], flag, comment: prev[key]?.comment ?? '' } }))

  const setSectionComment = (key: string, comment: string) =>
    setSectionFeedback(prev => ({ ...prev, [key]: { ...prev[key], comment, flag: prev[key]?.flag ?? '' } }))

  const submit = async (status: 'approved' | 'changes_requested') => {
    if (!token) return
    setSubmitting(true)
    const { data: res } = await supabase.functions.invoke('submit-review', {
      body: { token, reviewerName, reviewerEmail, status, overallComment, sectionFeedback },
    })
    setSubmitting(false)
    if (res?.success) { setSubmitted(true); setSubmitStatus(status) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <Loader2 size={24} className="animate-spin text-purple-500" />
    </div>
  )

  if (notFound || !data) return <Navigate to="/" replace />

  const { campaign } = data
  const c = campaign.content ?? {}
  const initial = campaign.businessName.charAt(0).toUpperCase() || 'N'

  if (submitted || alreadyReviewed) {
    const approved = submitStatus === 'approved'
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f8fafc' }}>
        <div className="max-w-sm w-full text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${approved ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            {approved ? <CheckCircle size={32} className="text-emerald-500" /> : <AlertCircle size={32} className="text-amber-500" />}
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">
            {approved ? 'Campaign approved!' : 'Changes requested'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {approved
              ? `${campaign.businessName} has been notified. This campaign is ready to publish.`
              : `${campaign.businessName} has been notified and will review your feedback.`}
          </p>
          {alreadyReviewed && overallComment && (
            <div className="mt-6 p-4 rounded-xl bg-white border border-gray-100 text-left">
              <p className="text-xs text-gray-400 mb-1">Your comment</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{overallComment}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-6">Powered by <span className="font-semibold text-gray-500">Nia Media</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            {initial}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">{campaign.businessName}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Campaign review — {campaign.title}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
            style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
            <Sparkles size={10} /> Awaiting review
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-4">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{campaign.title}</h1>
          <p className="text-sm text-gray-500">{campaign.industry} · Please review each section and leave feedback where needed.</p>
        </div>

        {/* Sections */}
        {SECTIONS.map(section => {
          const text = section.path(c)
          const fb = sectionFeedback[section.key]
          const isOpen = expanded === section.key
          return (
            <div key={section.key} className="bg-white rounded-2xl border overflow-hidden shadow-sm"
              style={{ borderColor: fb?.flag === 'ok' ? '#d1fae5' : fb?.flag === 'change' ? '#fde68a' : '#f3f4f6' }}>
              <button onClick={() => setExpanded(isOpen ? null : section.key)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                  {fb?.flag === 'ok' && <CheckCircle size={15} className="text-emerald-500 shrink-0" />}
                  {fb?.flag === 'change' && <AlertCircle size={15} className="text-amber-500 shrink-0" />}
                  {!fb?.flag && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0" />}
                  <span className="text-sm font-semibold text-gray-800">{section.label}</span>
                </div>
                {isOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <pre className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-sans mt-4 mb-4">{text}</pre>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setSectionFlag(section.key, fb?.flag === 'ok' ? '' : 'ok')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: fb?.flag === 'ok' ? '#d1fae5' : '#f9fafb',
                        color: fb?.flag === 'ok' ? '#065f46' : '#6b7280',
                        border: `1px solid ${fb?.flag === 'ok' ? '#6ee7b7' : '#e5e7eb'}`,
                      }}>
                      <CheckCircle size={11} /> Looks good
                    </button>
                    <button onClick={() => setSectionFlag(section.key, fb?.flag === 'change' ? '' : 'change')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: fb?.flag === 'change' ? '#fef3c7' : '#f9fafb',
                        color: fb?.flag === 'change' ? '#92400e' : '#6b7280',
                        border: `1px solid ${fb?.flag === 'change' ? '#fcd34d' : '#e5e7eb'}`,
                      }}>
                      <AlertCircle size={11} /> Needs change
                    </button>
                  </div>
                  {fb?.flag === 'change' && (
                    <textarea
                      placeholder="What needs to change? Be specific…"
                      value={fb?.comment ?? ''}
                      onChange={e => setSectionComment(section.key, e.target.value)}
                      rows={3}
                      className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-amber-400 resize-none bg-amber-50/40"
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Reviewer info + overall comment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={15} className="text-purple-500" />
            <span className="text-sm font-bold text-gray-800">Your details &amp; overall comment</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Your name" value={reviewerName} onChange={e => setReviewerName(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 transition-colors" />
            <input type="email" placeholder="Your email (optional)" value={reviewerEmail} onChange={e => setReviewerEmail(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 transition-colors" />
          </div>
          <textarea placeholder="Overall comment for the team…" value={overallComment} onChange={e => setOverallComment(e.target.value)}
            rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none transition-colors" />
        </div>

        {/* Submit buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => submit('changes_requested')} disabled={submitting || !reviewerName.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
            Request changes
          </button>
          <button onClick={() => submit('approved')} disabled={submitting || !reviewerName.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Approve campaign
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 pb-6">Your name is required so {campaign.businessName} knows who reviewed.</p>
      </main>
    </div>
  )
}
