import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STYLE_PROMPTS: Record<string, string> = {
  cinematic:
    'Dramatic 35mm film still, Nairobi skyline at golden dusk, silhouettes of urban buildings against burning orange sky, cinematic teal and orange color grade, anamorphic lens bokeh, deep moody shadows, ultra-realistic cinematography',
  cartoon:
    'Vibrant 2D cartoon animation frame, bold flat colors, joyful African characters in a dynamic scene, pop art thick black outlines, bright saturated color palette, comic book energy, clean professional illustration',
  'bold-graphic':
    'Bold high-impact commercial advertising composition, stark black background with crimson red diagonal shapes, powerful geometric abstraction, dramatic angular motion, graphic design poster aesthetic, ultra modern commercial art',
  documentary:
    'Candid documentary photograph, warm natural golden hour light, authentic Nairobi street life, real people in unposed moment, photojournalism style, 35mm film grain, raw emotional humanity',
  luxury:
    'Ultra-luxury lifestyle editorial photograph, elegant African woman in haute couture, champagne and dark rich tones, upscale Nairobi penthouse rooftop at night, city lights bokeh, aspirational premium fashion editorial',
  minimal:
    'Ultra-clean minimalist product still life, single white ceramic vase on white marble surface, soft diffused natural light, subtle shadow, abundant negative space, refined sophistication, high-end editorial photography',
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
  return imgPart.inlineData.data as string // raw base64 PNG
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { style_id } = await req.json()
    const prompt = STYLE_PROMPTS[style_id]
    if (!prompt) {
      return new Response(JSON.stringify({ error: `Unknown style: ${style_id}` }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) throw new Error('GEMINI_API_KEY not configured')

    const rawBase64 = await geminiImage(key, prompt)
    // Resize to 480×270 (16:9 thumbnail), JPEG q72 → ~30–60 KB
    const dataUrl = await compressToJpeg(rawBase64, 480, 72)

    return new Response(JSON.stringify({ url: dataUrl }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = (err as Error).message ?? String(err)
    console.error('[generate-style-thumb] fatal:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
