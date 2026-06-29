import Anthropic from "npm:@anthropic-ai/sdk"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { leadId, campaignId, userId, leadName, leadPhone, campaignTitle, campaignContent, businessName, tone } =
    await req.json().catch(() => ({}))

  if (!leadId || !campaignId || !userId || !leadPhone) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  // Check if follow-ups already exist for this lead
  const { data: existing } = await supabase
    .from("lead_follow_ups")
    .select("id")
    .eq("lead_id", leadId)
    .limit(1)

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ success: true, skipped: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const firstName = (leadName || "").split(" ")[0] || "there"
  const campaignBroadcast = campaignContent?.whatsapp?.broadcast ?? ""
  const campaignOffer = campaignContent?.strategy?.angle ?? ""

  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })

  const prompt = `You are writing 3 WhatsApp follow-up messages for ${businessName}, a Kenyan business.

A potential customer named ${firstName} (${leadPhone}) just enquired via their "${campaignTitle}" campaign landing page. Write 3 warm, conversational follow-up messages that feel like they're from a real person — not a bot.

BUSINESS: ${businessName}
CAMPAIGN: ${campaignTitle}
TONE: ${tone || "Friendly"}
CAMPAIGN OFFER: ${campaignOffer || campaignBroadcast || "their products/services"}

MESSAGE TIMING:
- Message 1: Sent 1 hour after enquiry — warm welcome, confirm interest, ask one qualifying question
- Message 2: Sent 24 hours later — share one specific reason why customers choose ${businessName}, soft nudge
- Message 3: Sent 72 hours later — final follow-up with a time-limited reason to act now

RULES:
- Each message starts with "Hi ${firstName}" or "Hey ${firstName}"
- WhatsApp-ready: use emoji naturally, keep it concise (3-5 lines max)
- Sound like a real person texting, NOT a corporate autoresponder
- Message 3 must include a gentle urgency without being pushy
- Do NOT use "I hope this message finds you well" or any generic opener

Return a JSON object:
{
  "message1": "...",
  "message2": "...",
  "message3": "..."
}

Return ONLY valid JSON.`

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}"
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return new Response(JSON.stringify({ error: "Failed to generate messages" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const msgs = JSON.parse(jsonMatch[0]) as { message1: string; message2: string; message3: string }

  const now = new Date()
  const rows = [
    {
      lead_id: leadId, campaign_id: campaignId, user_id: userId,
      message: msgs.message1, sequence_number: 1,
      scheduled_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // +1h
    },
    {
      lead_id: leadId, campaign_id: campaignId, user_id: userId,
      message: msgs.message2, sequence_number: 2,
      scheduled_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // +24h
    },
    {
      lead_id: leadId, campaign_id: campaignId, user_id: userId,
      message: msgs.message3, sequence_number: 3,
      scheduled_at: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(), // +72h
    },
  ]

  const { error } = await supabase.from("lead_follow_ups").insert(rows)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ success: true, scheduled: 3 }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
