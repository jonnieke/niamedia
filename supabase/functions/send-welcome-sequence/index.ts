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

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  return res.ok
}

function welcomeEmailHtml(name: string, appUrl: string): string {
  const firstName = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to Nia Media</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a2e}
  .wrapper{max-width:600px;margin:32px auto;padding:0 16px}
  .card{background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#8b5cf6,#3b82f6);padding:40px 40px 32px;text-align:center}
  .hero-logo{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;margin-bottom:4px}
  .hero-tagline{color:rgba(255,255,255,0.75);font-size:13px}
  .hero h1{font-size:26px;font-weight:800;color:#fff;margin-top:24px;line-height:1.3}
  .hero p{color:rgba(255,255,255,0.85);font-size:15px;margin-top:8px;line-height:1.6}
  .body{padding:36px 40px}
  .credit-box{background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(59,130,246,0.08));border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center}
  .credit-box .number{font-size:48px;font-weight:900;background:linear-gradient(135deg,#8b5cf6,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
  .credit-box .label{font-size:15px;font-weight:600;color:#1a1a2e;margin-top:4px}
  .credit-box .sublabel{font-size:12px;color:#666;margin-top:4px}
  .steps{margin:28px 0}
  .step{display:flex;gap:16px;align-items:flex-start;margin-bottom:20px}
  .step-num{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .step-text strong{display:block;font-size:14px;color:#1a1a2e;margin-bottom:2px}
  .step-text span{font-size:13px;color:#666;line-height:1.5}
  .cta{text-align:center;margin:32px 0 16px}
  .cta a{display:inline-block;padding:14px 36px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 4px 16px rgba(139,92,246,0.3)}
  .footer{text-align:center;padding:24px 40px;background:#f9f9fb;border-top:1px solid #f0f0f5}
  .footer p{font-size:12px;color:#999;line-height:1.7}
  .footer a{color:#8b5cf6;text-decoration:none}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="hero">
      <div class="hero-logo">Nia Media</div>
      <div class="hero-tagline">AI-Powered Advertising for African Businesses</div>
      <h1>Welcome, ${firstName}! 🎉</h1>
      <p>You're about to create ads that actually convert — in seconds, not days.</p>
    </div>

    <div class="body">
      <p style="font-size:15px;color:#333;line-height:1.7">
        We built Nia Media for businesses like yours — ones that need professional advertising without the agency price tag. From social captions to radio scripts to WhatsApp campaigns, your AI is ready to go.
      </p>

      <div class="credit-box">
        <div class="number">1</div>
        <div class="label">Free Campaign Credit</div>
        <div class="sublabel">Already added to your account — no card needed</div>
      </div>

      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">
            <strong>Tell us about your business</strong>
            <span>Product name, target audience, and what makes you different.</span>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">
            <strong>AI generates a full campaign</strong>
            <span>Headlines, video scripts, WhatsApp copy, captions — all tailored to your audience.</span>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">
            <strong>Tweak anything, instantly</strong>
            <span>Not quite right? Click "Tweak" on any section and describe the change.</span>
          </div>
        </div>
      </div>

      <div class="cta">
        <a href="${appUrl}/new-campaign">Generate My First Campaign →</a>
      </div>

      <p style="font-size:13px;color:#999;text-align:center;margin-top:8px">
        Takes less than 2 minutes. No design skills needed.
      </p>
    </div>

    <div class="footer">
      <p>
        Questions? Reply to this email or chat with us on
        <a href="https://wa.me/254700000000">WhatsApp</a>.<br>
        © ${new Date().getFullYear()} Nia Media · Nairobi, Kenya<br>
        <a href="${appUrl}/settings">Manage notifications</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`
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
      <p>You signed up yesterday but haven't created a campaign yet</p>
    </div>

    <div class="body">
      <p style="font-size:15px;color:#333;line-height:1.7;margin-bottom:20px">
        Most businesses that try Nia Media generate their first campaign in under 3 minutes. Here's a quick tip to get the most out of it:
      </p>

      <div class="tip">
        <p><strong>Pro tip:</strong> Be specific about your target audience. Instead of "young people," try "young professionals aged 25–35 in Nairobi who want to invest but don't know where to start." The more specific, the more persuasive the copy.</p>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.7;margin:20px 0">
        Your 1 free credit covers a full campaign — video scripts, WhatsApp messages, social media captions, and more. After that, credits start at KES 500 each (or KES 4,000 for 12).
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
  .testimonial{background:#f9fdf9;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:24px 0}
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
        ${firstName}, businesses across Nairobi are replacing KES 20,000/month agency retainers with Nia Media credits at KES 500 each. Here's what they're saying:
      </p>

      <div class="testimonial">
        <p>"We used to spend KES 25,000 per month for a content agency that barely understood our market. With Nia Media, I generate better campaigns in 5 minutes that actually speak to Kenyan customers."</p>
        <div class="author">— James M., Real Estate Agent, Westlands</div>
      </div>

      <div class="testimonial">
        <p>"I use it every week for our restaurant specials on WhatsApp and Instagram. Customers always ask who does our marketing — they're surprised it's AI!"</p>
        <div class="author">— Amina K., Restaurant Owner, Kilimani</div>
      </div>

      <p style="font-size:14px;font-weight:600;color:#1a1a2e;margin:24px 0 12px">Top up your credits:</p>

      <div class="pricing">
        <div class="pkg">
          <div class="price">KES 500</div>
          <div class="credits">1 campaign</div>
        </div>
        <div class="pkg">
          <div class="price">KES 2,000</div>
          <div class="credits">5 campaigns</div>
          <div class="badge">Save KES 500</div>
        </div>
        <div class="pkg featured">
          <div class="price">KES 4,000</div>
          <div class="credits">12 campaigns</div>
          <div class="badge">Best value</div>
        </div>
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

  try {
    const { user_id, email, name } = await req.json() as {
      user_id: string
      email: string
      name: string
    }

    if (!user_id || !email || !name) {
      return new Response(JSON.stringify({ error: 'user_id, email, name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()

    // Email 1: send immediately
    const sent1 = await sendEmail(
      email,
      `Welcome to Nia Media, ${name.split(' ')[0]}! 🎉 Your free credit is ready`,
      welcomeEmailHtml(name, APP_URL)
    )

    // Emails 2 & 3: queue for later (day 2, day 5)
    const day2 = new Date(now); day2.setDate(day2.getDate() + 2)
    const day5 = new Date(now); day5.setDate(day5.getDate() + 5)

    await supabase.from('email_queue').insert([
      {
        user_id,
        recipient_email: email,
        recipient_name: name,
        email_type: 'day2_nudge',
        scheduled_at: day2.toISOString(),
        status: 'pending',
      },
      {
        user_id,
        recipient_email: email,
        recipient_name: name,
        email_type: 'day5_social_proof',
        scheduled_at: day5.toISOString(),
        status: 'pending',
      },
    ])

    return new Response(JSON.stringify({ ok: true, email1_sent: sent1 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('send-welcome-sequence error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
