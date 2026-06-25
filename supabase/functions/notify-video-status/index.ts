import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const FROM_EMAIL = 'Nia Media <hello@niamedia.co.ke>'

type Status = 'in-production' | 'delivered' | 'contacted' | 'closed'

const STATUS_COPY: Record<Status, { subject: (t: string) => string; headline: string; detail: string; cta: string; ctaUrl: string; accent: string }> = {
  'in-production': {
    subject: (t) => `Production started: ${t}`,
    headline: "Your video is now in production!",
    detail: "Our production team has started work on your video. We'll keep you updated and deliver as agreed.",
    cta: "Track Progress",
    ctaUrl: "/my-requests",
    accent: "#d97706",
  },
  'delivered': {
    subject: (t) => `Your video is ready: ${t}`,
    headline: "Your video has been delivered!",
    detail: "Your video is complete and ready for download. Log in to your dashboard to access and download your files.",
    cta: "View Delivered Assets",
    ctaUrl: "/assets",
    accent: "#059669",
  },
  'contacted': {
    subject: (t) => `Update on your request: ${t}`,
    headline: "We've reviewed your brief",
    detail: "We've reviewed your video request and will be in touch shortly to confirm scope, timeline, and pricing.",
    cta: "View My Requests",
    ctaUrl: "/my-requests",
    accent: "#2563eb",
  },
  'closed': {
    subject: (t) => `Request closed: ${t}`,
    headline: "Your request has been closed",
    detail: "Your video request has been marked as closed. If you have questions, reply to this email or WhatsApp us.",
    cta: "Submit New Request",
    ctaUrl: "/request-video",
    accent: "#6b7280",
  },
}

function statusEmailHtml(name: string, business: string, title: string, status: Status, appUrl: string, waPhone: string): string {
  const copy = STATUS_COPY[status]
  const firstName = (name || 'there').split(' ')[0]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${copy.headline}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a2e}
  .wrapper{max-width:600px;margin:32px auto;padding:0 16px}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#1a1a2e,#2d1b69);padding:40px 40px 32px;text-align:center}
  .hero-logo{font-size:18px;font-weight:800;color:rgba(255,255,255,0.7);margin-bottom:20px}
  .status-badge{display:inline-block;padding:6px 16px;border-radius:999px;font-size:12px;font-weight:700;color:#fff;margin-bottom:16px}
  .hero h1{font-size:22px;font-weight:800;color:#fff;line-height:1.3}
  .hero p{color:rgba(255,255,255,0.7);font-size:14px;margin-top:8px}
  .body{padding:36px 40px}
  .project-box{background:#f9f8ff;border:1px solid #e9d5ff;border-radius:12px;padding:16px 20px;margin:20px 0}
  .project-box .label{font-size:11px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em}
  .project-box .value{font-size:15px;font-weight:700;color:#1a1a2e;margin-top:3px}
  .cta{text-align:center;margin:28px 0}
  .cta a{display:inline-block;padding:14px 32px;border-radius:12px;color:#fff;font-weight:700;font-size:14px;text-decoration:none}
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
      <div class="status-badge" style="background:${copy.accent}">${copy.headline.split(' ').slice(0, 4).join(' ')}</div>
      <h1>${copy.headline}</h1>
      <p>Update for ${firstName} — ${business || title}</p>
    </div>
    <div class="body">
      <p style="font-size:15px;color:#333;line-height:1.7;margin-bottom:20px">${copy.detail}</p>
      <div class="project-box">
        <div class="label">Project</div>
        <div class="value">${title || business}</div>
        ${business && title && business !== title ? `<div style="font-size:12px;color:#666;margin-top:2px">${business}</div>` : ''}
      </div>
      <div class="cta">
        <a href="${appUrl}${copy.ctaUrl}" style="background:linear-gradient(135deg,#7c3aed,#2563eb);box-shadow:0 4px 16px rgba(124,58,237,0.3)">
          ${copy.cta} →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>
        &copy; ${new Date().getFullYear()} Nia Media &middot; Nairobi, Kenya<br>
        <a href="https://wa.me/${waPhone}">WhatsApp us</a> &middot; <a href="mailto:hello@niamedia.co.ke">hello@niamedia.co.ke</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`
}

serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { user_email, user_name, business_name, title, status } = await req.json()

    if (!user_email || !status) {
      return new Response(JSON.stringify({ error: 'user_email and status required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const copy = STATUS_COPY[status as Status]
    if (!copy) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://niamedia.co.ke'
    const ADMIN_WHATSAPP = Deno.env.get('ADMIN_WHATSAPP') ?? Deno.env.get('ADMIN_PHONE') ?? '254700000000'

    if (!RESEND_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY not set' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: user_email,
        subject: copy.subject(title || business_name || 'your video'),
        html: statusEmailHtml(user_name ?? '', business_name ?? '', title ?? '', status as Status, APP_URL, ADMIN_WHATSAPP),
      }),
    })

    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[notify-video-status]', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
