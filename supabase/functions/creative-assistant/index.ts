import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import Anthropic from "npm:@anthropic-ai/sdk"

const SYSTEM_PROMPT = `You are Nia Creative Assistant, a Kenyan creative director, campaign strategist, copywriter, video producer, and SME marketing advisor. You help business owners turn rough ideas into clear campaigns. You are practical, warm, sharp, locally aware, and commercially focused. You do not give generic content. You ask useful questions only when necessary, but you can also propose strong ideas quickly. Your goal is to help the user move from idea to campaign execution.

You help with: campaign ideas, offer sharpening, audience targeting, WhatsApp copy, poster concepts, video scripts, 7-day content calendars, brand positioning, lead follow-up, creative direction, and production briefs.

TONE: Warm, sharp, practical, locally aware. Not corporate, minimal jargon, confident but helpful. Write like a Nairobi creative director talking to a business owner: direct and useful. Keep replies tight; use short paragraphs or compact lists. WhatsApp is the #1 sales channel for Kenyan SMEs, so make WhatsApp angles prominent.

LANGUAGE: Match the user. Support English, Kiswahili, Kenyan conversational English, light-Sheng (professional), and mixed English/Kiswahili. Never use fake claims, exaggerated guarantees, or manipulative language. For health, finance, education, and faith/community, keep wording careful and compliant.

STRUCTURED OUTPUT: When you propose a concrete campaign idea, also call the propose_campaign_idea tool with a sharp, ready-to-use idea that can be turned into a campaign brief. Include the business industry when you can infer it. If the user is only exploring or you need more info, just reply in text without the tool.`

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  try {
    const { messages, brandContext } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[]
      brandContext?: string
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "no_messages" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const system = brandContext
      ? `${SYSTEM_PROMPT}\n\nBRAND CONTEXT (use this in every suggestion):\n${brandContext}`
      : SYSTEM_PROMPT

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system,
      tools: [
        {
          name: "propose_campaign_idea",
          description: "Propose a concrete, ready-to-use campaign idea the user can save or turn into a full campaign. Only call when you have a real idea, not when asking a clarifying question.",
          input_schema: {
            type: "object" as const,
            required: ["idea_title", "campaign_angle", "target_audience", "offer", "platforms"],
            properties: {
              idea_title: { type: "string" as const, description: "Short, punchy name for the idea" },
              industry: { type: "string" as const, description: "Business industry or sector if known" },
              campaign_angle: { type: "string" as const, description: "The core sales angle or hook in 1-2 sentences" },
              target_audience: { type: "string" as const, description: "Who this targets, specific to Kenya where possible" },
              offer: { type: "string" as const, description: "The concrete offer or value proposition" },
              platforms: { type: "array" as const, items: { type: "string" as const }, description: "Recommended platforms such as WhatsApp, Instagram, Facebook, TikTok, YouTube Shorts" },
              whatsapp_message: { type: "string" as const, description: "A ready-to-send WhatsApp broadcast or status message" },
              poster_concept: { type: "string" as const, description: "One-line poster concept or headline direction" },
              video_concept: { type: "string" as const, description: "One-line short-video concept" },
              next_actions: { type: "array" as const, items: { type: "string" as const }, description: "2-4 suggested next steps" },
            },
          },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    let reply = ""
    let idea: Record<string, unknown> | null = null
    for (const block of response.content) {
      if (block.type === "text") reply += block.text
      else if (block.type === "tool_use" && block.name === "propose_campaign_idea") idea = block.input as Record<string, unknown>
    }
    if (!reply && idea) reply = "Here is a campaign idea you can build on below."

    return new Response(JSON.stringify({ reply, idea }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message, friendly: "Nia couldn't respond just now. Please try again." }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
