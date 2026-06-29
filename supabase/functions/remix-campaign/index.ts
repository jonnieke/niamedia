import Anthropic from "npm:@anthropic-ai/sdk"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { data: { user }, error: authErr } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  ).auth.getUser()

  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { campaignId, currentContent, newTone, newOffer, newAudience } = await req.json().catch(() => ({}))

  if (!campaignId || !currentContent) {
    return new Response(JSON.stringify({ error: "campaignId and currentContent required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  // Verify the campaign belongs to this user
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("id, business_name, industry, product_name, objective, target_audience, location, offer, tone, cta, content")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (campErr || !campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const effectiveTone = newTone || campaign.tone
  const effectiveOffer = newOffer || campaign.offer
  const effectiveAudience = newAudience || campaign.target_audience

  const changes: string[] = []
  if (newTone && newTone !== campaign.tone) changes.push(`tone changed from "${campaign.tone}" to "${newTone}"`)
  if (newOffer && newOffer !== campaign.offer) changes.push(`offer updated to "${newOffer}"`)
  if (newAudience && newAudience !== campaign.target_audience) changes.push(`target audience changed to "${newAudience}"`)

  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })

  const prompt = `You are a senior copywriter remixing an existing marketing campaign for a Kenyan business.

BUSINESS: ${campaign.business_name} (${campaign.industry})
PRODUCT: ${campaign.product_name}
OBJECTIVE: ${campaign.objective}
LOCATION: ${campaign.location}
CTA: ${campaign.cta}

REMIX CHANGES: ${changes.length ? changes.join("; ") : "Freshen up the copy with a new angle"}
NEW TONE: ${effectiveTone}
NEW OFFER: ${effectiveOffer}
NEW AUDIENCE: ${effectiveAudience}

EXISTING COPY (for reference — do not copy, use as context only):
WhatsApp broadcast: ${currentContent.whatsapp?.broadcast ?? ""}
Instagram: ${currentContent.captions?.instagram ?? ""}
Poster headline: ${currentContent.posterCopy?.headline ?? ""}
Video hook: ${currentContent.videoScript?.hook ?? ""}

Rewrite ONLY the following sections with the new parameters. Keep the same business facts but completely refresh the voice, angle, and energy to match the remix changes.

Return a JSON object with exactly these keys:
{
  "whatsapp": {
    "broadcast": "new WhatsApp broadcast message, emoji-rich, ready to send to 200 contacts",
    "status": "new WhatsApp status (short, punchy, 1-2 lines)",
    "reply": "new reply template for enquiries"
  },
  "captions": {
    "facebook": "new Facebook caption",
    "instagram": "new Instagram caption with hashtags",
    "tiktok": "new TikTok caption",
    "linkedin": "new LinkedIn caption"
  },
  "posterCopy": {
    "headline": "new poster headline — punchy and specific",
    "subheadline": "new subheadline",
    "offerText": "the offer in 1 line",
    "cta": "${campaign.cta}"
  },
  "videoScript": {
    "hook": "new scroll-stopping hook line (first 2 seconds)",
    "scene1": "scene 1 script",
    "scene2": "scene 2 script",
    "scene3": "scene 3 script",
    "callToAction": "closing CTA"
  }
}

Return ONLY valid JSON. No markdown, no explanation. Every line of copy must feel native to Kenya — specific, not generic.`

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}"
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return new Response(JSON.stringify({ error: "Generation failed" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const remixed = JSON.parse(jsonMatch[0])

  return new Response(JSON.stringify({ success: true, remixed, changes }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
