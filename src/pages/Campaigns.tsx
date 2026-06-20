import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Clock, Megaphone, Loader2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Campaign {
  id: string
  title: string
  type: string
  content: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export default function Campaigns() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('campaigns')
      .select('id, title, type, content, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCampaigns(data ?? [])
        setLoading(false)
      })
  }, [user])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">All your AI-generated campaigns in one place.</p>
        </div>
        <Link to="/new-campaign" className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-purple-400 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card-glow flex flex-col items-center justify-center py-20 text-center">
          <Megaphone size={40} className="text-gray-700 mb-4" />
          <p className="text-white font-semibold mb-1">No campaigns yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            Generate your first AI-powered campaign copy — taglines, social posts, scripts and more.
          </p>
          <Link to="/new-campaign" className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
            <Plus size={15} /> Create First Campaign
          </Link>
        </div>
      ) : (
        <div className="card-glow divide-y divide-white/5">
          {campaigns.map(c => {
            const meta = c.metadata as Record<string, string>
            const platforms = Array.isArray(meta?.platforms) ? (meta.platforms as string[]) : []
            return (
              <div key={c.id} className="flex items-center gap-5 px-5 py-4 hover:bg-white/2 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20 capitalize">
                      {c.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {meta?.business_name && (
                      <>
                        <span className="text-xs text-gray-500">{meta.business_name}</span>
                        <span className="text-xs text-gray-700">·</span>
                      </>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock size={10} />
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {platforms.length > 0 && (
                    <div className="flex gap-1.5">
                      {platforms.slice(0, 3).map(p => (
                        <span key={p} className="px-2 py-0.5 bg-white/5 border border-white/8 text-gray-500 text-[11px] rounded-lg">{p}</span>
                      ))}
                    </div>
                  )}
                  <Link to={`/campaigns/${c.id}`} className="btn-outline text-xs px-3 py-1.5">View</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
