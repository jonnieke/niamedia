import Anthropic from "npm:@anthropic-ai/sdk"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeaders(req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  let reservationId: string | null = null
  let brandMemory = ""
  let isFreeTier = false
  let userId: string | null = null
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  try {
    const form = await req.json()

    const authHeader = req.headers.get("Authorization") ?? ""
    const token = authHeader.replace("Bearer ", "")

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_free_tier, free_campaigns_used, free_campaigns_reset_at")
          .eq("id", user.id)
          .single()

        isFreeTier = profile?.is_free_tier ?? true
        if (isFreeTier) {
          const resetDate = new Date(profile?.free_campaigns_reset_at || new Date())
          const now = new Date()
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          const used = resetDate < monthAgo ? 0 : (profile?.free_campaigns_used ?? 0)

          if (used >= 1) {
            return new Response(
              JSON.stringify({
                error: "free_tier_limit",
                friendly:
                  "You've used your free campaign this month! Upgrade to unlimited: 5 campaigns for KES 2,000, or monthly plans from KES 2,500.",
              }),
              { status: 402, headers: { ...cors, "Content-Type": "application/json" } }
            )
          }
        } else {
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

        if (!txId) {
          return new Response(JSON.stringify({ error: "insufficient_credits" }), {
            status: 402,
            headers: { ...cors, "Content-Type": "application/json" },
          })
        }
        reservationId = txId as string

        if (!isFreeTier) {
          const { data: kit } = await supabase
            .from("brand_kits")
            .select("tagline, selling_points, common_offers, customer_objections, competitors, words_to_use, words_to_avoid, common_questions, brand_memory")
            .eq("user_id", user.id)
            .single()

          if (kit) {
            const lines = [
              kit.tagline && `Tagline: ${kit.tagline}`,
              kit.selling_points && `Key selling points: ${kit.selling_points}`,
              kit.common_offers && `Common offers: ${kit.common_offers}`,
              kit.customer_objections && `Customer objections to overcome: ${kit.customer_objections}`,
              kit.common_questions && `Common customer questions: ${kit.common_questions}`,
              kit.competitors && `Competitors: ${kit.competitors}`,
              kit.words_to_use && `Words to use: ${kit.words_to_use}`,
              kit.words_to_avoid && `Words to avoid: ${kit.words_to_avoid}`,
              kit.brand_memory && `Always remember: ${kit.brand_memory}`,
            ].filter(Boolean)

            if (lines.length) {
              brandMemory = `\n\nBRAND MEMORY (apply to all copy - stay on-brand, honor words-to-use and words-to-avoid, and address objections):\n${lines.join("\n")}`
            }
          }
        }
      }
    } else {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
        ?? req.headers.get("cf-connecting-ip")
        ?? "unknown"
      const dayKey = new Date().toISOString().slice(0, 10)
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

    const LANG_INSTRUCTIONS: Record<string, string> = {
      sw: "LANGUAGE: Generate all copy in Kiswahili. Use natural, conversational Swahili that feels authentic to Kenyan business communication, not a literal translation.",
      sheng: "LANGUAGE: Generate copy in light Sheng, the urban Kenyan mix of Swahili and English, but keep it professional and widely understood.",
      mixed: "LANGUAGE: Generate copy in a natural mix of English and Kiswahili, the way many Kenyan businesses actually speak to customers on WhatsApp and social media.",
      conversational: "LANGUAGE: Generate copy in Kenyan conversational English - warm, direct, everyday spoken English as used in Nairobi business, not formal or corporate.",
    }
    const languageInstruction = LANG_INSTRUCTIONS[form.language as string]
      ? `\n\n${LANG_INSTRUCTIONS[form.language as string]}`
      : ""

    const REGULATED_INSTRUCTIONS: Record<string, string> = {
      "Health & Wellness": "HEALTH INSTRUCTION: Use careful, compliant wording. Do not promise cures, guaranteed outcomes, medical certainty, or misleading before-and-after claims. Keep claims modest, practical, and trustworthy.",
      "Fintech / SACCO": "FINANCE INSTRUCTION: Use careful, compliant wording. Do not imply guaranteed returns, instant approval certainty, or risk-free financial outcomes. Be clear, responsible, and specific about the offer without exaggeration.",
      Education: "EDUCATION INSTRUCTION: Use careful, compliant wording. Do not guarantee admissions, exam success, scholarships, or life outcomes. Keep the message encouraging, clear, and parent-student friendly.",
      "Faith & Community": "FAITH AND COMMUNITY INSTRUCTION: Create respectful, welcoming, non-exploitative copy suitable for churches, mosques, ministries, community groups, outreach programs, and faith-based events. Avoid exaggerated spiritual claims, manipulative fundraising language, or insensitive wording.",
    }
    const regulatedInstruction = REGULATED_INSTRUCTIONS[form.industry as string]
      ? `\n\n${REGULATED_INSTRUCTIONS[form.industry as string]}`
      : ""

    const prompt = `You are an expert marketing copywriter specialising in Kenyan small businesses. Generate a complete campaign for the following brief. Write in a voice that feels genuine and locally resonant, use the tone specified, avoid corporate jargon, and make each platform's copy feel native to that platform.

Business: ${form.business_name} (${form.industry})
Product or Service: ${form.product_name}
Objective: ${form.objective}
Target Audience: ${form.target_audience}
Location: ${form.location}
Offer: ${form.offer}
Tone: ${form.tone}
Platforms: ${(form.platforms as string[]).join(", ")}
Call to Action: ${form.cta}
WhatsApp Number: ${form.whatsapp_number || "Not provided"}
Additional Notes: ${form.notes || "None"}${languageInstruction}${regulatedInstruction}

WhatsApp is the number one sales channel for Kenyan SMEs, so make every WhatsApp message ready to send. If a WhatsApp number is provided, weave a "chat with us on WhatsApp" line into CTAs naturally.

Also produce: a YouTube Shorts or Reel script that is punchier and vertical, a practical 7-day content calendar with one concrete post per day across the chosen platforms, and three lead follow-up messages for prospects who enquired but have not bought yet.${brandMemory}

Generate copy that a Kenyan small business owner would be proud to publish. Be specific, commercially useful, locally aware, and avoid generic filler.`

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
                  angle: { type: "string" as const, description: "The core campaign angle or positioning" },
                  painPoint: { type: "string" as const, description: "The key pain point this campaign addresses" },
                  keyMessage: { type: "string" as const, description: "The single most important message" },
                  platforms: { type: "array" as const, items: { type: "string" as const }, description: "Recommended platforms from the brief" },
                  cta: { type: "string" as const, description: "Primary call to action phrase" },
                },
              },
              videoScript: {
                type: "object" as const,
                required: ["hook", "scene1", "scene2", "scene3", "callToAction", "visualDirection"],
                properties: {
                  hook: { type: "string" as const, description: "Opening hook - the first 3 seconds" },
                  scene1: { type: "string" as const, description: "Scene 1 narration or on-screen action" },
                  scene2: { type: "string" as const, description: "Scene 2 narration or on-screen action" },
                  scene3: { type: "string" as const, description: "Scene 3 narration or on-screen action" },
                  callToAction: { type: "string" as const, description: "Final CTA with contact details" },
                  visualDirection: { type: "string" as const, description: "Brief direction on visual style, colors, and mood" },
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
                  instagram: { type: "string" as const, description: "Instagram caption with line breaks and hashtags" },
                  tiktok: { type: "string" as const, description: "TikTok caption - casual and short" },
                  linkedin: { type: "string" as const, description: "LinkedIn post - professional and story-driven" },
                },
              },
              whatsapp: {
                type: "object" as const,
                required: ["status", "broadcast", "reply"],
                properties: {
                  status: { type: "string" as const, description: "Short WhatsApp Status text" },
                  broadcast: { type: "string" as const, description: "Broadcast message to existing contacts" },
                  reply: { type: "string" as const, description: "Auto-reply or follow-up message template" },
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
                  hook: { type: "string" as const, description: "First 2 seconds for a vertical short" },
                  script: { type: "string" as const, description: "Full 30-45s vertical short script" },
                  caption: { type: "string" as const, description: "YouTube Shorts caption with hashtags" },
                },
              },
              contentCalendar: {
                type: "array" as const,
                description: "Exactly 7 entries, one per day",
                items: {
                  type: "object" as const,
                  required: ["day", "platform", "format", "idea", "caption"],
                  properties: {
                    day: { type: "string" as const },
                    platform: { type: "string" as const },
                    format: { type: "string" as const },
                    idea: { type: "string" as const },
                    caption: { type: "string" as const },
                  },
                },
              },
              followUps: {
                type: "object" as const,
                required: ["firstFollowUp", "secondFollowUp", "finalFollowUp"],
                properties: {
                  firstFollowUp: { type: "string" as const },
                  secondFollowUp: { type: "string" as const },
                  finalFollowUp: { type: "string" as const },
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

    if (reservationId) {
      await supabase.rpc("commit_credit", { p_tx_id: reservationId })
    }

    let output = toolUse.input as Record<string, unknown>

    if (isFreeTier && userId) {
      // Filter free tier output: remove shorts, calendar, follow-ups; mark poster as watermarked
      const { youtubeShorts, contentCalendar, followUps, ...freeTierOutput } = output
      output = {
        ...freeTierOutput,
        _freeTier: true,
        _posterWatermarked: true,
      }
      // Update free campaign count
      const now = new Date()
      await supabase
        .from("profiles")
        .update({
          free_campaigns_used: 1,
          free_campaigns_reset_at: now.toISOString(),
        })
        .eq("id", userId)
    }

    return new Response(JSON.stringify(output), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    if (reservationId) {
      try { await supabase.rpc("refund_credit", { p_tx_id: reservationId }) } catch { /* best effort */ }
    }
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message, friendly: "We couldn't generate your campaign just now. No credit was used - please try again." }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
