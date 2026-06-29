import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ShareTracker() {
  const { token } = useParams<{ token: string }>()
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }

    // Track the view and get campaign ID
    Promise.all([
      supabase.functions.invoke('track-share', {
        body: { token, eventType: 'view' },
      }),
      supabase
        .from('campaign_shares')
        .select('campaign_id')
        .eq('share_token', token)
        .single(),
    ]).then(([trackRes, { data: share }]) => {
      if (share) setCampaignId(share.campaign_id)
      setLoading(false)
    })
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin text-purple-500" />
      </div>
    )
  }

  if (!campaignId) {
    return <Navigate to="/" replace />
  }

  // Redirect to the campaign
  window.location.href = `/campaigns/${campaignId}`
  return null
}
