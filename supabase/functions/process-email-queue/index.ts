import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'Nia Media <hello@niamedia.co.ke>'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://niamedia.co.ke'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('Resend error:', res.status, body)
  }
  return res.ok
}

function day2EmailHtml(name: string, appUrl: string): string {
  const firstName = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your free campaign is waiting</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a2e}
  .wrapper{max-width:600px;margin:32px auto;padding:0 16px}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#1a1a2e,#2d1b69);padding:36px 40px;text-align:center}
  .hero-logo{font-size:18px;font-weight:800;color:#a78bfa;margin-bottom:20px}
  .hero h1{font-size:24px;font-weight:800;color:#fff;line-height:1.3}
  .hero p{color:rgba(255,255,255,0.7);font-size:14px;margin-top:8px}
  .body{padding:36px 40px}
  .tip{background:#f9f8ff;border-left:3px solid #8b5cf6;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0}
  .tip p{font-size:14px;color:#333;line-height:1.6}
  .tip strong{color:#6d28d9}
  .cta{text-align:center;margin:32px 0}
  .cta a{display:inline-block;padding:14px 36px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;font-weight:700;font-size:15px;text-decoration:none}
  .footer{text-align:center;padding:20px 40px;border-top:1px solid #f0f0f5}
  .footer p{font-size:12px;color:#999;line-height:1.7}
  .footer a{color:#8b5cf6;text-decoration:none}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="hero">
      <div class="hero-logo">Nia Media</div>
      <h1>Your free credit is still waiting, ${firstName}</h1>
      <p>You signed up 2 days ago but haven't created a campaign yet</p>
    </div>
    <div class="body">
      <p style="font-size:15px;color:#333;line-height:1.7;margin-bottom:20px">
        Most businesses that try Nia Media generate their first campaign in under 3 minutes. Here's a quick tip to get the most out of it:
      </p>
      <div class="tip">
        <p><strong>Pro tip:</strong> Be specific about your target audience. Instead of "young people," try "young professionals aged 25–35 in Nairobi who want to invest but don't know where to start." The more specific, the more persuasive the copy.</p>
      </div>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:20px 0">
        Your 1 free credit covers a full campaign — video scripts, WhatsApp messages, social media captions, and more.
      </p>
      <div class="cta">
        <a href="${appUrl}/new-campaign">Use My Free Credit Now →</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Nia Media · <a href="${appUrl}/settings">Unsubscribe</a></p>
    </div>
  </div>
</div>
</body>
</html>`
}

function day5EmailHtml(name: string, appUrl: string): string {
  const firstName = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KES 150K saved per year</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a2e}
  .wrapper{max-width:600px;margin:32px auto;padding:0 16px}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#065f46,#047857);padding:36px 40px;text-align:center}
  .hero-logo{font-size:18px;font-weight:800;color:#6ee7b7;margin-bottom:16px}
  .stat{font-size:48px;font-weight:900;color:#fff;line-height:1}
  .stat-label{font-size:16px;color:rgba(255,255,255,0.8);margin-top:8px}
  .body{padding:36px 40px}
  .testimonial{background:#f9fdf9;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:16px 0}
  .testimonial p{font-size:14px;color:#1a1a2e;line-height:1.7;font-style:italic}
  .testimonial .author{font-size:12px;color:#059669;font-weight:600;margin-top:10px;font-style:normal}
  .pricing{display:flex;gap:12px;margin:24px 0}
  .pkg{flex:1;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center}
  .pkg.featured{border-color:#8b5cf6;background:#faf5ff}
  .pkg .price{font-size:20px;font-weight:800;color:#1a1a2e}
  .pkg .credits{font-size:13px;color:#666;margin-top:2px}
  .pkg .badge{display:inline-block;background:#8b5cf6;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:6px}
  .cta{text-align:center;margin:28px 0}
  .cta a{display:inline-block;padding:14px 36px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;font-weight:700;font-size:15px;text-decoration:none}
  .footer{text-align:center;padding:20px 40px;border-top:1px solid #f0f0f5}
  .footer p{font-size:12px;color:#999;line-height:1.7}
  .footer a{color:#8b5cf6;text-decoration:none}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="hero">
      <div class="hero-logo">Nia Media</div>
      <div class="stat">KES 150K</div>
      <div class="stat-label">Average annual savings vs. hiring a copywriter</div>
    </div>
    <div class="body">
      <p style="font-size:15px;color:#333;line-height:1.7;margin-bottom:20px">
        ${firstName}, businesses across Nairobi are replacing KES 20,000/month agency retainers with Nia Media. Here's what they're saying:
      </p>
      <div class="testimonial">
        <p>"We used to spend KES 25,000 per month for a content agency that barely understood our market. With Nia Media, I generate better campaigns in 5 minutes."</p>
        <div class="author">— James M., Real Estate Agent, Westlands</div>
      </div>
      <div class="testimonial">
        <p>"I use it every week for our restaurant specials on WhatsApp and Instagram. Customers always ask who does our marketing!"</p>
        <div class="author">— Amina K., Restaurant Owner, Kilimani</div>
      </div>
      <p style="font-size:14px;font-weight:600;color:#1a1a2e;margin:24px 0 12px">Top up your credits:</p>
      <div class="pricing">
        <div class="pkg"><div class="price">KES 500</div><div class="credits">1 campaign</div></div>
        <div class="pkg"><div class="price">KES 2,000</div><div class="credits">5 campaigns</div><div class="badge">Save KES 500</div></div>
        <div class="pkg featured"><div class="price">KES 4,000</div><div class="credits">12 campaigns</div><div class="badge">Best value</div></div>
      </div>
      <div class="cta">
        <a href="${appUrl}/new-campaign">Get More Credits →</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Nia Media · <a href="${appUrl}/settings">Unsubscribe</a></p>
    </div>
  </div>
</div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const now = new Date().toISOString()

  // Fetch all pending emails due to be sent
  const { data: queue, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(50)

  if (error) {
    console.error('Queue fetch error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (!queue || queue.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  let sent = 0, failed = 0

  for (const item of queue) {
    let subject = ''
    let html = ''

    if (item.email_type === 'day2_nudge') {
      subject = `${item.recipient_name.split(' ')[0]}, your free campaign credit is still here`
      html = day2EmailHtml(item.recipient_name, APP_URL)
    } else if (item.email_type === 'day5_social_proof') {
      subject = 'How Nairobi businesses save KES 150K/year on advertising'
      html = day5EmailHtml(item.recipient_name, APP_URL)
    } else {
      // Unknown type — mark as failed so it doesn't loop
      await supabase.from('email_queue').update({
        status: 'failed',
        error: 'unknown email_type',
        sent_at: now,
      }).eq('id', item.id)
      failed++
      continue
    }

    const ok = await sendEmail(item.recipient_email, subject, html)

    await supabase.from('email_queue').update({
      status: ok ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
      error: ok ? null : 'Resend API returned non-200',
    }).eq('id', item.id)

    if (ok) sent++; else failed++
  }

  return new Response(JSON.stringify({ ok: true, processed: queue.length, sent, failed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
