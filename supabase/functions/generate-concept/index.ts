import Anthropic from "npm:@anthropic-ai/sdk"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SCENE_COUNTS: Record<string, number> = {
  "commercial-15": 3,
  "commercial-30": 4,
  "commercial-60": 5,
  "documentary": 4,
  "short-film": 5,
}

const FORMAT_LABELS: Record<string, string> = {
  "commercial-15": "Television Commercial",
  "commercial-30": "Television Commercial",
  "commercial-60": "Brand Film Commercial",
  "documentary": "Mini Documentary",
  "short-film": "Short Film",
}

const DURATIONS: Record<string, string> = {
  "commercial-15": "15 seconds",
  "commercial-30": "30 seconds",
  "commercial-60": "60 seconds",
  "documentary": "3–5 minutes",
  "short-film": "5–10 minutes",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { brief, format } = await req.json()
    const sceneCount = SCENE_COUNTS[format] ?? 4

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const prompt = `You are a senior creative director and screenwriter specialising in Kenyan advertising and branded content. Generate a professional script concept brief for the following business idea.

Brief: ${brief}
Format: ${FORMAT_LABELS[format] ?? format} (${DURATIONS[format] ?? ""})
Number of scenes: ${sceneCount}

Write with the craft and specificity of an award-winning East African creative. Reference real Kenyan locations, sounds, cultural moments, and language nuances where relevant. Each scene should have cinematic direction that a real director can follow.`

    const sceneSchema = {
      type: "object" as const,
      required: ["number", "title", "timecode", "visual", "audio", "vo"] as string[],
      properties: {
        number: { type: "integer" as const },
        title: { type: "string" as const, description: "Short evocative scene title" },
        timecode: { type: "string" as const, description: "e.g. '0:00–0:07'" },
        visual: { type: "string" as const, description: "Specific camera direction, shot type, and on-screen action" },
        audio: { type: "string" as const, description: "Sound design, music cue, or ambient audio direction" },
        vo: { type: "string" as const, description: "Voice over narration or on-screen talent dialogue" },
        onScreen: { type: "string" as const, description: "Super / on-screen text (optional — only if needed)" },
      },
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        {
          name: "generate_concept",
          description: "Generate a professional film/ad concept brief",
          input_schema: {
            type: "object" as const,
            required: ["title", "logline", "synopsis", "scenes", "castNotes", "productionNotes"],
            properties: {
              title: { type: "string" as const, description: "Evocative concept title (3–6 words)" },
              logline: { type: "string" as const, description: "Single compelling sentence capturing the emotional core" },
              synopsis: {
                type: "string" as const,
                description: `2–3 paragraph synopsis separated by \\n\\n. Describe the narrative arc, key emotional beats, and what makes this concept unique for the Kenyan market.`,
              },
              scenes: {
                type: "array" as const,
                items: sceneSchema,
                description: `Exactly ${sceneCount} scenes with specific cinematic direction`,
              },
              castNotes: {
                type: "string" as const,
                description: "Casting direction as multi-line string (newline separated). Include voice type, age range, look, and performance notes.",
              },
              productionNotes: {
                type: "object" as const,
                required: ["recommendedStyle", "mood", "colorDirection", "musicDirection"],
                properties: {
                  recommendedStyle: { type: "string" as const },
                  mood: { type: "string" as const },
                  colorDirection: { type: "string" as const },
                  musicDirection: { type: "string" as const, description: "Specific genre, tempo, and Kenyan music reference if applicable" },
                },
              },
            },
          },
        },
      ],
      tool_choice: { type: "tool", name: "generate_concept" },
      messages: [{ role: "user", content: prompt }],
    })

    const toolUse = response.content.find((c) => c.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not return a concept")
    }

    const result = {
      ...(toolUse.input as Record<string, unknown>),
      id: `concept-${Date.now()}`,
      format: FORMAT_LABELS[format] ?? format,
      duration: DURATIONS[format] ?? "",
      generatedAt: new Date().toISOString(),
    }

    return new Response(JSON.stringify(result), {
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
