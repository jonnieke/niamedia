import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Film, CheckCircle, Download, Star, Loader2, Clock, AlertCircle, CreditCard, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Project {
  id: string
  token: string
  business_name: string
  contact_name: string | null
  video_length: string | null
  platforms: string[]
  status: string
  deliverable_url: string | null
  deliverable_label: string | null
  thumbnail_url: string | null
  final_price: number | null
  deposit_paid: number | null
  balance_due: number | null
  balance_paid_at: string | null
  delivered_at: string | null
  completed_at: string | null
}

export default function DeliveryView() {
  const { token } = useParams<{ token: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [thanking, setThanking] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  useEffect(() => {
    if (!token) return
    supabase.from('projects').select('*').eq('token', token).single()
      .then(({ data }) => { setProject(data as Project); setLoading(false) })
  }, [token])

  async function payBalance() {
    if (!project) return
    setPaying(true)
    setPayError('')
    try {
      const { data, error } = await supabase.functions.invoke('pesapal-checkout', {
        body: {
          amount: project.balance_due,
          description: `Final payment — ${project.business_name}`,
          orderId: `proj_${project.id}`,
          customerName: project.contact_name ?? project.business_name,
          currency: 'KES',
        },
      })
      if (error || !data?.redirect_url) throw new Error(error?.message ?? 'No redirect URL')
      window.location.href = data.redirect_url
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setPaying(false)
    }
  }

  async function markComplete() {
    if (!project) return
    setThanking(true)
    await supabase.from('projects').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', project.id)
    setProject(p => p ? { ...p, status: 'completed', completed_at: new Date().toISOString() } : p)
    setThanking(false)
  }

  async function submitReview() {
    if (!project || rating === 0 || !reviewText.trim()) return
    setReviewSubmitting(true)
    await supabase.from('testimonials').insert({
      project_id: project.id,
      business_name: project.business_name,
      contact_name: project.contact_name,
      video_length: project.video_length,
      rating,
      body: reviewText.trim(),
    })
    supabase.rpc('notify_admins', {
      p_type: 'success',
      p_title: `New ${rating}-star review — ${project.business_name}`,
      p_body: reviewText.trim().substring(0, 120),
      p_action_url: '/admin',
    })
    setReviewSubmitting(false)
    setReviewDone(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  )

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
      <div className="text-center text-white">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="font-semibold">Delivery page not found</p>
        <p className="text-sm text-gray-400 mt-1">This link may have expired or been removed.</p>
      </div>
    </div>
  )

  const balanceDue = project.balance_due ?? 0
  const balancePaid = Boolean(project.balance_paid_at)
  const isDelivered = ['delivered', 'completed'].includes(project.status)
  const isCompleted = project.status === 'completed'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Film size={14} className="text-white" />
          </div>
          <span className="text-sm font-extrabold text-white">Nia Media</span>
        </div>
        <span className="text-xs text-gray-400">Delivery Portal</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Status banner */}
        {isCompleted ? (
          <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 mb-8">
            <CheckCircle size={20} className="text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-300">Project completed!</p>
              <p className="text-xs text-green-400/80 mt-0.5">Thank you for choosing Nia Media. We hope you love the final cut.</p>
            </div>
          </div>
        ) : isDelivered ? (
          <div className="flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-4 mb-8">
            <CheckCircle size={20} className="text-purple-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-purple-300">Your video is ready!</p>
              <p className="text-xs text-purple-400/80 mt-0.5">Review and download below. If everything looks great, mark it complete.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 mb-8">
            <Clock size={20} className="text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-yellow-300">Your video is being produced</p>
              <p className="text-xs text-yellow-400/80 mt-0.5">You will receive an email when it is ready for review.</p>
            </div>
          </div>
        )}

        {/* Project info */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 mb-6">
          <h1 className="text-2xl font-extrabold text-white mb-1">{project.business_name}</h1>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            {project.video_length && <span>· {project.video_length}</span>}
            {project.platforms?.map(p => <span key={p} className="px-2 py-0.5 rounded-md bg-white/10 text-gray-300">{p}</span>)}
          </div>
        </div>

        {/* Deliverable */}
        {isDelivered && project.deliverable_url && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">Your deliverable</p>

            {/* Thumbnail / preview */}
            {project.thumbnail_url ? (
              <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-black">
                <img src={project.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 flex items-center justify-center mb-4">
                <Film size={40} className="text-white/20" />
              </div>
            )}

            <p className="text-base font-bold text-white mb-4">{project.deliverable_label ?? 'Final video'}</p>

            <a href={project.deliverable_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Download size={16} /> Download / View Video
            </a>
          </div>
        )}

        {/* Payment section */}
        {isDelivered && balanceDue > 0 && !balancePaid && (
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 backdrop-blur p-6 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">Balance payment</p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-300">Final balance due</p>
                {project.final_price && project.deposit_paid && (
                  <p className="text-xs text-gray-500 mt-0.5">KES {project.final_price.toLocaleString()} total · KES {project.deposit_paid.toLocaleString()} deposit paid</p>
                )}
              </div>
              <p className="text-2xl font-extrabold text-white">KES {balanceDue.toLocaleString()}</p>
            </div>
            {payError && <p className="text-xs text-red-400 mb-3">{payError}</p>}
            <button onClick={payBalance} disabled={paying}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              {paying ? <><Loader2 size={15} className="animate-spin" /> Redirecting to payment...</> : <><CreditCard size={15} /> Pay Balance Now</>}
            </button>
          </div>
        )}

        {balancePaid && (
          <div className="rounded-3xl border border-green-500/30 bg-green-500/10 backdrop-blur p-5 mb-6 flex items-center gap-3">
            <CheckCircle size={18} className="text-green-400 shrink-0" />
            <p className="text-sm font-semibold text-green-300">Final payment received. Thank you!</p>
          </div>
        )}

        {/* Mark complete */}
        {isDelivered && !isCompleted && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 text-center">
            <Star size={24} className="text-amber-400 mx-auto mb-3" />
            <p className="text-base font-bold text-white mb-1">Happy with the video?</p>
            <p className="text-sm text-gray-400 mb-4">Let us know it hits the mark and we will close out the project.</p>
            <button onClick={markComplete} disabled={thanking}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
              {thanking ? <><Loader2 size={14} className="animate-spin inline mr-2" />Saving...</> : 'Yes, mark as complete!'}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Need a revision?{' '}
              <a href="https://wa.me/254751822556" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                Message us on WhatsApp
              </a>
            </p>
          </div>
        )}

        {/* Testimonial form — shown after completion */}
        {isCompleted && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
            {reviewDone ? (
              <div className="text-center py-4">
                <CheckCircle size={28} className="text-green-400 mx-auto mb-3" />
                <p className="text-base font-bold text-white">Thank you for your review!</p>
                <p className="text-sm text-gray-400 mt-1">We really appreciate your feedback.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">Leave a review</p>
                <p className="text-sm text-gray-300 mb-4">How would you rate your experience with Nia Media?</p>

                {/* Star rating */}
                <div className="flex gap-2 mb-5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110">
                      <Star size={28}
                        fill={(hoverRating || rating) >= n ? '#f59e0b' : 'none'}
                        stroke={(hoverRating || rating) >= n ? '#f59e0b' : 'rgba(255,255,255,0.3)'}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-amber-400 font-semibold self-center">
                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
                    </span>
                  )}
                </div>

                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  rows={3}
                  placeholder="Tell us about your experience — what did you love? How has the video been performing?"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />

                <button
                  onClick={submitReview}
                  disabled={reviewSubmitting || rating === 0 || !reviewText.trim()}
                  className="mt-3 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  {reviewSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Submit Review
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-10">
          © {new Date().getFullYear()} Nia Media · hello@niamedia.co.ke · +254 751 822 556
        </p>
      </div>
    </div>
  )
}
