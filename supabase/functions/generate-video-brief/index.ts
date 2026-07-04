import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

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
    const { briefId } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: brief } = await supabase
      .from("video_briefs")
      .select("*, proposals(what_to_promote, include_poster, include_subtitles, industry)")
      .eq("id", briefId)
      .single()

    if (!brief) throw new Error("Brief not found")

    const proposal = brief.proposals as {
      what_to_promote: string | null
      include_poster: boolean
      include_subtitles: boolean
      industry: string | null
    } | null

    const lengthSeconds: Record<string, number> = {
      "15s": 15, "30s": 30, "60s": 60, "90s": 90, "3 min+": 180,
    }
    const durationSec = lengthSeconds[brief.video_length] ?? 30
    const sceneCount = durationSec <= 15 ? 3 : durationSec <= 30 ? 4 : durationSec <= 60 ? 6 : 8

    const prompt = `You are a senior creative director at an award-winning African video production agency. Generate a complete production brief for the following video commercial.

Client: ${brief.business_name}
Industry: ${proposal?.industry ?? "General business"}
Video length: ${brief.video_length}
Platforms: ${brief.platforms.join(", ") || "Social media & digital"}
What to promote: ${proposal?.what_to_promote ?? brief.what_to_promote ?? "Their product/service"}
Delivery: ${brief.delivery_speed === "standard" ? "Standard (3-5 days)" : brief.delivery_speed === "48h" ? "48-hour rush" : "24-hour rush"}
Extras: ${[proposal?.include_poster && "Promo poster", proposal?.include_subtitles && "Subtitles"].filter(Boolean).join(", ") || "None"}

Return a JSON object with exactly these fields:

"script": The full video script. Include scene headings (SCENE 1, SCENE 2 etc), on-screen text, and voiceover lines clearly labelled. Write for the Kenyan/East African market. Conversational, persuasive, culturally relevant. Max ${Math.round(durationSec * 2.5)} words.

"shot_list": Array of exactly ${sceneCount} shot objects. Each object must have:
  - "scene": integer (1-based)
  - "duration": string like "3s" or "5s"
  - "visual": what the camera shows (1 sentence, vivid)
  - "audio": voiceover or music note for this scene (1 sentence)

"music_mood": 2 sentences. Specific genre/tempo recommendation + why it fits this brand.

"voiceover_notes": 2-3 sentences for the voice artist. Tone, pace, accent, energy level.

"visual_style": 2-3 sentences. Color palette, motion graphics style, filming aesthetic.

Return valid JSON only. No markdown. No code fences. No extra text outside the JSON.`

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`)

    const json = await res.json()
    const raw = (json.content?.[0]?.text as string ?? "").trim()

    let parsed: {
      script?: string
      shot_list?: unknown[]
      music_mood?: string
      voiceover_notes?: string
      visual_style?: string
    } = {}

    try {
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
      const match = stripped.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(match ? match[0] : stripped)
    } catch {
      parsed = { script: raw, shot_list: [], music_mood: "", voiceover_notes: "", visual_style: "" }
    }

    await supabase.from("video_briefs").update({
      script: parsed.script ?? "",
      shot_list: parsed.shot_list ?? [],
      music_mood: parsed.music_mood ?? "",
      voiceover_notes: parsed.voiceover_notes ?? "",
      visual_style: parsed.visual_style ?? "",
      status: "ready",
      updated_at: new Date().toISOString(),
    }).eq("id", briefId)

    // Email client if proposal has an email
    if (brief.proposals?.proposal_id ?? brief.proposal_id) {
      const { data: prop } = await supabase.from("proposals")
        .select("email, contact_name, business_name, video_length")
        .eq("id", brief.proposal_id).maybeSingle()

      if (prop?.email) {
        void supabase.functions.invoke("send-client-email", {
          body: {
            type: "brief_ready",
            to: prop.email,
            name: prop.contact_name,
            businessName: prop.business_name,
            videoLength: prop.video_length,
            briefToken: brief.token,
          },
        })
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
