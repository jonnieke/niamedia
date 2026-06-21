import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const cors = {
  'Access-Control-Allow-Origin': 'https://niamedia.co.ke',
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
  'Faith & Community': 'modern faith and community event setting, elegant church or community hall interior, warm inviting lighting, peaceful welcoming atmosphere, stained glass light effects, East Africa context, no text, no logos, no faces, professional event poster background',
}

const STYLE_MODIFIERS: Record<string, string> = {
  bold: 'dramatic cinematic lighting, high contrast, deep shadows, intense atmosphere',
  minimal: 'soft pastel tones, minimalist clean composition, airy bright, plenty of negative space',
  vibrant: 'vibrant saturated jewel colors, energetic dynamic composition, warm rich tones, lush and inviting',
}

async function geminiImage(key: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const imgPart = parts.find((p: Record<string, unknown>) => p.inlineData)
  if (!imgPart) throw new Error('No image returned by Gemini')
  return imgPart.inlineData.data as string
}

async function compressToJpeg(base64Png: string, width: number, quality: number): Promise<string> {
  const pngBytes = Uint8Array.from(atob(base64Png), c => c.charCodeAt(0))
  const img = await Image.decode(pngBytes)
  img.resize(width, Image.RESIZE_AUTO)
  const jpegBytes = await img.encodeJPEG(quality)
  let binary = ''
  for (let i = 0; i < jpegBytes.byteLength; i++) binary += String.fromCharCode(jpegBytes[i])
  return `data:image/jpeg;base64,${btoa(binary)}`
}

async function generateOne(key: string, ctx: {
  industry: string; style: string
  business_name?: string; product_name?: string; location?: string
  offer?: string; tone?: string; target_audience?: string; design_direction?: string
}, width = 360): Promise<string> {
  const industryDesc = INDUSTRY_PROMPTS[ctx.industry] ?? `${ctx.industry} business in Kenya, professional commercial photography`
  const styleDesc = STYLE_MODIFIERS[ctx.style] ?? STYLE_MODIFIERS.bold
  const extras: string[] = []
  if (ctx.product_name) extras.push(`featuring ${ctx.product_name}`)
  if (ctx.offer) extras.push(ctx.offer)
  if (ctx.location) extras.push(`in ${ctx.location}`)
  if (ctx.target_audience) extras.push(`appealing to ${ctx.target_audience}`)
  if (ctx.tone) extras.push(`${ctx.tone.toLowerCase()} mood`)
  if (ctx.design_direction) extras.push(ctx.design_direction)
  const contextClause = extras.length > 0 ? `, ${extras.join(', ')}` : ''
  const prompt = `Professional marketing poster background for ${ctx.business_name ?? 'a business'}: ${industryDesc}${contextClause}, ${styleDesc}, no text overlay, no logos, no human faces, Kenya East Africa, high quality commercial photography`
  const rawBase64 = await geminiImage(key, prompt)
  return compressToJpeg(rawBase64, width, width >= 600 ? 82 : 72)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const {
      industry, business_name, product_name, location, offer, tone, target_audience, design_direction,
      style = 'bold', unlock = false,
    } = body

    const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured')

    const ctx = { industry: industry ?? business_name ?? 'Professional Services', business_name, product_name, location, offer, tone, target_audience, design_direction }

    // Preview mode — 1 image, no credit required (360px, q72)
    if (!unlock) {
      const imageData = await generateOne(GEMINI_KEY, { ...ctx, style: 'bold' })
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

    const { data: creditData, error: creditError } = await supabase.rpc('spend_credit', { uid: user.id })
    if (creditError || !creditData) {
      return new Response(JSON.stringify({ error: 'insufficient_credits' }), {
        status: 402, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const [bold, minimal, vibrant] = await Promise.all([
      generateOne(GEMINI_KEY, { ...ctx, style: 'bold' }, 768),
      generateOne(GEMINI_KEY, { ...ctx, style: 'minimal' }, 768),
      generateOne(GEMINI_KEY, { ...ctx, style: 'vibrant' }, 768),
    ])

    return new Response(JSON.stringify({ images: { bold, minimal, vibrant }, unlocked: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = (err as Error).message ?? String(err)
    console.error('[generate-poster] fatal:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
