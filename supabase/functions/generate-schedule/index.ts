import Anthropic from "npm:@anthropic-ai/sdk"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { serviceClient, requireUser, unauthorized, checkRateLimit, rateLimited } from "../_shared/authGuard.ts"

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabase = serviceClient()
    const user = await requireUser(req, supabase)
    if (!user) return unauthorized(corsHeaders)
    if (!(await checkRateLimit(supabase, `generate_schedule:${user.id}`, 15))) return rateLimited(corsHeaders)

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })
    const { campaign, startDate, platforms } = await req.json()

    const systemPrompt = `You are a social media strategist specializing in the Kenyan market.
Generate a 30-day content calendar from a campaign brief.
Return ONLY a JSON array of post objects — no markdown, no extra text.
Each post object:
{
  "day": 1-30,
  "date": "YYYY-MM-DD",
  "platform": "Facebook"|"Instagram"|"TikTok"|"WhatsApp"|"LinkedIn",
  "type": "hook"|"educational"|"testimonial"|"offer"|"engagement"|"behind-scenes"|"reminder",
  "caption": "Full post caption ready to publish — include emojis, hashtags where relevant",
  "hashtags": ["tag1","tag2"],
  "time": "HH:MM",
  "tip": "One-line note on why this post at this time"
}
Vary content types across the month. Use peak hours for Kenya: FB/IG 7-9am, 12-1pm, 7-9pm.
Include at least 2 posts per week per platform selected.`

    const start = new Date(startDate ?? new Date())
    const platformList = (platforms ?? ['Facebook', 'Instagram']).join(', ')

    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Campaign:
Business: ${campaign.business_name} (${campaign.industry})
Product: ${campaign.product_name}
Objective: ${campaign.objective}
Offer: ${campaign.offer}
Audience: ${campaign.target_audience}
Tone: ${campaign.tone}
Platforms: ${platformList}
CTA: ${campaign.cta}
Start date: ${start.toISOString().slice(0, 10)}

Generate a 30-day post schedule.`
      }],
    })

    const text = (res.content[0] as { text: string }).text.trim()
    const match = text.match(/\[[\s\S]*\]/)
    let posts: unknown[]
    try {
      posts = JSON.parse(match?.[0] ?? text)
    } catch {
      return new Response(JSON.stringify({ error: "Schedule generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("generate-schedule error:", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
