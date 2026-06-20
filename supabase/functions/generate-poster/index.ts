import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INDUSTRY_PROMPTS: Record<string, string> = {
  'Real Estate': 'luxury modern apartment interior, Nairobi skyline view through large windows, professional real estate photography, golden hour warm lighting, no people',
  'Hospitality': 'elegant hotel lobby or infinity pool, East Africa resort, warm hospitality atmosphere, professional photography, soft golden light, no people',
  'Restaurant': 'delicious African cuisine food photography, beautifully plated dishes on premium tableware, warm restaurant ambiance, rich vibrant colors, no people',
  'Education': 'modern university library or bright contemporary classroom, books and learning materials, inspiring educational space, clean airy atmosphere, no people',
  'Fintech / SACCO': 'modern Nairobi CBD glass architecture, abstract financial technology concept, professional blue and gold tones, aerial city view, no people',
  'Health & Wellness': 'clean modern clinic interior or wellness spa, natural light, fresh green plants, calming blue-white palette, medical professional setting, no people',
  'Events': 'elegant event venue with beautiful lighting, sophisticated event setup, floral decorations, warm golden bokeh lights, no people',
  'Travel': 'stunning Kenya landscape photography, Masai Mara savanna at golden hour, Mount Kenya snow peak, vibrant African nature, wide open skies',
  'Retail': 'modern upscale retail store interior, beautifully arranged products on display, contemporary clean space, bright natural lighting, no people',
  'Professional Services': 'sleek modern office with glass walls, Nairobi CBD view, executive meeting room, clean professional workspace, no people',
}

const STYLE_PROMPTS: Record<string, string> = {
  bold: 'dramatic cinematic lighting, high contrast, deep shadows, intense atmosphere, commercial advertising photography',
  minimal: 'soft pastel tones, minimalist clean composition, airy bright, plenty of negative space, editorial photography style',
  vibrant: 'vibrant saturated jewel colors, energetic dynamic composition, warm rich tones, lush and inviting, lifestyle photography',
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  const b64 = btoa(binary)
  const mime = res.headers.get('content-type') || 'image/jpeg'
  return `data:${mime};base64,${b64}`
}

async function generateOne(apiKey: string, industry: string, style: string): Promise<string> {
  const industryDesc = INDUSTRY_PROMPTS[industry] ?? `${industry} business in Kenya, professional commercial photography`
  const styleDesc = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.bold
  const prompt = `Professional marketing poster background: ${industryDesc}, ${styleDesc}, no text overlay, no logos, no faces, Kenya East Africa, 4K commercial quality, suitable for business advertising`

  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      image_size: 'portrait_3_4',
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
      sync_mode: true,
    }),
  })

  if (!res.ok) throw new Error(`fal.ai ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const imageUrl = data.images?.[0]?.url
  if (!imageUrl) throw new Error('No image returned from fal.ai')
  return fetchImageAsBase64(imageUrl)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { industry, business_name, style = 'bold', unlock = false } = await req.json()

    const FALAI_KEY = Deno.env.get('FALAI_API_KEY')
    if (!FALAI_KEY) throw new Error('FALAI_API_KEY not configured')

    // Preview mode — 1 image, no credit required
    if (!unlock) {
      const imageData = await generateOne(FALAI_KEY, industry, 'bold')
      return new Response(JSON.stringify({ images: { bold: imageData } }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Unlock mode — spend 1 credit, generate 3 styles in parallel
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors })

    // Deduct 1 credit
    const { data: creditData, error: creditError } = await supabase.rpc('spend_credit', { uid: user.id })
    if (creditError || !creditData) {
      return new Response(JSON.stringify({ error: 'insufficient_credits' }), {
        status: 402,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Generate all 3 styles in parallel
    const [bold, minimal, vibrant] = await Promise.all([
      generateOne(FALAI_KEY, industry, 'bold'),
      generateOne(FALAI_KEY, industry, 'minimal'),
      generateOne(FALAI_KEY, industry, 'vibrant'),
    ])

    return new Response(JSON.stringify({ images: { bold, minimal, vibrant }, unlocked: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = (err as Error).message ?? String(err)
    console.error('[generate-poster] fatal:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
