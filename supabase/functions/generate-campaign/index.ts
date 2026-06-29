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
          .select("is_free_tier, free_campaigns_used, free_campaigns_reset_at, credits")
          .eq("id", user.id)
          .single()

        const userCredits = (profile?.credits ?? 0) as number
        isFreeTier = userCredits === 0 && (profile?.is_free_tier ?? true)

        if (userCredits > 0) {
          // Paid user with credits — reserve 1 credit
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
        } else {
          // No credits — enforce free tier limit (1/month)
          const resetDate = new Date(profile?.free_campaigns_reset_at || new Date())
          const now = new Date()
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          const used = resetDate < monthAgo ? 0 : (profile?.free_campaigns_used ?? 0)

          if (used >= 1) {
            return new Response(
              JSON.stringify({
                error: "free_tier_limit",
                friendly:
                  "You've used your free campaign this month! Upgrade to unlock more: 5 campaigns for KES 2,000, or monthly plans from KES 2,500.",
              }),
              { status: 402, headers: { ...cors, "Content-Type": "application/json" } }
            )
          }
        }

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

    /* ── Optional: research the business URL + parse uploaded documents (parallel) ── */
    const profileLines: string[] = []
    const sourceTags: string[] = []

    function extractProfileLines(p: Record<string, unknown>) {
      const lines: string[] = []
      if (p.businessDescription) lines.push(`About: ${p.businessDescription}`)
      if (Array.isArray(p.productsServices) && p.productsServices.length) lines.push(`Products/Services: ${(p.productsServices as string[]).join(", ")}`)
      if (Array.isArray(p.uniqueSellingPoints) && p.uniqueSellingPoints.length) lines.push(`What sets them apart: ${(p.uniqueSellingPoints as string[]).join(", ")}`)
      if (p.targetAudience) lines.push(`Their customer: ${p.targetAudience}`)
      if (p.pricePoints) lines.push(`Pricing: ${p.pricePoints}`)
      if (p.socialProof) lines.push(`Proof/credentials: ${p.socialProof}`)
      if (p.keyOffers) lines.push(`Current offers: ${p.keyOffers}`)
      return lines
    }

    const researchTasks: Promise<void>[] = []

    // URL research
    if (form.business_url && typeof form.business_url === "string" && (form.business_url as string).startsWith("http")) {
      researchTasks.push((async () => {
        try {
          const resRes = await supabase.functions.invoke("research-url", { body: { url: form.business_url } })
          if (resRes.data?.success && resRes.data?.profile) {
            const lines = extractProfileLines(resRes.data.profile as Record<string, unknown>)
            if (lines.length) { profileLines.push(...lines); sourceTags.push(`website: ${form.business_url}`) }
          }
        } catch { /* best-effort */ }
      })())
    }

    // Document parsing (parallel — one call per file)
    const docPaths = Array.isArray(form.document_paths) ? (form.document_paths as string[]) : []
    for (const storagePath of docPaths) {
      researchTasks.push((async () => {
        try {
          const docRes = await supabase.functions.invoke("parse-document", {
            body: { storage_path: storagePath },
          })
          if (docRes.data?.success && docRes.data?.profile) {
            const lines = extractProfileLines(docRes.data.profile as Record<string, unknown>)
            if (lines.length) { profileLines.push(...lines); sourceTags.push(`document: ${docRes.data.fileName ?? storagePath}`) }
          }
        } catch { /* best-effort */ }
      })())
    }

    await Promise.allSettled(researchTasks)

    let researchContext = ""
    if (profileLines.length > 0) {
      researchContext = `\n\nVERIFIED BUSINESS INTELLIGENCE (sourced from: ${sourceTags.join(", ")}):\n${profileLines.join("\n")}\n\nDIRECTIVE: Weave specific details from this research into your copy. Name actual products. Use real prices. Echo genuine social proof. Specificity from verified research is what makes copy trustworthy.`
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

    const platforms = ((form.platforms as string[]) ?? []).join(", ") || "WhatsApp, Instagram, Facebook"

    const prompt = `You are a senior marketing strategist and creative director with 15 years running campaigns for East African businesses. You have an obsession with specificity — you know that vague copy kills conversions, and that the most powerful marketing copy sounds like it was written by someone who knows the business intimately.

Your task: produce a complete, production-ready campaign kit for this brief. Every word must earn its place. No filler, no generic claims, no copy that could apply to any other business.

━━━ BUSINESS BRIEF ━━━
Business: ${form.business_name} (${form.industry})
Product / Service: ${form.product_name}
Campaign Objective: ${form.objective}
Target Audience: ${form.target_audience}
Location: ${form.location}
The Offer: ${form.offer}
Tone & Voice: ${form.tone}
Platforms: ${platforms}
Primary CTA: ${form.cta}
WhatsApp Number: ${form.whatsapp_number || "Not provided"}
Additional Context: ${form.notes || "None"}${researchContext}${brandMemory}${languageInstruction}${regulatedInstruction}

━━━ KENYA MARKET INTELLIGENCE ━━━
Apply throughout every output:
• WhatsApp is the #1 sales channel — every campaign must have a WhatsApp broadcast ready to copy-paste RIGHT NOW, with emoji, a clear offer, and a specific CTA
• M-Pesa is the default payment — reference it naturally where it fits ("Pay via M-Pesa", "Lipa na M-Pesa")
• Nairobi audiences are ad-blind — only specifics cut through. "Quality service" = ignored. "Delivered to Westlands in 2 hours" = clicked
• Saturday morning 8–10am and Sunday evening are peak WhatsApp broadcast times in Kenya
• Instagram Reels outperform static posts 3:1 for under-35 Kenyan audiences
• Facebook Groups still dominate engagement for 35+ Kenyan consumers and B2B
• TikTok is the fastest-growing platform for Gen-Z and young professional audiences in Nairobi
• Price anchoring works extremely well in Kenya — always show value vs cost
• Social proof from real Kenyans (testimonials, client logos, known brands) converts better than any claim

━━━ QUALITY STANDARDS — NON-NEGOTIABLE ━━━
1. ZERO generic phrases: Never write "quality products", "excellent service", "affordable prices", "best in the market", "your one-stop shop", or any phrase that could appear in any other campaign
2. WhatsApp broadcast: Must be complete, emoji-appropriate, offer-clear, and CTA-specific — ready to send to 200 contacts with zero editing
3. Platform-native writing: Instagram caption ≠ Facebook post ≠ WhatsApp message. Each must feel like it was written by someone who lives on that platform
4. Content calendar: 7 genuinely different creative angles — behind-the-scenes, customer story, educational tip, UGC-style post, limited offer, product close-up, social proof. NOT 7 variations of the same product pitch
5. Follow-up messages: Warm and personal, like a friend texting — not a sales robot. Each must reference where the lead came from and create a natural reason to respond
6. Video hook: Must stop the scroll in 2 seconds. If it could appear on any other business's video, it is not good enough. Rewrite until it is specific to THIS business
7. Landing page benefits: Each benefit must address a real customer fear, desire, or objection — not a product feature
8. Poster headline: Punchy, specific, memorable — works as a standalone statement on a poster with no other context

Now generate the complete campaign. Make ${form.business_name} proud.`

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
