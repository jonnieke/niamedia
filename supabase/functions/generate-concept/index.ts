import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import Anthropic from "npm:@anthropic-ai/sdk"

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
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { brief, format } = await req.json()
    const sceneCount = SCENE_COUNTS[format] ?? 4

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })

    const prompt = `You are a senior creative director and screenwriter at a world-class Nairobi production house — think Strika Entertainment meets Ogilvy Africa. You write TV commercials and brand films that win Cannes Lions and go viral across East Africa.

BRIEF: ${brief}
FORMAT: ${FORMAT_LABELS[format] ?? format} (${DURATIONS[format] ?? ""})
SCENES: ${sceneCount}

LANGUAGE RULE — CRITICAL:
Write ALL voice-over, dialogue, and on-screen text in ENGLISH only. Do NOT use Swahili, Sheng, or any other language unless the brief EXPLICITLY requests it. Default is always English.

QUALITY STANDARD — CRITICAL:
Every VO line must be POWERFUL, SPECIFIC, and CINEMATIC. Avoid generic marketing clichés.
BAD (generic): "Our product helps you succeed." / "Experience the difference." / "Quality you can trust."
GOOD (award-winning): "Most people spend 12 years in school learning to be managed. Soma teaches you to think." / "Lagos has Dangote. Mombasa has the ocean. And now, it has you."
Each VO should feel like it belongs in a Super Bowl spot or a Cannes Film Festival short.

SCENE DIRECTION:
- Visual: Camera angle, lens choice, movement, what's on screen frame-by-frame
- Audio: Specific sound design (e.g. "Matatu engine fading, replaced by piano note") not just "music plays"
- VO: One or two punchy lines maximum per scene. Make every word earn its place.
- Reference real Nairobi/Kenya geography, textures, and cultural imagery for authenticity — but all copy stays in English.`

    const sceneSchema = {
      type: "object" as const,
      required: ["number", "title", "timecode", "visual", "audio", "vo"] as string[],
      properties: {
        number: { type: "integer" as const },
        title: { type: "string" as const, description: "Short evocative scene title" },
        timecode: { type: "string" as const, description: "e.g. '0:00–0:07'" },
        visual: { type: "string" as const, description: "Specific camera direction, shot type, and on-screen action" },
        audio: { type: "string" as const, description: "Sound design, music cue, or ambient audio direction" },
        vo: { type: "string" as const, description: "Voice-over narration or dialogue — ENGLISH ONLY. 1–2 punchy, cinematic lines maximum. Must be specific and emotionally powerful, not generic marketing copy. Think Cannes Lions quality." },
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
