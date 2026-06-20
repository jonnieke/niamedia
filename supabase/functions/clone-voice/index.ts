import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY")
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ElevenLabs not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  try {
    const { slotId } = await req.json() as { slotId: string }
    if (!slotId) throw new Error("slotId is required")

    // Get voice profile
    const { data: profile } = await supabase
      .from("voice_profiles")
      .select("label, age_group, gender, elevenlabs_voice_id")
      .eq("slot_id", slotId)
      .single()
    if (!profile) throw new Error("Voice slot not found")

    // If there's an existing cloned voice on ElevenLabs, delete it first
    if (profile.elevenlabs_voice_id) {
      await fetch(`https://api.elevenlabs.io/v1/voices/${profile.elevenlabs_voice_id}`, {
        method: "DELETE",
        headers: { "xi-api-key": apiKey },
      })
    }

    // Get samples for this slot
    const { data: samples } = await supabase
      .from("voice_samples")
      .select("storage_path, file_name")
      .eq("slot_id", slotId)
    if (!samples || samples.length === 0) throw new Error("No samples uploaded for this voice slot")

    // Mark as cloning
    await supabase.from("voice_profiles")
      .update({ status: "cloning", updated_at: new Date().toISOString() })
      .eq("slot_id", slotId)

    // Download samples and build FormData for ElevenLabs
    const formData = new FormData()
    formData.append("name", `Nia Media — ${profile.label}`)
    formData.append("description",
      `African ${profile.age_group ?? ""} ${profile.gender === "F" ? "female" : "male"} voice`)

    for (const sample of samples) {
      const { data: blob, error } = await supabase.storage
        .from("voice-samples")
        .download(sample.storage_path)
      if (error || !blob) throw new Error(`Download failed: ${error?.message ?? "empty"}`)

      const fileName = sample.file_name ?? sample.storage_path.split("/").pop() ?? "sample.mp3"
      formData.append("files", blob, fileName)
    }

    // Submit to ElevenLabs voice cloning
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
    })

    if (!res.ok) {
      const errText = await res.text()
      await supabase.from("voice_profiles")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("slot_id", slotId)
      throw new Error(`ElevenLabs error ${res.status}: ${errText.slice(0, 400)}`)
    }

    const { voice_id } = await res.json() as { voice_id: string }

    await supabase.from("voice_profiles")
      .update({ status: "ready", elevenlabs_voice_id: voice_id, updated_at: new Date().toISOString() })
      .eq("slot_id", slotId)

    return new Response(JSON.stringify({ success: true, voice_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
