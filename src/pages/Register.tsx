import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, CheckCircle2, Mail, Loader2 } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

function GoogleButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    })
  }

  return (
    <button onClick={handleClick} disabled={loading} type="button"
      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-all disabled:opacity-50">
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.7-6.7C35.8 2.3 30.2 0 24 0 14.6 0 6.6 5.3 2.7 13.1l7.8 6.1C12.2 13.1 17.6 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4H24v7.7h12.5c-.5 2.7-2.1 5-4.5 6.5l7 5.4c4-3.7 6.4-9.2 6.4-15.6z"/>
          <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7L2.7 13.1C1 16.3 0 20 0 24s1 7.7 2.7 10.9l7.8-6.2z"/>
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7-5.4c-2.1 1.4-4.8 2.3-8.2 2.3-6.4 0-11.8-3.6-14.5-8.8l-7.8 6.2C6.6 42.7 14.6 48 24 48z"/>
        </svg>
      )}
      {loading ? 'Redirecting…' : 'Continue with Google'}
    </button>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-white/8" />
      <span className="text-xs text-gray-600">or sign up with email</span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError('')
    setLoading(true)
    try {
      const { needsConfirmation: confirm } = await register(name, email, password)
      if (confirm) {
        setNeedsConfirmation(true)
      } else {
        navigate(localStorage.getItem('onboarded') ? '/dashboard' : '/onboarding')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.3)' }}>
            <Mail size={28} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sm text-gray-400 mb-6">
            We sent a confirmation link to <strong className="text-white">{email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <Link to="/login" className="btn-primary w-full py-3 text-sm inline-flex items-center justify-center gap-2">
            Back to Sign In <ArrowRight size={14} />
          </Link>
          <p className="text-xs text-gray-600 mt-4">
            No email? Check spam or{' '}
            <button onClick={() => setNeedsConfirmation(false)} className="text-purple-400 hover:text-purple-300">
              try again
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center mb-6"><Logo size="md" /></Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start creating campaigns in minutes</p>
        </div>

        <div className="card-glow p-7">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}

          <GoogleButton />
          <Divider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="Jane Wanjiru" value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="At least 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Creating account…' : <><span>Create account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/6">
            <div className="flex flex-col gap-1.5 mb-5">
              {['No credit card required', 'Free to explore', 'Cancel anytime'].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-purple-400" />
                  <span className="text-xs text-gray-500">{t}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
