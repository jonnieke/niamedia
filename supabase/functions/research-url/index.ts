import Anthropic from "npm:@anthropic-ai/sdk"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { url } = await req.json().catch(() => ({}))
  if (!url || typeof url !== "string") {
    return new Response(JSON.stringify({ error: "Missing url" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NiaMediaBot/1.0; +https://niamedia.co.ke)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()

    // Strip scripts, styles, navigation noise, then extract readable text
    const clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 7000)

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      messages: [{
        role: "user",
        content: `You are extracting business intelligence from a website for use in marketing campaign generation.

URL: ${url}

WEBSITE TEXT:
${clean}

Extract key business information and return a JSON object. Be specific — pull exact product names, actual prices, real testimonials, specific locations. Use null for any field you cannot find.

{
  "businessDescription": "2-3 specific sentences about exactly what this business does and who it serves",
  "productsServices": ["specific product/service names with details"],
  "uniqueSellingPoints": ["what genuinely differentiates this business from competitors"],
  "targetAudience": "specific description of who their customers are",
  "location": "city, area, or region where they operate",
  "pricePoints": "any specific prices, packages, or pricing info found",
  "socialProof": "client names, testimonials, awards, certifications, case study results",
  "contactInfo": "phone, email, WhatsApp numbers found",
  "brandTone": "the tone/voice the website uses (professional/friendly/luxury/bold/etc)",
  "keyOffers": "current promotions, deals, or signature offers mentioned"
}

Return ONLY valid JSON. No markdown, no explanation.`,
      }],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}"
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const profile = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return new Response(JSON.stringify({ success: true, profile, url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err), profile: null }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
