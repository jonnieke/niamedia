import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // With implicit flow, supabase-js fires PASSWORD_RECOVERY when the
    // reset link is clicked and the hash token is parsed from the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // If the session was already set (e.g. page refresh), check immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center mb-6"><Logo size="md" /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account</p>
        </div>

        <div className="card-glow p-7">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)' }}>
                <ArrowRight size={24} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500">Taking you to your dashboardâ€¦</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6">
              <Loader2 size={28} className="animate-spin text-purple-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Verifying reset linkâ€¦</p>
              <p className="text-xs text-gray-600 mt-4">
                Link expired?{' '}
                <Link to="/forgot-password" className="text-purple-400 hover:text-purple-300">Request a new one</Link>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} className="input pr-10"
                      placeholder="At least 6 characters" value={password}
                      onChange={e => setPassword(e.target.value)} required autoFocus />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input type="password" className="input" placeholder="Repeat your password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : <><span>Update password</span><ArrowRight size={15} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

