import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const { business, description, targetAudience, audioType, packageLabel, mood, platforms, existing } = await req.json()

    const typeLabel: Record<string, string> = {
      jingle: "jingle / branded music",
      voiceover: "voice-over",
      "radio-spot": "radio spot",
    }

    const action = existing
      ? `Improve and expand this existing script direction (keep the key ideas, make it clearer and more detailed):\n"${existing}"`
      : `Write a script direction for this project.`

    const prompt = `You are a creative director at an African media agency specialising in audio content. ${action}

Project details:
- Business/brand name: ${business || "the client's brand"}
- What the business does: ${description || "not specified"}
- Target audience: ${targetAudience || "general Kenyan / African market"}
- Audio format: ${typeLabel[audioType] ?? audioType} (${packageLabel ?? ""})
- Mood/tone: ${mood || "upbeat and energetic"}
- Distribution platforms: ${platforms?.join(", ") || "general digital"}

Return a JSON object with exactly two fields:

"direction": A concise script direction (4-6 sentences) written FOR the voice artist/AI. Use imperative form ("Open with...", "Emphasise...", "Close with..."). Be specific to this business and target audience. No bullet points, flowing prose. Max 120 words.

"script": A ready-to-record sample script — the actual words the voice artist would say. It should match the format (${typeLabel[audioType] ?? audioType}, ${packageLabel ?? "standard length"}), mood (${mood || "upbeat"}), and feel authentic to the Kenyan/African market. Use natural punctuation only (commas, ellipses, em dashes) to imply pacing — NO stage directions, NO brackets, NO [pause] markers, NO labels. Just clean, speakable prose. Max 100 words.

Return valid JSON only. No markdown, no code fences, no extra text.`

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 250,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic error: ${err}`)
    }

    const json = await res.json()
    const raw = (json.content?.[0]?.text as string ?? "").trim()

    let direction = ""
    let script = ""
    try {
      // Strip markdown code fences Claude sometimes wraps around JSON
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
      // Extract the first {...} block in case there's any preamble
      const match = stripped.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match ? match[0] : stripped) as { direction?: string; script?: string }
      direction = parsed.direction ?? ""
      script = parsed.script ?? ""
    } catch {
      direction = raw
    }

    return new Response(JSON.stringify({ message: direction, script }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
