import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STYLE_PROMPTS: Record<string, string> = {
  cinematic:
    'dramatic 35mm film still, Nairobi skyline at golden dusk, silhouettes of urban buildings against burning orange sky, cinematic teal and orange color grade, anamorphic lens bokeh, deep moody shadows, ultra-realistic cinematography, no text, no watermarks',
  cartoon:
    'vibrant 2D cartoon animation frame, bold flat colors, joyful African characters in dynamic scene, pop art thick black outlines, bright saturated color palette, comic book energy, clean professional illustration, no text, no logos',
  'bold-graphic':
    'bold high-impact commercial advertising composition, stark black background with crimson red diagonal shapes, powerful geometric abstraction, dramatic angular motion blur, graphic design poster aesthetic, ultra modern commercial art, no text, no typography',
  documentary:
    'candid documentary photograph, warm natural golden hour light, authentic Nairobi street life, real people in unposed moment, photojournalism style, 35mm film grain texture, raw emotional humanity, market stalls vibrant color',
  luxury:
    'ultra-luxury lifestyle editorial photograph, elegant African woman in haute couture, champagne flute and dark rich tones, upscale Nairobi penthouse rooftop at night, city lights bokeh, aspirational premium atmosphere, fashion magazine quality, no text',
  minimal:
    'ultra-clean minimalist product still life, single white ceramic vase on white marble surface, soft diffused natural light, subtle shadow, abundant negative space, refined sophistication, high-end editorial photography, pure and serene composition, no text',
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

    const FALAI_KEY = Deno.env.get('FALAI_API_KEY')
    if (!FALAI_KEY) throw new Error('FALAI_API_KEY not configured')

    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { Authorization: `Key ${FALAI_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
        sync_mode: true,
      }),
    })

    if (!res.ok) throw new Error(`fal.ai ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const imageUrl = data.images?.[0]?.url
    if (!imageUrl) throw new Error('No image URL returned from fal.ai')

    // Proxy the image URL back — client fetches it directly so we avoid base64 overhead
    return new Response(JSON.stringify({ url: imageUrl }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = (err as Error).message ?? String(err)
    console.error('[generate-style-thumb] fatal:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
