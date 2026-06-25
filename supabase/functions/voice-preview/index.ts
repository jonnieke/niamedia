import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
// Map Nia Media voice IDs → ElevenLabs voice IDs
// Override any by setting ELEVENLABS_VOICE_{ID} secrets in Supabase Dashboard
const DEFAULT_VOICE_MAP: Record<string, string> = {
  // Kids (6–12) — bright, clear voices
  "af-child-f": "MF3mGyEYCl7XYWbV9V6O", // Elli — youthful female
  "af-child-m": "GBv7mTt0atIp3Br8iCZE", // Thomas — light young male
  // Teens (13–19) — energetic, expressive
  "af-teen-f":  "AZnzlk1XvdvUeBnXmlld", // Domi — energetic young female
  "af-teen-m":  "TxGEqnHWrfWFTfGW9XjX", // Josh — young adult male
  // Young Adults (20–35) — African regional accents
  "km-f": "Xb7hH8MSUJpSbSDYk0k2",       // Alice  — Kenyan English female
  "km-m": "pNInz6obpgDQGcFmaJgB",       // Adam   — Kenyan English male
  "sw-f": "EXAVITQu4vr4xnSDxMaL",       // Bella  — Swahili female
  "sw-m": "29vD33N1BoEC8qjEqPPe",       // Drew   — Swahili male
  "ng-f": "XB0fDUnXU5powFXDhCwa",       // Charlotte — Nigerian English female
  "sa-m": "2EiwWnXFnvU5JabPnv8n",       // Clyde  — South African English male
  // Mature Adults (35–55) — composed, warm
  "af-mature-f": "oWAxZDx7w5VEj9dCyTzz", // Grace — warm mature female
  "af-mature-m": "VR6AewLTigWG4xSOukaG", // Arnold — mature male
  // Elders (55+) — measured, authoritative
  "af-elder-f": "ThT5KcBeYPX3keUQqHPh",  // Dorothy — older female
  "af-elder-m": "pqHfZKP75CvOlQylNhV4",  // Bill — older male
}

// Voice settings tuned per age group
const VOICE_SETTINGS: Record<string, { stability: number; similarity_boost: number; style?: number; use_speaker_boost?: boolean }> = {
  "af-child-f":  { stability: 0.45, similarity_boost: 0.80, style: 0.40, use_speaker_boost: true },
  "af-child-m":  { stability: 0.45, similarity_boost: 0.80, style: 0.40, use_speaker_boost: true },
  "af-teen-f":   { stability: 0.50, similarity_boost: 0.75, style: 0.55 },
  "af-teen-m":   { stability: 0.50, similarity_boost: 0.75, style: 0.55 },
  "af-mature-f": { stability: 0.70, similarity_boost: 0.80, style: 0.20 },
  "af-mature-m": { stability: 0.70, similarity_boost: 0.80, style: 0.20 },
  "af-elder-f":  { stability: 0.82, similarity_boost: 0.78, style: 0.08 },
  "af-elder-m":  { stability: 0.82, similarity_boost: 0.78, style: 0.08 },
}

const DEFAULT_VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75 }

const DEFAULT_PREVIEW_TEXT = "This is Nia Media — Africa's creative platform. Bringing your brand to life."

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY")
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Voice preview not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const { voiceId, text } = await req.json()
    if (!voiceId) {
      return new Response(JSON.stringify({ error: "voiceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    // If caller provides custom text, use first 200 chars; otherwise use default
    const previewText = text ? String(text).slice(0, 200) : DEFAULT_PREVIEW_TEXT

    // 1. Check DB for a live cloned voice (highest priority)
    const { createClient } = await import("npm:@supabase/supabase-js@2")
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )
    const { data: cloned } = await supabase
      .from("voice_profiles")
      .select("elevenlabs_voice_id")
      .eq("slot_id", voiceId)
      .eq("status", "ready")
      .maybeSingle()

    // 2. Fall back: secret override → static map
    const secretKey = `ELEVENLABS_VOICE_${(voiceId as string).toUpperCase().replace(/-/g, "_")}`
    const elevenVoiceId = cloned?.elevenlabs_voice_id
      ?? Deno.env.get(secretKey)
      ?? DEFAULT_VOICE_MAP[voiceId as string]

    if (!elevenVoiceId) {
      return new Response(JSON.stringify({ error: `Unknown voice: ${voiceId}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: previewText,
          model_id: "eleven_multilingual_v2",
          voice_settings: VOICE_SETTINGS[voiceId as string] ?? DEFAULT_VOICE_SETTINGS,
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      // Return 502 so clients don't confuse ElevenLabs errors with Supabase auth errors
      return new Response(JSON.stringify({ error: `TTS error ${response.status}: ${err.slice(0, 300)}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Return base64-encoded audio so supabase-js invoke() can handle it as JSON
    const audioBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(audioBuffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)

    return new Response(JSON.stringify({ audio: base64 }), {
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
