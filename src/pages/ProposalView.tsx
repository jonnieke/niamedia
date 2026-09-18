import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Loader2, CheckCircle2, XCircle, Film, Clock, Users,
  Star, AlertCircle, MessageSquare,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Logo from '../components/ui/Logo'

interface Proposal {
  id: string
  token: string
  business_name: string
  contact_name: string | null
  phone: string
  email: string | null
  industry: string | null
  video_length: string
  platforms: string[]
  what_to_promote: string | null
  delivery_speed: string
  include_poster: boolean
  include_subtitles: boolean
  final_price: number
  deposit_percent: number
  deposit_amount: number
  deliverables: string[]
  timeline_days: number
  valid_until: string | null
  status: string
  created_at: string
}

const SPEED_LABELS: Record<string, string> = {
  standard: '3–5 business days',
  '48h': '48-hour rush',
  '24h': '24-hour rush',
}

function fmt(n: number) {
  return `KES ${n.toLocaleString('en-KE')}`
}

export default function ProposalView() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [payError, setPayError] = useState('')

  const returnedFromPayment = searchParams.get('paid') === 'true'

  useEffect(() => {
    if (!token) return
    supabase.from('proposals').select('*').eq('token', token).single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Proposal not found or has expired.'); setLoading(false); return }
        setProposal(data as Proposal)
        setLoading(false)
      })
  }, [token])

  // Poll for paid status after PesaPal redirect
  useEffect(() => {
    if (!returnedFromPayment || !token) return
    const interval = setInterval(() => {
      supabase.from('proposals').select('status').eq('token', token).single()
        .then(({ data }) => {
          if (data?.status === 'paid') {
            setProposal(prev => prev ? { ...prev, status: 'paid' } : prev)
            clearInterval(interval)
          }
        })
    }, 2000)
    return () => clearInterval(interval)
  }, [returnedFromPayment, token])

  const handleAcceptAndPay = async () => {
    if (!proposal) return
    setPaying(true)
    setPayError('')
    try {
      await supabase.from('proposals')
        .update({ status: 'accepted', pesapal_order_id: `prop_${proposal.id}` })
        .eq('token', token)

      const callbackUrl = `${window.location.origin}/proposal/${token}?paid=true`
      const nameParts = (proposal.contact_name ?? proposal.business_name).split(' ')
      const { data, error: fnErr } = await supabase.functions.invoke('pesapal-checkout', {
        body: {
          orderId: `prop_${proposal.id}`,
          amountKes: proposal.deposit_amount,
          description: `Deposit for ${proposal.business_name} video commercial`,
          callbackUrl,
          email: proposal.email ?? '',
          phone: proposal.phone,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || 'Client',
        },
      })
      if (fnErr || !data?.redirectUrl) throw new Error(data?.error ?? 'Payment initiation failed')
      window.location.href = data.redirectUrl as string
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Could not initiate payment. Please try again.')
      setPaying(false)
    }
  }

  const handleDecline = async () => {
    if (!proposal) return
    setDeclining(true)
    await supabase.from('proposals').update({ status: 'declined' }).eq('token', token)
    setProposal(prev => prev ? { ...prev, status: 'declined' } : prev)
    setDeclining(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={24} className="animate-spin text-purple-500" />
    </div>
  )

  if (error || !proposal) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <AlertCircle size={40} className="text-gray-300 mb-4" />
      <p className="text-gray-600 text-sm">{error || 'Proposal not found.'}</p>
      <a href="https://wa.me/254751822556" target="_blank" rel="noopener noreferrer"
        className="mt-4 text-xs text-purple-600 hover:underline">Contact us on WhatsApp →</a>
    </div>
  )

  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date()
  const isPaid = proposal.status === 'paid'
  const isAccepted = proposal.status === 'accepted'
  const isDeclined = proposal.status === 'declined'
  const isActive = !isPaid && !isDeclined && !isExpired

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Production Proposal</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Status banners */}
        {isPaid && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Deposit Received — Production Starting Soon</p>
              <p className="text-xs text-emerald-600 mt-0.5">Thank you! Our team will reach out within 24 hours to kick off your project.</p>
            </div>
          </div>
        )}
        {isAccepted && returnedFromPayment && !isPaid && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
            <Loader2 size={18} className="text-blue-500 shrink-0 animate-spin" />
            <p className="text-sm text-blue-700">Confirming your payment — this may take a moment...</p>
          </div>
        )}
        {isDeclined && (
          <div className="mb-6 p-4 rounded-xl bg-gray-100 border border-gray-200 flex items-center gap-3">
            <XCircle size={18} className="text-gray-400 shrink-0" />
            <p className="text-sm text-gray-600">You declined this proposal. Chat with us if you'd like to revisit.</p>
          </div>
        )}
        {isExpired && !isPaid && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <Clock size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">This proposal has expired. Contact us to get a fresh quote.</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Heading */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#7c3aed' }}>
                Video Commercial Proposal
              </p>
              <h1 className="text-2xl font-extrabold text-gray-900">{proposal.business_name}</h1>
              {proposal.contact_name && (
                <p className="text-sm text-gray-500 mt-0.5">Prepared for {proposal.contact_name}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                <span>Prepared: {new Date(proposal.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {proposal.valid_until && (
                  <span>Valid until: {new Date(proposal.valid_until).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
              </div>
            </div>

            {/* Video Spec */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Film size={15} style={{ color: '#7c3aed' }} /> Video Specifications
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Video Length', value: proposal.video_length },
                  { label: 'Delivery Speed', value: SPEED_LABELS[proposal.delivery_speed] ?? proposal.delivery_speed },
                  { label: 'Platforms', value: proposal.platforms.join(', ') || '—' },
                  {
                    label: 'Extras',
                    value: [
                      proposal.include_poster && 'Promo Poster',
                      proposal.include_subtitles && 'Subtitles / Captions',
                    ].filter(Boolean).join(', ') || 'None',
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              {proposal.what_to_promote && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">What to Promote</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{proposal.what_to_promote}</p>
                </div>
              )}
            </div>

            {/* Deliverables */}
            {proposal.deliverables.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Star size={15} style={{ color: '#7c3aed' }} /> What You Get
                </h2>
                <ul className="space-y-2.5">
                  {proposal.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Clock size={15} style={{ color: '#7c3aed' }} /> Timeline
              </h2>
              <p className="text-sm text-gray-700">
                Estimated delivery in{' '}
                <span className="font-bold text-gray-900">{proposal.timeline_days} business days</span>{' '}
                after deposit is received.
              </p>
            </div>

            {/* Contact footer */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <MessageSquare size={15} style={{ color: '#7c3aed' }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Questions?</p>
                  <p className="text-xs text-gray-500">Chat with our team on WhatsApp</p>
                </div>
              </div>
              <a href={`https://wa.me/254751822556?text=${encodeURIComponent(`Hi, I have a question about the proposal for ${proposal.business_name}.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all"
                style={{ background: '#25d366' }}>
                WhatsApp Us
              </a>
            </div>
          </div>

          {/* Sticky price panel */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl p-5 text-white sticky top-6" style={{ background: '#111827' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#6b7280' }}>Price Summary</p>

              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>Video Commercial ({proposal.video_length})</span>
                  <span className="font-semibold text-white">{fmt(proposal.final_price)}</span>
                </div>
                {proposal.include_poster && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#9ca3af' }}>Promo Poster</span>
                    <span className="font-semibold text-emerald-400">Included</span>
                  </div>
                )}
                {proposal.include_subtitles && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#9ca3af' }}>Subtitles</span>
                    <span className="font-semibold text-emerald-400">Included</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm" style={{ color: '#d1d5db' }}>Total</span>
                  <span className="text-xl font-extrabold text-white">{fmt(proposal.final_price)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-2.5">
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{proposal.deposit_percent}% Initial Deposit (to start)</span>
                  <span className="text-base font-bold text-purple-300">{fmt(proposal.deposit_amount)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-1.5">
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{100 - proposal.deposit_percent}% Milestone Balance</span>
                  <span className="text-sm font-semibold text-gray-300">{fmt(proposal.final_price - proposal.deposit_amount)}</span>
                </div>
                <p className="text-[11px] mt-2 leading-relaxed text-gray-400">
                  Balance is due only after you review and approve your watermarked preview cut.
                </p>
              </div>

              {isActive && (
                <>
                  {payError && <p className="text-xs text-red-400 mb-3">{payError}</p>}
                  <button
                    onClick={handleAcceptAndPay}
                    disabled={paying}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all mb-2.5 flex items-center justify-center gap-2"
                    style={{ background: paying ? '#374151' : '#7c3aed', color: '#ffffff' }}>
                    {paying
                      ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                      : `Accept & Pay ${fmt(proposal.deposit_amount)}`
                    }
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={declining}
                    className="w-full py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {declining ? 'Declining...' : 'Decline Proposal'}
                  </button>
                </>
              )}

              {isPaid && (
                <div className="py-3 rounded-xl text-center"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-sm font-bold text-emerald-300">Deposit Paid</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6ee7b7' }}>Production starts within 24 hrs</p>
                </div>
              )}

              {isDeclined && (
                <div className="text-center py-2">
                  <a href={`https://wa.me/254751822556?text=${encodeURIComponent('Hi, I reconsidered — I\'d like to discuss the proposal further.')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs underline" style={{ color: '#a78bfa' }}>
                    Changed your mind? Chat with us →
                  </a>
                </div>
              )}

              <div className="mt-5 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Users size={12} style={{ color: '#6b7280' }} />
                <span className="text-[11px]" style={{ color: '#6b7280' }}>WhatsApp: 0751 822 556</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
