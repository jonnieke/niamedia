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
      .select("id, name, ai_responder_enabled, ai_responder_greeting, whatsapp_business_number, role")
      .eq("whatsapp_business_number", toNumber)
      .eq("ai_responder_enabled", true)
      .maybeSingle()

    // Fallback 1: if shared Twilio sandbox number, look up by lead's phone
    if (!ownerProfile) {
      const { data: lead } = await db
        .from("leads")
        .select("user_id, name")
        .eq("phone", from)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lead) {
        const { data: profile } = await db
          .from("profiles")
          .select("id, name, ai_responder_enabled, ai_responder_greeting, role")
          .eq("id", lead.user_id)
          .eq("ai_responder_enabled", true)
          .maybeSingle()
        ownerProfile = profile
      }
    }

    // Fallback 2: Direct inbound lead to Nia Media agency admin profile
    if (!ownerProfile) {
      const { data: adminProfile } = await db
        .from("profiles")
        .select("id, name, ai_responder_enabled, ai_responder_greeting, role")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle()

      if (adminProfile) {
        ownerProfile = adminProfile
      }
    }

    if (!ownerProfile) {
      // Direct Nia Media concierge fallback so no client is ever ignored
      return twiml(
        `Hi! 👋 Welcome to Nia Media.\n\nWe produce high-converting commercial video ads & social campaigns for Kenyan brands in 24–48 hours.\n\n` +
        `• 30s Social Hook: KES 2,000 (~$15)\n` +
        `• 30s Standard Commercial: KES 8,000 (~$65)\n` +
        `• 60s Full Brand Story: KES 15,000 (~$120)\n` +
        `• Content Retainers: From KES 15,000/mo (or KES 38,000 / 3-mo Termly Pass)\n\n` +
        `Calculate your exact price and get an instant quote in 60 seconds: https://niamedia.co.ke/quote\n\n` +
        `How can our creative team help your business today?`
      )
    }

    const ownerId: string = ownerProfile.id

    // ── Get or create conversation ────────────────────────────
    let { data: conv } = await db
      .from("whatsapp_conversations")
      .select("*")
      .eq("user_id", ownerId)
      .eq("lead_phone", from)
      .maybeSingle()

    const incomingMsg = { role: "user" as const, content: body, ts: new Date().toISOString() }

    if (!conv) {
      // New conversation — also create or update the lead record
      const { data: existingLead } = await db
        .from("leads")
        .select("id, name")
        .eq("user_id", ownerId)
        .eq("phone", from)
        .maybeSingle()

      let leadId: string | null = existingLead?.id ?? null
      let leadName: string = existingLead?.name ?? "WhatsApp Lead"

      if (!existingLead) {
        const { data: newLead } = await db.from("leads").insert({
          user_id: ownerId,
          name: "WhatsApp Lead",
          phone: from,
          source: "WhatsApp",
          interest_level: "Warm",
          status: "New",
          notes: `Incoming WhatsApp message: "${body.slice(0, 100)}"`,
        }).select("id").maybeSingle()
        leadId = newLead?.id ?? null
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
      db.from("brand_kits").select("business_name, industry, preferred_tone, brand_voice").eq("user_id", ownerId).maybeSingle(),
      db.from("campaigns").select("title, metadata").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(3),
    ])

    const brand = brandRes.data
    const campaigns = (campaignRes.data ?? []).map(c => (c.metadata as Record<string, string>)?.product_name ?? c.title).join(", ")

    const isNiaAgency = ownerProfile.role === "admin" || !brand || brand.business_name?.toLowerCase().includes("nia")

    const systemPrompt = isNiaAgency
      ? `You are Nia, the AI Creative Producer & Client Concierge for Nia Media (https://niamedia.co.ke), Kenya's premier video commercial production studio.
We produce high-impact, studio-grade video ads, matching promotional posters, and social campaigns for businesses across Kenya and the diaspora.

Key Studio Details:
- Turnaround: 48–72 hours standard (24h rush available for +50%).
- Video Packages:
  • 30s Startup Social Hook: KES 2,000 (~$15 USD) for micro-businesses & social feeds.
  • 30s Standard Commercial: KES 8,000 (~$65 USD) — our flagship tier with human Kenyan voice talent, custom editing, 2 revisions, and full commercial rights.
  • 60s Full Brand Story: KES 15,000 (~$120 USD) — complete campaign narrative.
  • 90s Deep Story: KES 20,000 (~$160 USD) — detailed product/app demonstration.
  • 3min+ Brand Film: KES 60,000 (~$480 USD) — mini-documentary & corporate infomercial.
  • Video & Poster Retainers: KES 15,000/month (2 videos + 2 posters) or KES 38,000 / 3-month Termly Pass (Save 15%).
- Voices: Professional Kenyan English, Swahili (Kiswahili Sanifu), Urban Sheng, and US/UK Global English.
- Every video project includes a FREE matching promotional poster for WhatsApp & social media.
- Terms: 70% deposit to start production, 30% milestone balance after reviewing and approving watermarked preview.
- Payments: M-Pesa, Visa, Mastercard via PesaPal.
- Instant Quote Link: https://niamedia.co.ke/quote

Rules:
- Keep responses concise (2-4 sentences max — this is WhatsApp).
- Warm, polite Kenyan English tone.
- Always include one helpful next step (e.g. invite them to get an instant quote at https://niamedia.co.ke/quote or ask what product they are promoting).
- If they ask for custom quotes or meeting, mention they can book at https://niamedia.co.ke/book-meeting or that our Creative Director will follow up shortly.`
      : `You are a helpful WhatsApp customer service assistant for ${brand?.business_name ?? "this business"}, a ${brand?.industry ?? "business"} in Kenya.

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
