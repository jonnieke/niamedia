import { useState, useEffect } from 'react'
import { UserPlus, Loader2, Copy, Check, X, Shield, Eye, Edit3, Crown, Users } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface TeamMember {
  id: string
  member_id: string
  role: string
  created_at: string
  member_name: string
  member_email: string
}

interface Invite {
  id: string
  email: string
  role: string
  token: string
  accepted_at: string | null
  created_at: string
}

const ROLE_META: Record<string, { label: string; desc: string; Icon: typeof Eye; color: string }> = {
  admin:  { label: 'Admin',  desc: 'Full access including billing and team management', Icon: Crown,  color: '#d97706' },
  editor: { label: 'Editor', desc: 'Create and edit campaigns and leads',               Icon: Edit3,  color: '#7c3aed' },
  viewer: { label: 'Viewer', desc: 'Read-only access to campaigns and leads',           Icon: Eye,    color: '#2563eb' },
}

export default function Team() {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [copiedToken, setCopiedToken] = useState('')
  const [removingId, setRemovingId] = useState('')

  const load = async () => {
    if (!user) return
    setLoading(true)
    const [membersRes, invitesRes] = await Promise.all([
      supabase.from('team_members').select('id, member_id, role, created_at').eq('owner_id', user.id),
      supabase.from('team_invites').select('id, email, role, token, accepted_at, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }),
    ])

    // Fetch profile info for each member
    const memberIds = (membersRes.data ?? []).map((m: { member_id: string }) => m.member_id)
    let profileMap: Record<string, { name: string; email: string }> = {}
    if (memberIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', memberIds)
      profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string; name: string; email: string }) => [p.id, p]))
    }

    setMembers((membersRes.data ?? []).map((m: { id: string; member_id: string; role: string; created_at: string }) => ({
      ...m,
      member_name: profileMap[m.member_id]?.name ?? 'Unknown',
      member_email: profileMap[m.member_id]?.email ?? '',
    })))
    setInvites((invitesRes.data ?? []) as Invite[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const sendInvite = async () => {
    if (!user || !email.trim()) return
    setInviting(true)
    setInviteError('')
    const { data, error } = await supabase.from('team_invites').insert({
      owner_id: user.id,
      owner_name: user.name ?? '',
      email: email.trim().toLowerCase(),
      role,
    }).select('id, email, role, token, accepted_at, created_at').single()

    if (error) {
      setInviteError(error.message.includes('unique') ? 'An invite for this email already exists.' : error.message)
    } else if (data) {
      setInvites(prev => [data as Invite, ...prev])
      setEmail('')
    }
    setInviting(false)
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/accept-invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(''), 2000)
  }

  const revokeInvite = async (id: string) => {
    await supabase.from('team_invites').delete().eq('id', id)
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  const removeMember = async (id: string, memberId: string) => {
    setRemovingId(memberId)
    await supabase.from('team_members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
    setRemovingId('')
  }

  const changeRole = async (id: string, newRole: string) => {
    await supabase.from('team_members').update({ role: newRole }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m))
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Team Workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Invite team members to collaborate on campaigns and leads.</p>
        </div>

        {/* Invite form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Invite a team member</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              className="input flex-1 min-w-0 text-sm"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendInvite()}
            />
            <select className="input text-sm w-32 shrink-0" value={role} onChange={e => setRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={sendInvite}
              disabled={!email.trim() || inviting}
              className="btn-primary text-sm px-4 py-2.5 gap-1.5 disabled:opacity-50 shrink-0">
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Send invite
            </button>
          </div>
          {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}

          {/* Role descriptions */}
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {Object.entries(ROLE_META).map(([key, meta]) => {
              const Icon = meta.Icon
              return (
                <div key={key} className={`rounded-xl p-3 border transition-all ${role === key ? 'border-gray-300 bg-gray-50' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={12} style={{ color: meta.color }} />
                    <p className="text-xs font-semibold text-gray-900">{meta.label}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{meta.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-purple-400" /></div>
        ) : (
          <>
            {/* Active members */}
            {members.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-6">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-900">Active members ({members.length})</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {members.map(m => {
                    const meta = ROLE_META[m.role] ?? ROLE_META.viewer
                    const Icon = meta.Icon
                    return (
                      <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                          {m.member_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{m.member_name}</p>
                          <p className="text-xs text-gray-400 truncate">{m.member_email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={m.role}
                            onChange={e => changeRole(m.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-white">
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: `${meta.color}15`, color: meta.color }}>
                            <Icon size={11} /> {meta.label}
                          </div>
                          <button
                            onClick={() => removeMember(m.id, m.member_id)}
                            disabled={removingId === m.member_id}
                            className="text-gray-300 hover:text-red-400 transition-colors">
                            {removingId === m.member_id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pending invites */}
            {invites.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Shield size={14} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-900">Pending invites</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {invites.map(inv => (
                    <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{inv.email}</p>
                          {inv.accepted_at && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">Accepted</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 capitalize">{inv.role} · Invited {new Date(inv.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!inv.accepted_at && (
                          <button
                            onClick={() => copyLink(inv.token)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                            {copiedToken === inv.token ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                            {copiedToken === inv.token ? 'Copied!' : 'Copy link'}
                          </button>
                        )}
                        <button onClick={() => revokeInvite(inv.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {members.length === 0 && invites.length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-white">
                <Users size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-700 mb-1">No team members yet</p>
                <p className="text-sm text-gray-500">Invite a colleague above — they'll get a link to join your workspace.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
