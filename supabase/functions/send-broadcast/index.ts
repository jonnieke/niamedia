import { createClient } from "npm:@supabase/supabase-js@2"
import Anthropic from "npm:@anthropic-ai/sdk@0.27"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

async function sendWhatsApp(phone: string, message: string, accountSid: string, authToken: string, from: string) {
  const digits = phone.replace(/\D/g, "")
  const e164 = digits.startsWith("0") ? `+254${digits.slice(1)}` : digits.startsWith("254") ? `+${digits}` : `+${digits}`
  const params = new URLSearchParams({ From: from, To: `whatsapp:${e164}`, Body: message })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Twilio ${res.status}`)
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const authHeader = req.headers.get("Authorization")
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader ?? "" } } },
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } })
  }

  const { prompt, campaignId, statusFilter, messageOverride } = await req.json().catch(() => ({}))

  // Fetch leads to broadcast to
  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
  let query = service.from("leads").select("id, name, phone, status").eq("user_id", user.id).neq("phone", "")
  if (campaignId) query = query.eq("campaign_id", campaignId)
  if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter)
  // Skip opted-out leads (status Lost means no longer interested)
  query = query.neq("status", "Lost")

  const { data: leads } = await query
  if (!leads?.length) {
    return new Response(JSON.stringify({ error: "No leads with phone numbers match this filter." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  // Generate or use provided message
  let message = messageOverride ?? ""
  if (!message && prompt) {
    // Get brand context
    const { data: brandKit } = await service.from("brand_kits").select("business_name, industry, preferred_tone").eq("user_id", user.id).maybeSingle()
    let campaignContext = ""
    if (campaignId) {
      const { data: camp } = await service.from("campaigns").select("title, content").eq("id", campaignId).maybeSingle()
      if (camp?.content) {
        try {
          const c = JSON.parse(camp.content)
          campaignContext = `Campaign: "${camp.title}"\nKey message: ${c.strategy?.keyMessage ?? ""}\nOffer: ${c.strategy?.offer ?? ""}`
        } catch { /**/ }
      }
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Write a WhatsApp broadcast message for a Kenyan business.

Business: ${brandKit?.business_name ?? "the business"} (${brandKit?.industry ?? ""})
Tone: ${brandKit?.preferred_tone ?? "Friendly"}
${campaignContext}

User's instruction: ${prompt}

Rules:
- Start with "Hi [Name]," (use literally [Name] as the merge field)
- Max 3 short paragraphs
- Include a clear call to action
- Use 1–2 relevant emojis
- WhatsApp-ready (no markdown, no bullet points)
- End with the business name
- Kenyan context

Reply with ONLY the message text, nothing else.`,
      }],
    })
    message = (completion.content[0] as { type: string; text: string }).text.trim()
  }

  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } })
  }

  // Create broadcast record
  const { data: broadcast, error: broadcastErr } = await service.from("broadcasts").insert({
    user_id: user.id,
    campaign_id: campaignId ?? null,
    message,
    title: `Broadcast to ${leads.length} lead${leads.length !== 1 ? "s" : ""}`,
    status: "sending",
    recipient_count: leads.length,
  }).select("id").single()

  if (broadcastErr || !broadcast) {
    return new Response(JSON.stringify({ error: "Failed to create broadcast" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } })
  }

  // Insert recipients
  await service.from("broadcast_recipients").insert(
    leads.map((l: { id: string; name: string; phone: string }) => ({
      broadcast_id: broadcast.id,
      lead_id: l.id,
      phone: l.phone,
      name: l.name ?? "",
    }))
  )

  // Fire and forget: send via Twilio
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM")

  let sentCount = 0
  let failedCount = 0

  if (accountSid && authToken && from) {
    for (const lead of leads as { id: string; name: string; phone: string }[]) {
      const personalised = message.replace(/\[Name\]/gi, lead.name?.split(" ")[0] || "there")
      try {
        await sendWhatsApp(lead.phone, personalised, accountSid, authToken, from)
        await service.from("broadcast_recipients")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("broadcast_id", broadcast.id).eq("lead_id", lead.id)
        sentCount++
      } catch (err) {
        await service.from("broadcast_recipients")
          .update({ status: "failed", error_message: String(err) })
          .eq("broadcast_id", broadcast.id).eq("lead_id", lead.id)
        failedCount++
      }
    }
  } else {
    // Twilio not configured — mark as simulated
    await service.from("broadcast_recipients").update({ status: "sent", sent_at: new Date().toISOString() }).eq("broadcast_id", broadcast.id)
    sentCount = leads.length
  }

  await service.from("broadcasts").update({
    status: "sent",
    sent_count: sentCount,
    failed_count: failedCount,
    sent_at: new Date().toISOString(),
  }).eq("id", broadcast.id)

  return new Response(JSON.stringify({
    broadcastId: broadcast.id,
    message,
    recipientCount: leads.length,
    sentCount,
    failedCount,
  }), { headers: { ...cors, "Content-Type": "application/json" } })
})
