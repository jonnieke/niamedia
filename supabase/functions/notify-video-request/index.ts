import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': 'https://niamedia.co.ke',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM_EMAIL = 'Nia Media <hello@niamedia.co.ke>'

function confirmationHtml(name: string, business: string, title: string, budget: string, delivery: string, appUrl: string, waPhone: string): string {
  const firstName = name.split(' ')[0]
  const deliveryLabel = delivery === '24h' ? '24-hour rush (+50%)' : delivery === '48h' ? '48-hour rush (+25%)' : '3–5 business days'
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Video request received</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a2e}
  .wrapper{max-width:600px;margin:32px auto;padding:0 16px}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#4c1d95,#1e3a8a);padding:40px 40px 32px;text-align:center}
  .hero-logo{font-size:18px;font-weight:800;color:rgba(255,255,255,0.7);margin-bottom:20px}
  .hero-icon{font-size:40px;margin-bottom:12px}
  .hero h1{font-size:24px;font-weight:800;color:#fff;line-height:1.3}
  .hero p{color:rgba(255,255,255,0.75);font-size:14px;margin-top:8px}
  .body{padding:36px 40px}
  .summary{background:#f9f8ff;border-radius:12px;border:1px solid #e9d5ff;padding:20px 24px;margin:24px 0}
  .summary-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0ebff}
  .summary-row:last-child{border-bottom:none}
  .summary-row .label{font-size:12px;color:#7c3aed;font-weight:600}
  .summary-row .value{font-size:13px;color:#1a1a2e;font-weight:500}
  .steps{margin:24px 0}
  .step{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px}
  .step-num{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .step-text p{font-size:13px;font-weight:600;color:#1a1a2e;margin-bottom:2px}
  .step-text span{font-size:12px;color:#666}
  .cta{text-align:center;margin:28px 0 16px}
  .cta a{display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 4px 16px rgba(124,58,237,0.3)}
  .footer{text-align:center;padding:20px 40px;background:#f9f9fb;border-top:1px solid #f0f0f5}
  .footer p{font-size:11px;color:#999;line-height:1.7}
  .footer a{color:#7c3aed;text-decoration:none}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="hero">
      <div class="hero-logo">Nia Media</div>
      <div class="hero-icon">🎬</div>
      <h1>Video request received, ${firstName}!</h1>
      <p>We'll review your brief and confirm scope within 24 hours.</p>
    </div>

    <div class="body">
      <p style="font-size:15px;color:#333;line-height:1.7">
        Thanks for submitting your video production request. Here's a summary of what we received:
      </p>

      <div class="summary">
        <div class="summary-row">
          <span class="label">Business</span>
          <span class="value">${business}</span>
        </div>
        <div class="summary-row">
          <span class="label">Project</span>
          <span class="value">${title || business}</span>
        </div>
        <div class="summary-row">
          <span class="label">Budget</span>
          <span class="value">${budget || 'To be confirmed'}</span>
        </div>
        <div class="summary-row">
          <span class="label">Delivery</span>
          <span class="value">${deliveryLabel}</span>
        </div>
      </div>

      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">
            <p>Brief review (within 24 hours)</p>
            <span>We'll review your script and specs and confirm what's included.</span>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">
            <p>Quote confirmation</p>
            <span>We'll send a final price and timeline before production starts.</span>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">
            <p>Production & delivery</p>
            <span>Once approved, we'll produce your video and deliver via download link.</span>
          </div>
        </div>
      </div>

      <p style="font-size:13px;color:#666;line-height:1.7;margin-bottom:24px">
        If you need to update your brief or have questions, reply to this email or WhatsApp us.
        We won't start production until you've approved the scope and price.
      </p>

      <div class="cta">
        <a href="${appUrl}/request-video">Submit Another Request →</a>
      </div>
    </div>

    <div class="footer">
      <p>
        © ${new Date().getFullYear()} Nia Media · Nairobi, Kenya<br>
        <a href="https://wa.me/${waPhone}">WhatsApp us</a> · <a href="mailto:hello@niamedia.co.ke">hello@niamedia.co.ke</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { user_email, user_name, business_name, title, budget_range, delivery_speed, industry } = await req.json()

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const AT_KEY = Deno.env.get('AFRICAS_TALKING_API_KEY')
    const AT_USER = Deno.env.get('AFRICAS_TALKING_USERNAME') ?? 'sandbox'
    const ADMIN_PHONE = Deno.env.get('ADMIN_PHONE')
    const ADMIN_WHATSAPP = Deno.env.get('ADMIN_WHATSAPP') ?? ADMIN_PHONE ?? '254700000000'
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://niamedia.co.ke'

    const results: Record<string, unknown> = {}

    // 1. User confirmation email
    if (RESEND_KEY && user_email) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user_email,
          subject: `Video request received — ${title || business_name}`,
          html: confirmationHtml(user_name ?? 'there', business_name ?? '', title ?? '', budget_range ?? '', delivery_speed ?? '', APP_URL, ADMIN_WHATSAPP),
        }),
      })
      results.email = emailRes.ok ? 'sent' : `failed:${emailRes.status}`
    }

    // 2. Admin SMS via Africa's Talking
    if (AT_KEY && ADMIN_PHONE) {
      const rushLabel = delivery_speed === '24h' ? ' ⚡ 24-HOUR RUSH' : delivery_speed === '48h' ? ' ⚡ 48-HR RUSH' : ''
      const message = [
        `🎬 NEW VIDEO REQUEST${rushLabel} — Nia Media`,
        `Business: ${business_name}`,
        industry ? `Industry: ${industry}` : '',
        `Budget: ${budget_range || 'TBC'}`,
        `\nAdmin → niamedia.co.ke/admin (Video Requests tab)`,
      ].filter(Boolean).join('\n')

      const baseUrl = AT_USER === 'sandbox'
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging'

      const smsRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'apiKey': AT_KEY, 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: AT_USER, to: ADMIN_PHONE, message }).toString(),
      })
      results.sms = smsRes.ok ? 'sent' : `failed:${smsRes.status}`
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[notify-video-request]', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
