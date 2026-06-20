import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyPayload {
  type: 'new_order' | 'new_lead'
  title: string
  business: string
  phone?: string
  email?: string
  package?: string
  price?: number
  rush?: boolean
  service?: string
  timeline?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const apiKey = Deno.env.get('AFRICAS_TALKING_API_KEY')
  const username = Deno.env.get('AFRICAS_TALKING_USERNAME') ?? 'sandbox'
  const adminPhone = Deno.env.get('ADMIN_PHONE')

  if (!apiKey || !adminPhone) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing AT credentials or ADMIN_PHONE' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload: NotifyPayload = await req.json()

  let message = ''

  if (payload.type === 'new_order') {
    const rushLine = payload.rush ? '\n⚡ RUSH ORDER — 24hr delivery' : ''
    message = [
      `🎵 NEW AUDIO ORDER — Nia Media`,
      `Client: ${payload.business}`,
      `Package: ${payload.package}`,
      payload.price ? `Price: KES ${payload.price.toLocaleString()}` : '',
      rushLine,
      `\nLog in → niamedia.co.ke/admin`,
    ].filter(Boolean).join('\n')
  } else if (payload.type === 'new_lead') {
    message = [
      `📥 NEW LEAD — Nia Media`,
      `${payload.title} — ${payload.business}`,
      `Service: ${payload.service ?? '—'}`,
      payload.phone ? `Phone: ${payload.phone}` : '',
      payload.email ? `Email: ${payload.email}` : '',
      payload.timeline ? `Timeline: ${payload.timeline}` : '',
      `\nAdmin → Leads tab`,
    ].filter(Boolean).join('\n')
  } else {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const baseUrl = username === 'sandbox'
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging'

  const form = new URLSearchParams({ username, to: adminPhone, message })

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'apiKey': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  const result = await res.json()

  return new Response(JSON.stringify({ ok: true, result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
