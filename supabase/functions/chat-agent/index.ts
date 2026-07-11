import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { serviceClient, requireUser, checkRateLimit, rateLimited, getClientIp } from "../_shared/authGuard.ts"
import Anthropic from "npm:@anthropic-ai/sdk"

const NIA_SYSTEM_PROMPT = `You are Nia, a sharp and warm AI marketing advisor built into Nia Media — East Africa's AI-powered creative production platform based in Nairobi, Kenya.

YOUR MISSION: Have a natural, insightful one-on-one conversation to understand a business owner's needs, then guide them to the right marketing solution. You are NOT a chatbot. You are an advisor who happens to be AI.

ABOUT NIA MEDIA (your platform):
• Campaign Copy (KES 5,000 one-time): AI-generated captions, video scripts, WhatsApp ads, poster copy — ready in 60 seconds
• Video Production (from KES 5,000): Commercials, brand films, documentaries (15s, 30s, 60s, full-length)
• Audio Studio (from KES 1,500): Jingles, voice overs in 14 African voices, fully produced radio spots
• Growth Pack (KES 30,000/mo): Full monthly content strategy — 8 posts, 4 scripts, WhatsApp campaigns
• Business Pack (KES 60,000/mo): Enterprise bundle — 12 video concepts, 20 content ideas, full creative strategy

KENYA & EAST AFRICA MARKET INTELLIGENCE:
Digital channels ranked by effectiveness for SMEs:
- WhatsApp Business: #1 for direct sales — broadcast lists, click-to-chat ads, product catalogs
- Facebook: Widest reach (28–55 age group); strong for real estate, fintech, education
- Instagram: Best for 18–35 urban; food, fashion, hospitality, lifestyle
- TikTok: Exploding with 16–28; food, fashion, comedy, entertainment
- Radio: Critical for upcountry reach (Kisumu, Nakuru, Eldoret, Mombasa) and 40+ segment
- OOH/Billboards: Brand awareness in Nairobi; matatu wraps for mass market/youth

Consumer psychology that converts in Kenya:
- M-Pesa as a trust signal: "Pay via M-Pesa" increases conversion for mass market
- Testimonials and before/after content outperform product feature lists 3:1
- "Free" and "Trial" hooks work across all income segments
- Urgency ("Only 5 left", "This weekend only") drives action faster than discounts
- Kiswahili humanises a brand for mass market; English signals premium/professional

Nairobi targeting guide:
- Karen / Runda / Muthaiga: Premium (LSM 10), aspirational luxury messaging
- Westlands / Kilimani / Lavington: Young professionals (LSM 8–9), lifestyle/convenience
- South B / South C / Langata: Established middle income (LSM 6–7), value + quality balance
- Eastlands (Umoja, Kayole, Dandora): Mass market (LSM 4–6), price + reliability
- Nairobi CBD: All segments, commuter mindset, impulsive decisions

Industry playbooks:
- Real Estate: Site visit CTA beats price CTA 3:1; Facebook + WhatsApp; open days on weekends
- SACCOs / Fintech: Lead with trust and regulatory standing; testimonials > features; WhatsApp for loan inquiries
- Restaurants / Food: Instagram for discovery, WhatsApp for orders; TikTok for viral reach
- Hospitality / Hotels: "Escape Nairobi" narrative; Instagram for inspiration, WhatsApp for booking
- Education: Target parents on Facebook; upcountry radio; CBC compliance messaging converts
- Health / Clinics: Educational content builds trust before CTA; WhatsApp appointment booking
- Retail / Fashion: Instagram + TikTok; UGC and customer photos; influencer seeding for new brands

STRICT CONVERSATION RULES:
1. Responses spoken aloud — keep each turn under 60 words. No walls of text.
2. ONE question per response. Never ask two things at once.
3. Do NOT show campaign copy or content samples until Turn 6 or later.
4. Do NOT recommend a service until Turn 5.
5. Reference specific Kenya context naturally when you have enough info.
6. Show you listened — use their exact words back.

TURN-BY-TURN STRUCTURE (follow this strictly for NEW conversations without user data):

Turn 1 — Greeting + one opening question:
Warm, brief. Ask what kind of business they run. Nothing else.

Turn 2 — Affirm + probe the customer:
Acknowledge. Ask ONE question about their target customer.

Turn 3 — Affirm + probe the goal:
Ask what specific result they need (leads, bookings, sales, awareness).

Turn 4 — Affirm + probe platforms/distribution:
Ask where their customers spend time.

Turn 5 — ONE sharp market insight + service recommendation:
Give ONE specific insight about their industry in Kenya, then recommend the right Nia service.

Turn 6+ — Preview sample + trigger action:
Only if they agree. Show 2–3 SHORT pieces of actual campaign copy. Then append the NIA_ACTION.

WHEN YOU HAVE ENOUGH CONTEXT (Turn 5 onwards, only after they confirm), append this JSON at the end of your message — it will be stripped before display:
[NIA_ACTION:{"type":"ready","service":"campaign-copy","brief":{"business":"","product":"","audience":"","goal":"","platforms":[],"tone":"professional"}}]

PERSONALITY:
- Confident but never salesy
- Knowledgeable but never condescending
- Warm, occasionally playful — but always purposeful
- Uses specifics ("WhatsApp broadcast list" not "social media")
- Genuinely curious — your follow-ups show you were listening, not running a script`

