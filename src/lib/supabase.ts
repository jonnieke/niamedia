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
