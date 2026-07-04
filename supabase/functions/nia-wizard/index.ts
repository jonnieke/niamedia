import Anthropic from "npm:@anthropic-ai/sdk"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const INDUSTRIES = ["Real Estate","Hospitality","Education","Fintech / SACCO","Restaurant","Travel","Retail","Health & Wellness","Events","Professional Services","Faith & Community","Other"]
const OBJECTIVES = ["Get leads","Sell product","Promote offer","Increase bookings","Launch product","Grow social media","Drive WhatsApp enquiries"]
const TONES = ["Professional","Friendly","Bold","Luxury","Youthful","Emotional","Direct sales"]
const PLATFORMS = ["Facebook","Instagram","TikTok","YouTube Shorts","WhatsApp","LinkedIn"]

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

    const { message, currentForm, step, userId } = await req.json()

    // Load brand kit context if available
    let brandContext = ""
    if (userId) {
      const { data: brand } = await db.from("brand_kits")
        .select("business_name, industry, brand_voice, target_customer, preferred_tone")
        .eq("user_id", userId).single()
      if (brand) {
        brandContext = `\nKnown brand context: ${JSON.stringify(brand)}`
      }
    }

    const systemPrompt = `You are Nia, a warm and sharp marketing advisor helping a business owner fill in their campaign brief.
The user describes their business in natural language. Extract structured data from what they say.
${brandContext}

Valid industries: ${INDUSTRIES.join(", ")}
Valid objectives: ${OBJECTIVES.join(", ")}
Valid tones: ${TONES.join(", ")}
Valid platforms: ${PLATFORMS.join(", ")}

Current step: ${step}
Current form so far: ${JSON.stringify(currentForm)}

Respond with a JSON object in this EXACT format (no markdown, raw JSON only):
{
  "message": "Your warm, helpful 1-2 sentence response acknowledging what you understood",
  "updates": {
    "business_name": "...",
    "industry": "...",
    "product_name": "...",
    "objective": "...",
    "target_audience": "...",
    "location": "...",
    "offer": "...",
    "tone": "...",
    "platforms": [],
    "cta": "...",
    "notes": "..."
  }
}
Only include fields you can confidently extract. Leave others out.
The message should be conversational and confirm what you understood, then gently ask for the next thing if needed.`

    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        { role: "user", content: `The user says: "${message}"` }
      ],
      system: systemPrompt,
    })

    const text = (res.content[0] as { text: string }).text.trim()
    let parsed: { message: string; updates: Record<string, unknown> }
    try {
      // Extract JSON even if there's surrounding text
      const match = text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(match?.[0] ?? text)
    } catch {
      parsed = { message: "Got it! I've noted your details. Feel free to keep going or adjust anything.", updates: {} }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("nia-wizard error:", err)
    return new Response(JSON.stringify({ message: "I'm having a moment — try typing that again!", updates: {} }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
