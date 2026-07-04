import Anthropic from "npm:@anthropic-ai/sdk"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })
    const form = await req.json()

    const brief = `
Business: ${form.business_name} (${form.industry})
Promoting: ${form.product_name}
Goal: ${form.objective}
Offer: ${form.offer || "none specified"}
Target audience: ${form.target_audience}
Location: ${form.location || "Kenya"}
Platforms: ${(form.platforms || []).join(", ")}
Tone: ${form.tone}
CTA: ${form.cta}
Campaign type: ${form.campaign_type || "social + WhatsApp"}
Notes: ${form.notes || "none"}
`

    const systemPrompt = `You are a senior marketing strategist with deep expertise in the Kenyan and East African market.
Analyze this campaign brief and provide genuinely useful strategic research — not generic advice.
Be specific to the industry, product, and Kenyan market context.

Return ONLY valid JSON in this exact format (no markdown fences, no extra text):
{
  "marketContext": "2-3 sentences about the current market landscape for this specific industry in Kenya. Include a relevant trend or insight.",
  "messagingAngles": [
    {
      "title": "Short angle name (3-5 words)",
      "description": "What this angle emphasizes and why it works for this audience",
      "hook": "A compelling opening line or headline using this angle"
    },
    {
      "title": "...",
      "description": "...",
      "hook": "..."
    },
    {
      "title": "...",
      "description": "...",
      "hook": "..."
    }
  ],
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "platformTips": [
    { "platform": "Platform name", "tip": "Specific, actionable tip for this campaign on this platform" }
  ],
  "competitorWatch": "One specific insight about the competitive landscape — what competitors are doing wrong that this brand can exploit",
  "budgetNote": "Brief practical advice on where to focus spend or effort given the goal and platforms",
  "advisoryNote": "One honest piece of strategic advice — something the client might not have considered"
}`

    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: `Campaign brief:\n${brief}` }],
    })

    const text = (res.content[0] as { text: string }).text.trim()
    let research: unknown
    try {
      const match = text.match(/\{[\s\S]*\}/)
      research = JSON.parse(match?.[0] ?? text)
    } catch {
      return new Response(JSON.stringify({ error: "Research generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify(research), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("campaign-research error:", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
