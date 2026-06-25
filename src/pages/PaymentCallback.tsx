import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Status = 'loading' | 'paid' | 'failed' | 'timeout'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [orderTitle, setOrderTitle] = useState<string>('')

  const orderId = searchParams.get('OrderMerchantReference')
  const trackingId = searchParams.get('OrderTrackingId')

  useEffect(() => {
    if (!orderId && !trackingId) { setStatus('failed'); return }

    let attempts = 0
    const MAX_ATTEMPTS = 10

    const check = async () => {
      attempts++
      const query = orderId
        ? supabase.from('audio_orders').select('payment_status, title').eq('id', orderId).single()
        : supabase.from('audio_orders').select('payment_status, title').eq('order_tracking_id', trackingId!).single()

      const { data } = await query
      if (data) {
        setOrderTitle(data.title ?? '')
        if (data.payment_status === 'paid') { setStatus('paid'); return }
        if (data.payment_status === 'failed' || data.payment_status === 'reversed') { setStatus('failed'); return }
      }
      if (attempts >= MAX_ATTEMPTS) { setStatus('timeout'); return }
      setTimeout(check, 3000)
    }

    void check()
  }, [orderId, trackingId])

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(139,92,246,0.15) 0%, transparent 60%), #0a0a0f' }}>
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="mb-10">
          <span className="text-2xl font-bold tracking-tight text-white">nia<span style={{ color: '#8b5cf6' }}>media</span></span>
        </div>

        {status === 'loading' && (
          <div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Loader2 size={32} className="text-purple-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirming your payment...</h2>
            <p className="text-gray-500 text-sm">This usually takes a few seconds. Please don't close this tab.</p>
          </div>
        )}

        {status === 'paid' && (
          <div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
            {orderTitle && <p className="text-purple-300 font-medium mb-3">{orderTitle}</p>}
            <p className="text-gray-500 text-sm mb-2">
              Your brief is now in the production queue. A Nia Media creative will begin work shortly.
            </p>
            <p className="text-gray-500 text-xs mb-8">You'll receive an email notification when your audio is ready for review.</p>
            <div className="flex flex-col gap-3">
              <Link to="/projects"
                className="btn-primary w-full py-3 text-sm"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'block', borderRadius: '12px', textAlign: 'center', color: 'white', fontWeight: 600 }}>
                View My Projects
              </Link>
              <Link to="/audio-studio"
                className="text-sm text-gray-500 hover:text-white transition-colors">
                Order another audio →
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <XCircle size={36} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Completed</h2>
            <p className="text-gray-500 text-sm mb-8">
              Your payment didn't go through. No charges have been made. Please try again or contact support.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/audio-studio"
                className="text-sm font-semibold"
                style={{ color: '#8b5cf6' }}>
                ← Back to Audio Studio
              </Link>
              {import.meta.env.VITE_WHATSAPP_NUMBER && (
                <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}?text=Hi, I had a payment issue for my audio order.`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-white transition-colors">
                  Contact support via WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {status === 'timeout' && (
          <div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <AlertCircle size={36} className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Still Confirming...</h2>
            <p className="text-gray-500 text-sm mb-4">
              Payment confirmation is taking longer than usual. If you completed the payment, your order will be processed automatically.
            </p>
            <p className="text-gray-500 text-xs mb-8">
              Check your <strong className="text-gray-500">Projects</strong> page in a few minutes, or contact support with your tracking ID:
              {trackingId && <span className="block mt-1 font-mono text-purple-400 text-xs">{trackingId}</span>}
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/projects"
                style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: 600 }}>
                Check My Projects →
              </Link>
              <Link to="/audio-studio"
                className="text-sm text-gray-500 hover:text-gray-600 transition-colors">
                ← Back to Audio Studio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

