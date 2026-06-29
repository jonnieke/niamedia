import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
)

/** Upload a profile avatar and return its public URL */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage
    .from('brand-assets')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) { console.error('Avatar upload failed:', error.message); return null }
  const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
  return data.publicUrl
}

/** Upload a brand logo to Supabase Storage and return its public URL */
export async function uploadLogo(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${userId}/logo.${ext}`
  const { error } = await supabase.storage
    .from('brand-assets')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) { console.error('Logo upload failed:', error.message); return null }
  const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
  return data.publicUrl
}

/** Create a shareable campaign link with tracking */
export async function createShareableLink(campaignId: string, platform: 'whatsapp' | 'instagram' | 'facebook' | 'email' | 'other' = 'whatsapp'): Promise<string | null> {
  const user = (await supabase.auth.getSession()).data.session?.user
  if (!user) return null

  const { data, error } = await supabase
    .from('campaign_shares')
    .insert({
      campaign_id: campaignId,
      user_id: user.id,
      platform,
      share_token: crypto.randomUUID(),
    })
    .select('share_token')
    .single()

  if (error || !data) {
    console.error('Failed to create shareable link:', error)
    return null
  }

  // Return a tracking URL that will log views/clicks
  const trackingUrl = `${window.location.origin}/track/${data.share_token}`
  return trackingUrl
}
