import Anthropic from "npm:@anthropic-ai/sdk"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeaders(req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  // Reservation id for the credit held during generation. Committed on success,
  // refunded if anything fails, so a failed generation never costs the user a credit.
  let reservationId: string | null = null
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  try {
    const form = await req.json()

    const authHeader = req.headers.get("Authorization") ?? ""
    const token = authHeader.replace("Bearer ", "")

    if (token) {
      // Authenticated user — reserve a credit (committed only after a successful generation)
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        const { data: txId } = await supabase.rpc("reserve_credit", {
          p_user_id: user.id,
          p_description: `Campaign: ${form.product_name ?? "untitled"}`,
        })
        if (!txId) {
          return new Response(JSON.stringify({ error: "insufficient_credits" }), {
            status: 402,
            headers: { ...cors, "Content-Type": "application/json" },
          })
        }
        reservationId = txId as string
      }
    } else {
      // Unauthenticated demo — rate-limit to 5 per IP per day
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
        ?? req.headers.get("cf-connecting-ip")
        ?? "unknown"
      const dayKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const rateLimitKey = `demo_rate:${ip}:${dayKey}`

      const { data: existing } = await supabase
        .from("demo_rate_limits")
        .select("count")
        .eq("key", rateLimitKey)
        .maybeSingle()

      const count = (existing?.count ?? 0) as number
      if (count >= 5) {
        return new Response(
          JSON.stringify({ error: "demo_limit_reached", message: "You've used today's free demo limit. Sign up for full access." }),
          { status: 429, headers: { ...cors, "Content-Type": "application/json" } },
        )
      }

      await supabase.from("demo_rate_limits").upsert(
        { key: rateLimitKey, count: count + 1, last_used: new Date().toISOString() },
        { onConflict: "key" },
      )
    }

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const languageInstruction = form.language === "sw"
      ? "\n\nLANGUAGE: Generate ALL copy in Kiswahili. Use natural, conversational Swahili that feels authentic to Kenyan business communication — not a translation, but copy that a native Swahili speaker would write. Where English brand names or terms are standard, keep them."
      : ""

    const prompt = `You are an expert marketing copywriter specialising in Kenyan small businesses. Generate a complete campaign for the following brief. Write in a voice that feels genuine and locally resonant — use the tone specified, avoid corporate jargon, and make each platform's copy feel native to that platform.

Business: ${form.business_name} (${form.industry})
Product/Service: ${form.product_name}
Objective: ${form.objective}
Target Audience: ${form.target_audience}
Location: ${form.location}
Offer: ${form.offer}
Tone: ${form.tone}
Platforms: ${(form.platforms as string[]).join(", ")}
Call to Action: ${form.cta}
WhatsApp Number: ${form.whatsapp_number || "Not provided"}
Additional Notes: ${form.notes || "None"}${languageInstruction}${form.industry === 'Faith & Community' ? '\n\nFAITH & COMMUNITY INSTRUCTION: Create respectful, welcoming, non-exploitative copy suitable for churches, mosques, ministries, community groups, outreach programs, and faith-based events. Avoid exaggerated spiritual claims, manipulative fundraising language, or insensitive wording. Keep tone warm, clear, and community-centered.' : ''}

WhatsApp is the #1 sales channel for Kenyan SMEs — make every WhatsApp message ready to send. If a WhatsApp number is provided, weave a "chat with us on WhatsApp" line into CTAs naturally.

Also produce: a YouTube Shorts / Reel script (separate from the main video script — punchier, vertical, 30–45s), a practical 7-day content calendar (one concrete post per day across the chosen platforms), and three lead follow-up messages for prospects who enquired but haven't bought (first nudge, value reminder, final friendly close).

Generate copy that a Kenyan small business owner would be proud to publish. Be specific, be compelling, avoid generic filler.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        {
          name: "generate_campaign_content",
          description: "Generate complete marketing campaign content structured by channel",
          input_schema: {
            type: "object" as const,
            required: ["strategy", "videoScript", "posterCopy", "captions", "whatsapp", "landingPage", "youtubeShorts", "contentCalendar", "followUps"],
            properties: {
              strategy: {
                type: "object" as const,
                required: ["angle", "painPoint", "keyMessage", "platforms", "cta"],
                properties: {
                  angle: { type: "string" as const, description: "The core campaign angle / positioning" },
                  painPoint: { type: "string" as const, description: "The key pain point this campaign addresses" },
                  keyMessage: { type: "string" as const, description: "The single most important message" },
                  platforms: { type: "array" as const, items: { type: "string" as const }, description: "Recommended platforms (use the ones from the brief)" },
                  cta: { type: "string" as const, description: "Primary call to action phrase" },
                },
              },
              videoScript: {
                type: "object" as const,
                required: ["hook", "scene1", "scene2", "scene3", "callToAction", "visualDirection"],
                properties: {
                  hook: { type: "string" as const, description: "Opening hook — first 3 seconds, must grab attention" },
                  scene1: { type: "string" as const, description: "Scene 1 narration / on-screen action (problem or relatability)" },
                  scene2: { type: "string" as const, description: "Scene 2 narration / on-screen action (solution / product)" },
                  scene3: { type: "string" as const, description: "Scene 3 narration / on-screen action (social proof / outcome)" },
                  callToAction: { type: "string" as const, description: "Final CTA with contact details" },
                  visualDirection: { type: "string" as const, description: "Brief direction on visual style, colours, and mood" },
                },
              },
              posterCopy: {
                type: "object" as const,
                required: ["headline", "subheadline", "offerText", "cta", "designDirection"],
                properties: {
                  headline: { type: "string" as const },
                  subheadline: { type: "string" as const },
                  offerText: { type: "string" as const, description: "Formatted offer details, bullet-friendly" },
                  cta: { type: "string" as const },
                  designDirection: { type: "string" as const, description: "Layout and design guidance" },
                },
              },
              captions: {
                type: "object" as const,
                required: ["facebook", "instagram", "tiktok", "linkedin"],
                properties: {
                  facebook: { type: "string" as const, description: "Full Facebook post caption with hashtags" },
                  instagram: { type: "string" as const, description: "Instagram caption — punchy, with line breaks and hashtags" },
                  tiktok: { type: "string" as const, description: "TikTok caption — casual, short, trending style" },
                  linkedin: { type: "string" as const, description: "LinkedIn post — professional, story-driven" },
                },
              },
              whatsapp: {
                type: "object" as const,
                required: ["status", "broadcast", "reply"],
                properties: {
                  status: { type: "string" as const, description: "Short WhatsApp Status text (max 5 lines)" },
                  broadcast: { type: "string" as const, description: "Broadcast message to existing contacts" },
                  reply: { type: "string" as const, description: "Auto-reply / follow-up message template" },
                },
              },
              landingPage: {
                type: "object" as const,
                required: ["headline", "subheadline", "benefits", "cta", "faqs"],
                properties: {
                  headline: { type: "string" as const },
                  subheadline: { type: "string" as const },
                  benefits: { type: "array" as const, items: { type: "string" as const }, description: "6 bullet-point benefits" },
                  cta: { type: "string" as const },
                  faqs: {
                    type: "array" as const,
                    items: {
                      type: "object" as const,
                      required: ["question", "answer"],
                      properties: {
                        question: { type: "string" as const },
                        answer: { type: "string" as const },
                      },
                    },
                    description: "4 FAQs",
                  },
                },
              },
              youtubeShorts: {
                type: "object" as const,
                required: ["hook", "script", "caption"],
                properties: {
                  hook: { type: "string" as const, description: "First 2 seconds — a scroll-stopping line for a vertical short" },
                  script: { type: "string" as const, description: "Full 30-45s vertical short script with on-screen text and spoken lines, punchier than the main video" },
                  caption: { type: "string" as const, description: "YouTube Shorts caption with relevant hashtags" },
                },
              },
              contentCalendar: {
                type: "array" as const,
                description: "Exactly 7 entries, one per day (Day 1 to Day 7), each a concrete post for the chosen platforms",
                items: {
                  type: "object" as const,
                  required: ["day", "platform", "format", "idea", "caption"],
                  properties: {
                    day: { type: "string" as const, description: "e.g. 'Day 1'" },
                    platform: { type: "string" as const, description: "The platform for this post" },
                    format: { type: "string" as const, description: "e.g. Reel, Status, Carousel, Photo, Broadcast" },
                    idea: { type: "string" as const, description: "Short description of the post concept" },
                    caption: { type: "string" as const, description: "Ready-to-post caption / message for that day" },
                  },
                },
              },
              followUps: {
                type: "object" as const,
                required: ["firstFollowUp", "secondFollowUp", "finalFollowUp"],
                properties: {
                  firstFollowUp: { type: "string" as const, description: "First gentle nudge to a lead who enquired but didn't buy (WhatsApp-ready)" },
                  secondFollowUp: { type: "string" as const, description: "Value reminder / overcome objection follow-up" },
                  finalFollowUp: { type: "string" as const, description: "Final friendly close with light urgency" },
                },
              },
            },
          },
        },
      ],
      tool_choice: { type: "tool", name: "generate_campaign_content" },
      messages: [{ role: "user", content: prompt }],
    })

    const toolUse = response.content.find((c) => c.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not return structured content")
    }

    // Generation succeeded — commit the reserved credit.
    if (reservationId) {
      await supabase.rpc("commit_credit", { p_tx_id: reservationId })
    }

    return new Response(JSON.stringify(toolUse.input), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    // Generation failed — refund the reserved credit so the user is not charged.
    if (reservationId) {
      try { await supabase.rpc("refund_credit", { p_tx_id: reservationId }) } catch { /* best effort */ }
    }
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message, friendly: "We couldn't generate your campaign just now. No credit was used — please try again." }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
