import { createClient } from "npm:@supabase/supabase-js@2"
import Anthropic from "npm:@anthropic-ai/sdk@0.27"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const authHeader = req.headers.get("Authorization")
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader ?? "" } } },
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } })
  }

  const { year, month } = await req.json().catch(() => ({}))
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? (now.getMonth() + 1) // 1-based

  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

  // Get brand kit + recent campaigns for context
  const [brandRes, campsRes] = await Promise.all([
    service.from("brand_kits").select("business_name, industry, preferred_tone, tagline, target_audience").eq("user_id", user.id).maybeSingle(),
    service.from("campaigns").select("title, content, metadata").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
  ])

  const brand = brandRes.data
  const camps = campsRes.data ?? []

  // Extract campaign snippets
  const campContext = camps.map((c: { title: string; content: string; metadata: Record<string, unknown> }) => {
    try {
      const content = JSON.parse(c.content)
      return `- Campaign: "${c.title}" | Offer: ${content.strategy?.offer ?? ""} | Audience: ${content.strategy?.targetAudience ?? ""}`
    } catch {
      return `- Campaign: "${c.title}"`
    }
  }).join("\n")

  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate()
  const monthName = new Date(targetYear, targetMonth - 1, 1).toLocaleString("en-KE", { month: "long" })

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })

  const completion = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: `You are a social media content strategist for Kenyan SMEs. Generate a content calendar for ${monthName} ${targetYear}.

BUSINESS CONTEXT:
Business: ${brand?.business_name ?? "the business"} (${brand?.industry ?? "general"})
Target audience: ${brand?.target_audience ?? "Kenyan consumers"}
Tone: ${brand?.preferred_tone ?? "Friendly"}
${brand?.tagline ? `Tagline: ${brand.tagline}` : ""}

ACTIVE CAMPAIGNS:
${campContext || "No active campaigns yet"}

INSTRUCTIONS:
Generate exactly 20 content items spread across ${daysInMonth} days of ${monthName} ${targetYear}.
Mix content types: caption (Instagram/Facebook), whatsapp (WhatsApp status/broadcast), story (Instagram/Facebook story), idea (content idea to explore).
Use a ratio of roughly: 8 captions, 5 whatsapp, 4 stories, 3 ideas.

Kenyan context: reference relevant Kenyan events, culture, M-Pesa, WhatsApp culture, local holidays if applicable.
Each piece should be ready to post or very easy to adapt.

Return ONLY valid JSON, no markdown, no explanation:
{
  "items": [
    {
      "date": "${targetYear}-${String(targetMonth).padStart(2, "0")}-01",
      "type": "caption",
      "content": "Full ready-to-post content here"
    }
  ]
}`,
    }],
  })

  let items: { date: string; type: string; content: string }[] = []
  try {
    const raw = (completion.content[0] as { type: string; text: string }).text.trim()
    const parsed = JSON.parse(raw)
    items = parsed.items ?? []
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse calendar from AI" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  // Delete existing calendar for this month before inserting new
  const monthStart = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`
  const monthEnd = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`
  await service.from("content_calendar")
    .delete()
    .eq("user_id", user.id)
    .gte("scheduled_date", monthStart)
    .lte("scheduled_date", monthEnd)

  // Insert new items
  const rows = items.map((item) => ({
    user_id: user.id,
    scheduled_date: item.date,
    content_type: item.type,
    content: item.content,
    status: "idea",
  }))

  const { error: insertErr } = await service.from("content_calendar").insert(rows)
  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ generated: items.length, month: `${targetYear}-${targetMonth}` }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
