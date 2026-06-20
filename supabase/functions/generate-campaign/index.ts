import Anthropic from "npm:@anthropic-ai/sdk"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const form = await req.json()

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

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
Additional Notes: ${form.notes || "None"}

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
            required: ["strategy", "videoScript", "posterCopy", "captions", "whatsapp", "landingPage"],
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

    return new Response(JSON.stringify(toolUse.input), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