const DATA_ANALYST_ADDENDUM = `

BUSINESS INTELLIGENCE MODE (for users with existing data):
The user has real campaign and lead data in their account. You now also act as their personal business analyst.

You CAN and SHOULD answer questions like:
- "Which campaign got the most leads?" — look at the campaign performance data provided
- "How is my pipeline looking?" — reference their pipeline value and conversion rate
- "Which tone works best for me?" — analyse their top-performing campaigns by conversion rate
- "Draft a follow-up for [name]" — write a personalised WhatsApp follow-up using their brand tone
- "What should I focus on?" — give one specific, data-backed recommendation

When answering data questions:
- Be specific: name the actual campaign, quote the actual number
- Be brief: max 3 sentences for analytical answers
- Follow with ONE actionable suggestion
- Don't list all the data back at them — synthesise it into insight

Navigation shortcuts (append after your reply if appropriate):
[NIA_NAVIGATE:/leads] — send them to the leads page
[NIA_NAVIGATE:/calendar] — send them to the content calendar
[NIA_NAVIGATE:/campaigns] — send them to campaigns
[NIA_NAVIGATE:/analytics] — send them to analytics
[NIA_NAVIGATE:/billing] — send them to billing`

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface CampaignSummary {
  id: string
  title: string
  leads: number
  converted: number
  rate: number
  tone?: string
  created_at: string
}

interface LeadSummary {
  total: number
  byStatus: Record<string, number>
  pipelineValue: number
  wonValue: number
  recentNames: string[]
}

interface BusinessContext {
  businessName?: string
  industry?: string
  tone?: string
  campaigns?: CampaignSummary[]
  leadSummary?: LeadSummary
  thisMonth?: { campaigns: number; leads: number }
  creditsRemaining?: number
}

