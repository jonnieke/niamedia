import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeadersFor } from "../_shared/cors.ts"

const corsHeaders = corsHeadersFor(new Request("http://localhost"))

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("OK", { headers: corsHeaders })

  try {
    const { token, eventType } = await req.json()

    if (!token || !eventType || !['view', 'click'].includes(eventType)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // Get the share record
    const { data: share, error: shareError } = await supabase
      .from("campaign_shares")
      .select("id")
      .eq("share_token", token)
      .single()

    if (shareError || !share) {
      return new Response(JSON.stringify({ error: "Share not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Log the event
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? ""
    const ua = req.headers.get("user-agent") ?? ""
    const referer = req.headers.get("referer") ?? ""

    await supabase.from("share_events").insert({
      share_id: share.id,
      event_type: eventType,
      ip_address: ip,
      user_agent: ua,
      referrer: referer,
    })

    // Increment counter
    const counterField = eventType === 'view' ? 'views' : 'clicks'
    await supabase.rpc("increment_share_counter", {
      p_share_id: share.id,
      p_field: counterField,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
