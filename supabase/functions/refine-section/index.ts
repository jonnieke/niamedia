import Anthropic from "npm:@anthropic-ai/sdk"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { label, currentContent, feedback, briefContext } = await req.json() as {
      label: string
      currentContent: string
      feedback: string
      briefContext: string
    }

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 450,
      system: `You are an expert marketing copywriter for Kenyan businesses. Refine the provided marketing copy based on the user's feedback.

Return ONLY the refined copy — no explanations, no preamble, no labels, no quotes around the output. Just the copy itself, ready to publish.

Keep the same general purpose and platform as the original. Apply the feedback precisely.`,
      messages: [{
        role: "user",
        content: `Section: ${label}
Business: ${briefContext}

Current copy:
${currentContent}

Feedback: ${feedback}

Return the refined copy only.`,
      }],
    })

    const refined = (response.content[0] as { type: string; text: string }).text?.trim() ?? currentContent

    return new Response(JSON.stringify({ refined }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
