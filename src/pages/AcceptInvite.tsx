import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Logo from '../components/ui/Logo'

interface InviteData {
  id: string
  owner_id: string
  owner_name: string
  email: string
  role: string
  accepted_at: string | null
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setError('Invalid invite link.'); setLoading(false); return }
    supabase.from('team_invites').select('id, owner_id, owner_name, email, role, accepted_at').eq('token', token).maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) setError('This invite link is invalid or has expired.')
        else setInvite(data as InviteData)
        setLoading(false)
      })
  }, [token])

  const acceptInvite = async () => {
    if (!invite || !user) return
    setAccepting(true)
    setError('')

    // Upsert team member
    const { error: memberErr } = await supabase.from('team_members').upsert({
      owner_id: invite.owner_id,
      member_id: user.id,
      role: invite.role,
    }, { onConflict: 'owner_id,member_id' })

    if (memberErr) {
      setError(memberErr.message)
      setAccepting(false)
      return
    }

    // Mark invite as accepted
    await supabase.from('team_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)

    setDone(true)
    setAccepting(false)
    setTimeout(() => navigate('/dashboard'), 2000)
  }

  const roleLabel: Record<string, string> = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          {loading ? (
            <Loader2 size={28} className="animate-spin text-purple-500 mx-auto" />
          ) : error ? (
            <>
              <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Invalid invite</p>
              <p className="text-sm text-gray-500">{error}</p>
            </>
          ) : done ? (
            <>
              <CheckCircle size={36} className="text-green-500 mx-auto mb-3" />
              <p className="font-bold text-gray-900 mb-1">You've joined the workspace!</p>
              <p className="text-sm text-gray-500">Redirecting to your dashboard…</p>
            </>
          ) : invite?.accepted_at ? (
            <>
              <CheckCircle size={36} className="text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Already accepted</p>
              <p className="text-sm text-gray-500">This invite has already been used.</p>
              <button onClick={() => navigate('/dashboard')} className="btn-primary mt-5 text-sm px-5 py-2.5">Go to dashboard</button>
            </>
          ) : invite ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #ede9fe, #dbeafe)' }}>
                <Users size={22} className="text-purple-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">You're invited!</h1>
              <p className="text-sm text-gray-500 mb-5">
                <span className="font-semibold text-gray-700">{invite.owner_name || 'A Nia Media user'}</span> has invited you to join their workspace as a{' '}
                <span className="font-semibold text-purple-600">{roleLabel[invite.role] ?? invite.role}</span>.
              </p>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">You need an account to join. Create one or log in.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/register?invite=${token}`)}
                      className="flex-1 btn-primary text-sm py-2.5">
                      Create account
                    </button>
                    <button
                      onClick={() => navigate(`/login?redirect=/accept-invite/${token}`)}
                      className="flex-1 btn-secondary text-sm py-2.5">
                      Log in
                    </button>
                  </div>
                </div>
              ) : user?.email !== invite.email ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Wrong account</p>
                  <p className="text-xs text-amber-600">This invite is for <strong>{invite.email}</strong> but you're signed in as <strong>{user?.email}</strong>. Please log in with the correct account.</p>
                </div>
              ) : (
                <button
                  onClick={acceptInvite}
                  disabled={accepting}
                  className="w-full btn-primary text-sm py-3 gap-2 disabled:opacity-60">
                  {accepting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Accept & join workspace
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
