import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

function GoogleButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
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
      <span className="text-xs text-gray-600">or continue with email</span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center mb-6">
            <Logo size="md" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card-glow p-7">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <GoogleButton />
          <Divider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@company.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">Forgot?</Link>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="Your password"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Signing in...' : <><span>Sign in</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold">Create one</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