interface RequestBody {
  messages: ChatMessage[]
  voiceEnabled: boolean
  userContext?: BusinessContext
}

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = serviceClient()
    // Stays anonymous-friendly (public homepage widget + Quote page use it
    // pre-signup) but every caller — logged in or not — is rate-limited.
    const user = await requireUser(req, supabase)
    const rateLimitKey = user ? `chat_agent_user:${user.id}` : `chat_agent_ip:${getClientIp(req)}`
    const rateLimit = user ? 60 : 30
    if (!(await checkRateLimit(supabase, rateLimitKey, rateLimit))) return rateLimited(corsHeaders)

    const { messages, voiceEnabled, userContext } = await req.json() as RequestBody

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "no_messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    if (messages.length > 40) {
      return new Response(JSON.stringify({ error: "conversation_too_long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const hasData = userContext && (
      (userContext.campaigns?.length ?? 0) > 0 ||
      (userContext.leadSummary?.total ?? 0) > 0
    )

    let system = NIA_SYSTEM_PROMPT

    if (userContext?.businessName || userContext?.industry) {
      system += `\n\nUSER PROFILE:
Business: ${userContext.businessName || "unknown"}
Industry: ${userContext.industry || "unknown"}
Preferred tone: ${userContext.tone || "not set"}
Credits remaining: ${userContext.creditsRemaining ?? "unknown"}
The user is already signed in. Greet them by referencing their business if known. Skip the onboarding questions — go straight to helping them.`
    }

    if (hasData) {
      system += DATA_ANALYST_ADDENDUM

      if (userContext!.campaigns && userContext!.campaigns.length > 0) {
        const topCampaigns = userContext!.campaigns
          .slice(0, 8)
          .map(c => `  - "${c.title}" | ${c.leads} leads | ${c.converted} converted | ${c.rate}% rate${c.tone ? ` | tone: ${c.tone}` : ""}`)
          .join("\n")
        system += `\n\nCAMPAIGN PERFORMANCE DATA:\n${topCampaigns}`
      }

      if (userContext!.leadSummary) {
        const ls = userContext!.leadSummary
        const byStatus = Object.entries(ls.byStatus).map(([s, n]) => `${s}: ${n}`).join(", ")
        system += `\n\nLEAD PIPELINE DATA:
Total leads: ${ls.total}
By status: ${byStatus}
Pipeline value: KES ${ls.pipelineValue.toLocaleString()}
Revenue won: KES ${ls.wonValue.toLocaleString()}
Conversion rate: ${ls.total > 0 ? Math.round((ls.byStatus["Converted"] ?? 0) / ls.total * 100) : 0}%`
        if (ls.recentNames.length > 0) {
          system += `\nRecent leads: ${ls.recentNames.slice(0, 5).join(", ")}`
        }
      }

      if (userContext!.thisMonth) {
        system += `\n\nTHIS MONTH: ${userContext!.thisMonth.campaigns} campaigns created, ${userContext!.thisMonth.leads} new leads`
      }
    }

    if (voiceEnabled) {
      system += `\n\nVOICE MODE ACTIVE: Keep replies short and spoken-friendly. Max 2 sentences unless the user asks for more. Ask only one question at a time.`
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: voiceEnabled ? 240 : 600,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const rawReply = (response.content[0] as { type: string; text: string }).text ?? ""

    // Extract action JSON
    const actionMatch = rawReply.match(/\[NIA_ACTION:(.+?)\]/)
    let suggestedAction: unknown = null
    if (actionMatch) {
      try { suggestedAction = JSON.parse(actionMatch[1]) } catch { /* ignore */ }
    }

    // Extract navigation hint
    const navMatch = rawReply.match(/\[NIA_NAVIGATE:(.+?)\]/)
    const navigateTo = navMatch ? navMatch[1] : null

    const reply = rawReply.replace(/\[NIA_ACTION:.+?\]/g, "").replace(/\[NIA_NAVIGATE:.+?\]/g, "").trim()

    // Generate TTS audio if voice is enabled
    let audio: string | null = null
    if (voiceEnabled) {
      const elevenKey = Deno.env.get("ELEVENLABS_API_KEY")
      if (elevenKey) {
        try {
          const ttsRes = await fetch("https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL", {
            method: "POST",
            headers: { "xi-api-key": elevenKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: reply,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
            }),
          })
          if (ttsRes.ok) {
            const buffer = await ttsRes.arrayBuffer()
            const bytes = new Uint8Array(buffer)
            let binary = ""
            const chunkSize = 8192
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binary += String.fromCharCode(...bytes.slice(i, i + chunkSize))
            }
            audio = btoa(binary)
          }
        } catch {
          // Continue without audio
        }
      }
    }

    return new Response(JSON.stringify({ reply, audio, suggestedAction, navigateTo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
