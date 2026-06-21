import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return new Response(JSON.stringify({ error: 'GEMINI_API_KEY secret not found' }), { status: 500, headers: cors })

  // gemini-2.5-flash-image = "Nano Banana" in Google AI Studio
  const model = 'gemini-2.5-flash-image'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'A dramatic cinematic sunset over a Nairobi skyline, golden hour, teal and orange grade, ultra-realistic photography' }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })

  const body = await res.json()

  if (!res.ok) {
    return new Response(JSON.stringify({ error: body?.error?.message ?? 'Gemini error', status: res.status, body }), {
      status: 502, headers: cors,
    })
  }

  const parts = body?.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p: Record<string, unknown>) => p.inlineData)

  if (!imagePart) {
    return new Response(JSON.stringify({ error: 'No image in response', parts }), { status: 502, headers: cors })
  }

  return new Response(JSON.stringify({
    ok: true,
    model,
    mimeType: imagePart.inlineData.mimeType,
    byteLength: (imagePart.inlineData.data as string).length,
    preview: (imagePart.inlineData.data as string).slice(0, 60) + '...',
  }), { headers: cors })
})
