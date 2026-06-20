import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center mb-6"><Logo size="md" /></Link>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="card-glow p-7">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.3)' }}>
                <Mail size={24} className="text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-400 mb-6">
                We sent a reset link to <strong className="text-white">{email}</strong>.
                Click it to set a new password.
              </p>
              <p className="text-xs text-gray-600">
                No email? Check spam or{' '}
                <button onClick={() => setSent(false)} className="text-purple-400 hover:text-purple-300">
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          <div className="mt-5 pt-5 border-t border-white/6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
