import Anthropic from "npm:@anthropic-ai/sdk"
import { createClient } from "npm:@supabase/supabase-js@2"

// Twilio webhook — receives incoming WhatsApp messages and replies with AI.
// Configure this URL in your Twilio console:
//   POST https://{project}.supabase.co/functions/v1/whatsapp-webhook
//
// Twilio sends application/x-www-form-urlencoded.
// We reply with TwiML XML to send a message back.

function twiml(body: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message></Response>`
  return new Response(xml, { headers: { "Content-Type": "text/xml" } })
}

function normalizePhone(raw: string): string {
  // Strip whatsapp: prefix
  return raw.replace(/^whatsapp:/, "").trim()
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const db = createClient(supabaseUrl, supabaseKey)
    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    // Parse Twilio form body
    const text = await req.text()
    const params = new URLSearchParams(text)
    const from = normalizePhone(params.get("From") ?? "")
    const toNumber = normalizePhone(params.get("To") ?? "")
    const body = (params.get("Body") ?? "").trim()

    if (!from || !body) return twiml("Sorry, could not process your message.")

    // ── Find which business owns this Twilio number ────────────
    // First try: match by whatsapp_business_number in profiles
    let { data: ownerProfile } = await db
      .from("profiles")
      .select("id, name, ai_responder_enabled, ai_responder_greeting, whatsapp_business_number")
      .eq("whatsapp_business_number", toNumber)
      .eq("ai_responder_enabled", true)
      .single()

    // Fallback: if shared Twilio sandbox number, look up by lead's phone
    if (!ownerProfile) {
      const { data: lead } = await db
        .from("leads")
        .select("user_id, name")
        .eq("phone", from)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (lead) {
        const { data: profile } = await db
          .from("profiles")
          .select("id, name, ai_responder_enabled, ai_responder_greeting")
          .eq("id", lead.user_id)
          .eq("ai_responder_enabled", true)
          .single()
        ownerProfile = profile
      }
    }

    if (!ownerProfile) {
      // No business found or AI disabled — silent drop
      return new Response("", { status: 200 })
    }

    const ownerId: string = ownerProfile.id

    // ── Get or create conversation ────────────────────────────
    let { data: conv } = await db
      .from("whatsapp_conversations")
      .select("*")
      .eq("user_id", ownerId)
      .eq("lead_phone", from)
      .single()

    const incomingMsg = { role: "user" as const, content: body, ts: new Date().toISOString() }

    if (!conv) {
      // New conversation — also create or update the lead record
      const { data: existingLead } = await db
        .from("leads")
        .select("id, name")
        .eq("user_id", ownerId)
        .eq("phone", from)
        .single()

      let leadId: string | null = existingLead?.id ?? null
      let leadName: string = existingLead?.name ?? "New Customer"

      if (!existingLead) {
        const { data: newLead } = await db.from("leads").insert({
          user_id: ownerId,
          name: "WhatsApp Lead",
          phone: from,
          source: "WhatsApp",
          interest_level: "Warm",
          status: "New",
          notes: `Incoming WhatsApp message: "${body.slice(0, 100)}"`,
        }).select("id").single()
        leadId = newLead?.id ?? null
        leadName = "WhatsApp Lead"
      }

      const { data: newConv } = await db.from("whatsapp_conversations").insert({
        user_id: ownerId,
        lead_id: leadId,
        lead_phone: from,
        lead_name: leadName,
        messages: [incomingMsg],
        unread_count: 1,
        last_message_at: new Date().toISOString(),
      }).select("*").single()
      conv = newConv
    } else {
      // Append message
      const messages = [...(conv.messages ?? []), incomingMsg]
      await db.from("whatsapp_conversations").update({
        messages,
        unread_count: (conv.unread_count ?? 0) + 1,
        last_message_at: new Date().toISOString(),
      }).eq("id", conv.id)
      conv = { ...conv, messages }
    }

    // ── If AI is paused, don't reply ──────────────────────────
    if (conv?.ai_paused) {
      return new Response("", { status: 200 })
    }

    // ── Build AI context ──────────────────────────────────────
    const [brandRes, campaignRes] = await Promise.all([
      db.from("brand_kits").select("business_name, industry, preferred_tone, brand_voice").eq("user_id", ownerId).single(),
      db.from("campaigns").select("title, metadata").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(3),
    ])

    const brand = brandRes.data
    const campaigns = (campaignRes.data ?? []).map(c => (c.metadata as Record<string, string>)?.product_name ?? c.title).join(", ")

    const systemPrompt = `You are a helpful WhatsApp customer service assistant for ${brand?.business_name ?? "this business"}, a ${brand?.industry ?? "business"} in Kenya.

Your job: respond to customer enquiries in a warm, helpful way that matches the brand's ${brand?.preferred_tone ?? "professional"} tone.

${brand?.brand_voice ? `Brand voice: ${brand.brand_voice}` : ""}
${campaigns ? `Recent products/services: ${campaigns}` : ""}

Rules:
- Keep responses SHORT (2-4 sentences max — this is WhatsApp)
- Greet customers by name if known
- Always end with one clear action (book, call, visit link, reply to confirm)
- If you don't know something specific, say you'll connect them with the team
- Use Kenyan English naturally
- Never make up prices or dates you don't know
- If they ask to speak to a human, say "Let me connect you with our team right away" and stop responding`

    // Build message history for Claude (last 10 messages)
    const history = (conv.messages ?? []).slice(-10)
    const claudeMessages = history.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" as const : "assistant" as const,
      content: m.content,
    }))

    const aiRes = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const reply = (aiRes.content[0] as { text: string }).text ?? "Thank you for your message! We'll be in touch soon."

    // Store the AI reply in conversation
    const replyMsg = { role: "assistant" as const, content: reply, ts: new Date().toISOString() }
    const updatedMessages = [...(conv.messages ?? []), replyMsg]
    await db.from("whatsapp_conversations").update({
      messages: updatedMessages,
      last_message_at: new Date().toISOString(),
    }).eq("id", conv.id)

    return twiml(reply)
  } catch (err) {
    console.error("whatsapp-webhook error:", err)
    return twiml("Sorry, we're experiencing a technical issue. Please try again shortly.")
  }
})
