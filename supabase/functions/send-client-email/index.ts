import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

const FROM = "Nia Media <hello@niamedia.co.ke>"
const APP_URL = Deno.env.get("APP_URL") ?? "https://niamedia.co.ke"

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a2e}
  .wrap{max-width:600px;margin:32px auto;padding:0 16px}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#8b5cf6,#3b82f6);padding:36px 40px;text-align:center}
  .logo{font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px}
  .tagline{color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px}
  .body{padding:32px 40px}
  h1{font-size:22px;font-weight:800;color:#1a1a2e;line-height:1.3;margin-bottom:12px}
  p{font-size:14px;color:#444;line-height:1.7;margin-bottom:14px}
  .box{background:#f9f9fb;border:1px solid #e8e8f0;border-radius:12px;padding:20px 24px;margin:20px 0}
  .box-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}
  .box-label{font-size:12px;color:#888}
  .box-value{font-size:14px;font-weight:600;color:#1a1a2e}
  .cta{text-align:center;margin:28px 0 12px}
  .btn{display:inline-block;padding:14px 36px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;font-weight:700;font-size:15px;text-decoration:none}
  .footer{text-align:center;padding:20px 40px;background:#f9f9fb;border-top:1px solid #f0f0f5}
  .footer p{font-size:11px;color:#999;line-height:1.7}
  .green{color:#059669;font-weight:700}
  .wa{display:inline-block;padding:12px 28px;border-radius:12px;background:#25d366;color:#fff;font-weight:700;font-size:14px;text-decoration:none;margin-top:8px}
</style></head>
<body><div class="wrap"><div class="card">
  <div class="hero"><div class="logo">Nia Media</div><div class="tagline">Video Commercials · AI Campaigns</div></div>
  <div class="body">${content}</div>
  <div class="footer"><p>Nia Media · Nairobi, Kenya · <a href="https://wa.me/254751822556" style="color:#8b5cf6">WhatsApp: 0751 822 556</a><br>© ${new Date().getFullYear()} Nia Media. All rights reserved.</p></div>
</div></div></body></html>`
}

type EmailType =
  | "proposal_sent"
  | "deposit_confirmed"
  | "brief_ready"
  | "brief_approved_admin"
  | "revision_requested_admin"

interface EmailPayload {
  type: EmailType
  to: string
  name?: string
  businessName: string
  proposalToken?: string
  briefToken?: string
  finalPrice?: number
  depositAmount?: number
  videoLength?: string
  clientFeedback?: string
  timelineDays?: number
}

function buildEmail(p: EmailPayload): { subject: string; html: string } {
  const first = (p.name ?? p.businessName).split(" ")[0]
  const fmt = (n: number) => `KES ${n.toLocaleString("en-KE")}`

  switch (p.type) {
    case "proposal_sent": {
      const link = `${APP_URL}/proposal/${p.proposalToken}`
      return {
        subject: `Your video commercial proposal is ready — ${p.businessName}`,
        html: base(`
          <h1>Your proposal is ready, ${first}!</h1>
          <p>We've put together a custom video commercial proposal for <strong>${p.businessName}</strong>. Review the details, see the pricing, and pay your deposit to kick off production.</p>
          ${p.finalPrice ? `<div class="box">
            <div class="box-row"><span class="box-label">Video length</span><span class="box-value">${p.videoLength ?? "—"}</span></div>
            <div class="box-row"><span class="box-label">Total price</span><span class="box-value">${fmt(p.finalPrice)}</span></div>
            ${p.depositAmount ? `<div class="box-row"><span class="box-label">Deposit to start</span><span class="box-value green">${fmt(p.depositAmount)}</span></div>` : ""}
          </div>` : ""}
          <div class="cta"><a href="${link}" class="btn">View My Proposal →</a></div>
          <p style="text-align:center;font-size:13px;color:#888">Or paste this link in your browser:<br><a href="${link}" style="color:#8b5cf6;word-break:break-all">${link}</a></p>
          <p>Questions? We're on WhatsApp — just reply there and our team will help.</p>
          <div class="cta"><a href="https://wa.me/254751822556" class="wa">WhatsApp Us</a></div>
        `),
      }
    }

    case "deposit_confirmed": {
      return {
        subject: `Deposit received — production starts within 24 hours`,
        html: base(`
          <h1>Deposit confirmed, ${first}!</h1>
          <p>We've received your deposit for the <strong>${p.businessName}</strong> video commercial. Your project is now in our production queue.</p>
          <div class="box">
            <div class="box-row"><span class="box-label">Deposit paid</span><span class="box-value green">${p.depositAmount ? fmt(p.depositAmount) : "Confirmed"}</span></div>
            <div class="box-row"><span class="box-label">Estimated delivery</span><span class="box-value">${p.timelineDays ?? 7} business days</span></div>
          </div>
          <p><strong>What happens next:</strong></p>
          <p>1. Our creative team will prepare your production brief within 24 hours.<br>
          2. You'll receive a link to review and approve the script and shot list.<br>
          3. Once approved, we begin filming and editing.</p>
          <p>We'll keep you updated via WhatsApp. Thank you for choosing Nia Media!</p>
          <div class="cta"><a href="https://wa.me/254751822556" class="wa">Message Our Team</a></div>
        `),
      }
    }

    case "brief_ready": {
      const link = `${APP_URL}/brief/${p.briefToken}`
      return {
        subject: `Your production brief is ready — please review and approve`,
        html: base(`
          <h1>Your brief is ready for review, ${first}!</h1>
          <p>Our creative team has prepared a full production brief for your <strong>${p.businessName}</strong> video commercial. This includes the script, shot list, music direction, and visual style.</p>
          <p>Please review everything carefully and click <strong>Approve</strong> to start production — or request changes if anything needs adjusting.</p>
          <div class="cta"><a href="${link}" class="btn">Review My Brief →</a></div>
          <p style="text-align:center;font-size:13px;color:#888">Or paste this link:<br><a href="${link}" style="color:#8b5cf6;word-break:break-all">${link}</a></p>
          <p>Once approved, production begins immediately and we target delivery within your agreed timeline.</p>
          <div class="cta"><a href="https://wa.me/254751822556" class="wa">Questions? WhatsApp Us</a></div>
        `),
      }
    }

    case "brief_approved_admin": {
      return {
        subject: `Brief approved — ${p.businessName} is ready for production`,
        html: base(`
          <h1>Brief approved by client</h1>
          <p><strong>${p.businessName}</strong> has approved their production brief. Production can start immediately.</p>
          <div class="box">
            <div class="box-row"><span class="box-label">Client</span><span class="box-value">${p.businessName}</span></div>
            <div class="box-row"><span class="box-label">Video</span><span class="box-value">${p.videoLength ?? "—"}</span></div>
          </div>
          <div class="cta"><a href="${APP_URL}/proposals" class="btn">View Proposals →</a></div>
        `),
      }
    }

    case "revision_requested_admin": {
      return {
        subject: `Revision requested — ${p.businessName}`,
        html: base(`
          <h1>Client requested a revision</h1>
          <p><strong>${p.businessName}</strong> has reviewed their production brief and requested changes.</p>
          ${p.clientFeedback ? `<div class="box"><p style="margin:0;font-size:14px;font-style:italic;color:#333">"${p.clientFeedback}"</p></div>` : ""}
          <div class="cta"><a href="${APP_URL}/proposals" class="btn">View Proposals →</a></div>
        `),
      }
    }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const apiKey = Deno.env.get("RESEND_API_KEY")
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Email not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const payload = await req.json() as EmailPayload
    const { subject, html } = buildEmail(payload)

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: payload.to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error: ${err}`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
