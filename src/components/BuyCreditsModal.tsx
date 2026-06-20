import { useState } from 'react'
import { X, Zap, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const PACKAGES = [
  { id: '1',  credits: 1,  price: 500,  label: 'Starter', perCredit: 500, highlight: false, badge: null },
  { id: '5',  credits: 5,  price: 2000, label: 'Growth',  perCredit: 400, highlight: true,  badge: 'Save KES 500' },
  { id: '12', credits: 12, price: 4000, label: 'Pro',     perCredit: 333, highlight: false, badge: 'Best value' },
]

interface Props {
  onClose: () => void
}

export default function BuyCreditsModal({ onClose }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const buy = async (pkg: typeof PACKAGES[0]) => {
    if (!user || loading) return
    setLoading(pkg.id)
    setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('buy-credits', {
        body: {
          pkg: pkg.id,
          callbackUrl: `${window.location.origin}/dashboard?credits=added`,
          email: user.email,
          firstName: user.name?.split(' ')[0] ?? '',
          lastName: user.name?.split(' ')[1] ?? '',
        },
      })
      if (fnError || !data?.redirectUrl) throw new Error(fnError?.message ?? 'Checkout failed')
      window.location.href = data.redirectUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#ede9fe' }}>
              <Zap size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Buy Campaign Credits</p>
              <p className="text-xs text-gray-500">Each credit = one full campaign across 6 formats + unlimited tweaks</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Packages */}
        <div className="p-6 space-y-3">
          {PACKAGES.map(pkg => (
            <button key={pkg.id} onClick={() => buy(pkg)} disabled={!!loading}
              className={`w-full text-left rounded-xl border p-4 transition-all relative overflow-hidden disabled:opacity-60 ${
                pkg.highlight
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}>

              {pkg.badge && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: pkg.highlight ? '#ede9fe' : '#d1fae5',
                    color: pkg.highlight ? '#7c3aed' : '#065f46',
                    border: `1px solid ${pkg.highlight ? '#c4b5fd' : '#6ee7b7'}`,
                  }}>
                  {pkg.badge}
                </span>
              )}

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-black"
                  style={{
                    background: pkg.highlight ? '#7c3aed' : '#f3f4f6',
                    color: pkg.highlight ? '#ffffff' : '#374151',
                  }}>
                  {pkg.credits}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{pkg.label} — {pkg.credits} credit{pkg.credits !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-500 mt-0.5">KES {pkg.perCredit.toLocaleString()} per campaign</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-gray-900">KES {pkg.price.toLocaleString()}</p>
                  {loading === pkg.id
                    ? <Loader2 size={14} className="animate-spin text-purple-500 ml-auto mt-1" />
                    : <p className="text-[10px] text-gray-400 mt-0.5">M-Pesa / Card</p>
                  }
                </div>
              </div>
            </button>
          ))}

          {error && (
            <p className="text-xs text-red-500 text-center pt-1">{error}</p>
          )}

          <div className="pt-2 space-y-2">
            {[
              'Video scripts, captions, WhatsApp, poster copy + landing page per campaign',
              'Unlimited AI tweaks on every section after generation',
              'Credits never expire',
            ].map(f => (
              <div key={f} className="flex items-start gap-2 text-xs text-gray-500">
                <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-[11px] text-gray-400">Secure payment via PesaPal · M-Pesa, Visa, Mastercard accepted</p>
        </div>
      </div>
    </div>
  )
}
